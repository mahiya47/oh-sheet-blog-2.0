import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";

export default function ForgotPasswordPage() {
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
        <h2 className="app-auth-card-title">Reset your password</h2>

        {sent ? (
          <p className="app-auth-success">
            If that email is registered, a reset link is on its way — check your inbox.
          </p>
        ) : (
          <form className="app-auth-form" onSubmit={handleSubmit}>
            {error && <p className="app-auth-error">{error}</p>}
            <label className="app-auth-field">
              <span>Email</span>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" className="app-auth-submit" disabled={busy}>
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="app-auth-switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
