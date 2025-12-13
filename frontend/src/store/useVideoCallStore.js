import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// WebRTC Configuration
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

export const useVideoCallStore = create((set, get) => ({
    callStatus: "idle", // idle, calling, incoming, connected, ended
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    incomingCallData: null, // { from, name, signal }
    activeCallUserId: null, // ID of the user we are calling or talking to
    isMicOn: true,
    isCameraOn: true,

    // Actions
    startCall: async (userToCall) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

        set({ callStatus: "calling", activeCallUserId: userToCall });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", {
                        to: userToCall,
                        candidate: event.candidate,
                    });
                }
            };

            peer.ontrack = (event) => {
                set({ remoteStream: event.streams[0] });
            };

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("callUser", {
                userToCall: userToCall,
                signalData: offer,
                from: authUser._id,
                name: authUser.fullname,
            });

            socket.on("callAccepted", async (signal) => {
                set({ callStatus: "connected" });
                await peer.setRemoteDescription(new RTCSessionDescription(signal));
            });

            socket.on("callRejected", (data) => {
                toast.error(data.reason || "Call rejected");
                get().endCall();
            });

            socket.on("callEnded", () => {
                toast.error("Call ended");
                get().endCall();
            });

            socket.on("iceCandidate", async (candidate) => {
                try {
                    const pc = get().peerConnection;
                    if (pc && pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            });

        } catch (error) {
            console.error("Error starting call:", error);
            toast.error("Failed to access camera/microphone");
            get().endCall();
        }
    },

    acceptCall: async () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (!socket || !incomingCallData) return;

        set({ callStatus: "connected", activeCallUserId: incomingCallData.from });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("iceCandidate", {
                        to: incomingCallData.from,
                        candidate: event.candidate,
                    });
                }
            };

            peer.ontrack = (event) => {
                set({ remoteStream: event.streams[0] });
            };

            await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("answerCall", {
                signal: answer,
                to: incomingCallData.from,
            });

            socket.on("callEnded", () => {
                toast.error("Call ended");
                get().endCall();
            });

            socket.on("iceCandidate", async (candidate) => {
                try {
                    const pc = get().peerConnection;
                    if (pc && pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } catch (e) {
                    console.error("Error adding ice candidate", e);
                }
            });

        } catch (error) {
            console.error("Error accepting call:", error);
            toast.error("Failed to access camera/microphone");
            get().endCall();
        }
    },

    rejectCall: () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (socket && incomingCallData) {
            socket.emit("rejectCall", { to: incomingCallData.from });
        }
        get().endCall();
    },

    endCall: () => {
        const { socket } = useAuthStore.getState();
        const { peerConnection, localStream, activeCallUserId } = get();

        if (socket && activeCallUserId) {
            socket.emit("endCall", { to: activeCallUserId });
        }

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }

        set({
            callStatus: "idle",
            localStream: null,
            remoteStream: null,
            peerConnection: null,
            incomingCallData: null,
            activeCallUserId: null,
        });
    },

    setIncomingCall: (data) => {
        set({
            callStatus: "incoming",
            incomingCallData: data
        });
    },

    toggleMic: () => {
        const { localStream, isMicOn } = get();
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !isMicOn));
            set({ isMicOn: !isMicOn });
        }
    },

    toggleCamera: () => {
        const { localStream, isCameraOn } = get();
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !isCameraOn));
            set({ isCameraOn: !isCameraOn });
        }
    },
}));
