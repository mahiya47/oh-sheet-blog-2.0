// The one account that can open the admin panel. Mirrors
// ADMIN_USERNAME in the backend's src/middleware/admin.js — the backend
// is the real gate; this is only so the UI doesn't offer a link that
// would 403. Compare case-insensitively.
export const ADMIN_USERNAME = "sourabhmahiya";
