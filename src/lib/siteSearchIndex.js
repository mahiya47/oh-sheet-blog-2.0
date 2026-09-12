import { ARCADE_GAMES } from "./arcadeGames.js";

// Everything on the site you can jump STRAIGHT to from Search — pages,
// individual settings, and games. Searched locally in the browser (no
// API call), so results appear as fast as you type.
//
// `keywords` are the other words someone might reasonably type for the
// same thing. They're matched but never displayed.

const PAGES = [
  { to: "/", label: "Home feed", emoji: "🏠", keywords: "feed home timeline sheets posts latest" },
  { to: "/stories", label: "Stories", emoji: "📸", keywords: "story status 24 hours camera" },
  { to: "/create", label: "Write a sheet", emoji: "✍️", keywords: "create post new write publish compose upload photo video" },
  { to: "/notifications", label: "Notifications", emoji: "🔔", keywords: "alerts bell activity likes follows mentions" },
  { to: "/messages", label: "Messages", emoji: "💬", keywords: "dm direct message chat inbox conversation" },
  { to: "/profile", label: "My profile", emoji: "👤", keywords: "me my account my posts my sheets bio avatar" },
  { to: "/following", label: "Following feed", emoji: "👥", keywords: "following friends people i follow" },
  { to: "/trending", label: "Trending", emoji: "🔥", keywords: "popular hot top viral" },
  { to: "/leaderboard", label: "Leaderboard", emoji: "🏆", keywords: "ranking top scores points champions" },
  { to: "/arcade", label: "Arcade", emoji: "🕹️", keywords: "games play arcade fun" },
  { to: "/search", label: "Search", emoji: "🔍", keywords: "find look up" },
  { to: "/settings", label: "Settings", emoji: "⚙️", keywords: "options preferences configure account" },
  { to: "/about", label: "About Oh Sheet!", emoji: "📖", keywords: "about who made this creator story info" },
  { to: "/rules", label: "Rules", emoji: "📋", keywords: "rules guidelines community conduct allowed banned" },
  { to: "/privacy", label: "Privacy policy", emoji: "🔒", keywords: "privacy data gdpr cookies tracking" },
  { to: "/agreement", label: "User agreement", emoji: "📜", keywords: "terms agreement tos legal conditions" },
  { to: "/support", label: "Support", emoji: "🛟", keywords: "help contact bug report problem faq question" },
];

// Admin is only listed for the one account that can actually open it.
const ADMIN_PAGE = {
  to: "/admin",
  label: "Admin panel",
  emoji: "🛠️",
  keywords: "admin moderation stats reports errors tickets analytics dashboard",
};

// Each entry deep-links to its tab: SettingsPage reads ?tab= on load.
const SETTINGS = [
  { tab: "Profile", label: "Profile photo", keywords: "avatar dp picture profile pic upload photo change" },
  { tab: "Profile", label: "Cover photo", keywords: "banner header cover background image" },
  { tab: "Profile", label: "Display name", keywords: "name rename what im called" },
  { tab: "Profile", label: "Username", keywords: "username handle @ change username" },
  { tab: "Profile", label: "Bio", keywords: "bio about me description status line" },

  { tab: "About", label: "Birthday", keywords: "birthday dob date of birth age born" },
  { tab: "About", label: "Pronouns", keywords: "pronouns he she they" },
  { tab: "About", label: "Current city", keywords: "city location where i live hometown place" },
  { tab: "About", label: "Work", keywords: "work job company employer career occupation" },
  { tab: "About", label: "Education", keywords: "education school college university study degree" },
  { tab: "About", label: "Gender", keywords: "gender" },
  { tab: "About", label: "Orientation", keywords: "orientation" },

  { tab: "Social Links", label: "GitHub link", keywords: "github git code profile link" },
  { tab: "Social Links", label: "X / Twitter link", keywords: "twitter x tweet link" },
  { tab: "Social Links", label: "LinkedIn link", keywords: "linkedin work profile link" },
  { tab: "Social Links", label: "Instagram link", keywords: "instagram insta ig link" },
  { tab: "Social Links", label: "Pinterest link", keywords: "pinterest pin link" },

  { tab: "Privacy & Safety", label: "Private account", keywords: "private lock protect approve followers requests hide" },
  { tab: "Privacy & Safety", label: "Blocked people", keywords: "block blocked unblock ban" },
  { tab: "Privacy & Safety", label: "Muted people", keywords: "mute muted unmute silence hide posts" },
  { tab: "Privacy & Safety", label: "Delete my account", keywords: "delete account remove close deactivate erase" },

  { tab: "Account", label: "Email verification", keywords: "email verify verification confirm resend tick verified" },
  { tab: "Account", label: "Connected accounts", keywords: "google github connect link oauth sign in with" },
  { tab: "Account", label: "Two-factor authentication", keywords: "2fa two factor totp authenticator otp code security backup codes" },
  { tab: "Account", label: "Passkeys", keywords: "passkey webauthn fingerprint face id biometric no password" },
  { tab: "Account", label: "Active sessions", keywords: "sessions devices logged in log out remotely revoke where im signed in" },
  { tab: "Account", label: "Download my data", keywords: "export download data backup my information" },
  { tab: "Account", label: "Log out", keywords: "logout log out sign out leave" },

  { tab: "Appearance", label: "Dark mode", keywords: "dark mode light theme night black appearance colour color" },
  { tab: "Appearance", label: "Push notifications", keywords: "push notifications alerts browser phone enable turn on" },
  { tab: "Appearance", label: "Install the app", keywords: "install app pwa home screen add shortcut" },
];

function normalise(s) {
  return (s || "").toLowerCase().trim();
}

// Builds the full list once per call — cheap (about 60 items) and keeps
// the admin entry conditional without caching stale state.
function buildIndex(isAdmin) {
  const out = [];

  for (const p of PAGES) {
    out.push({ ...p, group: "Pages", hint: p.to });
  }
  if (isAdmin) out.push({ ...ADMIN_PAGE, group: "Pages", hint: ADMIN_PAGE.to });

  for (const g of ARCADE_GAMES) {
    out.push({
      to: `/arcade/${g.slug}`,
      label: g.label,
      emoji: g.emoji,
      group: "Games",
      keywords: `game arcade play ${g.slug} ${g.blurb} ${g.multiplayer ? "multiplayer friend challenge versus 1v1" : "single player solo high score"}`,
      hint: g.multiplayer ? "Multiplayer game" : "Game",
    });
  }

  for (const s of SETTINGS) {
    out.push({
      to: `/settings?tab=${encodeURIComponent(s.tab)}`,
      label: s.label,
      emoji: "⚙️",
      group: "Settings",
      keywords: `settings ${s.tab} ${s.keywords}`,
      hint: `Settings › ${s.tab}`,
    });
  }

  return out;
}

// Ranked so an exact/prefix hit on the visible label always beats a hit
// buried in the hidden keyword list.
export function searchDestinations(query, { isAdmin = false, limit = 8 } = {}) {
  const q = normalise(query);
  if (q.length < 2) return [];

  const scored = [];
  for (const item of buildIndex(isAdmin)) {
    const label = normalise(item.label);
    const keywords = normalise(item.keywords);
    let score = 0;

    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (new RegExp(`(^|\\s)${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(keywords)) score = 40;
    else if (keywords.includes(q)) score = 20;

    if (score) scored.push({ ...item, score });
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return scored.slice(0, limit);
}
