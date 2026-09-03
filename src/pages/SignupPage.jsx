import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { oauthUrl } from "../lib/api.js";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";
import { GoogleIcon, GitHubIcon } from "../components/OAuthIcons.jsx";
import { PasswordInput, PasswordStrengthMeter } from "../components/PasswordField.jsx";
import AuthFooterLinks from "../components/AuthFooterLinks.jsx";

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      // No username here — the onboarding page right after signup is where
      // that gets picked. The backend hands back a temporary "user_xxxx"
      // one in the meantime.
      await register({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
      });
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-page app-auth-page">
      <AuthFooterLinks />
      <div className={`app-auth-card app-card-${cardColor}`}>
        <Link to="/" className="app-auth-logo-badge" style={{ background: logoColor }} aria-label="Oh sheet! home">
          <OhSheetLogo size={30} />
        </Link>
        <h2 className="app-auth-card-title">Create your account</h2>

        <div className="app-auth-oauth-row">
          <a className="app-auth-oauth-btn" href={oauthUrl("google")}>
            <GoogleIcon />
            <span>Sign up with Google</span>
          </a>
          <a className="app-auth-oauth-btn" href={oauthUrl("github")}>
            <GitHubIcon />
            <span>Sign up with GitHub</span>
          </a>
        </div>
        <div className="app-auth-divider">
          <span />
          <em>or sign up with email</em>
          <span />
        </div>

        <form className="app-auth-form" onSubmit={handleSubmit}>
          {error && <p className="app-auth-error">{error}</p>}
          <div className="app-auth-field-row">
            <label className="app-auth-field">
              <span>First name</span>
              <input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                required
              />
            </label>
            <label className="app-auth-field">
              <span>Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                required
              />
            </label>
          </div>
          <label className="app-auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="app-auth-field">
            <span>Password</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <PasswordStrengthMeter password={password} />
          </label>
          <label className="app-auth-field">
            <span>Confirm password</span>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          <button type="submit" className="app-auth-submit" disabled={busy}>
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="app-auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
