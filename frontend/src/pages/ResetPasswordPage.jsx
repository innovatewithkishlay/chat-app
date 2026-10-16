import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import AuthLayout from "../components/auth/AuthLayout";
import { PasswordInput, PasswordStrength, SubmitButton } from "../components/auth/AuthFields";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isResettingPassword = useAuthStore((s) => s.isResettingPassword);

  const passwordError =
    (submitted || password.length > 0) && password.length < 6 ? "Use at least 6 characters" : null;
  const confirmError =
    // Wait until they've typed as much as the password before flagging a mismatch.
    (submitted || confirmPassword.length >= password.length) && confirmPassword && confirmPassword !== password
      ? "Passwords don't match"
      : submitted && !confirmPassword
        ? "Please confirm your password"
        : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (password.length < 6 || password !== confirmPassword) return;
    const ok = await resetPassword(token, password);
    if (ok) navigate("/login");
  };

  return (
    <AuthLayout
      heading="Set a new password"
      description="Choose a strong password you haven't used here before."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-zinc-900 underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <PasswordInput
            label="New password"
            icon={Lock}
            name="new-password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordInput
          label="Confirm new password"
          icon={Lock}
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Type it again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError}
        />
        <SubmitButton loading={isResettingPassword} loadingText="Updating…">
          Update password
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
