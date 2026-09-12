import { Link } from "react-router-dom";
import { logoColor } from "../lib/logoColor.js";
import OhSheetLogo from "../components/OhSheetLogo.jsx";

// Shown instead of the real feed to anyone who isn't signed in — see
// App.jsx's showLanding gate. Keep this in sync in spirit with
// AboutPage.jsx's fuller feature list, but shorter: this is a pitch, not
// a reference page (that's what the "learn more" link is for).
const HIGHLIGHTS = [
  {
    emoji: "📝",
    color: "yellow",
    title: "Sheets",
    blurb: "Post a thought, a photo, a video, or a hashtag rabbit hole. Upvote, comment, and save the ones you love.",
  },
  {
    emoji: "💬",
    color: "blue",
    title: "Messages & stories",
    blurb: "Private one-on-one DMs, plus stories that quietly disappear after 24 hours.",
  },
  {
    emoji: "🕹️",
    color: "pink",
    title: "Arcade & daily puzzles",
    blurb: "Six single-player games with their own leaderboards, plus a daily Sudoku and Crossword to keep your streak alive.",
  },
  {
    emoji: "🎲",
    color: "purple",
    title: "Play your friends",
    blurb: "Live matches — Monopoly, Ludo, Snake & Ladder, Tic-Tac-Toe and Rock Paper Scissors.",
  },
];

export default function LandingPage() {
  return (
    <div className="app-page app-landing-page">
      <div className="app-landing-hero">
        <span className="app-auth-logo-badge app-landing-logo" style={{ background: logoColor }}>
          <OhSheetLogo size={40} />
        </span>
        <h1 className="app-landing-title">Oh Sheet!</h1>
        <p className="app-landing-kicker">Post it. Play it. Keep up with your people.</p>
        <p className="app-landing-tagline">
          A place to post whatever's on your mind — a thought, a photo, a video, a hashtag rabbit
          hole — and see what your people are up to. Part social feed, part arcade, part DMs with
          your closest sheeters.
        </p>
        <div className="app-landing-cta-row">
          <Link to="/signup" className="app-landing-signup">
            Create an account
          </Link>
          <Link to="/login" className="app-landing-login">
            Log in
          </Link>
        </div>
        <p className="app-landing-note">Free to join · No ads · No algorithm deciding for you</p>
      </div>

      <h3 className="app-about-subtitle app-landing-subtitle">What you'll find inside</h3>
      <div className="app-about-feature-grid">
        {HIGHLIGHTS.map((f) => (
          <div className={`app-about-feature app-card-${f.color}`} key={f.title}>
            <span className="app-about-feature-emoji" aria-hidden="true">
              {f.emoji}
            </span>
            <span className="app-about-feature-title">{f.title}</span>
            <p className="app-about-feature-blurb">{f.blurb}</p>
          </div>
        ))}
      </div>

      <div className="app-about-cta app-landing-outro">
        <p>
          Oh Sheet! is a real, working blog — built and run by one person, not a company.
        </p>
        <p>
          <Link to="/signup">Create an account</Link> to start posting, or{" "}
          <Link to="/about">read more about it first</Link>.
        </p>
      </div>
    </div>
  );
}
