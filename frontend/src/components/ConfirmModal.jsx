import React from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-base-100 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-base-200 animate-in zoom-in-95 duration-200 scale-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    {isDangerous && <AlertTriangle className="size-5 text-error" />}
                    {title}
                </h3>
                <p className="py-4 text-base-content/70">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-ghost"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`btn ${isDangerous ? "btn-error" : "btn-primary"}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};

export default ConfirmModal;
