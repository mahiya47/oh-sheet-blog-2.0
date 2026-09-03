// Single source of truth for the "what's new" announcement shown to
// returning users after an update (see appAnnouncements.js for the
// per-account tracking, and WhatsNewModal.jsx for the UI). Bump
// CURRENT_APP_VERSION and update WHATS_NEW_HIGHLIGHTS whenever there's
// something worth telling people about — anyone whose last-seen version
// doesn't match this one gets shown the new list, once.
export const CURRENT_APP_VERSION = "2.1";

export const WHATS_NEW_HIGHLIGHTS = [
  {
    emoji: "⚔️",
    title: "Challenge a friend, live",
    blurb:
      "Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, and Ludo now support real-time 1-on-1 matches against anyone you follow — right from the Arcade.",
  },
  {
    emoji: "🔥",
    title: "Daily puzzle streaks",
    blurb:
      "A new Sudoku and mini Crossword every day, same for everyone. Solve it to keep your streak alive.",
  },
  {
    emoji: "🔐",
    title: "Safer Google & GitHub login",
    blurb:
      "Logging in with Google or GitHub now asks before creating a new account if one doesn't already exist — no more surprise sign-ups.",
  },
  {
    emoji: "📄",
    title: "Reworked About, Support & legal pages",
    blurb:
      "About, Support, Privacy, Rules, and the Agreement all got a proper rewrite — more detail, easier to actually find what you're looking for.",
  },
];
