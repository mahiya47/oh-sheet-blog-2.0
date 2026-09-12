const FEATURES = [
  {
    emoji: "📝",
    color: "yellow",
    title: "Sheets",
    blurb:
      "Post a thought, a photo, a video, or a hashtag rabbit hole from the composer or the New Sheet button. Upvote or downvote, comment, and save the ones you want to find again.",
  },
  {
    emoji: "🏷️",
    color: "pink",
    title: "Tags & hashtags",
    blurb:
      "Tag people directly so they get notified, or drop a #hashtag to link your sheet into that topic's own page for anyone browsing it.",
  },
  {
    emoji: "💬",
    color: "blue",
    title: "Direct messages",
    blurb: "Slide into someone's DMs for a private, one-on-one conversation away from the main feed.",
  },
  {
    emoji: "🔔",
    color: "purple",
    title: "Notifications",
    blurb: "Get pinged when someone follows you, comments, votes, tags you, or messages you — all in one place.",
  },
  {
    emoji: "📈",
    color: "green",
    title: "Trending & Leaderboard",
    blurb:
      "Trending surfaces what's getting the most attention right now. The Leaderboard ranks sheeters by posting, commenting, and getting upvoted.",
  },
  {
    emoji: "👤",
    color: "yellow",
    title: "Profiles",
    blurb:
      "Build out your profile with a bio, avatar, cover photo, and life details like birthday, pronouns, location, work, and education — each one private by default until you choose to show it.",
  },
  {
    emoji: "🕹️",
    color: "pink",
    title: "Arcade",
    blurb:
      "Six classic single-player games (Snake, Tetris, Minesweeper, Reaction Timer, Flappy Bird, Endless Runner), each with its own leaderboard.",
  },
  {
    emoji: "🔥",
    color: "blue",
    title: "Daily puzzles & streaks",
    blurb:
      "A new Sudoku and a new mini Crossword every day, same puzzle for everyone. Solve it to keep your streak alive — miss a day and it resets.",
  },
  {
    emoji: "⚔️",
    color: "purple",
    title: "Challenge a friend",
    blurb:
      "Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, and Ludo — challenge someone you follow to a live, real-time match and see who comes out on top.",
  },
];

export default function AboutPage() {
  return (
    <div className="app-page">
      <h2 className="app-section-title">About Oh Sheet!</h2>

      <div className="app-about-hero">
        <p>
          Oh Sheet! is a place to post whatever's on your mind — a thought, a photo, a video, a
          hashtag rabbit hole — and see what your people are up to.
        </p>
        <p>
          It's part social feed, part arcade, part DMs with your closest sheeters. Follow
          people, post sheets, climb the leaderboard, keep a puzzle streak alive, and challenge a
          friend to a quick game when you need a break from scrolling.
        </p>
      </div>

      <h3 className="app-about-subtitle">Everything you can do here</h3>
      <div className="app-about-feature-grid">
        {FEATURES.map((f) => (
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
          Oh Sheet! isn't a demo or a weekend side project — it's a real, working blog, built and
          run by one person rather than a company.
        </p>
        <p>
          Every part of it — the feed, the arcade, the messages, the server it all runs on — was
          written by me, Sourabh Mahiya, and it lives on my GitHub at{" "}
          <a href="https://github.com/mahiya47" target="_blank" rel="noreferrer">
            github.com/mahiya47
          </a>
          .
        </p>
        <p>
          So if something looks off, or you've got an idea for what's next, head over to{" "}
          <a href="/support">Support</a> and say hi — I'd love to hear from you.
        </p>
      </div>
    </div>
  );
}
