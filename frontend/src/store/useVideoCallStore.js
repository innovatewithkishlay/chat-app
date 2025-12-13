import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// WebRTC Configuration
const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.framasoft.org:3478" },
    ],
    iceCandidatePoolSize: 10,
};



export const useVideoCallStore = create((set, get) => ({
    // STRICT STATE MACHINE: "IDLE" | "OUTGOING" | "INCOMING" | "CONNECTED" | "ENDED"
    callStatus: "IDLE",
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    incomingCallData: null, // { from, name, signal }
    activeCallUserId: null,
    isMicOn: true,
    isCameraOn: true,

    iceCandidateQueue: [], // Queue for early arrival candidates

    // --- Actions ---

    startCall: async (userToCall, userName) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

        // Reset state before starting
        get().resetState();

        set({ callStatus: "OUTGOING", activeCallUserId: userToCall });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            // Handle ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:signal", { to: userToCall, candidate: event.candidate });
                }
            };

            // Handle Remote Stream
            peer.ontrack = (event) => {
                console.log("PEER: Received remote track");
                set({ remoteStream: event.streams[0] });
            };

            // Monitor Connection State
            peer.oniceconnectionstatechange = () => {
                console.log("PEER: Connection State:", peer.iceConnectionState);
                if (peer.iceConnectionState === "disconnected" || peer.iceConnectionState === "failed") {
                    toast.error("Connection lost. Poor network.");
                }
            };

            // Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            // Emit Initiate Event
            socket.emit("call:initiate", {
                userToCall,
                signalData: offer,
                from: authUser._id,
                name: authUser.fullname,
            });

        } catch (error) {
            console.error("Error starting call:", error);
            toast.error("Failed to access camera/microphone");
            get().resetState();
        }
    },

    acceptCall: async () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData, iceCandidateQueue } = get();
        if (!socket || !incomingCallData) return;

        set({ callStatus: "CONNECTED", activeCallUserId: incomingCallData.from });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:signal", { to: incomingCallData.from, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log("PEER: Received remote track");
                set({ remoteStream: event.streams[0] });
            };

            // Set Remote Description (Offer)
            await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));

            // Create Answer
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            // Emit Accept Event
            socket.emit("call:accept", { signal: answer, to: incomingCallData.from });

            // Process Queue
            iceCandidateQueue.forEach(candidate => {
                peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding queued ICE candidate", e));
            });
            set({ iceCandidateQueue: [] });

        } catch (error) {
            console.error("Error accepting call:", error);
            toast.error("Failed to access media devices");
            get().resetState();
        }
    },

    rejectCall: () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (socket && incomingCallData) {
            socket.emit("call:reject", { to: incomingCallData.from });
        }
        get().resetState();
    },

    endCall: () => {
        const { socket } = useAuthStore.getState();
        const { activeCallUserId, callStatus } = get();

        if (callStatus === "IDLE") return; // Prevent duplicate end calls

        if (socket && activeCallUserId) {
            socket.emit("call:end", { to: activeCallUserId });
        }
        get().resetState();
    },

    // --- Internal Helpers ---

    setIncomingCall: (data) => {
        // Only accept incoming if IDLE
        if (get().callStatus !== "IDLE") return;

        set({
            callStatus: "INCOMING",
            incomingCallData: data,
            activeCallUserId: data.from
        });
    },

    resetState: () => {
        const { localStream, peerConnection } = get();

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }

        set({
            callStatus: "IDLE",
            localStream: null,
            remoteStream: null,
            peerConnection: null,
            incomingCallData: null,
            activeCallUserId: null,
            iceCandidateQueue: []
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

    // --- Socket Listeners Management ---

    initializeListeners: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        // Remove existing listeners to avoid duplicates
        socket.off("call:incoming");
        socket.off("call:accepted");
        socket.off("call:rejected");
        socket.off("call:ended");
        socket.off("call:signal");
        socket.off("call:error");

        socket.on("call:incoming", (data) => {
            console.log("FRONTEND: call:incoming received", data);
            get().setIncomingCall(data);
        });

        socket.on("call:accepted", async (data) => {
            const { peerConnection, callStatus, iceCandidateQueue } = get();
            if (callStatus === "OUTGOING" && peerConnection) {
                set({ callStatus: "CONNECTED" });
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));

                // Process Queue
                iceCandidateQueue.forEach(candidate => {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding queued ICE candidate", e));
                });
                set({ iceCandidateQueue: [] });
            }
        });

        socket.on("call:rejected", (data) => {
            toast.error(data.reason || "Call rejected");
            get().resetState();
        });

        socket.on("call:ended", () => {
            toast.error("Call ended");
            get().resetState();
        });

        socket.on("call:signal", async (data) => {
            const { peerConnection } = get();
            if (peerConnection && peerConnection.remoteDescription) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error("Error adding ICE candidate", e);
                }
            } else {
                // Queue candidate if remote description not set yet
                set(state => ({ iceCandidateQueue: [...state.iceCandidateQueue, data.candidate] }));
            }
        });

        socket.on("call:error", (data) => {
            toast.error(data.message);
            get().resetState();
        });
    },

    cleanupListeners: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("call:incoming");
        socket.off("call:accepted");
        socket.off("call:rejected");
        socket.off("call:ended");
        socket.off("call:signal");
        socket.off("call:error");
    }
}));
