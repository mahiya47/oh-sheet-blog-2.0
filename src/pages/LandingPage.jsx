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
    title: "Direct messages",
    blurb: "Slide into someone's DMs for a private, one-on-one conversation away from the main feed.",
  },
  {
    emoji: "🕹️",
    color: "pink",
    title: "Arcade & daily puzzles",
    blurb: "Six classic single-player games, plus a daily Sudoku and Crossword to keep your streak alive.",
  },
  {
    emoji: "⚔️",
    color: "purple",
    title: "Challenge a friend",
    blurb: "Live real-time matches — Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, Ludo.",
  },
];

export default function LandingPage() {
  return (
    <div className="app-page app-landing-page">
      <div className="app-landing-hero">
        <span className="app-auth-logo-badge app-landing-logo" style={{ background: logoColor }}>
          <OhSheetLogo size={34} />
        </span>
        <h1 className="app-landing-title">Oh Sheet!</h1>
        <p className="app-landing-tagline">
          A place to post whatever's on your mind — a thought, a photo, a video, a hashtag rabbit
          hole — and see what your people are up to. Part social feed, part arcade, part group
          chat with your closest sheeters.
        </p>
        <div className="app-landing-cta-row">
          <Link to="/signup" className="app-auth-submit app-landing-signup">
            Sign up
          </Link>
          <Link to="/login" className="app-landing-login">
            Log in
          </Link>
        </div>
      </div>

      <h3 className="app-about-subtitle">What you'll find inside</h3>
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

      <div className="app-about-cta">
        <p>
          Free to join, built and run by one person as a personal project.{" "}
          <Link to="/signup">Create an account</Link> to start posting, or{" "}
          <Link to="/about">learn more about Oh Sheet!</Link>.
        </p>
      </div>
    </div>
  );
}
