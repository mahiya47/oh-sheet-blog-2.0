import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    const isNew = params.get("isNew") === "1";

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate(isNew ? "/onboarding" : "/", { replace: true }))
      .catch(() => navigate("/login", { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-page app-auth-page">
      <div className={`app-auth-card app-card-${cardColor}`}>
        <span className="app-auth-logo-badge" style={{ background: logoColor }} aria-hidden="true">
          <OhSheetLogo size={30} />
        </span>
        <h2 className="app-auth-card-title">Signing you in...</h2>
      </div>
    </div>
  );
}
