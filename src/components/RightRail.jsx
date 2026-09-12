import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import ArcadeChampions from "./ArcadeChampions.jsx";

const MAX_ITEMS = 5;

// Distance the rail keeps from the top of the screen when it's short
// enough to park there (clears the sticky top bar).
const TOP_GAP = 90;
// ...and from the bottom of the screen when it's too tall to park at the top.
const BOTTOM_GAP = 18;

export default function RightRail() {
  const { user } = useAuth();
  const railRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [requestedIds, setRequestedIds] = useState(() => new Set());
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api
      .getSuggestions()
      .then((data) => setPeople(data.slice(0, MAX_ITEMS)))
      .catch(() => setPeople([]));

    api
      .getTrendingPosts(MAX_ITEMS)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, [user]);

  async function handleFollow(personId) {
    if (!user) return;
    try {
      const res = await api.follow(personId);
      if (res?.requested) {
        setRequestedIds((prev) => new Set(prev).add(personId));
      } else {
        setFollowedIds((prev) => new Set(prev).add(personId));
      }
    } catch {
      // Nothing was set optimistically — nothing to roll back.
    }
  }

  // Twitter-style rail. A rail short enough to fit just parks under the
  // top bar. A rail TALLER than the screen can't do that — one end is
  // always off-screen — so which end is showing follows the direction
  // you're scrolling:
  //
  //  - Scrolling down, the rail slides up with the feed until its bottom
  //    reaches the bottom of the screen, then holds there.
  //  - Scrolling up, it slides back down until its top is under the top
  //    bar, then holds there — so the top of the rail comes back after a
  //    short scroll up, instead of only when you reach the top of the
  //    whole page.
  //
  // CSS can't do this alone: `position: sticky` only ever honours one
  // end, so the sticky `top` is recomputed on every scroll. (And it has
  // to be `top` — a sticky element with only `bottom` set never engages
  // here at all; it just scrolls away and stays away.)
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    let lastY = window.scrollY;
    let top = TOP_GAP;
    let frame = 0;

    const apply = () => {
      frame = 0;
      const h = el.offsetHeight;
      if (!h) return;

      // Highest the rail's top edge can go: negative once the rail is
      // taller than the screen.
      const minTop = window.innerHeight - h - BOTTOM_GAP;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      if (minTop >= TOP_GAP) {
        top = TOP_GAP;
      } else {
        top = Math.max(minTop, Math.min(TOP_GAP, top - dy));
      }
      el.style.top = top + "px";
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(schedule);
      ro.observe(el);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
    };
  }, []);

  return (
    <aside className="app-rightrail" ref={railRef}>
      <div className="app-rail-card">
        <h2>People you might know</h2>
        {people.length ? (
          <ul className="app-suggest-list">
            {people.map((p) => (
              <li key={p.id}>
                <Link to={`/profile/${p.username}`} className="app-suggest-dp">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" />
                  ) : (
                    (p.name || p.username).charAt(0).toUpperCase()
                  )}
                </Link>
                <Link to={`/profile/${p.username}`} className="app-suggest-name">
                  {p.name || p.username}
                </Link>
                {user && user.username !== p.username && (
                  <button
                    type="button"
                    className="app-follow-btn"
                    disabled={followedIds.has(p.id) || requestedIds.has(p.id)}
                    onClick={() => handleFollow(p.id)}
                  >
                    {followedIds.has(p.id) ? "Following" : requestedIds.has(p.id) ? "Requested" : "Follow"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-empty">No suggestions right now.</p>
        )}
      </div>

      <div className="app-rail-card">
        <h2>Trending</h2>
        {trending.length ? (
          <ul className="app-trend-list">
            {trending.map((p) => {
              const name = p.author.name || p.author.username;
              const caption = (p.content || "").slice(0, 60);
              return (
                <li key={p.id} className="app-trend-item">
                  <Link to={`/profile/${p.author.username}`} className="app-trend-head">
                    <span className="app-trend-dp">
                      {p.author.avatarUrl ? (
                        <img src={p.author.avatarUrl} alt="" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="app-trend-username">{name}</span>
                  </Link>
                  {caption && (
                    <p className="app-trend-caption">
                      {caption}
                      {(p.content || "").length > 60 ? "…" : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="app-empty">Nothing trending yet.</p>
        )}
      </div>

      <ArcadeChampions />

      <nav className="app-rail-footer">
        <Link to="/about">About</Link>
        <Link to="/rules">Rules</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/agreement">Agreement</Link>
        <Link to="/support">Support</Link>
        <a href="/feed.xml" target="_blank" rel="noopener noreferrer">
          RSS
        </a>
      </nav>
      {/* Not "Inc." — per the Agreement/Privacy pages, Oh Sheet! is a
          personal project run by one person, not a company. Year is
          computed so this never needs a manual bump. */}
      <p className="app-rail-copyright">© {new Date().getFullYear()} Oh Sheet!</p>
    </aside>
  );
}
