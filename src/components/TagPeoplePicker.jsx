import { useEffect, useRef, useState } from "react";
import NavIcon from "./NavIcons.jsx";
import { api } from "../lib/api.js";

// "Tag people" button + popover: search users by name/username, check the
// ones to tag, see them as removable chips. Selection lives in the parent
// (selected/onChange) so the composer can submit taggedUserIds on post.
export default function TagPeoplePicker({ selected, onChange, excludeUserId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(() => {
      api
        .searchAll(q)
        .then((data) => {
          if (cancelled) return;
          setResults((data.users || []).filter((u) => u.id !== excludeUserId));
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query, open, excludeUserId]);

  function isSelected(userId) {
    return selected.some((u) => u.id === userId);
  }

  function toggleUser(u) {
    if (isSelected(u.id)) {
      onChange(selected.filter((s) => s.id !== u.id));
    } else {
      onChange([...selected, u]);
    }
  }

  function removeUser(userId) {
    onChange(selected.filter((s) => s.id !== userId));
  }

  return (
    <div className="app-tagpicker" ref={wrapRef}>
      <button
        type="button"
        className="app-create-attach"
        onClick={() => setOpen((v) => !v)}
      >
        <NavIcon name="tag" />
        <span>{selected.length ? `Tagged (${selected.length})` : "Tag people"}</span>
      </button>

      {selected.length > 0 && (
        <div className="app-tagpicker-chips">
          {selected.map((u) => (
            <span key={u.id} className="app-tagpicker-chip">
              {u.name || u.username}
              <button type="button" onClick={() => removeUser(u.id)} aria-label={`Remove ${u.username}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="app-tagpicker-pop">
          <input
            autoFocus
            type="text"
            className="app-tagpicker-search"
            placeholder="Search people to tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="app-tagpicker-list">
            {searching && <p className="app-empty">Searching...</p>}
            {!searching && query.trim() && !results.length && (
              <p className="app-empty">No one found.</p>
            )}
            {!searching &&
              results.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className={"app-tagpicker-item" + (isSelected(u.id) ? " is-selected" : "")}
                  onClick={() => toggleUser(u)}
                >
                  <span className="app-tagpicker-dp">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" />
                    ) : (
                      (u.name || u.username).charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="app-tagpicker-name">{u.name || u.username}</span>
                  {isSelected(u.id) && <span className="app-tagpicker-check">✓</span>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
