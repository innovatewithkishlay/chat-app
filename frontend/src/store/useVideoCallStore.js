import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { getIceServers } from "../lib/iceServers";
import toast from "react-hot-toast";

const ICE_CANDIDATE_POOL_SIZE = 10;

let beforeUnloadHandler = null;
let ringTimeoutId = null;
const RING_TIMEOUT_MS = 45000;



export const useVideoCallStore = create((set, get) => ({
    // STRICT STATE MACHINE: "IDLE" | "OUTGOING" | "INCOMING" | "CONNECTED" | "ENDED"
    callStatus: "IDLE",
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    incomingCallData: null, // { from, name, signal, callId }
    activeCallUserId: null,
    activeCallId: null, // Store the DB ID of the call
    isMicOn: true,
    isCameraOn: true,

    iceCandidateQueue: [], // Queue for early arrival candidates

    // --- Actions ---

    startCall: async (userToCall) => {
        const { socket, authUser } = useAuthStore.getState();
        if (!socket) return;

        console.log("Starting video call to:", userToCall);
        get().resetState();
        set({ callStatus: "OUTGOING", activeCallUserId: userToCall });

        try {
            const [stream, iceServers] = await Promise.all([
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
                getIceServers(),
            ]);
            set({ localStream: stream });

            const peer = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: ICE_CANDIDATE_POOL_SIZE });
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:signal", { to: userToCall, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log("Remote video stream received");
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

            socket.emit("call:initiate", {
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
            console.error("Error starting video call:", error);
            toast.error("Failed to access camera/microphone: " + error.message);
            get().resetState();
        }
    },

    acceptCall: async () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        if (!socket || !incomingCallData) {
            console.error("Cannot accept video call: Missing socket or incomingCallData");
            return;
        }

        console.log("Accepting video call from:", incomingCallData.from);
        set({ callStatus: "CONNECTED", activeCallUserId: incomingCallData.from, activeCallId: incomingCallData.callId });

        try {
            const [stream, iceServers] = await Promise.all([
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
                getIceServers(),
            ]);
            set({ localStream: stream });

            const peer = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: ICE_CANDIDATE_POOL_SIZE });
            set({ peerConnection: peer });

            stream.getTracks().forEach((track) => peer.addTrack(track, stream));

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:signal", { to: incomingCallData.from, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log("Remote video stream received (Answerer)");
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

            socket.emit("call:accept", { signal: answer, to: incomingCallData.from, callId: incomingCallData.callId });

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
            console.error("Error accepting video call:", error);
            toast.error("Failed to access camera/microphone: " + error.message);
            get().resetState();
        }
    },

    rejectCall: () => {
        const { socket } = useAuthStore.getState();
        const { incomingCallData } = get();
        console.log("Rejecting video call");
        if (socket && incomingCallData) {
            socket.emit("call:reject", { to: incomingCallData.from, callId: incomingCallData.callId });
        }
        get().resetState();
    },

    endCall: () => {
        const { socket } = useAuthStore.getState();
        const { activeCallUserId, activeCallId, callStatus } = get();

        console.log("Ending video call. Status:", callStatus);

        if (callStatus === "IDLE") return;

        if (socket && activeCallUserId) {
            socket.emit("call:end", { to: activeCallUserId, callId: activeCallId });
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
        socket.off("call:created");

        socket.on("call:created", (data) => {
            set({ activeCallId: data.callId });
        });

        socket.on("call:incoming", (data) => {

            get().setIncomingCall(data);
        });

        socket.on("call:accepted", async (data) => {
            const { peerConnection, callStatus } = get();
            if (callStatus === "OUTGOING" && peerConnection) {
                get().clearRingTimeout();
                set({ callStatus: "CONNECTED", activeCallId: data.callId }); // Ensure we have callId
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));

                // Process whatever queued up during the await above - read
                // the queue fresh rather than a value captured before it.
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
            socket.off("call:incoming");
            socket.off("call:accepted");
            socket.off("call:rejected");
            socket.off("call:ended");
            socket.off("call:signal");
            socket.off("call:error");
            socket.off("call:created");
        }

        if (beforeUnloadHandler) {
            window.removeEventListener("beforeunload", beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
    }
}));
