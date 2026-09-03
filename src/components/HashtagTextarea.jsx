import { useEffect, useRef } from "react";
import { splitContent } from "../lib/hashtags.js";

// A textarea that highlights #hashtags and @mentions live as you type. Real inline
// syntax-highlighting inside a native textarea isn't possible, so this
// uses the standard trick: an identically-styled backdrop <div> renders
// the styled text, sitting exactly behind a textarea whose own text is
// made transparent (only the caret stays visible) — so what the user
// sees is the backdrop's colored "#tag" spans showing through.
export default function HashtagTextarea({
  value,
  onChange,
  className = "",
  textareaClassName = "",
  placeholder,
  rows = 6,
  autoFocus,
  textareaRef: externalRef,
}) {
  const backdropRef = useRef(null);
  const localRef = useRef(null);
  const textareaRef = externalRef || localRef;

  function syncScroll() {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  useEffect(() => {
    syncScroll();
  }, [value]);

  const segments = splitContent(value);

  return (
    <div className={"app-hl-wrap " + className}>
      <div className="app-hl-backdrop" ref={backdropRef} aria-hidden="true">
        {segments.map((seg, i) =>
          seg.type ? (
            <mark key={i} className={seg.type === "hashtag" ? "app-hl-tag" : "app-hl-mention"}>
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
        {/* A trailing space keeps the backdrop from collapsing when the
            textarea ends in a newline, so heights stay in sync. */}
        {value.endsWith("\n") ? " " : ""}
      </div>
      <textarea
        ref={textareaRef}
        className={"app-hl-textarea " + textareaClassName}
        rows={rows}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
    </div>
  );
}
