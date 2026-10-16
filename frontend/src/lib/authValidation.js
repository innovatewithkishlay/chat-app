export function getPasswordScore(password) {
  if (password.length < 6) return 0;
  let score = 1;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  else if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 0.5;
  return Math.min(4, Math.floor(score));
}

// The backend only accepts these domains (see backend domainValidator), so
// catch it here instead of after a round trip.
export const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email, { checkDomain = true } = {}) {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address";
  if (checkDomain && !ALLOWED_EMAIL_DOMAINS.includes(value.split("@")[1].toLowerCase())) {
    return "Please use a Gmail, Yahoo or Outlook address";
  }
  return null;
}
