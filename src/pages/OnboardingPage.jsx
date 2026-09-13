import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { markTourPending } from "../lib/appAnnouncements.js";
import { logoColor } from "../lib/logoColor.js";
import { pickRandomCardColor } from "../lib/randomCardColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";
import {
  AVATAR_PRESET_COLORS,
  AVATAR_PRESET_ICONS,
  COVER_PRESET_GRADIENTS,
  COVER_PRESET_PATTERNS,
  buildAvatarDataUri,
  buildIconAvatarDataUri,
  buildCoverDataUri,
  buildPatternCoverDataUri,
  pickRandomAvatarUrl,
  pickRandomCoverUrl,
} from "../lib/presetAssets.js";

const GENDER_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

function toDateInputValue(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

export default function OnboardingPage() {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const cardColor = useMemo(() => pickRandomCardColor(), []);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // The backend hands new signups a temporary "user_xxxx" username —
  // clear that out so the field starts empty and they have to pick a
  // real one. A username picked via OAuth (derived from their email/GitHub
  // handle) doesn't start with "user_" and is kept as a starting point.
  const initialUsername = user?.username?.startsWith("user_") ? "" : user?.username || "";

  const [username, setUsername] = useState(initialUsername);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || "");
  const [uploadingCover, setUploadingCover] = useState(false);

  const [bio, setBio] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  // Live username availability check, debounced — same pattern as the old
  // app's onboarding page.
  useEffect(() => {
    const uname = username.trim();
    if (uname.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    if (uname === user?.username) {
      setUsernameAvailable(true);
      return;
    }
    setCheckingUsername(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.checkUsername(uname);
        setUsernameAvailable(res.available);
      } catch {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(t);
  }, [username, user?.username]);

  async function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const uploaded = await api.uploadMedia(file);
      setAvatarUrl(uploaded.url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCoverPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const uploaded = await api.uploadMedia(file);
      setCoverUrl(uploaded.url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 3) {
      setError("Please pick a username (at least 3 characters) to continue.");
      return;
    }
    if (usernameAvailable === false) {
      setError("That username is already taken.");
      return;
    }

    setSaving(true);
    setError("");
    // Avatar/cover are optional — if they skipped picking one, assign a
    // random preset now rather than saving a blank profile.
    const finalAvatarUrl = avatarUrl || pickRandomAvatarUrl(username);
    const finalCoverUrl = coverUrl || pickRandomCoverUrl();
    try {
      const updated = await api.updateProfile({
        username: username.trim(),
        avatarUrl: finalAvatarUrl,
        coverUrl: finalCoverUrl,
        bio,
        currentCity,
        birthday: birthday || null,
        gender,
      });
      setUser((u) => ({ ...u, ...updated }));
      // First real look at the app for this account — queue the feature
      // tour to show as soon as they land on the feed (AppAnnouncementsGate
      // picks this up and clears it once shown).
      markTourPending(updated.username || username.trim());
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't save — try a different username.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="app-page app-auth-page">
      <div className={`app-auth-card app-card-${cardColor}`}>
        <Link to="/" className="app-auth-logo-badge" style={{ background: logoColor }} aria-label="Oh sheet! home">
          <OhSheetLogo size={30} />
        </Link>
        <h2 className="app-auth-card-title">Welcome! Let's set up your profile.</h2>

      <form className="app-auth-form" onSubmit={handleSave}>
        {error && <p className="app-auth-error">{error}</p>}

        <label className="app-auth-field">
          <span>Username</span>
          <div className="app-onboarding-username-wrap">
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              placeholder="username"
              autoComplete="username"
              required
              minLength={3}
            />
            {username.trim().length >= 3 && (
              <span className="app-onboarding-username-status">
                {checkingUsername
                  ? "Checking..."
                  : usernameAvailable === true
                    ? "✓ Available"
                    : usernameAvailable === false
                      ? "✗ Taken"
                      : ""}
              </span>
            )}
          </div>
        </label>

        <label className="app-auth-field">
          <span>Birthday (optional)</span>
          <input
            type="date"
            value={toDateInputValue(birthday)}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </label>

        <div className="app-settings-group app-onboarding-group">
          <p className="app-settings-hint">Profile photo (optional)</p>
          <div className="app-settings-avatar-row">
            <div className="app-settings-avatar-picker" onClick={() => avatarInputRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <span>{(username || "?").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              type="button"
              className="app-settings-row-btn"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading..." : "Upload photo"}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
          </div>
          <div className="app-onboarding-preset-header">
            <p className="app-settings-preset-label">Or pick one</p>
            <button
              type="button"
              className="app-onboarding-surprise-btn"
              onClick={() => setAvatarUrl(pickRandomAvatarUrl(username))}
            >
              🎲 Surprise me
            </button>
          </div>
          <div className="app-settings-swatch-row">
            {AVATAR_PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="app-settings-avatar-swatch"
                style={{ background: color }}
                aria-label={`Use ${color} avatar`}
                onClick={() => setAvatarUrl(buildAvatarDataUri(color, username))}
              >
                {(username || "?").charAt(0).toUpperCase()}
              </button>
            ))}
            {AVATAR_PRESET_ICONS.map(({ icon, bg }) => (
              <button
                key={icon}
                type="button"
                className="app-settings-avatar-swatch"
                style={{ background: bg }}
                aria-label={`Use ${icon} avatar`}
                onClick={() => setAvatarUrl(buildIconAvatarDataUri(bg, icon))}
              >
                {icon}
              </button>
            ))}
          </div>
          <p className="app-onboarding-preset-note">
            Skip this and we'll pick one for you automatically when you continue.
          </p>
        </div>

        <div className="app-settings-group app-onboarding-group">
          <p className="app-settings-hint">Cover photo (optional)</p>
          <div className="app-settings-cover-picker" onClick={() => coverInputRef.current?.click()}>
            {coverUrl ? <img src={coverUrl} alt="Cover" /> : <span>Add a cover photo</span>}
            {uploadingCover && <span className="app-settings-uploading-badge">Uploading...</span>}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverPick} />
          <div className="app-onboarding-preset-header">
            <p className="app-settings-preset-label">Or pick one</p>
            <button
              type="button"
              className="app-onboarding-surprise-btn"
              onClick={() => setCoverUrl(pickRandomCoverUrl())}
            >
              🎲 Surprise me
            </button>
          </div>
          <div className="app-settings-swatch-row">
            {COVER_PRESET_GRADIENTS.map(([from, to]) => (
              <button
                key={from + to}
                type="button"
                className="app-settings-cover-swatch"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                aria-label="Use this cover"
                onClick={() => setCoverUrl(buildCoverDataUri([from, to]))}
              />
            ))}
            {COVER_PRESET_PATTERNS.map((preset, i) => (
              <button
                key={preset.pattern + preset.bg + i}
                type="button"
                className="app-settings-cover-swatch"
                style={{ background: preset.bg }}
                aria-label={`Use ${preset.pattern} cover`}
                onClick={() => setCoverUrl(buildPatternCoverDataUri(preset))}
              />
            ))}
          </div>
          <p className="app-onboarding-preset-note">
            Skip this and we'll pick one for you automatically when you continue.
          </p>
        </div>

        <label className="app-auth-field">
          <span>Bio (optional)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="Tell the world about yourself..."
            rows={3}
            maxLength={160}
          />
        </label>

        <label className="app-auth-field">
          <span>Place (optional)</span>
          <input
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
            placeholder="City, Country"
          />
        </label>

        <label className="app-auth-field">
          <span>Gender (optional)</span>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="app-auth-submit"
          disabled={saving || usernameAvailable === false}
        >
          {saving ? "Saving..." : "Continue to Oh Sheet!"}
        </button>
      </form>
      </div>
    </div>
  );
}
