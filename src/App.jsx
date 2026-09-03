import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { logoColor, buildFaviconHref } from "./lib/logoColor.js";
import TopBar from "./components/TopBar.jsx";
import SideNav from "./components/SideNav.jsx";
import RightRail from "./components/RightRail.jsx";
import BottomNav from "./components/BottomNav.jsx";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import PostPage from "./pages/PostPage.jsx";
import TagPage from "./pages/TagPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import MessageThreadPage from "./pages/MessageThreadPage.jsx";
import FollowingPage from "./pages/FollowingPage.jsx";
import TrendingPage from "./pages/TrendingPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.jsx";
import RulesPage from "./pages/RulesPage.jsx";
import AgreementPage from "./pages/AgreementPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SnakePage from "./pages/arcade/SnakePage.jsx";
import TetrisPage from "./pages/arcade/TetrisPage.jsx";
import MinesweeperPage from "./pages/arcade/MinesweeperPage.jsx";
import ReactionPage from "./pages/arcade/ReactionPage.jsx";
import FlappyBirdPage from "./pages/arcade/FlappyBirdPage.jsx";
import RunnerPage from "./pages/arcade/RunnerPage.jsx";
import SudokuPage from "./pages/arcade/SudokuPage.jsx";
import CrosswordPage from "./pages/arcade/CrosswordPage.jsx";
import RpsPage from "./pages/arcade/RpsPage.jsx";
import TicTacToePage from "./pages/arcade/TicTacToePage.jsx";
import SnakeLadderPage from "./pages/arcade/SnakeLadderPage.jsx";
import LudoPage from "./pages/arcade/LudoPage.jsx";
import IncomingChallengeModal from "./components/IncomingChallengeModal.jsx";
import AppAnnouncementsGate from "./components/AppAnnouncementsGate.jsx";
import InstallAppPrompt from "./components/InstallAppPrompt.jsx";
import { api } from "./lib/api.js";

// Pages that render "bare" — no TopBar, SideNav, RightRail or BottomNav —
// matching the old app's chrome-free auth screens and Settings page.
// Matched by exact path or as a path prefix (for routes with params, like
// "/reset-password/:token").
const BARE_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/oauth-callback",
  "/settings",
];

function isBarePath(pathname) {
  return BARE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function App() {
  // Match the browser tab icon — and every "accent" highlight in the app
  // (active nav item, New Sheet button, Follow/Message buttons) — to
  // this reload's random logo color.
  useEffect(() => {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = buildFaviconHref(logoColor);
    document.documentElement.style.setProperty("--app-accent", logoColor);
  }, []);

  const location = useLocation();
  const bare = isBarePath(location.pathname);

  // Lightweight built-in analytics — one ping per route change, fire and
  // forget. api.trackPageview already swallows its own errors.
  useEffect(() => {
    api.trackPageview(location.pathname);
  }, [location.pathname]);

  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:username" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify/:token" element={<VerifyEmailPage />} />
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/tag/:name" element={<TagPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:username" element={<MessageThreadPage />} />
      <Route path="/following" element={<FollowingPage />} />
      <Route path="/trending" element={<TrendingPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/arcade" element={<ArcadePage />} />
      <Route path="/arcade/snake" element={<SnakePage />} />
      <Route path="/arcade/tetris" element={<TetrisPage />} />
      <Route path="/arcade/minesweeper" element={<MinesweeperPage />} />
      <Route path="/arcade/reaction" element={<ReactionPage />} />
      <Route path="/arcade/flappybird" element={<FlappyBirdPage />} />
      <Route path="/arcade/runner" element={<RunnerPage />} />
      <Route path="/arcade/sudoku" element={<SudokuPage />} />
      <Route path="/arcade/crossword" element={<CrosswordPage />} />
      <Route path="/arcade/rps" element={<RpsPage />} />
      <Route path="/arcade/tictactoe" element={<TicTacToePage />} />
      <Route path="/arcade/snakeandladder" element={<SnakeLadderPage />} />
      <Route path="/arcade/ludo" element={<LudoPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/agreement" element={<AgreementPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );

  if (bare) {
    return (
      <div className="app-bare-shell">
        <main className="app-bare-main">{routes}</main>
        <IncomingChallengeModal />
        <InstallAppPrompt />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <SideNav />
        <main className="app-main">{routes}</main>
        <RightRail />
      </div>
      <BottomNav />
      <IncomingChallengeModal />
      <AppAnnouncementsGate />
      <InstallAppPrompt />
    </div>
  );
}
