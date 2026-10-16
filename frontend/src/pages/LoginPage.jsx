import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import AuthLayout from "../components/auth/AuthLayout";
import {
  AuthInput,
  PasswordInput,
  ServerWakeNotice,
  SubmitButton,
} from "../components/auth/AuthFields";
import { validateEmail } from "../lib/authValidation";

const validate = ({ email, password }) => {
  const errors = {};
  // Domain isn't checked here: if an older account exists on another
  // domain, let the server be the judge rather than locking it out.
  const emailError = validateEmail(email, { checkDomain: false });
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Password is required";
  return errors;
};

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const login = useAuthStore((s) => s.login);
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn);

  const update = (field) => (e) => {
    const next = { ...formData, [field]: e.target.value };
    setFormData(next);
    // Re-validate live only after the first submit attempt, so users aren't
    // shouted at while they're still typing.
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    login({ email: formData.email.trim(), password: formData.password });
  };

  return (
    <AuthLayout
      heading="Welcome back"
      description="Sign in to pick up your conversations right where you left them."
      showcaseTitle={<>Talk it through.<br /><em className="text-[#C2410C]">Then get it done.</em></>}
      showcaseSubtitle="Message friends in real time, plan together with shared boards and notes, and hop on a call without switching apps."
      footer={
        <>
          New to Touki?{" "}
          <Link to="/signup" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
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
          value={formData.email}
          onChange={update("email")}
          error={errors.email}
        />
        <PasswordInput
          label="Password"
          icon={Lock}
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={update("password")}
          error={errors.password}
          labelAction={
            <Link to="/forgot-password" className="text-xs font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline">
              Forgot password?
            </Link>
          }
        />

        <ServerWakeNotice />

        <SubmitButton loading={isLoggingIn} loadingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
