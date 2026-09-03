const SECTIONS = [
  { id: "be-decent", label: "Be decent" },
  { id: "no-spam", label: "No spam" },
  { id: "keep-it-legal", label: "Keep it legal" },
  { id: "fair-play", label: "Fair play in the Arcade" },
  { id: "no-impersonation", label: "No impersonation" },
  { id: "one-account", label: "One account per person" },
  { id: "use-the-tools", label: "Use the tools" },
  { id: "enforcement", label: "What happens if you break these" },
];

export default function RulesPage() {
  return (
    <div className="app-page">
      <h2 className="app-section-title">Rules</h2>
      <div className="app-legal-content">
        <p className="app-legal-intro">
          Oh Sheet! works best when it's a good place to hang out. The short version: don't be
          cruel, don't cheat, don't break the law. Here's the longer version.
        </p>

        <ul className="app-legal-nav">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>

        <h3 id="be-decent">Be decent</h3>
        <p>
          No harassment, hate speech, threats, or targeting someone because of who they are —
          their race, religion, gender, sexual orientation, disability, or anything else.
          Disagree with a sheet all you want — attack the take, not the person. Pile-ons, brigading
          someone's profile, and encouraging others to harass someone are all covered by this too.
        </p>

        <h3 id="no-spam">No spam</h3>
        <p>
          Don't flood the feed with repeated posts, fake engagement, or unrelated
          self-promotion. Tag people because they're actually relevant, not to farm attention.
          Using bots, scripts, or vote-manipulation schemes to inflate upvotes, followers, or
          leaderboard position is spam too, even if a human is technically clicking the buttons.
        </p>

        <h3 id="keep-it-legal">Keep it legal</h3>
        <p>
          Nothing illegal, no sexual content involving minors in any form, no doxxing, and no
          sharing someone's private information (address, phone number, workplace, ID documents)
          without their say-so. This covers content you post, links you share, and messages you
          send.
        </p>

        <h3 id="fair-play">Fair play in the Arcade</h3>
        <p>
          The daily Sudoku and Crossword streaks and the single-player leaderboards only mean
          something if everyone's actually playing. Don't use solvers, bots, or automation to
          submit scores or puzzle solutions — that includes scripting the real-time multiplayer
          games (Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, Ludo) instead of playing them
          yourself. Sandbagging a match on purpose to manipulate an opponent, or repeatedly
          challenging someone who's asked you to stop, isn't in the spirit of it either.
        </p>

        <h3 id="no-impersonation">No impersonation</h3>
        <p>
          Don't create an account pretending to be someone else — a real person, a celebrity, or
          another Oh Sheet! user — in a way that's meant to confuse or deceive people. Clearly
          labeled parody or fan accounts are fine.
        </p>

        <h3 id="one-account">One account per person</h3>
        <p>
          Keep it to one account. Creating extra accounts to get around a suspension, vote for
          yourself, dodge a block, or work around any of these rules counts as ban evasion and
          gets every account involved removed.
        </p>

        <h3 id="use-the-tools">Use the tools</h3>
        <p>
          Every post, comment, and profile has a Report option, and you can Block anyone whose
          sheets you'd rather not see or hear from. Reports get reviewed — use them for things
          that actually break these rules, not just posts you dislike or disagree with.
        </p>

        <h3 id="enforcement">What happens if you break these</h3>
        <p>
          Depending on how serious it is, that can mean a removed post, a warning, a temporary
          suspension, or your account getting permanently removed. Repeated or serious violations
          (harassment campaigns, illegal content, ban evasion) go straight to a permanent removal.
          If you think a decision was a mistake, you can appeal it from the Support page — include
          what happened and we'll take another look.
        </p>
      </div>
    </div>
  );
}
