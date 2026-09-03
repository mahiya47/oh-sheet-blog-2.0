const SECTIONS = [
  { id: "acceptance", label: "Acceptance of these terms" },
  { id: "eligibility", label: "Who can use Oh Sheet!" },
  { id: "your-account", label: "Your account" },
  { id: "your-content", label: "Your content" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "third-party", label: "Third-party services" },
  { id: "removal", label: "Suspension & account removal" },
  { id: "no-guarantees", label: "No guarantees" },
  { id: "liability", label: "Limitation of liability" },
  { id: "changes", label: "Changes to this agreement" },
  { id: "contact", label: "Contact" },
];

export default function AgreementPage() {
  return (
    <div className="app-page">
      <h2 className="app-section-title">Agreement</h2>
      <div className="app-legal-content">
        <p className="app-legal-updated">Last updated: September 2026</p>
        <p className="app-legal-intro">
          This is the agreement between you and Oh Sheet! for using the app. It's written in
          plain language on purpose — it's still the terms you're agreeing to by using the app,
          just without the legalese.
        </p>

        <ul className="app-legal-nav">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.label}</a>
            </li>
          ))}
        </ul>

        <h3 id="acceptance">Acceptance of these terms</h3>
        <p>
          By creating an account or using Oh Sheet! in any way, you're agreeing to this Agreement,
          the Rules, and the Privacy Policy. If you don't agree with any of it, the app isn't for
          you right now — that's okay, but please don't sign up.
        </p>

        <h3 id="eligibility">Who can use Oh Sheet!</h3>
        <p>
          You need to be at least 13 years old to create an account. If local law where you live
          sets a higher minimum age for using services like this, that higher age applies to you
          instead. By signing up, you're confirming you meet whichever age applies to you.
        </p>

        <h3 id="your-account">Your account</h3>
        <p>
          You're responsible for what happens on your account and for keeping your password
          safe. You need to give us a real, working email so we can verify you and reach you if
          something's wrong with your account. Don't share your login with anyone else, and let
          us know through Support right away if you think someone's gotten into your account
          without permission.
        </p>

        <h3 id="your-content">Your content</h3>
        <p>
          Whatever you post — sheets, comments, your bio, your photos — is still yours. By
          posting it here, you're giving Oh Sheet! permission to store it and show it to other
          users, which is just what running the app requires. You're responsible for what you
          post, and by posting it you're confirming you actually have the right to post it and
          that it doesn't violate anyone else's rights.
        </p>

        <h3 id="acceptable-use">Acceptable use</h3>
        <p>
          Follow the <a href="/rules">Rules</a> — they're part of this agreement, not a separate
          suggestion. Don't try to break, scrape, or abuse the app: that includes automated bots,
          spamming the API, scripting the arcade games or multiplayer matches, or trying to access
          accounts that aren't yours.
        </p>

        <h3 id="third-party">Third-party services</h3>
        <p>
          Oh Sheet! uses a few outside services to work properly — Google and GitHub for optional
          sign-in, Resend for account emails, and standard cloud hosting for our servers and
          database. Using those sign-in options also means agreeing to that provider's own terms
          with them; we don't control what happens on their end. Any links other users post to
          outside sites are their content, not ours, and we're not responsible for where they
          lead.
        </p>

        <h3 id="removal">Suspension and account removal</h3>
        <p>
          You can delete your own account any time from Settings (with a 7-day window to change
          your mind — see the Privacy Policy). We can also suspend or remove accounts that break
          the Rules, ranging from a warning to a permanent ban depending on how serious it is.
        </p>

        <h3 id="no-guarantees">No guarantees</h3>
        <p>
          Oh Sheet! is a personal project, run and maintained by one person. It's provided
          "as-is," without guarantees of uptime, that it'll be bug-free, or that it'll be around
          forever — though we'll try our best to keep it running smoothly and to give notice
          before any major changes or, in the unlikely event it ever happens, shutting down.
        </p>

        <h3 id="liability">Limitation of liability</h3>
        <p>
          To the extent the law allows it, Oh Sheet! isn't liable for indirect damages or losses
          that come from using (or not being able to use) the app — think lost data from a bug or
          downtime, not anything intentional on our part. We're a single-person project, not a
          company with deep pockets, so this keeps things realistic on both sides.
        </p>

        <h3 id="changes">Changes to this agreement</h3>
        <p>
          If this agreement changes in a meaningful way, we'll update the date at the top of this
          page and mention it in the app's "what's new" announcement. Continuing to use Oh Sheet!
          after a change means you're okay with the updated terms.
        </p>

        <h3 id="contact">Contact</h3>
        <p>
          Questions about any of this? Reach out from the <a href="/support">Support</a> page —
          it goes straight to the person who built and runs Oh Sheet!, and you'll get a real
          answer.
        </p>
      </div>
    </div>
  );
}
