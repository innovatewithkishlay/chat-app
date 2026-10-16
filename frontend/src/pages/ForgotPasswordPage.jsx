import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import AuthLayout from "../components/auth/AuthLayout";
import { AuthInput, SubmitButton } from "../components/auth/AuthFields";
import { validateEmail } from "../lib/authValidation";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [sentTo, setSentTo] = useState(null);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isRequestingReset = useAuthStore((s) => s.isRequestingReset);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextError = validateEmail(email, { checkDomain: false });
    setError(nextError);
    if (nextError) return;
    const trimmed = email.trim();
    const ok = await forgotPassword(trimmed);
    if (ok) setSentTo(trimmed);
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-zinc-900 underline-offset-4 hover:underline">
      <ArrowLeft className="size-4" /> Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout
        heading="Check your inbox"
        description={
          <>
            If an account exists for <span className="font-medium text-zinc-900">{sentTo}</span>, a reset
            link is on its way. It expires in 30 minutes.
          </>
        }
        footer={backToLogin}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <MailCheck className="size-5 shrink-0 text-emerald-600" />
            <span className="text-zinc-700">Reset email requested.</span>
          </div>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="h-11 w-full rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Use a different email or resend
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Forgot your password?"
      description="No worries. Enter the email you signed up with and we'll send you a reset link."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthInput
          label="Email"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@gmail.com"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(validateEmail(e.target.value, { checkDomain: false }));
          }}
          error={error}
        />
        <SubmitButton loading={isRequestingReset} loadingText="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
