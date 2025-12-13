import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { Phone, PhoneOff, Mic, MicOff, Camera, CameraOff } from "lucide-react";

const VideoCall = () => {
    const {
        callStatus,
        localStream,
        remoteStream,
        incomingCallData,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
        isMicOn,
        isCameraOn
    } = useVideoCallStore();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (callStatus === "IDLE") return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-0 md:p-4">
            <div className="relative w-full h-full md:h-auto md:max-w-4xl md:aspect-video bg-zinc-900 md:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">

                {/* Remote Video */}
                {callStatus === "CONNECTED" && (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Incoming Call UI */}
                {callStatus === "INCOMING" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center p-8 bg-zinc-800 rounded-xl">
                            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <img
                                    src="/avatar.png" // Placeholder
                                    className="size-20 rounded-full object-cover"
                                />
                            </div>
                            <h3 className="text-2xl font-semibold text-white mb-2">{incomingCallData?.name}</h3>
                            <p className="text-zinc-400 mb-8">Incoming Video Call...</p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={rejectCall} className="btn btn-circle btn-error btn-lg text-white">
                                    <PhoneOff size={32} />
                                </button>
                                <button onClick={acceptCall} className="btn btn-circle btn-success btn-lg text-white">
                                    <Phone size={32} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Calling UI */}
                {callStatus === "OUTGOING" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <img
                                    src="/avatar.png"
                                    className="size-20 rounded-full object-cover"
                                />
                            </div>
                            <h3 className="text-2xl font-semibold text-white">Calling...</h3>
                        </div>
                    </div>
                )}

                {/* Local Video */}
                {callStatus !== "INCOMING" && (
                    <div className="absolute bottom-4 right-4 w-48 aspect-video bg-zinc-800 rounded-lg border border-zinc-700 shadow-lg overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Controls */}
                {callStatus === "CONNECTED" && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                        <button onClick={toggleMic} className={`btn btn-circle btn-ghost ${!isMicOn ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-white"} hover:bg-zinc-700`}>
                            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button onClick={toggleCamera} className={`btn btn-circle btn-ghost ${!isCameraOn ? "bg-red-500/20 text-red-500" : "bg-zinc-800 text-white"} hover:bg-zinc-700`}>
                            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
                        </button>
                        <button onClick={endCall} className="btn btn-circle btn-error text-white">
                            <PhoneOff size={24} />
                        </button>
                    </div>
                )}

                {/* Cancel Call Button (for caller) */}
                {callStatus === "OUTGOING" && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                        <button onClick={endCall} className="btn btn-circle btn-error text-white">
                            <PhoneOff size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCall;
