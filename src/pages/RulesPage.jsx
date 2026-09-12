const SECTIONS = [
  { id: "be-decent", label: "Be decent" },
  { id: "dms", label: "Messages are still public" },
  { id: "stories", label: "Stories" },
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
        <p className="app-legal-updated">Last updated: September 2026</p>
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

        <h3 id="dms">Messages are still public</h3>
        <p>
          A direct message being private doesn't make it a free-for-all. Everything on this page
          applies in DMs exactly as it does in the feed. If someone stops replying, blocks you, or
          asks you to leave them alone, that's the end of the conversation — don't message them
          from a second account. Unsolicited sexual messages and images are never okay, and
          sharing a private conversation to embarrass or pile on someone counts as harassment.
        </p>

        <h3 id="stories">Stories</h3>
        <p>
          Stories disappear after 24 hours, but they're held to the same standard as anything else
          you post here — a rule you'd break in a sheet is still broken in a story. Assume someone
          screenshotted it: disappearing isn't the same as deleted, and it isn't a reason to post
          something you wouldn't stand behind.
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
          The daily Sudoku and Crossword streaks and the single-player leaderboards — Snake,
          Tetris, Minesweeper, Reaction Timer, Flappy Bird, Endless Runner — only mean something
          if everyone's actually playing. Don't use solvers, bots, or automation to submit scores
          or puzzle solutions.
        </p>
        <p>
          The same goes for the games you play against other people: Rock Paper Scissors,
          Tic-Tac-Toe, Snake &amp; Ladder, Ludo and Monopoly are meant to be played by you, not
          scripted. In a longer game like Monopoly that also means seeing it through — quitting a
          room to dodge a loss, stalling so the table can't continue, or teaming up to bankrupt one
          player for the fun of it all ruin the game for everyone else at it. Votes and trades in
          Monopoly are part of playing; using them to bully someone off the app isn't. Repeatedly
          challenging someone who's asked you to stop isn't in the spirit of it either.
        </p>

        <h3 id="no-impersonation">No impersonation</h3>
        <p>
          Don't create an account pretending to be someone else — a real person, a celebrity, or
          another Oh Sheet! user — in a way that's meant to confuse or deceive people. Clearly
          labeled parody or fan accounts are fine. The verified tick means an account confirmed
          its email or signed in with Google or GitHub; don't try to fake one, and don't treat it
          as proof of anything more than that.
        </p>

        <h3 id="one-account">One account per person</h3>
        <p>
          Keep it to one account. Creating extra accounts to get around a suspension, vote for
          yourself, dodge a block, or work around any of these rules counts as ban evasion and
          gets every account involved removed.
        </p>

        <h3 id="use-the-tools">Use the tools</h3>
        <p>
          Every post, comment, and profile has a Report option, and you can Block or Mute anyone
          whose sheets you'd rather not see or hear from. Your profile can also be set to private
          if you'd rather approve who follows you. Reports get reviewed — use them for things that
          actually break these rules, not just posts you dislike or disagree with.
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
