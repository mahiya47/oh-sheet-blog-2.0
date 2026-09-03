import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";
import { PasswordInput, PasswordStrengthMeter } from "../components/PasswordField.jsx";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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
      await api.resetPassword(token, password);
      navigate("/login", { replace: true, state: { justReset: true } });
    } catch (err) {
      setError(err.message || "That reset link is invalid or expired.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-page app-auth-page">
      <div className={`app-auth-card app-card-${cardColor}`}>
        <Link to="/" className="app-auth-logo-badge" style={{ background: logoColor }} aria-label="Oh sheet! home">
          <OhSheetLogo size={30} />
        </Link>
        <h2 className="app-auth-card-title">Choose a new password</h2>
        <form className="app-auth-form" onSubmit={handleSubmit}>
          {error && <p className="app-auth-error">{error}</p>}
          <label className="app-auth-field">
            <span>New password</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
              autoFocus
            />
            <PasswordStrengthMeter password={password} />
          </label>
          <label className="app-auth-field">
            <span>Confirm new password</span>
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
            {busy ? "Saving..." : "Save new password"}
          </button>
        </form>
        <p className="app-auth-switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </div>
    </div>
  );
}
