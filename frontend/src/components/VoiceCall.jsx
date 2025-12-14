import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

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
        activeCallUserId
    } = useVoiceCallStore();

    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);

    useEffect(() => {
        if (localStream && localAudioRef.current) {
            localAudioRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (callStatus === "IDLE") return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 p-8 flex flex-col items-center gap-8">

                {/* User Avatar & Info */}
                <div className="flex flex-col items-center gap-4">
                    <div className="size-32 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <img
                            src="/avatar.png" // Placeholder
                            className="size-28 rounded-full object-cover z-10"
                        />
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
                        </p>
                    </div>
                </div>

                {/* Audio Elements (Hidden) */}
                <audio ref={localAudioRef} autoPlay muted />
                <audio ref={remoteAudioRef} autoPlay />

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

                            <button onClick={endCall} className="btn btn-circle btn-error btn-lg text-white shadow-lg hover:scale-110 transition-transform">
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
