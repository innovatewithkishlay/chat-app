import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { AuthImagePattern } from "../components/AuthImagePattern";
import { Eye, EyeOff, Loader2, Lock, MessageSquare } from "lucide-react";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { resetPassword, isResettingPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return;
    }
    if (password !== confirmPassword) {
      return;
    }
    const ok = await resetPassword(token, password);
    if (ok) navigate("/login");
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
              <h1 className="text-2xl font-bold mt-2">Set a new password</h1>
              <p className="text-base-content/60">Choose a new password for your account.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
              {password && password.length < 6 && (
                <span className="text-xs text-error mt-1">Password must be at least 6 characters.</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm new password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input input-bordered w-full pl-10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <span className="text-xs text-error mt-1">Passwords don&apos;t match.</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isResettingPassword || password.length < 6 || password !== confirmPassword}
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              <Link to="/login" className="link link-primary">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title={"Almost there"}
        subtitle={"Pick a strong password you haven't used before."}
      />
    </div>
  );
};

export default ResetPasswordPage;
