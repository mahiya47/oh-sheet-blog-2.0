import { useState } from "react";

// A password <input> with a show/hide toggle — shared by every auth
// form that collects a password (login, signup, reset).
export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  required = false,
  autoFocus = false,
  minLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="app-auth-password-wrap">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        autoFocus={autoFocus}
        minLength={minLength}
      />
      <button
        type="button"
        className="app-auth-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

// Very-weak..strong scored on length + character variety. Not a real
// entropy estimate — just enough signal to nudge people off "password1".
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const capped = Math.min(score, 4);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return { score: capped, label: labels[capped] };
}

export function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const { score, label } = getPasswordStrength(password);
  return (
    <div className="app-auth-strength" aria-live="polite">
      <div className="app-auth-strength-bars">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={"app-auth-strength-bar" + (i < score ? ` is-filled strength-${score}` : "")}
          />
        ))}
      </div>
      <span className={`app-auth-strength-label strength-${score}`}>{label}</span>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 004.24 4.24M6.5 6.7C4 8.3 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.45 4.5-1.15M9.9 5.15A10 10 0 0112 5c6.4 0 10 7 10 7a15.8 15.8 0 01-2.6 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
