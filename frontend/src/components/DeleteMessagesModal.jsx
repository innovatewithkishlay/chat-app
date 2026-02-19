import React from "react";
import Modal from "./Modal";

const DeleteMessagesModal = ({ isOpen, onClose, onDeleteForMe, onDeleteForEveryone, canDeleteForEveryone, count }) => {
    if (!isOpen) return null;

    return (
        <Modal onClose={onClose}>
            <div className="bg-white w-[90vw] max-w-[320px] rounded-2xl p-6 shadow-2xl animate-scaleIn relative overflow-hidden">
                <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
                    Delete {count} message{count > 1 ? "s" : ""}?
                </h3>

                <div className="flex flex-col gap-3">
                    {canDeleteForEveryone && (
                        <button
                            onClick={() => {
                                onDeleteForEveryone();
                                onClose();
                            }}
                            className="w-full py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
                        >
                            Delete for everyone
                        </button>
                    )}

                    <button
                        onClick={() => {
                            onDeleteForMe();
                            onClose();
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                    >
                        Delete for me
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium text-sm mt-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteMessagesModal;
