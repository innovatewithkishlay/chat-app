import { MessageCircle } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-200/50 animate-in fade-in duration-300">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-base-100 shadow-xl border border-base-300 flex items-center justify-center animate-bounce">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-base-content">Welcome to Touki</h2>
          <p className="text-base-content/60 max-w-xs mx-auto">
            Select a conversation from the sidebar to start chatting or create a new group.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
