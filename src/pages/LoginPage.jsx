import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { startAuthentication } from "@simplewebauthn/browser";
import { useAuth } from "../context/AuthContext.jsx";
import { api, oauthUrl } from "../lib/api.js";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";
import { GoogleIcon, GitHubIcon } from "../components/OAuthIcons.jsx";
import { PasswordInput } from "../components/PasswordField.jsx";
import AuthFooterLinks from "../components/AuthFooterLinks.jsx";

// Whether this browser can even attempt WebAuthn — stable for the life of
// the page, so there's no need to compute it more than once.
const webAuthnSupported = typeof window !== "undefined" && Boolean(window.PublicKeyCredential);

export default function LoginPage() {
  const { login, completeLogin2FA, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  // Set once login() comes back with { requires2FA: true, challengeToken }
  // instead of a real token — switches the form to the code-entry step.
  const [challengeToken, setChallengeToken] = useState(null);
  const [tfaCode, setTfaCode] = useState("");

  const redirectTo = location.state?.from || "/";

  // Set by the backend when someone clicks "Continue with Google/GitHub"
  // here on Login and no Oh Sheet account is tied to that account yet —
  // see passport.js's `state.intent === "login"` branch. Rather than
  // silently creating an account behind their back, it sends them back
  // here so they can choose to sign up instead.
  const oauthNoAccount = searchParams.get("oauthError") === "no_account";
  const oauthProvider = searchParams.get("provider");
  const oauthProviderLabel = oauthProvider === "github" ? "GitHub" : "Google";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await login(identifier.trim(), password);
      if (res?.requires2FA) {
        setChallengeToken(res.challengeToken);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // Discoverable/usernameless flow — no email or username needed up front,
  // the browser's own account picker shows whichever Oh Sheet passkeys it
  // already knows about on this device.
  async function handlePasskeyLogin() {
    setError("");
    setPasskeyBusy(true);
    try {
      const { challengeId, options } = await api.getPasskeyLoginOptions();
      const response = await startAuthentication(options);
      const res = await api.verifyPasskeyLogin(challengeId, response);
      await loginWithToken(res.token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // NotAllowedError covers both "user hit cancel" and "no matching
      // passkey" — either way there's nothing to tell them went wrong.
      if (err.name !== "NotAllowedError") {
        setError(err.message || "Passkey sign-in failed");
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await completeLogin2FA(challengeToken, tfaCode.trim());
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid code");
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
        <h2 className="app-auth-card-title">Log in</h2>

        {challengeToken ? (
          <form className="app-auth-form" onSubmit={handleVerify2FA}>
            <p className="app-settings-hint">
              Enter the 6-digit code from your authenticator app, or one of your backup codes.
            </p>
            {error && <p className="app-auth-error">{error}</p>}
            <label className="app-auth-field">
              <span>Authentication code</span>
              <input
                autoFocus
                inputMode="numeric"
                value={tfaCode}
                onChange={(e) => setTfaCode(e.target.value)}
                placeholder="123456"
                required
              />
            </label>
            <button type="submit" className="app-auth-submit" disabled={busy}>
              {busy ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              className="app-create-cancel"
              onClick={() => {
                setChallengeToken(null);
                setTfaCode("");
                setError("");
              }}
            >
              Back to log in
            </button>
          </form>
        ) : (
          <>
            {oauthNoAccount && (
              <p className="app-auth-error">
                No Oh Sheet account is linked to that {oauthProviderLabel} account yet.{" "}
                <Link to="/signup">Sign up</Link> to create one.
              </p>
            )}

            {webAuthnSupported && (
              <>
                <button
                  type="button"
                  className="app-auth-oauth-btn"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyBusy}
                >
                  <PasskeyIcon />
                  <span>{passkeyBusy ? "Waiting for passkey..." : "Sign in with a passkey"}</span>
                </button>
                <div className="app-auth-divider">
                  <span />
                  <em>or</em>
                  <span />
                </div>
              </>
            )}

            <div className="app-auth-oauth-row">
              <a className="app-auth-oauth-btn" href={oauthUrl("google", "login")}>
                <GoogleIcon />
                <span>Continue with Google</span>
              </a>
              <a className="app-auth-oauth-btn" href={oauthUrl("github", "login")}>
                <GitHubIcon />
                <span>Continue with GitHub</span>
              </a>
            </div>
            <div className="app-auth-divider">
              <span />
              <em>or</em>
              <span />
            </div>

            <form className="app-auth-form" onSubmit={handleSubmit}>
              {error && <p className="app-auth-error">{error}</p>}
              <label className="app-auth-field">
                <span>Email or username</span>
                <input
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className="app-auth-field">
                <span>Password</span>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>
              <Link to="/forgot-password" className="app-auth-forgot-link">
                Forgot password?
              </Link>
              <button type="submit" className="app-auth-submit" disabled={busy}>
                {busy ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="app-auth-switch">
              New here? <Link to="/signup">Create an account</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// The standard "key" glyph most sites use for passkeys — a round bow with
// a notched shaft, drawn on a diagonal.
function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 10 20 20M20 20l-2.5 2.5M20 20l2-2M14.5 14.5 17 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
