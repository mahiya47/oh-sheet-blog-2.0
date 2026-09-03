const SECTIONS = [
  { id: "what-we-collect", label: "What we collect" },
  { id: "how-we-use-it", label: "How we use it" },
  { id: "who-we-share-with", label: "Who we share it with" },
  { id: "cookies", label: "Cookies & local storage" },
  { id: "retention", label: "Data retention" },
  { id: "your-rights", label: "Your rights" },
  { id: "children", label: "Children's privacy" },
  { id: "security", label: "Security" },
  { id: "changes", label: "Changes to this policy" },
  { id: "questions", label: "Questions" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="app-page">
      <h2 className="app-section-title">Privacy policy</h2>
      <div className="app-legal-content">
        <p className="app-legal-updated">Last updated: September 2026</p>
        <p className="app-legal-intro">
          This covers what Oh Sheet! collects, why, and what you can do about it. We've tried to
          write it the way we'd actually explain it to a friend, not the way a legal team would.
        </p>

        <ul className="app-legal-nav">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>

        <h3 id="what-we-collect">What we collect</h3>
        <p>
          When you sign up we store your name, username, email address, and password (hashed —
          we never store it in plain text). If you sign in with Google or GitHub instead, we
          store the account ID they give us so we can recognize you next time, and we never see
          your Google or GitHub password.
        </p>
        <p>
          Anything you choose to add to your profile — bio, birthday, pronouns, location, work,
          education, gender, orientation, social links, and your avatar or cover photo — is
          stored too. Fields like gender and orientation are private by default; they're only
          shown to other people if you turn on "show on profile" for them yourself.
        </p>
        <p>
          We also store the sheets (posts), comments, votes, follows, tags, hashtags, and direct
          messages you create, since that's the whole point of the app. On the Arcade side, we
          store your single-player high scores and your daily Sudoku/Crossword streak. Real-time
          multiplayer games (Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder, Ludo) aren't saved
          anywhere — once a match ends, it's gone.
        </p>
        <p>
          Like most apps, our servers automatically log basic technical info for security and
          debugging — things like IP address, browser type, and timestamps of requests. We don't
          use this for tracking or advertising, just for keeping the app running and safe.
        </p>

        <h3 id="how-we-use-it">How we use it</h3>
        <p>
          Your data is used to run the app: showing your feed, your profile, your notifications,
          your messages, your arcade stats, and the leaderboard. We don't sell your data, and we
          don't share it with advertisers — Oh Sheet! doesn't run ads.
        </p>

        <h3 id="who-we-share-with">Who we share it with</h3>
        <p>
          We use a third-party service (Resend) to send account emails like verification links
          and password resets. If you connect a Google or GitHub account, those providers handle
          your sign-in — we only ever see the minimum info they share with us (your email and
          basic profile details). Our database and servers are hosted with standard cloud
          infrastructure providers, the same way pretty much every app on the internet works.
          None of these partners get to use your data for their own purposes — they just help us
          run the app.
        </p>
        <p>We don't sell, rent, or trade your personal data to anyone, period.</p>

        <h3 id="cookies">Cookies and local storage</h3>
        <p>
          We keep a login token in your browser's local storage so you don't have to log in every
          time you open the app. We also use local storage for small, non-sensitive things like
          remembering which "what's new" tour you've already seen. We don't use tracking cookies,
          analytics trackers, or third-party ad trackers.
        </p>

        <h3 id="retention">Data retention and deleting your account</h3>
        <p>
          We keep your data for as long as your account is active. If you delete your account
          from Settings, it's deactivated immediately and permanently erased after 7 days. If you
          log back in during that window, your account and everything in it comes right back —
          after 7 days, it's gone for good and can't be recovered.
        </p>

        <h3 id="your-rights">Your rights</h3>
        <p>
          You can see and edit almost everything we store about you directly in Settings and on
          your own profile. You can also ask us, from the Support page, to tell you what data we
          hold on your account or to delete it outright — for most requests, deleting your
          account from Settings is the fastest way to do that yourself.
        </p>

        <h3 id="children">Children's privacy</h3>
        <p>
          Oh Sheet! isn't directed at children, and you need to be at least 13 years old to make
          an account (see the Agreement for the full eligibility rule). We don't knowingly
          collect data from anyone younger than that — if we find out an account belongs to a
          child under 13, we'll remove it.
        </p>

        <h3 id="security">Security</h3>
        <p>
          Passwords are hashed, never stored or logged in plain text, and all traffic to Oh
          Sheet! is encrypted in transit. No system is perfectly unbreakable, so if you notice
          anything that looks like a security issue, please report it through the Support page —
          we take that seriously and will look into it quickly.
        </p>

        <h3 id="changes">Changes to this policy</h3>
        <p>
          If this policy changes in a meaningful way, we'll update the date at the top of this
          page and do our best to flag it in the app's "what's new" announcement. Continuing to
          use Oh Sheet! after a change means you're okay with the updated policy.
        </p>

        <h3 id="questions">Questions</h3>
        <p>
          This app is built and run by one person, not a company with a legal team — if you have
          questions about your data, reach out from the Support page and we'll actually answer.
        </p>
      </div>
    </div>
  );
}
