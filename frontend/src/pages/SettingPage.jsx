import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChattingStore";
import toast from "react-hot-toast";
import { Send, Bell, Eye, EyeOff, Palette, Monitor, Mail, MessageSquare } from "lucide-react";
import SettingsLayout from "../components/SettingsLayout";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { showNotifications, showPreview, toggleNotificationSetting } = useChatStore();

  return (
    <SettingsLayout>
      <div className="space-y-8 pb-10">

        {/* Intro Text */}
        <div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Preferences</h2>
          <p className="text-base-content/60">Customize your chat experience and look</p>
        </div>

        {/* Notifications Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary border-b border-primary/10 pb-2">
            <Bell size={20} />
            <h2>Notifications</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Show Notifications Toggle */}
            <div className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-medium text-base-content">Enable Notifications</h3>
                  <p className="text-xs text-base-content/60">Receive toast alerts for new messages</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={showNotifications}
                  onChange={() => toggleNotificationSetting("showNotifications")}
                />
              </div>
            </div>

            {/* Show Preview Toggle */}
            <div className={`bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${!showNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-medium flex items-center gap-2 text-base-content">
                    Message Preview
                    {showPreview ? <Eye size={14} className="text-base-content/40" /> : <EyeOff size={14} className="text-base-content/40" />}
                  </h3>
                  <p className="text-xs text-base-content/60">Show message content in notifications</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-secondary"
                  checked={showPreview}
                  onChange={() => toggleNotificationSetting("showPreview")}
                  disabled={!showNotifications}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-secondary border-b border-secondary/10 pb-2">
            <Palette size={20} />
            <h2>Appearance</h2>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-base-content">Theme Selection</h3>
                <span className="text-xs text-base-content/60">{THEMES.length} themes available</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={`
                      group flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200
                      ${theme === t ? "bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-base-100 scale-105" : "hover:bg-base-200 hover:scale-105"}
                    `}
                    onClick={() => setTheme(t)}
                  >
                    <div
                      className="relative h-10 w-full rounded-lg overflow-hidden shadow-sm border border-base-300"
                      data-theme={t}
                    >
                      <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium truncate w-full text-center text-base-content/60 group-hover:text-base-content">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-accent border-b border-accent/10 pb-2">
            <Monitor size={20} />
            <h2>Live Preview</h2>
          </div>

          <div className="rounded-2xl border border-base-300 overflow-hidden bg-base-200 shadow-xl">
            <div className="p-8 flex justify-center">
              <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-lg overflow-hidden border border-base-content/5">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold shadow-sm">
                      J
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">John Doe</h3>
                      <p className="text-xs text-success font-medium">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[250px] max-h-[250px] overflow-y-auto bg-base-100 relative">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4f4f4f_1px,transparent_1px)] [background-size:16px_16px]"></div>

                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"
                        } relative z-10`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm
                          ${message.isSent
                            ? "bg-primary text-primary-content rounded-br-none"
                            : "bg-base-200 text-base-content rounded-bl-none"
                          }
                        `}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1 text-right
                            ${message.isSent
                              ? "text-primary-content/70"
                              : "text-base-content/70"
                            }
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10 rounded-full px-4 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                      disabled
                    />
                    <button className="btn btn-primary btn-circle h-10 w-10 min-h-0 shadow-md">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-accent border-b border-accent/10 pb-2">
            <Mail size={20} />
            <h2>Support</h2>
          </div>

          <div className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 space-y-4">
                <h3 className="text-xl font-bold text-base-content">Report a Bug</h3>
                <p className="text-sm text-base-content/60 leading-relaxed">
                  Found something broken? Let us know! Your feedback helps us make Toukii better for everyone.
                </p>
                <div className="flex items-center gap-3 text-sm text-base-content/60">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare size={16} />
                  </div>
                  <span>We usually respond within 24 hours</span>
                </div>
              </div>

              <div className="md:w-2/3">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const formData = new FormData(form);

                    try {
                      const btn = form.querySelector('button[type="submit"]');
                      const originalText = btn.innerText;
                      btn.disabled = true;
                      btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Sending...';

                      const response = await fetch("https://formspree.io/f/mlgwldqk", {
                        method: "POST",
                        body: formData,
                        headers: {
                          'Accept': 'application/json'
                        }
                      });

                      if (response.ok) {
                        form.reset();
                        toast.success("Message sent, thanks for sending this up!");
                        btn.innerHTML = 'Message Sent! ✨';
                        btn.classList.add('btn-success', 'text-white');
                        setTimeout(() => {
                          btn.disabled = false;
                          btn.innerText = originalText;
                          btn.classList.remove('btn-success', 'text-white');
                        }, 3000);
                      } else {
                        throw new Error('Failed to send');
                      }
                    } catch (error) {
                      const btn = form.querySelector('button[type="submit"]');
                      btn.innerText = 'Failed. Try again.';
                      btn.classList.add('btn-error', 'text-white');
                      setTimeout(() => {
                        btn.disabled = false;
                        btn.innerText = 'Send Message';
                        btn.classList.remove('btn-error', 'text-white');
                      }, 3000);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-base-content/70">Name</span>
                      </label>
                      <input type="text" name="name" placeholder="Your name" className="input input-bordered w-full bg-base-200 focus:outline-none focus:border-primary" required />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-base-content/70">Email</span>
                      </label>
                      <input type="email" name="email" placeholder="your@email.com" className="input input-bordered w-full bg-base-200 focus:outline-none focus:border-primary" required />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-base-content/70">Message</span>
                    </label>
                    <textarea name="message" className="textarea textarea-bordered h-32 focus:outline-none focus:border-primary bg-base-200 resize-none" placeholder="Describe the bug or feature request..." required></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn btn-primary px-8">
                      Send Message <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingPage;
