// Temporary demo data so the new design has something to render.
// Swap this for real data/API calls later.

export const currentUser = {
  name: "Sourabh",
  username: "sourabh",
  bio: "Full-stack in progress. Gamer, cook, occasional traveller.",
  sheetsCount: 12,
  followers: 248,
  following: 96,
};

// Bare-bones profiles for the other demo authors who show up in the feed,
// so clicking a name/avatar that isn't the signed-in user still lands on
// a real (if minimal) profile page instead of a dead end.
const demoProfiles = {
  devdrew: {
    name: "devdrew",
    username: "devdrew",
    bio: "Backend guy. Ships fast, breaks less than he used to.",
    sheetsCount: 34,
    followers: 512,
    following: 180,
  },
  "mira.codes": {
    name: "mira.codes",
    username: "mira.codes",
    bio: "Frontend + coffee. Currently obsessed with grid layouts.",
    sheetsCount: 61,
    followers: 890,
    following: 240,
  },
  pixelqueen: {
    name: "pixelqueen",
    username: "pixelqueen",
    bio: "Designs things, then argues with devs about spacing.",
    sheetsCount: 47,
    followers: 703,
    following: 198,
  },
};

export function getProfileByUsername(username) {
  if (username === currentUser.username) return currentUser;
  if (demoProfiles[username]) return demoProfiles[username];
  // Unknown username — a harmless generic fallback so the page never breaks.
  return {
    name: username,
    username,
    bio: "This sheeter hasn't written a bio yet.",
    sheetsCount: 0,
    followers: 0,
    following: 0,
  };
}

export const tempPosts = [
  {
    id: 1,
    author: "sourabh",
    displayName: "Sourabh",
    time: "2m",
    dateTime: "Aug 30, 2026 · 9:58 AM",
    color: "green",
    text: "Finally fixed the crossword generation bug after six hours of debugging. Turns out I was only validating the END cells the whole time.",
    upvotes: 24,
    downvotes: 2,
    upvoters: ["devdrew", "mira.codes", "pixelqueen"],
    downvoters: ["devdrew"],
    reposts: 3,
    commentsList: [
      {
        id: 1,
        author: "devdrew",
        time: "1m",
        text: "Classic off-by-one energy.",
      },
      {
        id: 2,
        author: "mira.codes",
        time: "40s",
        text: "Been there. Six hours is almost fast for that bug.",
      },
    ],
  },
  {
    id: 2,
    author: "devdrew",
    displayName: "devdrew",
    time: "14m",
    dateTime: "Aug 30, 2026 · 9:46 AM",
    color: "yellow",
    text: "Shipped the new onboarding flow — signups are up 12% already. Sheet culture wins again.",
    upvotes: 57,
    downvotes: 4,
    upvoters: ["sourabh", "mira.codes", "pixelqueen"],
    downvoters: ["pixelqueen"],
    reposts: 2,
    commentsList: [
      {
        id: 1,
        author: "sourabh",
        time: "10m",
        text: "12%?! Okay teach me your ways.",
      },
      {
        id: 2,
        author: "pixelqueen",
        time: "6m",
        text: "Onboarding is so underrated, nice work.",
      },
      {
        id: 3,
        author: "mira.codes",
        time: "3m",
        text: "Screenshots or it didn't happen 👀",
      },
    ],
  },
  {
    id: 3,
    author: "mira.codes",
    displayName: "mira.codes",
    time: "1h",
    dateTime: "Aug 30, 2026 · 9:00 AM",
    color: "pink",
    text: "Coffee, keyboard, and a Saturday with no meetings. This is the good stuff.",
    upvotes: 41,
    downvotes: 1,
    upvoters: ["sourabh", "devdrew"],
    downvoters: [],
    reposts: 1,
    commentsList: [
      { id: 1, author: "pixelqueen", time: "40m", text: "Living the dream fr." },
      { id: 2, author: "devdrew", time: "20m", text: "Send coffee recs pls" },
    ],
  },
  {
    id: 4,
    author: "pixelqueen",
    displayName: "pixelqueen",
    time: "3h",
    dateTime: "Aug 30, 2026 · 7:00 AM",
    color: "blue",
    text: "Redesigned the whole nav bar from scratch today. New folder feels so much cleaner than the old one already.",
    upvotes: 33,
    downvotes: 3,
    upvoters: ["mira.codes"],
    downvoters: ["devdrew"],
    reposts: 2,
    commentsList: [
      {
        id: 1,
        author: "sourabh",
        time: "2h",
        text: "Following just for the nav bar redesigns tbh.",
      },
      {
        id: 2,
        author: "mira.codes",
        time: "1h",
        text: "That folder-tab detail is so satisfying.",
      },
    ],
  },
  {
    id: 5,
    author: "sourabh",
    displayName: "Sourabh",
    time: "1d",
    dateTime: "Aug 29, 2026 · 10:00 AM",
    color: "purple",
    text: "Testing out the fresh layout — icons and labels on the side rail this time, not just icons.",
    upvotes: 18,
    downvotes: 0,
    upvoters: ["devdrew", "pixelqueen"],
    downvoters: [],
    reposts: 0,
    commentsList: [
      {
        id: 1,
        author: "devdrew",
        time: "20h",
        text: "Labels are so much easier to scan, good call.",
      },
    ],
  },
];

export const trendingTags = [
  { tag: "#buildinpublic", count: 128 },
  { tag: "#100DaysOfCode", count: 96 },
  { tag: "#gamedev", count: 71 },
  { tag: "#cookingfails", count: 44 },
];

export const suggestedPeople = [
  { username: "devdrew", displayName: "devdrew" },
  { username: "mira.codes", displayName: "mira.codes" },
  { username: "pixelqueen", displayName: "pixelqueen" },
];
