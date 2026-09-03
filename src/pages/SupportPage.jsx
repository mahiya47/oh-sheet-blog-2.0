import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

// Grouped by topic and rendered as a native <details>/<summary> accordion —
// no extra JS needed for the expand/collapse behavior, and it stays usable
// with a long list on a small phone screen.
const FAQ_GROUPS = [
  {
    title: "Account & getting started",
    items: [
      {
        q: "How do I sign up?",
        a: "Tap Create an account from the Login page, or sign up straight through Google or GitHub — either way you'll land on a quick onboarding flow that walks you through your profile.",
      },
      {
        q: "I forgot my password — now what?",
        a: "Use the Forgot password? link on the Login page. We'll email you a reset link — it expires after a while for security, so use it soon after it lands.",
      },
      {
        q: "Can I log in with Google or GitHub instead of a password?",
        a: "Yes. If you signed up with email, you can link a Google or GitHub account from Settings so you can use either from then on. If you already have an Oh Sheet account tied to that Google/GitHub account, logging in with it works immediately — if you don't, the Login page will let you know and point you to Signup instead, rather than creating an account you didn't ask for.",
      },
      {
        q: "How do I change my email, username, or password?",
        a: "All of that lives in Settings, along with your bio, avatar, cover photo, and the rest of your profile details.",
      },
      {
        q: "How do I delete my account?",
        a: "From Settings, scroll to account deletion. It's deactivated immediately and permanently erased after 7 days — log back in during that window and everything comes right back. See the Privacy Policy for the full details.",
      },
    ],
  },
  {
    title: "Posting & the feed",
    items: [
      {
        q: "How do I post a sheet?",
        a: "Use the composer bar on the Home page, or tap New Sheet in the side menu. You can attach a photo or video, tag people, and drop in hashtags.",
      },
      {
        q: "How do I tag people or add a hashtag?",
        a: "On the New Sheet page, type # then a word to attach a hashtag, or use the Tag people button to tag someone directly — they'll get a notification either way.",
      },
      {
        q: "What's the difference between upvoting and downvoting?",
        a: "Upvotes and downvotes are how the feed and Trending page know what's landing — they don't affect anyone's account standing beyond the Leaderboard, which counts upvotes you've received.",
      },
      {
        q: "Can I save a sheet to find later?",
        a: "Yes — tap save on any sheet and it'll show up in your saved list from your profile.",
      },
      {
        q: "Can I edit or delete something I posted?",
        a: "Yes, from the ⋯ menu on your own sheet or comment. Editing shows an \"edited\" marker; deleting removes it for good.",
      },
    ],
  },
  {
    title: "Arcade & games",
    items: [
      {
        q: "How does the daily Sudoku/Crossword streak work?",
        a: "Everyone gets the same puzzle each day. Solve it and your streak goes up by one; miss a day entirely and it resets to zero. Solving the same day's puzzle again doesn't double-count.",
      },
      {
        q: "How do I challenge a friend to a game?",
        a: "Open Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, or Ludo from the Arcade — you'll see a list of people you follow with a Challenge button next to each. They get a live invite to accept or decline.",
      },
      {
        q: "What happens if my opponent closes the app mid-game?",
        a: "The match ends right there for both of you — these games play out live and aren't saved partway through, so there's nothing to resume. Just send a new challenge.",
      },
      {
        q: "Do arcade scores affect the Leaderboard?",
        a: "No — the Leaderboard tracks posting, commenting, and upvotes received. Arcade high scores and puzzle streaks are their own thing, shown on the Arcade page and your profile.",
      },
    ],
  },
  {
    title: "Messages & privacy",
    items: [
      {
        q: "Who can message me?",
        a: "Anyone can start a conversation with you from your profile. If you'd rather not hear from someone, block them from their profile — that closes the door on messages, follows, and seeing your sheets.",
      },
      {
        q: "Can I control what shows on my profile?",
        a: "Yes — fields like gender, orientation, and other life details are private by default. Flip \"show on profile\" for any of them in Settings if you want them visible to others.",
      },
      {
        q: "How do I report something?",
        a: "Every sheet, comment, and profile has a Report option. Reports get reviewed against the Rules — use them for actual violations, not just posts you disagree with.",
      },
    ],
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await api.submitSupportTicket({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSent(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.message || "Couldn't submit your message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-page">
      <h2 className="app-section-title">Support</h2>
      <p className="app-empty">
        Answers to the questions we get most, and a direct line to us for everything else.
      </p>

      <div className="app-support-quicklinks">
        <a href="/about">How Oh Sheet! works</a>
        <a href="/rules">Community rules</a>
        <a href="/privacy">Privacy policy</a>
        <a href="/agreement">Terms of use</a>
      </div>

      {FAQ_GROUPS.map((group) => (
        <div className="app-faq-group" key={group.title}>
          <h3 className="app-faq-group-title">{group.title}</h3>
          <div className="app-faq-accordion">
            {group.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      ))}

      <h3 className="app-section-title">Contact us</h3>
      <div className="app-support-form-card">
        {sent ? (
          <p className="app-empty">Thanks — we got your message and will get back to you soon.</p>
        ) : (
          <>
            <p>Didn't find your answer above? Send us a message and a real person will reply — usually within a day or two.</p>
            <form className="app-support-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                rows={5}
                placeholder="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              {error && <p className="app-auth-error">{error}</p>}
              <button type="submit" className="app-support-submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
