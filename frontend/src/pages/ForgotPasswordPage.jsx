import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { Loader2, Mail, MessageSquare } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword, isRequestingReset } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await forgotPassword(email);
    if (ok) setSubmitted(true);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Reset your password</h1>
              <p className="text-base-content/60">
                {submitted
                  ? "Check your inbox for a reset link."
                  : "Enter your email and we'll send you a link to reset it."}
              </p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    required
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isRequestingReset}>
                {isRequestingReset ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          ) : (
            <button onClick={() => setSubmitted(false)} className="btn btn-outline w-full">
              Send another link
            </button>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Remembered your password?{" "}
              <Link to="/login" className="link link-primary">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title={"Forgot your password?"}
        subtitle={"It happens. We'll get you back into your account in no time."}
      />
    </div>
  );
};

export default ForgotPasswordPage;
