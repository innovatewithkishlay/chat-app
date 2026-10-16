import { useState } from "react";
import { Link } from "react-router-dom";
import { AtSign, Lock, Mail, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import AuthLayout from "../components/auth/AuthLayout";
import {
  AuthInput,
  PasswordInput,
  PasswordStrength,
  ServerWakeNotice,
  SubmitButton,
} from "../components/auth/AuthFields";
import { validateEmail } from "../lib/authValidation";

const USERNAME_PATTERN = /^[a-z0-9._]{3,24}$/;

const validate = ({ fullname, username, email, password }) => {
  const errors = {};
  if (!fullname.trim()) errors.fullname = "Full name is required";
  if (!username.trim()) errors.username = "Username is required";
  else if (!USERNAME_PATTERN.test(username.trim())) {
    errors.username = "3–24 characters: letters, numbers, dots or underscores";
  }
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Use at least 6 characters";
  return errors;
};

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const signup = useAuthStore((s) => s.signup);
  const isSigningUp = useAuthStore((s) => s.isSigningUp);

  const update = (field, transform = (v) => v) => (e) => {
    const next = { ...formData, [field]: transform(e.target.value) };
    setFormData(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    signup({
      fullname: formData.fullname.trim(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
  };

  return (
    <AuthLayout
      heading="Create your account"
      description="It's free and takes less than a minute."
      showcaseTitle="Bring your people, and your plans, together."
      showcaseSubtitle="Chat one-on-one or in groups, keep a shared board for every conversation, and never lose track of what was decided."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          label="Full name"
          icon={User}
          name="name"
          autoComplete="name"
          placeholder="Your name"
          autoFocus
          value={formData.fullname}
          onChange={update("fullname")}
          error={errors.fullname}
        />
        <AuthInput
          label="Username"
          icon={AtSign}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="your_handle"
          value={formData.username}
          onChange={update("username", (v) => v.toLowerCase().replace(/\s/g, ""))}
          error={errors.username}
          hint="This is how friends will find you."
        />
        <AuthInput
          label="Email"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@gmail.com"
          value={formData.email}
          onChange={update("email")}
          error={errors.email}
          hint="Gmail, Yahoo and Outlook addresses are supported."
        />
        <div className="space-y-2">
          <PasswordInput
            label="Password"
            icon={Lock}
            name="new-password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={update("password")}
            error={errors.password}
          />
          <PasswordStrength password={formData.password} />
        </div>

        <ServerWakeNotice />

        <div className="pt-1">
          <SubmitButton loading={isSigningUp} loadingText="Creating account…">
            Create account
          </SubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}
