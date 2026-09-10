import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import NavIcon from "../components/NavIcons.jsx";
import FollowListModal from "../components/FollowListModal.jsx";
import ImageLightbox from "../components/ImageLightbox.jsx";
import { ProfileHeaderSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

const TABS = ["Posts", "About", "Saved"];

const GENDER_LABELS = {
  woman: "Woman",
  man: "Man",
  nonbinary: "Non-binary",
  other: "Other gender",
};
const ORIENTATION_LABELS = {
  straight: "Straight",
  gay: "Gay",
  lesbian: "Lesbian",
  bisexual: "Bisexual",
  asexual: "Asexual",
  other: "Other orientation",
};

export default function ProfilePage() {
  // No :username in the URL means "my own profile".
  const { username } = useParams();
  const { user, loading, logout } = useAuth();
  const viewedUsername = username || user?.username;
  const navigate = useNavigate();

  // Visiting "/profile" (no username) while logged out has nothing to show.
  useEffect(() => {
    if (!username && !loading && !user) {
      navigate("/login", { state: { from: "/profile" } });
    }
  }, [username, loading, user, navigate]);

  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState(null);
  const [activeTab, setActiveTab] = useState("Posts");
  const [following, setFollowing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const isOwnProfile = !!user && !!profile && user.username === profile.username;
  // A private account's sheets are only visible to the account itself and
  // people it's already accepted as a follower.
  const canViewContent =
    !profile || !profile.isPrivate || profile.isFollowedByMe || profile.isOwnProfile;

  // Viewing a different profile re-uses this same page/component, so
  // reset the per-profile UI state and re-fetch whenever the username changes.
  useEffect(() => {
    if (!viewedUsername) return;
    setActiveTab("Posts");
    setMoreOpen(false);
    setProfile(null);
    setNotFound(false);
    setPosts([]);
    setSavedPosts(null);

    api
      .getUserByUsername(viewedUsername)
      .then((data) => {
        setProfile(data);
        setFollowing(!!data.isFollowedByMe);
        setRequested(!!data.hasPendingRequest);
        // Private + not-yet-approved: the posts endpoint would just 403 —
        // don't bother calling it. (isOwnProfile comes straight from the
        // backend's own view of the token, so this doesn't race against
        // AuthContext's own async `user` load.)
        if (data.isPrivate && !data.isFollowedByMe && !data.isOwnProfile) {
          setPosts([]);
          return;
        }
        api
          .getPostsByUsername(viewedUsername)
          .then(setPosts)
          .catch(() => setPosts([]));
      })
      .catch(() => setNotFound(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedUsername]);

  useEffect(() => {
    function onClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (activeTab === "Saved" && isOwnProfile && savedPosts === null) {
      api
        .getSavedPosts()
        .then(setSavedPosts)
        .catch(() => setSavedPosts([]));
    }
  }, [activeTab, isOwnProfile, savedPosts]);

  // Keep the Saved tab in sync the moment a post is saved/unsaved anywhere
  // in the app (this page included), instead of only picking it up on the
  // next fetch/reload — see the matching dispatch in FeedCard.jsx.
  useEffect(() => {
    function onBookmarkChanged(e) {
      const { post, saved: nowSaved } = e.detail || {};
      if (!post) return;
      setSavedPosts((prev) => {
        if (!prev) return prev; // Saved tab hasn't been opened/loaded yet
        if (nowSaved) {
          if (prev.some((p) => p.id === post.id)) return prev;
          return [post, ...prev];
        }
        return prev.filter((p) => p.id !== post.id);
      });
    }
    window.addEventListener("app:bookmark-changed", onBookmarkChanged);
    return () => window.removeEventListener("app:bookmark-changed", onBookmarkChanged);
  }, []);

  function requireAuth() {
    if (!user) {
      navigate("/login", { state: { from: `/profile/${viewedUsername}` } });
      return false;
    }
    return true;
  }

  async function handleToggleFollow() {
    if (!requireAuth() || !profile) return;

    // Already following, or waiting on approval — either way this button
    // undoes it.
    if (following || requested) {
      setFollowing(false);
      setRequested(false);
      try {
        await api.unfollow(profile.id);
      } catch {
        setFollowing(following);
        setRequested(requested);
      }
      return;
    }

    try {
      const res = await api.follow(profile.id);
      if (res?.requested) setRequested(true);
      else setFollowing(true);
    } catch {
      // Nothing was set optimistically in this branch — nothing to undo.
    }
  }

  async function handleReport() {
    setMoreOpen(false);
    if (!requireAuth() || !profile) return;
    const reason = window.prompt(`Why are you reporting @${profile.username}?`);
    if (!reason || !reason.trim()) return;
    try {
      await api.report(profile.id, reason.trim());
      alert("Report submitted.");
    } catch (err) {
      alert(err.message || "Couldn't submit report");
    }
  }

  async function handleBlock() {
    setMoreOpen(false);
    if (!requireAuth() || !profile) return;
    if (!window.confirm(`Block @${profile.username}?`)) return;
    try {
      await api.block(profile.id);
      alert(`@${profile.username} is blocked.`);
    } catch (err) {
      alert(err.message || "Couldn't block user");
    }
  }

  function handleShareProfile() {
    setMoreOpen(false);
    const url = `${window.location.origin}/profile/${viewedUsername}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
  }

  function handleDeleted(id) {
    setPosts((p) => p.filter((post) => post.id !== id));
    setSavedPosts((p) => (p ? p.filter((post) => post.id !== id) : p));
  }

  if (notFound) {
    return (
      <div className="app-page">
        <p className="app-empty">No sheeter found at @{viewedUsername}.</p>
      </div>
    );
  }

  if (!profile) {
    return <ProfileHeaderSkeleton />;
  }

  return (
    <div className="app-profile-page">
      {profile.coverUrl ? (
        <div
          className="app-profile-cover app-profile-cover-photo"
          style={{ backgroundImage: `url(${profile.coverUrl})`, cursor: "zoom-in" }}
          onClick={() => setLightboxSrc(profile.coverUrl)}
          role="button"
          aria-label="View cover photo"
        />
      ) : (
        <div className="app-profile-cover" />
      )}

      <div className="app-profile-main">
        {profile.avatarUrl ? (
          <img
            className="app-profile-avatar app-profile-avatar-photo"
            src={profile.avatarUrl}
            alt={profile.name}
            style={{ cursor: "zoom-in" }}
            onClick={() => setLightboxSrc(profile.avatarUrl)}
          />
        ) : (
          <span className="app-profile-avatar">{profile.name.charAt(0).toUpperCase()}</span>
        )}

        <h2 className="app-profile-username">
          {profile.name}
          {profile.pronouns && <span className="app-profile-pronouns">{profile.pronouns}</span>}
        </h2>
        <p className="app-profile-handle">
          @{profile.username}
          {profile.isPrivate && <span className="app-profile-private-badge"> · Private account</span>}
        </p>
        <p className="app-profile-bio">{profile.bio || "This sheeter hasn't written a bio yet."}</p>

        {(profile.githubUrl ||
          profile.twitterUrl ||
          profile.linkedinUrl ||
          profile.instagramUrl ||
          profile.pinterestUrl) && (
          <div className="app-profile-social-icons">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
                <NavIcon name="github" />
              </a>
            )}
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noreferrer noopener" aria-label="Twitter / X">
                <NavIcon name="twitter" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
                <NavIcon name="linkedin" />
              </a>
            )}
            {profile.instagramUrl && (
              <a href={profile.instagramUrl} target="_blank" rel="noreferrer noopener" aria-label="Instagram">
                <NavIcon name="instagram" />
              </a>
            )}
            {profile.pinterestUrl && (
              <a href={profile.pinterestUrl} target="_blank" rel="noreferrer noopener" aria-label="Pinterest">
                <NavIcon name="pinterest" />
              </a>
            )}
          </div>
        )}

        <div className="app-profile-stats-row">
          <div className="app-stat-box">
            <strong>{profile.postsCount}</strong>
            <span>Sheets</span>
          </div>
          <button type="button" className="app-stat-box app-stat-box-btn" onClick={() => setListModal("following")}>
            <strong>{profile.followingCount}</strong>
            <span>Following</span>
          </button>
          <button type="button" className="app-stat-box app-stat-box-btn" onClick={() => setListModal("followers")}>
            <strong>{profile.followersCount}</strong>
            <span>Followers</span>
          </button>
        </div>

        <div className="app-profile-actions">
          {isOwnProfile ? (
            <button type="button" className="app-profile-edit" onClick={() => navigate("/settings")}>
              Edit profile
            </button>
          ) : (
            <>
              <button
                type="button"
                className={"app-profile-follow" + (following || requested ? " is-following" : "")}
                onClick={handleToggleFollow}
              >
                {following ? "Following" : requested ? "Requested" : "Follow"}
              </button>
              <button
                type="button"
                className="app-profile-message"
                onClick={() => {
                  if (!requireAuth()) return;
                  navigate(`/messages/${profile.username}`);
                }}
              >
                Message
              </button>
            </>
          )}

          <div className="app-profile-more-wrap" ref={moreRef}>
            <button
              type="button"
              className="app-profile-more"
              aria-label="More profile options"
              onClick={() => setMoreOpen((v) => !v)}
            >
              <NavIcon name="dots" />
            </button>
            {moreOpen && (
              <div className="app-profile-more-menu">
                <button type="button" onClick={handleShareProfile}>
                  Share profile
                </button>
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        navigate("/settings");
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="app-profile-more-logout"
                      onClick={() => {
                        setMoreOpen(false);
                        logout();
                        navigate("/");
                      }}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleReport}>
                      Report
                    </button>
                    <button type="button" onClick={handleBlock}>
                      Block
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="app-profile-tabs">
          {TABS.filter((t) => t !== "Saved" || isOwnProfile).map((tab) => (
            <button
              key={tab}
              type="button"
              className={"app-profile-tab" + (activeTab === tab ? " is-active" : "")}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="app-profile-tab-content">
        {!canViewContent ? (
          <p className="app-empty">
            This account is private. Follow @{profile.username} to see their sheets.
          </p>
        ) : (
          <>
        {activeTab === "Posts" &&
          (posts.length ? (
            <div className="app-feed">
              {posts.map((post) => (
                <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
              ))}
            </div>
          ) : (
            <p className="app-empty">No sheets yet.</p>
          ))}

        {activeTab === "About" && (
          <div className="app-profile-about">
            <p>{profile.bio || "This sheeter hasn't written a bio yet."}</p>

            {(profile.currentCity || profile.work || profile.education) && (
              <ul className="app-profile-about-list">
                {profile.currentCity && <li>Lives in {profile.currentCity}</li>}
                {profile.work && <li>Works at {profile.work}</li>}
                {profile.education && <li>Studied at {profile.education}</li>}
                {profile.gender && <li>{GENDER_LABELS[profile.gender] || profile.gender}</li>}
                {profile.orientation && (
                  <li>{ORIENTATION_LABELS[profile.orientation] || profile.orientation}</li>
                )}
              </ul>
            )}
          </div>
        )}

        {activeTab === "Saved" && isOwnProfile && (
          <>
            {savedPosts === null && <p className="app-empty">Loading saved sheets...</p>}
            {savedPosts && !savedPosts.length && <p className="app-empty">Nothing saved yet.</p>}
            {savedPosts && savedPosts.length > 0 && (
              <div className="app-feed">
                {savedPosts.map((post) => (
                  <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
                ))}
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>

      {listModal && (
        <FollowListModal
          userId={profile.id}
          kind={listModal}
          title={listModal === "followers" ? "Followers" : "Following"}
          onClose={() => setListModal(null)}
        />
      )}

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt={profile.name} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
