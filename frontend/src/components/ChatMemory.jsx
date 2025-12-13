import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChattingStore";
import { X, Plus, Trash2, Edit2 } from "lucide-react";
import gsap from "gsap";

const ChatMemory = ({ conversationId, isOpen, onClose }) => {
    const { chatMemory, addMemory, removeMemory } = useChatStore();
    const [newMemory, setNewMemory] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            gsap.to(panelRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
        } else {
            gsap.to(panelRef.current, { x: "100%", duration: 0.5, ease: "power3.in" });
        }
    }, [isOpen]);

    const handleAdd = async () => {
        if (!newMemory.trim()) return;
        await addMemory(conversationId, newMemory);
        setNewMemory("");
        setIsAdding(false);
    };

    return (
        <div
            ref={panelRef}
            className="fixed top-0 right-0 h-full w-80 bg-base-100 shadow-2xl z-50 transform translate-x-full border-l border-base-300"
        >
            <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50 backdrop-blur-md">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    🧠 Chat Memory
                </h3>
                <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                    <X size={20} />
                </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-130px)] space-y-4">
                {chatMemory.length === 0 ? (
                    <div className="text-center opacity-50 mt-10">
                        <p>No memories yet.</p>
                        <p className="text-sm">Pin important details here.</p>
                    </div>
                ) : (
                    chatMemory.map((mem) => (
                        <div key={mem._id} className="card bg-base-200 shadow-sm p-3 group relative">
                            <p className="text-sm">{mem.text}</p>
                            <button
                                onClick={() => removeMemory(conversationId, mem._id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 btn btn-xs btn-ghost text-error"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t border-base-300 bg-base-100">
                {isAdding ? (
                    <div className="flex flex-col gap-2">
                        <textarea
                            className="textarea textarea-bordered w-full h-20"
                            placeholder="Remember..."
                            value={newMemory}
                            onChange={(e) => setNewMemory(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsAdding(false)} className="btn btn-sm btn-ghost">Cancel</button>
                            <button onClick={handleAdd} className="btn btn-sm btn-primary">Save</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="btn btn-block btn-outline btn-primary gap-2">
                        <Plus size={18} /> Add Memory
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatMemory;
