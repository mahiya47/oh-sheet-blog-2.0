// The same five pastel tones feed post cards are colored with
// (see FeedCard.jsx) — reused here so the auth cards (login, signup,
// onboarding, etc.) feel like part of the same "sheet" system instead
// of a plain white settings-style box.
const CARD_COLORS = ["green", "yellow", "pink", "blue", "purple"];

export function pickRandomCardColor() {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
}
