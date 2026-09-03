import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const { refreshMe } = useAuth();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        // If the person verifying is currently logged in, refresh their
        // cached user so the "verified" state updates without a reload.
        refreshMe();
      })
      .catch(() => setStatus("error"));
  }, [token, refreshMe]);

  return (
    <div className="app-page app-auth-page">
      <div className={`app-auth-card app-card-${cardColor}`}>
        <Link to="/" className="app-auth-logo-badge" style={{ background: logoColor }} aria-label="Oh sheet! home">
          <OhSheetLogo size={30} />
        </Link>
        {status === "verifying" && <h2 className="app-auth-card-title">Verifying your email...</h2>}
        {status === "success" && (
          <>
            <h2 className="app-auth-card-title">✅ Email verified!</h2>
            <p className="app-auth-success">You're all set.</p>
            <p className="app-auth-switch">
              <Link to="/">Go to feed</Link>
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="app-auth-card-title">❌ Invalid or expired link</h2>
            <p className="app-auth-error">You can resend a verification email from Settings.</p>
            <p className="app-auth-switch">
              <Link to="/settings">Go to Settings</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
