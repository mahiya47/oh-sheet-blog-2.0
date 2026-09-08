// Single source of truth for the arcade game list — used by the hub page,
// the shared game header, the champions widget, and each game's own page.
export const ARCADE_GAMES = [
  {
    slug: "snake",
    label: "Snake",
    emoji: "🐍",
    color: "green",
    blurb: "Classic wrap-around snake — walls loop, speed ramps up as you grow.",
    timeBased: false,
    unit: "pts",
  },
  {
    slug: "tetris",
    label: "Tetris",
    emoji: "🧱",
    color: "blue",
    blurb: "Stack the falling blocks and clear lines before they pile up.",
    timeBased: false,
    unit: "pts",
  },
  {
    slug: "minesweeper",
    label: "Minesweeper",
    emoji: "💣",
    color: "yellow",
    blurb: "Clear the board without hitting a mine. Faster time wins.",
    timeBased: true,
    unit: "s",
  },
  {
    slug: "reaction",
    label: "Reaction Timer",
    emoji: "⚡",
    color: "pink",
    blurb: "3-round F1-style start lights. Lower average reaction time wins.",
    timeBased: true,
    unit: "ms",
  },
  {
    slug: "flappybird",
    label: "Flappy Bird",
    emoji: "🐦",
    color: "purple",
    blurb: "Flap through the jungle canopy without clipping a bamboo stalk.",
    timeBased: false,
    unit: "pts",
  },
  {
    slug: "runner",
    label: "Endless Runner",
    emoji: "🏃",
    color: "green",
    blurb: "Dodge trees, bushes, rocks, and cacti for as long as you can.",
    timeBased: false,
    unit: "pts",
  },
  {
    slug: "sudoku",
    label: "Daily Sudoku",
    emoji: "🔢",
    color: "blue",
    blurb: "One puzzle a day, same for everyone. Solve it to keep your streak alive.",
    timeBased: false,
    unit: "streak",
  },
  {
    slug: "crossword",
    label: "Daily Crossword",
    emoji: "📰",
    color: "pink",
    blurb: "A fresh mini crossword every day. Solve it to keep your streak alive.",
    timeBased: false,
    unit: "streak",
  },
  {
    slug: "rps",
    label: "Rock Paper Scissors",
    emoji: "✂️",
    color: "pink",
    blurb: "Challenge a friend to a live best-of battle of wits.",
    multiplayer: true,
  },
  {
    slug: "tictactoe",
    label: "Tic-Tac-Toe",
    emoji: "❌",
    color: "purple",
    blurb: "Classic X's and O's. Challenge a friend and get 3 in a row first.",
    multiplayer: true,
  },
  {
    slug: "snakeandladder",
    label: "Snake & Ladder",
    emoji: "🎲",
    color: "yellow",
    blurb: "Climb ladders, avoid snakes, and race a friend to square 100.",
    multiplayer: true,
  },
  {
    slug: "ludo",
    label: "Ludo",
    emoji: "🔴",
    color: "blue",
    blurb: "Roll the dice, race your tokens home, and send your opponent back to base.",
    multiplayer: true,
  },
  {
    slug: "monopoly",
    label: "Monopoly",
    emoji: "🏠",
    color: "green",
    blurb: "Buy the board, charge rent, bankrupt your friends. Up to 8 players.",
    multiplayer: true,
  },
];

export function getGameMeta(slug) {
  return ARCADE_GAMES.find((g) => g.slug === slug) || null;
}

// Lower-is-better games (time-based) show their raw number with a unit
// suffix; higher-is-better games are always whole points.
export function formatArcadeScore(score, unit) {
  if (score === null || score === undefined) return "—";
  if (unit === "ms") return `${score}ms`;
  if (unit === "s") return `${score}s`;
  if (unit === "streak") return `${score} day${score === 1 ? "" : "s"} 🔥`;
  return `${score} pts`;
}
