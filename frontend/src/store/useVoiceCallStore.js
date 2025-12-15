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

export const useVoiceCallStore = create((set, get) => ({
    // STRICT STATE MACHINE: "IDLE" | "OUTGOING" | "INCOMING" | "CONNECTED" | "ENDED"
    callStatus: "IDLE",
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    incomingCallData: null, // { from, name, signal, callId }
    activeCallUserId: null,
    activeCallId: null, // Store the DB ID of the call
    isMicOn: true,

    iceCandidateQueue: [], // Queue for early arrival candidates

    // --- Actions ---

    startCall: async (userToCall, userName) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

        // Reset state before starting
        get().resetState();

        set({ callStatus: "OUTGOING", activeCallUserId: userToCall });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            // Handle ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("voice:call:signal", { to: userToCall, candidate: event.candidate });
                }
            };

            // Handle Remote Stream
            peer.ontrack = (event) => {

                set({ remoteStream: event.streams[0] });
            };

            // Monitor Connection State
            peer.oniceconnectionstatechange = () => {

                if (peer.iceConnectionState === "disconnected" || peer.iceConnectionState === "failed") {
                    toast.error("Connection lost. Poor network.");
                }
            };

            // Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            // Emit Initiate Event
            socket.emit("voice:call:initiate", {
                userToCall,
                signalData: offer,
                from: authUser._id,
                name: authUser.fullname,
            });

        } catch (error) {
            console.error("Error starting voice call:", error);
            toast.error("Failed to access microphone");
            get().resetState();
        }
    },

    acceptCall: async () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData, iceCandidateQueue } = get();
        if (!socket || !incomingCallData) return;

        set({ callStatus: "CONNECTED", activeCallUserId: incomingCallData.from, activeCallId: incomingCallData.callId });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            set({ localStream: stream });

            const peer = new RTCPeerConnection(ICE_SERVERS);
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("voice:call:signal", { to: incomingCallData.from, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {

                set({ remoteStream: event.streams[0] });
            };

            // Set Remote Description (Offer)
            await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));

            // Create Answer
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            // Emit Accept Event
            socket.emit("voice:call:accept", { signal: answer, to: incomingCallData.from, callId: incomingCallData.callId });

            // Process Queue
            iceCandidateQueue.forEach(candidate => {
                peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding queued ICE candidate", e));
            });
            set({ iceCandidateQueue: [] });

        } catch (error) {
            console.error("Error accepting voice call:", error);
            toast.error("Failed to access microphone");
            get().resetState();
        }
    },

    rejectCall: () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (socket && incomingCallData) {
            socket.emit("voice:call:reject", { to: incomingCallData.from, callId: incomingCallData.callId });
        }
        get().resetState();
    },

    endCall: () => {
        const { socket } = useAuthStore.getState();
        const { activeCallUserId, callStatus } = get();

        if (callStatus === "IDLE") return; // Prevent duplicate end calls

        if (socket && activeCallUserId) {
            socket.emit("voice:call:end", { to: activeCallUserId, callId: activeCallId });
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
            activeCallUserId: data.from,
            activeCallId: data.callId
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
            activeCallId: null,
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

    // --- Socket Listeners Management ---

    initializeListeners: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;

        // Remove existing listeners to avoid duplicates
        socket.off("voice:call:incoming");
        socket.off("voice:call:accepted");
        socket.off("voice:call:rejected");
        socket.off("voice:call:ended");
        socket.off("voice:call:signal");
        socket.off("voice:call:error");
        socket.off("voice:call:created");

        socket.on("voice:call:created", (data) => {
            set({ activeCallId: data.callId });
        });

        socket.on("voice:call:incoming", (data) => {

            get().setIncomingCall(data);
        });

        socket.on("voice:call:accepted", async (data) => {
            const { peerConnection, callStatus, iceCandidateQueue } = get();
            if (callStatus === "OUTGOING" && peerConnection) {
                set({ callStatus: "CONNECTED", activeCallId: data.callId }); // Ensure we have callId
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));

                // Process Queue
                iceCandidateQueue.forEach(candidate => {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding queued ICE candidate", e));
                });
                set({ iceCandidateQueue: [] });
            }
        });

        socket.on("voice:call:rejected", (data) => {
            toast.error(data.reason || "Call rejected");
            get().resetState();
        });

        socket.on("voice:call:ended", () => {
            toast.error("Call ended");
            get().resetState();
        });

        socket.on("voice:call:signal", async (data) => {
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

        socket.on("voice:call:error", (data) => {
            toast.error(data.message);
            get().resetState();
        });

        // Handle Tab Close
        window.addEventListener("beforeunload", () => {
            get().endCall();
        });
    },

    cleanupListeners: () => {
        const { socket } = useAuthStore.getState();
        if (!socket) return;
        socket.off("voice:call:incoming");
        socket.off("voice:call:accepted");
        socket.off("voice:call:rejected");
        socket.off("voice:call:ended");
        socket.off("voice:call:signal");
        socket.off("voice:call:error");
        socket.off("voice:call:created");

        // Remove beforeunload listener (though browser handles it, good practice)
        // Note: We can't easily remove anonymous function, but since this is cleanup, it's fine.
        // Ideally we'd name the function, but for now this ensures the socket listeners are off.
    }
}));
