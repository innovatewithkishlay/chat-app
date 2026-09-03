import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { getIceServers } from "../lib/iceServers";
import toast from "react-hot-toast";

const ICE_CANDIDATE_POOL_SIZE = 10;

let beforeUnloadHandler = null;
let ringTimeoutId = null;
const RING_TIMEOUT_MS = 45000;

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

    startCall: async (userToCall) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

        console.log("Starting call to:", userToCall);
        get().resetState();
        set({ callStatus: "OUTGOING", activeCallUserId: userToCall });

        try {
            const [stream, iceServers] = await Promise.all([
                navigator.mediaDevices.getUserMedia({ video: false, audio: true }),
                getIceServers(),
            ]);
            set({ localStream: stream });

            const peer = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: ICE_CANDIDATE_POOL_SIZE });
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("voice:call:signal", { to: userToCall, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log("Remote stream received");
                set({ remoteStream: event.streams[0] });
            };

            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === "disconnected") {
                    toast.error("Connection unstable. Poor network.");
                } else if (peer.iceConnectionState === "failed") {
                    toast.error("Call connection lost.");
                    get().endCall();
                }
            };

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit("voice:call:initiate", {
                userToCall,
                signalData: offer,
                from: authUser._id,
                name: authUser.fullname,
            });

            get().clearRingTimeout();
            ringTimeoutId = setTimeout(() => {
                if (get().callStatus === "OUTGOING") {
                    toast.error("No answer.");
                    get().endCall();
                }
            }, RING_TIMEOUT_MS);

        } catch (error) {
            console.error("Error starting voice call:", error);
            toast.error("Failed to access microphone: " + error.message);
            get().resetState();
        }
    },

    acceptCall: async () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (!socket || !incomingCallData) {
            console.error("Cannot accept call: Missing socket or incomingCallData");
            return;
        }

        console.log("Accepting call from:", incomingCallData.from);
        set({ callStatus: "CONNECTED", activeCallUserId: incomingCallData.from, activeCallId: incomingCallData.callId });

        try {
            const [stream, iceServers] = await Promise.all([
                navigator.mediaDevices.getUserMedia({ video: false, audio: true }),
                getIceServers(),
            ]);
            set({ localStream: stream });

            const peer = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: ICE_CANDIDATE_POOL_SIZE });
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("voice:call:signal", { to: incomingCallData.from, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log("Remote stream received (Answerer)");
                set({ remoteStream: event.streams[0] });
            };

            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === "disconnected") {
                    toast.error("Connection unstable. Poor network.");
                } else if (peer.iceConnectionState === "failed") {
                    toast.error("Call connection lost.");
                    get().endCall();
                }
            };

            await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("voice:call:accept", { signal: answer, to: incomingCallData.from, callId: incomingCallData.callId });

            set((state) => {
                state.iceCandidateQueue.forEach((candidate) => {
                    peer.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
                        console.error("Error adding queued ICE candidate", e)
                    );
                });
                return { iceCandidateQueue: [] };
            });

        } catch (error) {
            console.error("Error accepting voice call:", error);
            toast.error("Failed to access microphone: " + error.message);
            get().resetState();
        }
    },

    rejectCall: () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        console.log("Rejecting call");
        if (socket && incomingCallData) {
            socket.emit("voice:call:reject", { to: incomingCallData.from, callId: incomingCallData.callId });
        }
        get().resetState();
    },

    endCall: () => {
        const { socket } = useAuthStore.getState();
        const { activeCallUserId, activeCallId, callStatus } = get();

        console.log("Ending call. Status:", callStatus, "To:", activeCallUserId);

        if (callStatus === "IDLE") return;

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

    clearRingTimeout: () => {
        if (ringTimeoutId) {
            clearTimeout(ringTimeoutId);
            ringTimeoutId = null;
        }
    },

    resetState: () => {
        get().clearRingTimeout();
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
            const { peerConnection, callStatus } = get();
            if (callStatus === "OUTGOING" && peerConnection) {
                get().clearRingTimeout();
                set({ callStatus: "CONNECTED", activeCallId: data.callId }); // Ensure we have callId
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));

                set((state) => {
                    state.iceCandidateQueue.forEach((candidate) => {
                        peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) =>
                            console.error("Error adding queued ICE candidate", e)
                        );
                    });
                    return { iceCandidateQueue: [] };
                });
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
        if (beforeUnloadHandler) {
            window.removeEventListener("beforeunload", beforeUnloadHandler);
        }
        beforeUnloadHandler = () => get().endCall();
        window.addEventListener("beforeunload", beforeUnloadHandler);
    },

    cleanupListeners: () => {
        const { socket } = useAuthStore.getState();
        if (socket) {
            socket.off("voice:call:incoming");
            socket.off("voice:call:accepted");
            socket.off("voice:call:rejected");
            socket.off("voice:call:ended");
            socket.off("voice:call:signal");
            socket.off("voice:call:error");
            socket.off("voice:call:created");
        }

        if (beforeUnloadHandler) {
            window.removeEventListener("beforeunload", beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
    }
}));
