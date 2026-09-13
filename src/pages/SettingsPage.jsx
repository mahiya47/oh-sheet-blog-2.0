import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { usePwaInstall } from "../context/PwaInstallContext.jsx";
import { subscribeToPush, unsubscribeFromPush, getExistingPushSubscription } from "../lib/pwa.js";
import { startRegistration } from "@simplewebauthn/browser";
import { api, oauthLinkUrl } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";
import { GoogleIcon, GitHubIcon } from "../components/OAuthIcons.jsx";
import NavIcon from "../components/NavIcons.jsx";
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

const TABS = ["Profile", "About", "Social Links", "Privacy & Safety", "Account", "Appearance"];

// A glyph per tab so the sidebar scans at a glance instead of reading as
// six lines of plain text.
const TAB_ICONS = {
  Profile: "\u{1F464}",
  About: "\u{1F4DD}",
  "Social Links": "\u{1F517}",
  "Privacy & Safety": "\u{1F512}",
  Account: "\u2699\uFE0F",
  Appearance: "\u{1F3A8}",
};
const TAB_BLURBS = {
  Profile: "Your photo, name and bio",
  About: "Details shown on your profile",
  "Social Links": "Where else people can find you",
  "Privacy & Safety": "Who can see you, blocks and mutes",
  Account: "Email, password, sessions and data",
  Appearance: "Theme and app install",
};

const PRONOUN_OPTIONS = ["", "he/him", "she/her", "they/them", "other"];
const GENDER_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "other", label: "Other" },
];
const ORIENTATION_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "straight", label: "Straight" },
  { value: "gay", label: "Gay" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "asexual", label: "Asexual" },
  { value: "other", label: "Other" },
];

