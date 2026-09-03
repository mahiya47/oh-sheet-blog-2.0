import { Link } from "react-router-dom";

// Login, Signup, and the other auth-flow pages render "bare" — no
// SideNav/RightRail — so without this, someone who isn't logged in yet
// has no way to find About, Rules, Privacy, the Agreement, or Support.
// Shared so both pages (and any future bare auth page) stay in sync.
export default function AuthFooterLinks() {
  return (
    <nav className="app-auth-footer" aria-label="About Oh Sheet!">
      <Link to="/about">About</Link>
      <Link to="/rules">Rules</Link>
      <Link to="/privacy">Privacy</Link>
      <Link to="/agreement">Terms</Link>
      <Link to="/support">Support</Link>
    </nav>
  );
}
