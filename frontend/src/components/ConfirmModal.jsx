import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-base-100 rounded-xl shadow-2xl p-6 w-[90vw] max-w-sm border border-base-200 animate-in zoom-in-95 duration-200 scale-100 relative" onClick={(e) => e.stopPropagation()}>
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
        </Modal>
    );
};

export default ConfirmModal;
