import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { getIceServers } from "../lib/iceServers";
import toast from "react-hot-toast";

const ICE_CANDIDATE_POOL_SIZE = 10;

let beforeUnloadHandler = null;
let ringTimeoutId = null;
let endScreenTimeoutId = null;
const RING_TIMEOUT_MS = 45000;
const END_SCREEN_MS = 2000;

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
    endReason: null, // Message shown on the brief "Call ended" screen
    callStartedAt: null, // Set once CONNECTED, used to show call duration
    callDuration: null, // Seconds, computed when the call ends

    iceCandidateQueue: [], // Queue for early arrival candidates

    // --- Actions ---

    startCall: async (userToCall) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

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
                set({ remoteStream: event.streams[0] });
            };

            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === "disconnected") {
                    toast.error("Connection unstable. Poor network.");
                } else if (peer.iceConnectionState === "failed") {
                    get().endCall("Connection lost");
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
                    get().endCall("No answer");
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

        set({
            callStatus: "CONNECTED",
            activeCallUserId: incomingCallData.from,
            activeCallId: incomingCallData.callId,
            callStartedAt: Date.now(),
        });

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
                set({ remoteStream: event.streams[0] });
            };

            peer.oniceconnectionstatechange = () => {
                if (peer.iceConnectionState === "disconnected") {
                    toast.error("Connection unstable. Poor network.");
                } else if (peer.iceConnectionState === "failed") {
                    get().endCall("Connection lost");
                }
            };

            await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.signal));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit("voice:call:accept", { signal: answer, to: incomingCallData.from, callId: incomingCallData.callId });

            // Drain whatever accumulated in the queue while the awaits above
            // were pending - read it fresh here rather than the value
            // captured at the top of this function, since candidates can
            // arrive concurrently with getUserMedia/SDP negotiation.
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
        if (socket && incomingCallData) {
            socket.emit("voice:call:reject", { to: incomingCallData.from, callId: incomingCallData.callId });
        }
        get().resetState();
    },

    endCall: (endReason = null) => {
        const { socket } = useAuthStore.getState();
        const { activeCallUserId, activeCallId, callStatus } = get();

        if (callStatus === "IDLE" || callStatus === "ENDED") return;

        if (socket && activeCallUserId) {
            socket.emit("voice:call:end", { to: activeCallUserId, callId: activeCallId });
        }
        get().resetState(endReason);
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

    // Tears down media/peer connection immediately, then either returns to
    // IDLE right away (no reason given - e.g. you just hung up yourself) or
    // holds on an "ENDED" screen for a couple seconds showing why the call
    // stopped (the other side hung up, declined, no answer, etc.) before
    // returning to IDLE.
    resetState: (endReason = null) => {
        get().clearRingTimeout();
        if (endScreenTimeoutId) {
            clearTimeout(endScreenTimeoutId);
            endScreenTimeoutId = null;
        }

        const { localStream, peerConnection, callStartedAt } = get();
        const hadConnected = !!callStartedAt;

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }

        if (endReason) {
            set({
                callStatus: "ENDED",
                endReason,
                localStream: null,
                remoteStream: null,
                peerConnection: null,
                iceCandidateQueue: [],
                callDuration: hadConnected ? Math.round((Date.now() - callStartedAt) / 1000) : null,
            });
            endScreenTimeoutId = setTimeout(() => {
                set({
                    callStatus: "IDLE",
                    incomingCallData: null,
                    activeCallUserId: null,
                    activeCallId: null,
                    endReason: null,
                    callStartedAt: null,
                    callDuration: null,
                });
            }, END_SCREEN_MS);
        } else {
            set({
                callStatus: "IDLE",
                localStream: null,
                remoteStream: null,
                peerConnection: null,
                incomingCallData: null,
                activeCallUserId: null,
                activeCallId: null,
                iceCandidateQueue: [],
                endReason: null,
                callStartedAt: null,
                callDuration: null,
            });
        }
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
                set({ callStatus: "CONNECTED", activeCallId: data.callId, callStartedAt: Date.now() });
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
            get().resetState(data.reason || "Call declined");
        });

        socket.on("voice:call:ended", (data) => {
            get().resetState(data?.reason || "Call ended");
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