function toDateInputValue(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

export default function SettingsPage() {
  const { user, setUser, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Search results link straight to a tab (/settings?tab=Account), so the
  // tab comes from the URL and the URL follows the tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    TABS.includes(tabFromUrl) ? tabFromUrl : "Profile",
  );

  useEffect(() => {
    if (tabFromUrl && TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  function selectTab(tab) {
    setActiveTab(tab);
    setSearchParams(tab === "Profile" ? {} : { tab }, { replace: true });
  }

  // Profile tab
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // About tab
  const [birthday, setBirthday] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [work, setWork] = useState("");
  const [education, setEducation] = useState("");
  const [gender, setGender] = useState("");
  const [showGender, setShowGender] = useState(false);
  const [orientation, setOrientation] = useState("");
  const [showOrientation, setShowOrientation] = useState(false);

  // Social Links tab
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [pinterestUrl, setPinterestUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Set to the path the user tried to go to while they had unsaved edits —
  // truthy means the "unsaved changes" prompt is open.
  const [pendingNav, setPendingNav] = useState(null);

  // Privacy & Safety tab
  const [isPrivate, setIsPrivate] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [blockedUsers, setBlockedUsers] = useState(null);
  const [blockedError, setBlockedError] = useState("");
  const [mutedUsers, setMutedUsers] = useState(null);
  const [mutedError, setMutedError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Account tab — resend verification
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // "google" | "github" | null — which Connect button is currently waiting
  // on its link-nonce round-trip, so a slow connection can't be double-clicked.
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [connectError, setConnectError] = useState("");

  async function handleConnectProvider(provider) {
    setConnectError("");
    setConnectingProvider(provider);
    try {
      const url = await oauthLinkUrl(provider);
      window.location.href = url;
    } catch (err) {
      setConnectError(err.message || "Couldn't start that connection");
      setConnectingProvider(null);
    }
  }

  // Account tab — two-factor authentication
  const [tfaSettingUp, setTfaSettingUp] = useState(false);
  const [tfaSecret, setTfaSecret] = useState("");
  const [tfaQrCode, setTfaQrCode] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaError, setTfaError] = useState("");
  const [tfaBusy, setTfaBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState(null);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);

  // Account tab — sessions (Settings > Account > Sessions)
  const [sessions, setSessions] = useState(null);
  const [sessionsError, setSessionsError] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  // Account tab — passkeys
  const [passkeys, setPasskeys] = useState(null);
  const [passkeysError, setPasskeysError] = useState("");
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [removingPasskeyId, setRemovingPasskeyId] = useState(null);

  // Account tab — data export
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Appearance tab — push notifications. Per-browser, not per-account, so
  // this reflects THIS device's subscription state, not something stored
  // on the user object.
  const [pushSupported, setPushSupported] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: "/settings" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    getExistingPushSubscription()
      .then((sub) => setPushSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarUrl(user.avatarUrl || null);
    setCoverUrl(user.coverUrl || null);
    setBirthday(toDateInputValue(user.birthday));
    setPronouns(user.pronouns || "");
    setCurrentCity(user.currentCity || "");
    setWork(user.work || "");
    setEducation(user.education || "");
    setGender(user.gender || "");
    setShowGender(!!user.showGender);
    setOrientation(user.orientation || "");
    setShowOrientation(!!user.showOrientation);
    setGithubUrl(user.githubUrl || "");
    setTwitterUrl(user.twitterUrl || "");
    setLinkedinUrl(user.linkedinUrl || "");
    setInstagramUrl(user.instagramUrl || "");
    setPinterestUrl(user.pinterestUrl || "");
    setIsPrivate(!!user.isPrivate);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api
      .getBlockedUsers()
      .then(setBlockedUsers)
      .catch((err) => setBlockedError(err.message || "Couldn't load blocked users"));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api
      .getMutedUsers()
      .then(setMutedUsers)
      .catch((err) => setMutedError(err.message || "Couldn't load muted users"));
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== "Account") return;
    api
      .getSessions()
      .then(setSessions)
      .catch((err) => setSessionsError(err.message || "Couldn't load sessions"));
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== "Account") return;
    api
      .getPasskeys()
      .then(setPasskeys)
      .catch((err) => setPasskeysError(err.message || "Couldn't load passkeys"));
  }, [user, activeTab]);

  async function handleUnblock(userId) {
    const prev = blockedUsers;
    setBlockedUsers((list) => (list ? list.filter((u) => u.id !== userId) : list));
    try {
      await api.unblock(userId);
    } catch (err) {
      setBlockedUsers(prev);
      setBlockedError(err.message || "Couldn't unblock user");
    }
  }

  async function handleUnmute(userId) {
    const prev = mutedUsers;
    setMutedUsers((list) => (list ? list.filter((u) => u.id !== userId) : list));
    try {
      await api.unmute(userId);
    } catch (err) {
      setMutedUsers(prev);
      setMutedError(err.message || "Couldn't unmute user");
    }
  }

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

  // Everything the Save button writes. `baseline` is the same shape rebuilt
  // from the saved user, so a plain compare of the two tells us whether
  // anything was actually edited — that's what enables the Save buttons and
  // what triggers the "you haven't saved" prompt on the way out.
  const baseline = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      username: user.username || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || null,
      coverUrl: user.coverUrl || null,
      birthday: toDateInputValue(user.birthday),
      pronouns: user.pronouns || "",
      currentCity: user.currentCity || "",
      work: user.work || "",
      education: user.education || "",
      gender: user.gender || "",
      showGender: !!user.showGender,
      orientation: user.orientation || "",
      showOrientation: !!user.showOrientation,
      githubUrl: user.githubUrl || "",
      twitterUrl: user.twitterUrl || "",
      linkedinUrl: user.linkedinUrl || "",
      instagramUrl: user.instagramUrl || "",
      pinterestUrl: user.pinterestUrl || "",
    };
  }, [user]);

  const draft = {
    name,
    username,
    bio,
    avatarUrl,
    coverUrl,
    birthday,
    pronouns,
    currentCity,
    work,
    education,
    gender,
    showGender,
    orientation,
    showOrientation,
    githubUrl,
    twitterUrl,
    linkedinUrl,
    instagramUrl,
    pinterestUrl,
  };
  const isDirty = !!baseline && JSON.stringify(draft) !== JSON.stringify(baseline);
  const canSave = isDirty && !saving && !uploadingAvatar && !uploadingCover;

  function resetDraft() {
    if (!baseline) return;
    setName(baseline.name);
    setUsername(baseline.username);
    setBio(baseline.bio);
    setAvatarUrl(baseline.avatarUrl);
    setCoverUrl(baseline.coverUrl);
    setBirthday(baseline.birthday);
    setPronouns(baseline.pronouns);
    setCurrentCity(baseline.currentCity);
    setWork(baseline.work);
    setEducation(baseline.education);
    setGender(baseline.gender);
    setShowGender(baseline.showGender);
    setOrientation(baseline.orientation);
    setShowOrientation(baseline.showOrientation);
    setGithubUrl(baseline.githubUrl);
    setTwitterUrl(baseline.twitterUrl);
    setLinkedinUrl(baseline.linkedinUrl);
    setInstagramUrl(baseline.instagramUrl);
    setPinterestUrl(baseline.pinterestUrl);
  }

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await api.updateProfile({
        ...draft,
        birthday: birthday || null,
      });
      setUser((u) => ({ ...u, ...updated }));
      setMessage("Saved.");
      return true;
    } catch (err) {
      setError(err.message || "Couldn't save changes");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Saving is the end of the job, so it hands the user back to their profile
  // rather than leaving them staring at the form they just submitted.
  async function handleSave(e) {
    e.preventDefault();
    if (!canSave) return;
    const ok = await saveProfile();
    if (ok) navigate("/profile");
  }

  // Reload / tab close.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // In-app navigation: catch any internal link click (back link, navbar,
  // drawer) before React Router sees it and ask first.
  useEffect(() => {
    if (!isDirty) return;
    const intercept = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//") || href === "/settings") return;
      e.preventDefault();
      e.stopPropagation();
      setPendingNav(href);
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [isDirty]);

  async function handleLeaveSave() {
    const target = pendingNav;
    const ok = await saveProfile();
    if (ok) {
      setPendingNav(null);
      navigate(target);
    }
  }

  function handleLeaveDiscard() {
    const target = pendingNav;
    resetDraft();
    setPendingNav(null);
    navigate(target);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteAccount();
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.message || "Couldn't delete account");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    setResendMessage("");
    try {
      await api.resendVerification();
      setResendMessage("Verification email sent — check your inbox.");
    } catch (err) {
      setResendMessage(err.message || "Couldn't send that right now.");
    } finally {
      setResending(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  async function handleRevokeSession(session) {
    setRevokingSessionId(session.id);
    setSessionsError("");
    try {
      await api.revokeSession(session.id);
      setSessions((list) => (list ? list.filter((s) => s.id !== session.id) : list));
      // Revoking your own current session is really just logging out —
      // your next authenticated request would 401 anyway, so do it now
      // instead of leaving the page in a broken-looking state.
      if (session.isCurrent) {
        logout();
        navigate("/login");
      }
    } catch (err) {
      setSessionsError(err.message || "Couldn't log out that session");
    } finally {
      setRevokingSessionId(null);
    }
  }

  async function handleExportData() {
    setExporting(true);
    setExportError("");
    try {
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oh-sheet-data-${user.username}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || "Couldn't export your data");
    } finally {
      setExporting(false);
    }
  }

  async function handleAddPasskey() {
    setPasskeysError("");
    setAddingPasskey(true);
    try {
      const options = await api.getPasskeyRegisterOptions();
      const response = await startRegistration(options);
      // No label prompt — the backend derives a friendly one from the
      // User-Agent ("Chrome on macOS"), which is enough to tell entries
      // apart in the list below.
      await api.verifyPasskeyRegistration(response);
      const list = await api.getPasskeys();
      setPasskeys(list);
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        setPasskeysError(err.message || "Couldn't add that passkey");
      }
    } finally {
      setAddingPasskey(false);
    }
  }

  async function handleRemovePasskey(passkey) {
    setRemovingPasskeyId(passkey.id);
    setPasskeysError("");
    try {
      await api.deletePasskey(passkey.id);
      setPasskeys((list) => (list ? list.filter((p) => p.id !== passkey.id) : list));
    } catch (err) {
      setPasskeysError(err.message || "Couldn't remove that passkey");
    } finally {
      setRemovingPasskeyId(null);
    }
  }

  async function handleInstallClick() {
    // If accepted, usePwaInstall() flips `installed` itself — this component
    // just re-renders into the "installed" branch below on its own.
    await promptInstall();
  }

  async function handleTogglePrivacy() {
    setPrivacyError("");
    const next = !isPrivate;
    setPrivacyBusy(true);
    try {
      const updated = await api.updatePrivacy(next);
      setIsPrivate(!!updated.isPrivate);
      setUser((u) => (u ? { ...u, isPrivate: !!updated.isPrivate } : u));
    } catch (err) {
      setPrivacyError(err.message || "Couldn't update this");
    } finally {
      setPrivacyBusy(false);
    }
  }

  async function handleTogglePush() {
    setPushError("");
    setPushBusy(true);
    try {
      if (pushSubscribed) {
        const endpoint = await unsubscribeFromPush();
        if (endpoint) await api.unsubscribePush(endpoint);
        setPushSubscribed(false);
      } else {
        const { publicKey } = await api.getPushPublicKey();
        if (!publicKey) throw new Error("Push notifications aren't set up on the server yet.");
        const subscription = await subscribeToPush(publicKey);
        await api.subscribePush(subscription);
        setPushSubscribed(true);
      }
    } catch (err) {
      setPushError(err.message || "Couldn't update push notifications");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleStart2FASetup() {
    setTfaError("");
    setTfaBusy(true);
    try {
      const { secret, qrCodeDataUrl } = await api.setup2FA();
      setTfaSecret(secret);
      setTfaQrCode(qrCodeDataUrl);
      setTfaSettingUp(true);
      setTfaCode("");
    } catch (err) {
      setTfaError(err.message || "Couldn't start 2FA setup");
    } finally {
      setTfaBusy(false);
    }
  }

  function handleCancel2FASetup() {
    setTfaSettingUp(false);
    setTfaSecret("");
    setTfaQrCode("");
    setTfaCode("");
    setTfaError("");
  }

  async function handleConfirm2FA(e) {
    e.preventDefault();
    setTfaError("");
    setTfaBusy(true);
    try {
      const { backupCodes: codes } = await api.enable2FA(tfaCode);
      setBackupCodes(codes);
      setTfaSettingUp(false);
      setTfaSecret("");
      setTfaQrCode("");
      setTfaCode("");
      setUser((u) => ({ ...u, twoFactorEnabled: true }));
    } catch (err) {
      setTfaError(err.message || "Couldn't confirm that code");
    } finally {
      setTfaBusy(false);
    }
  }

  function handleDoneWithBackupCodes() {
    setBackupCodes(null);
  }

  async function handleDisable2FA(e) {
    e.preventDefault();
    setDisableError("");
    setDisableBusy(true);
    try {
      await api.disable2FA(disablePassword);
      setUser((u) => ({ ...u, twoFactorEnabled: false }));
      setShowDisable2FA(false);
      setDisablePassword("");
    } catch (err) {
      setDisableError(err.message || "Couldn't disable 2FA");
    } finally {
      setDisableBusy(false);
    }
  }

  if (!user) return null;

  return (
    <div className="app-page app-settings-page">
      {/* Back button + title + strapline in one bar, the same shape the
          arcade game pages use. */}
      <div className="app-settings-head">
        <Link to="/" className="app-settings-back" aria-label="Back to feed">
          <NavIcon name="back" />
        </Link>
        <div className="app-settings-head-text">
          <h2 className="app-section-title">Settings</h2>
          <p className="app-settings-subtitle">Manage your profile, privacy and account.</p>
        </div>
      </div>

      <div className="app-settings-layout">
        <nav className="app-settings-tabs" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={"app-settings-tab" + (activeTab === tab ? " is-active" : "")}
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => selectTab(tab)}
            >
              <span className="app-settings-tab-icon" aria-hidden="true">
                {TAB_ICONS[tab]}
              </span>
              <span className="app-settings-tab-text">
                <span className="app-settings-tab-name">{tab}</span>
                <span className="app-settings-tab-blurb">{TAB_BLURBS[tab]}</span>
              </span>
            </button>
          ))}
        </nav>

        {["Profile", "About", "Social Links"].includes(activeTab) && (
        <form className="app-settings-content" onSubmit={handleSave}>
          {/* Save lives at the top and the bottom of the form, and only wakes
              up once something has actually changed. */}
          <div className={"app-settings-savebar is-top" + (isDirty ? " is-dirty" : "")}>
            <span className="app-settings-savebar-status">
              {isDirty ? "Unsaved changes" : "All saved"}
            </span>
            <button type="submit" className="app-settings-save-btn" disabled={!canSave}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>

          {message && <p className="app-auth-success">{message}</p>}
          {error && <p className="app-auth-error">{error}</p>}

          {activeTab === "Profile" && (
            <div className="app-settings-group">
              <h3>Public profile</h3>

              <div className="app-settings-cover-picker" onClick={() => coverInputRef.current?.click()}>
                {coverUrl ? <img src={coverUrl} alt="Cover" /> : <span>Add a cover photo</span>}
                {uploadingCover && <span className="app-settings-uploading-badge">Uploading...</span>}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverPick} />

              <div className="app-settings-avatar-row">
                <div className="app-settings-avatar-picker" onClick={() => avatarInputRef.current?.click()}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <span>{(name || username || "?").charAt(0).toUpperCase()}</span>
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
                <p className="app-settings-preset-label">Or choose an avatar</p>
                <button
                  type="button"
                  className="app-onboarding-surprise-btn"
                  onClick={() => setAvatarUrl(pickRandomAvatarUrl(name || username))}
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
                    onClick={() => setAvatarUrl(buildAvatarDataUri(color, name || username))}
                  >
                    {(name || username || "?").charAt(0).toUpperCase()}
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

              <div className="app-onboarding-preset-header">
                <p className="app-settings-preset-label">Profile cover</p>
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

              <h3>Basics</h3>
              <label className="app-settings-row">
                <span>Display name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="app-settings-row">
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                />
              </label>
              <label className="app-settings-row">
                <span>Bio</span>
                <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} />
              </label>
            </div>
          )}

          {activeTab === "About" && (
            <div className="app-settings-group">
              <h3>About you</h3>
              <label className="app-settings-row">
                <span>Birthday</span>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              </label>
              <p className="app-settings-hint">Shown as a little cake on your posts on your birthday.</p>

              <label className="app-settings-row">
                <span>Pronouns</span>
                <select value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
                  {PRONOUN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p === "" ? "Select..." : p}
                    </option>
                  ))}
                </select>
              </label>
              <p className="app-settings-hint">Shown next to your name on your profile.</p>

              <h3>Life details</h3>
              <label className="app-settings-row">
                <span>Location</span>
                <input
                  type="text"
                  placeholder="Where do you live?"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                />
              </label>
              <label className="app-settings-row">
                <span>Work</span>
                <input
                  type="text"
                  placeholder="Where do you work?"
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                />
              </label>
              <label className="app-settings-row">
                <span>Education</span>
                <input
                  type="text"
                  placeholder="Where did you study?"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </label>
              <p className="app-settings-hint">Shown in the About tab on your profile. Leave blank to hide.</p>

              <h3>Gender</h3>
              <label className="app-settings-row">
                <span>Gender</span>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={showGender}
                  onChange={(e) => setShowGender(e.target.checked)}
                />
                <span>Show on my profile</span>
              </label>

              <h3>Orientation</h3>
              <label className="app-settings-row">
                <span>Orientation</span>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  {ORIENTATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={showOrientation}
                  onChange={(e) => setShowOrientation(e.target.checked)}
                />
                <span>Show on my profile</span>
              </label>
            </div>
          )}

          {activeTab === "Social Links" && (
            <div className="app-settings-group">
              <h3>Social links</h3>
              <label className="app-settings-row app-settings-row-icon">
                <span>GitHub</span>
                <input
                  type="url"
                  placeholder="https://github.com/yourname"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </label>
              <label className="app-settings-row app-settings-row-icon">
                <span>Twitter / X</span>
                <input
                  type="url"
                  placeholder="https://x.com/yourname"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                />
              </label>
              <label className="app-settings-row app-settings-row-icon">
                <span>LinkedIn</span>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/yourname"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </label>
              <label className="app-settings-row app-settings-row-icon">
                <span>Instagram</span>
                <input
                  type="url"
                  placeholder="https://instagram.com/yourname"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </label>
              <label className="app-settings-row app-settings-row-icon">
                <span>Pinterest</span>
                <input
                  type="url"
                  placeholder="https://in.pinterest.com/yourname"
                  value={pinterestUrl}
                  onChange={(e) => setPinterestUrl(e.target.value)}
                />
              </label>
              <p className="app-settings-hint">Leave blank to hide any icon from your profile.</p>
            </div>
          )}

          <div className={"app-settings-savebar is-bottom" + (isDirty ? " is-dirty" : "")}>
            <span className="app-settings-savebar-status">
              {isDirty ? "Unsaved changes" : "All saved"}
            </span>
            <button type="submit" className="app-settings-save-btn" disabled={!canSave}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
        )}

        {activeTab === "Privacy & Safety" && (
          <div className="app-settings-content">
            <div className="app-settings-group">
              <h3>Private account</h3>
              <label className="app-settings-toggle-row">
                <span>Private account</span>
                <button
                  type="button"
                  className={"app-settings-switch" + (isPrivate ? " is-on" : "")}
                  role="switch"
                  aria-checked={isPrivate}
                  disabled={privacyBusy}
                  onClick={handleTogglePrivacy}
                >
                  <span className="app-settings-switch-knob" />
                </button>
              </label>
              <p className="app-settings-hint">
                {isPrivate
                  ? "Only people you approve can follow you and see your sheets. Anyone can still find your profile."
                  : "Anyone can follow you and see your sheets. Turn this on and new followers will need your approval."}
              </p>
              {privacyError && <p className="app-auth-error">{privacyError}</p>}
            </div>

            <div className="app-settings-group">
              <h3>Blocked users</h3>
              {blockedError && <p className="app-auth-error">{blockedError}</p>}
              {blockedUsers === null ? (
                <p className="app-empty">Loading...</p>
              ) : blockedUsers.length === 0 ? (
                <p className="app-empty">You haven't blocked anyone.</p>
              ) : (
                <ul className="app-settings-blocked-list">
                  {blockedUsers.map((u) => (
                    <li key={u.id}>
                      <span className="app-modal-user-dp">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" />
                        ) : (
                          (u.name || u.username).charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="app-modal-user-name">
                        {u.name || u.username}
                        <span className="app-search-handle">@{u.username}</span>
                      </span>
                      <button type="button" className="app-settings-row-btn" onClick={() => handleUnblock(u.id)}>
                        Unblock
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="app-settings-group">
              <h3>Muted users</h3>
              {mutedError && <p className="app-auth-error">{mutedError}</p>}
              {mutedUsers === null ? (
                <p className="app-empty">Loading...</p>
              ) : mutedUsers.length === 0 ? (
                <p className="app-empty">You haven't muted anyone.</p>
              ) : (
                <ul className="app-settings-blocked-list">
                  {mutedUsers.map((u) => (
                    <li key={u.id}>
                      <span className="app-modal-user-dp">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" />
                        ) : (
                          (u.name || u.username).charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="app-modal-user-name">
                        {u.name || u.username}
                        <span className="app-search-handle">@{u.username}</span>
                      </span>
                      <button type="button" className="app-settings-row-btn" onClick={() => handleUnmute(u.id)}>
                        Unmute
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="app-settings-group app-settings-danger">
              <h3>Delete account</h3>
              <p className="app-settings-hint">
                Deleting your account hides it immediately. You have 7 days to change your mind —
                just log back in during that window to undo it. After 7 days, your account and all
                your data are permanently deleted and can't be recovered.
              </p>
              {deleteError && <p className="app-auth-error">{deleteError}</p>}
              <label className="app-settings-row">
                <span>Type DELETE to confirm</span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </label>
              <button
                type="button"
                className="app-settings-delete-btn"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "Account" && (
          <div className="app-settings-content">
            <div className="app-settings-group">
              <h3>Account</h3>
              <label className="app-settings-row">
                <span>Email address</span>
                <input type="email" value={user.email || ""} disabled />
              </label>
              <p className="app-settings-hint">Email can't be changed here.</p>

              <p className="app-settings-verify-row">
                {user.emailVerified ? (
                  <span className="app-settings-verified">Your email is verified.</span>
                ) : (
                  <span className="app-settings-unverified">Your email isn't verified yet.</span>
                )}
              </p>
              {!user.emailVerified && (
                <>
                  <button
                    type="button"
                    className="app-settings-row-btn"
                    onClick={handleResendVerification}
                    disabled={resending}
                  >
                    {resending ? "Sending..." : "Resend verification email"}
                  </button>
                  {resendMessage && <p className="app-settings-hint">{resendMessage}</p>}
                </>
              )}

              <h3>Connected accounts</h3>
              <div className="app-settings-connected-row">
                <span className="app-settings-connected-label">
                  <GoogleIcon size={18} />
                  Google
                </span>
                {user.googleConnected ? (
                  <span className="app-settings-connected-badge">Connected</span>
                ) : (
                  <button
                    type="button"
                    className="app-settings-row-btn"
                    onClick={() => handleConnectProvider("google")}
                    disabled={connectingProvider === "google"}
                  >
                    {connectingProvider === "google" ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
              <div className="app-settings-connected-row">
                <span className="app-settings-connected-label">
                  <GitHubIcon size={18} />
                  GitHub
                </span>
                {user.githubConnected ? (
                  <span className="app-settings-connected-badge">Connected</span>
                ) : (
                  <button
                    type="button"
                    className="app-settings-row-btn"
                    onClick={() => handleConnectProvider("github")}
                    disabled={connectingProvider === "github"}
                  >
                    {connectingProvider === "github" ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
              {connectError && <p className="app-auth-error">{connectError}</p>}
            </div>

            <div className="app-settings-group">
              <h3>Two-factor authentication</h3>

              {backupCodes ? (
                <div className="app-settings-2fa-backup">
                  <p className="app-settings-hint">
                    Save these backup codes somewhere safe. Each one can be used once to log in if
                    you lose access to your authenticator app — they won't be shown again.
                  </p>
                  <ul className="app-settings-backup-codes">
                    {backupCodes.map((code) => (
                      <li key={code}>{code}</li>
                    ))}
                  </ul>
                  <button type="button" className="app-settings-row-btn" onClick={handleDoneWithBackupCodes}>
                    I've saved these
                  </button>
                </div>
              ) : user.twoFactorEnabled ? (
                <>
                  <p className="app-settings-verify-row">
                    <span className="app-settings-verified">Two-factor authentication is on.</span>
                  </p>
                  {!showDisable2FA ? (
                    <button
                      type="button"
                      className="app-settings-row-btn"
                      onClick={() => setShowDisable2FA(true)}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <form className="app-settings-2fa-form" onSubmit={handleDisable2FA}>
                      {user.hasPassword && (
                        <label className="app-settings-row">
                          <span>Confirm your password</span>
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            autoComplete="current-password"
                          />
                        </label>
                      )}
                      {disableError && <p className="app-auth-error">{disableError}</p>}
                      <div className="app-settings-actions-row">
                        <button type="submit" className="app-settings-row-btn" disabled={disableBusy}>
                          {disableBusy ? "Disabling..." : "Confirm disable"}
                        </button>
                        <button
                          type="button"
                          className="app-settings-row-btn"
                          onClick={() => {
                            setShowDisable2FA(false);
                            setDisablePassword("");
                            setDisableError("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : !tfaSettingUp ? (
                <>
                  <p className="app-settings-hint">
                    Add an extra layer of security — after entering your password, you'll also need
                    a code from an authenticator app to log in.
                  </p>
                  {tfaError && <p className="app-auth-error">{tfaError}</p>}
                  <button
                    type="button"
                    className="app-settings-row-btn"
                    onClick={handleStart2FASetup}
                    disabled={tfaBusy}
                  >
                    {tfaBusy ? "Starting..." : "Enable 2FA"}
                  </button>
                </>
              ) : (
                <form className="app-settings-2fa-form" onSubmit={handleConfirm2FA}>
                  <p className="app-settings-hint">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc),
                    then enter the 6-digit code it shows.
                  </p>
                  {tfaQrCode && <img src={tfaQrCode} alt="2FA QR code" className="app-settings-2fa-qr" />}
                  <p className="app-settings-hint">
                    Can't scan it? Enter this code manually: <code>{tfaSecret}</code>
                  </p>
                  <label className="app-settings-row">
                    <span>6-digit code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tfaCode}
                      onChange={(e) => setTfaCode(e.target.value)}
                      autoFocus
                    />
                  </label>
                  {tfaError && <p className="app-auth-error">{tfaError}</p>}
                  <div className="app-settings-actions-row">
                    <button type="submit" className="app-settings-row-btn" disabled={tfaBusy}>
                      {tfaBusy ? "Confirming..." : "Confirm"}
                    </button>
                    <button type="button" className="app-settings-row-btn" onClick={handleCancel2FASetup}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="app-settings-group">
              <h3>Sessions</h3>
              <p className="app-settings-hint">Everywhere you're currently logged in.</p>
              {sessionsError && <p className="app-auth-error">{sessionsError}</p>}
              {sessions === null ? (
                <p className="app-empty">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="app-empty">No active sessions.</p>
              ) : (
                <ul className="app-settings-sessions-list">
                  {sessions.map((s) => (
                    <li key={s.id} className="app-settings-session-row">
                      <span className="app-settings-session-info">
                        <span className="app-settings-session-device">
                          {s.device}
                          {s.isCurrent && <span className="app-settings-session-badge">This device</span>}
                        </span>
                        <span className="app-settings-session-lastactive">
                          Active {relativeTime(s.lastActiveAt)}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="app-settings-row-btn"
                        onClick={() => handleRevokeSession(s)}
                        disabled={revokingSessionId === s.id}
                      >
                        {revokingSessionId === s.id ? "Logging out..." : "Log out"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="app-settings-group">
              <h3>Passkeys</h3>
              <p className="app-settings-hint">
                Sign in with your device's fingerprint, face, or PIN instead of typing your
                password — nothing to remember, nothing to phish. Your password still works too.
              </p>
              {passkeysError && <p className="app-auth-error">{passkeysError}</p>}
              {passkeys === null ? (
                <p className="app-empty">Loading...</p>
              ) : passkeys.length === 0 ? (
                <p className="app-empty">No passkeys added yet.</p>
              ) : (
                <ul className="app-settings-sessions-list">
                  {passkeys.map((p) => (
                    <li key={p.id} className="app-settings-session-row">
                      <span className="app-settings-session-info">
                        <span className="app-settings-session-device">{p.deviceLabel}</span>
                        <span className="app-settings-session-lastactive">
                          Added {relativeTime(p.createdAt)}
                          {p.lastUsedAt ? ` · last used ${relativeTime(p.lastUsedAt)}` : ""}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="app-settings-row-btn"
                        onClick={() => handleRemovePasskey(p)}
                        disabled={removingPasskeyId === p.id}
                      >
                        {removingPasskeyId === p.id ? "Removing..." : "Remove"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="app-settings-row-btn"
                onClick={handleAddPasskey}
                disabled={addingPasskey}
              >
                {addingPasskey ? "Waiting for device..." : "Add a passkey"}
              </button>
            </div>

            <div className="app-settings-group">
              <h3>Your data</h3>
              <p className="app-settings-hint">
                Download a copy of your profile, posts, comments, and activity. Direct messages
                aren't included, since a DM also contains the other person's side of it.
              </p>
              {exportError && <p className="app-auth-error">{exportError}</p>}
              <button type="button" className="app-settings-row-btn" onClick={handleExportData} disabled={exporting}>
                {exporting ? "Preparing..." : "Download your data"}
              </button>
            </div>

            <div className="app-settings-group">
              <h3>Account actions</h3>
              <button type="button" className="app-profile-more-logout app-settings-logout" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        )}

        {activeTab === "Appearance" && (
          <div className="app-settings-content">
            <div className="app-settings-group">
              <h3>Appearance</h3>
              <label className="app-settings-toggle-row">
                <span>Dark mode</span>
                <button
                  type="button"
                  className={"app-settings-switch" + (theme === "dark" ? " is-on" : "")}
                  role="switch"
                  aria-checked={theme === "dark"}
                  onClick={toggleTheme}
                >
                  <span className="app-settings-switch-knob" />
                </button>
              </label>
              <p className="app-settings-hint">Your theme preference is remembered on this device.</p>
            </div>

            {(canInstall || installed) && (
              <div className="app-settings-group">
                <h3>Install app</h3>
                {installed ? (
                  <p className="app-settings-verify-row">
                    <span className="app-settings-verified">Oh Sheet! is installed on this device.</span>
                  </p>
                ) : (
                  <>
                    <p className="app-settings-hint">
                      Install Oh Sheet! for quicker access — it opens in its own window with an icon
                      on your home screen or desktop, just like a regular app.
                    </p>
                    <button type="button" className="app-settings-row-btn" onClick={handleInstallClick}>
                      Install app
                    </button>
                  </>
                )}
              </div>
            )}

            {pushSupported && (
              <div className="app-settings-group">
                <h3>Push notifications</h3>
                <label className="app-settings-toggle-row">
                  <span>Notify me on this device</span>
                  <button
                    type="button"
                    className={"app-settings-switch" + (pushSubscribed ? " is-on" : "")}
                    role="switch"
                    aria-checked={pushSubscribed}
                    disabled={pushBusy}
                    onClick={handleTogglePush}
                  >
                    <span className="app-settings-switch-knob" />
                  </button>
                </label>
                <p className="app-settings-hint">
                  Get an alert on this device — even with the tab closed — for the same things that
                  already show up in your notification bell: follows, upvotes, comments, replies,
                  mentions, tags, and DMs.
                </p>
                {pushError && <p className="app-auth-error">{pushError}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {pendingNav && (
        <div className="app-modal-overlay" onClick={() => setPendingNav(null)}>
          <div
            className="app-modal app-settings-leave-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Unsaved changes</h3>
            <p>You've changed some settings but haven't saved them yet. Leave now and they're gone.</p>
            {error && <p className="app-auth-error">{error}</p>}
            <div className="app-settings-leave-actions">
              <button
                type="button"
                className="app-settings-leave-save"
                disabled={saving || uploadingAvatar || uploadingCover}
                onClick={handleLeaveSave}
              >
                {saving ? "Saving..." : "Save and leave"}
              </button>
              <button type="button" className="app-settings-leave-discard" onClick={handleLeaveDiscard}>
                Discard changes
              </button>
              <button type="button" className="app-settings-leave-stay" onClick={() => setPendingNav(null)}>
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
