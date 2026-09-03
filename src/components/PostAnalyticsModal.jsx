import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

// A short weekday/day label for the trend chart's x-axis — just enough to
// orient the reader without cluttering 30 bars' worth of labels.
function shortDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Plain inline SVG bar chart — no charting library, since this is the only
// chart in the app. Scales to the container's width via viewBox so it
// stays crisp and mobile-first without any JS resize handling.
function ViewsTrendChart({ dailyViews }) {
  const max = Math.max(1, ...dailyViews.map((d) => d.count));
  const width = 300;
  const height = 80;
  const gap = 2;
  const barWidth = width / dailyViews.length - gap;

  return (
    <div className="app-analytics-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Views over the last 30 days">
        {dailyViews.map((d, i) => {
          const barHeight = (d.count / max) * (height - 4);
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <rect key={d.date} x={x} y={y} width={barWidth} height={Math.max(barHeight, d.count ? 2 : 0)} rx="1">
              <title>{`${shortDate(d.date)}: ${d.count} view${d.count === 1 ? "" : "s"}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="app-analytics-chart-labels">
        <span>{shortDate(dailyViews[0]?.date)}</span>
        <span>{shortDate(dailyViews[dailyViews.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

export default function PostAnalyticsModal({ postId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getPostAnalytics(postId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load analytics");
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h3>Post analytics</h3>
          <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal-body">
          {error && <p className="app-auth-error">{error}</p>}
          {!data && !error && <p className="app-composer-uploading">Loading...</p>}
          {data && (
            <>
              <div className="app-analytics-stats">
                <div className="app-analytics-stat">
                  <span className="app-analytics-stat-value">{data.viewCount}</span>
                  <span className="app-analytics-stat-label">Views</span>
                </div>
                <div className="app-analytics-stat">
                  <span className="app-analytics-stat-value">{data.upvotes}</span>
                  <span className="app-analytics-stat-label">Upvotes</span>
                </div>
                <div className="app-analytics-stat">
                  <span className="app-analytics-stat-value">{data.downvotes}</span>
                  <span className="app-analytics-stat-label">Downvotes</span>
                </div>
                <div className="app-analytics-stat">
                  <span className="app-analytics-stat-value">{data.commentCount}</span>
                  <span className="app-analytics-stat-label">Comments</span>
                </div>
                <div className="app-analytics-stat">
                  <span className="app-analytics-stat-value">{data.bookmarkCount}</span>
                  <span className="app-analytics-stat-label">Saves</span>
                </div>
              </div>
              <p className="app-analytics-chart-title">Views, last 30 days</p>
              <ViewsTrendChart dailyViews={data.dailyViews} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
