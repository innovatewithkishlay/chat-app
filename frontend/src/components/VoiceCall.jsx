import { useEffect, useRef, useState } from "react";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import Avatar from "./Avatar";

const VoiceCall = () => {
    const {
        callStatus,
        localStream,
        remoteStream,
        incomingCallData,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        isMicOn,
        endReason,
        callDuration
    } = useVoiceCallStore();

    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    // See VideoCall.jsx - mobile browsers can silently block autoplay of the
    // remote audio stream, so the call connects but the other person can't
    // be heard. Detect it and offer a one-tap unlock.
    const [playbackBlocked, setPlaybackBlocked] = useState(false);

    useEffect(() => {
        if (localStream && localAudioRef.current) {
            localAudioRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current
                .play()
                .then(() => setPlaybackBlocked(false))
                .catch(() => setPlaybackBlocked(true));
        }
    }, [remoteStream]);

    const unlockPlayback = () => {
        remoteAudioRef.current
            ?.play()
            .then(() => setPlaybackBlocked(false))
            .catch(() => {});
    };

    if (callStatus === "IDLE") return null;

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 p-8 flex flex-col items-center gap-8">

                {/* User Avatar & Info */}
                <div className="flex flex-col items-center gap-4">
                    <div className="size-32 rounded-full flex items-center justify-center relative">
                        <div className="z-10">
                            <Avatar user={incomingCallData || { name: "User" }} size="size-28" />
                        </div>
                        {/* Pulsing Animation for Calling/Ringing */}
                        {(callStatus === "OUTGOING" || callStatus === "INCOMING") && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse delay-75"></div>
                            </>
                        )}
                    </div>

                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {callStatus === "INCOMING" ? incomingCallData?.name : "User"}
                        </h3>
                        <p className="text-zinc-400 font-medium">
                            {callStatus === "OUTGOING" && "Calling..."}
                            {callStatus === "INCOMING" && "Incoming Voice Call..."}
                            {callStatus === "CONNECTED" && "Connected"}
                            {callStatus === "ENDED" && (endReason || "Call ended")}
                        </p>
                        {callStatus === "ENDED" && typeof callDuration === "number" && (
                            <p className="text-zinc-500 text-sm mt-1">{formatDuration(callDuration)}</p>
                        )}
                    </div>
                </div>

                {/* Audio Elements (Hidden) */}
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />

                {callStatus === "CONNECTED" && playbackBlocked && (
                    <button
                        onClick={unlockPlayback}
                        className="flex items-center gap-2 text-xs font-medium text-white bg-primary/80 hover:bg-primary px-3 py-1.5 rounded-full -mt-4"
                    >
                        <Volume2 size={14} /> Tap to enable audio
                    </button>
                )}

                {/* Controls */}
                <div className="flex items-center gap-6 mt-4">

                    {/* Incoming Call Controls */}
                    {callStatus === "INCOMING" && (
                        <>
                            <button onClick={rejectCall} className="btn btn-circle btn-error btn-lg text-white shadow-lg hover:scale-110 transition-transform">
                                <PhoneOff size={32} />
                            </button>
                            <button onClick={acceptCall} className="btn btn-circle btn-success btn-lg text-white shadow-lg hover:scale-110 transition-transform animate-bounce">
                                <Phone size={32} />
                            </button>
                        </>
                    )}

                    {/* Active/Outgoing Call Controls */}
                    {(callStatus === "CONNECTED" || callStatus === "OUTGOING") && (
                        <>
                            {callStatus === "CONNECTED" && (
                                <button
                                    onClick={toggleMic}
                                    className={`btn btn-circle btn-lg ${!isMicOn ? "btn-error text-white" : "btn-ghost bg-zinc-800 text-white hover:bg-zinc-700"}`}
                                >
                                    {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
                                </button>
                            )}

                            <button onClick={() => endCall()} className="btn btn-circle btn-error btn-lg text-white shadow-lg hover:scale-110 transition-transform">
                                <PhoneOff size={32} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceCall;
