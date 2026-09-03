import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "./api.js";

// Shared by every arcade game page: loads the logged-in player's existing
// best for this game, and exposes a submit() that posts a run's score and
// keeps local state in sync with whatever the server decides is the best
// (the server is the source of truth — it only keeps the better of the
// two, see arcade.controller.js).
export function useArcadeScore(gameSlug) {
  const { user } = useAuth();
  const [best, setBest] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setBest(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    api
      .getMyArcadeScores()
      .then((scores) => setBest(scores[gameSlug]?.score ?? null))
      .catch(() => setBest(null))
      .finally(() => setLoaded(true));
  }, [user, gameSlug]);

  const submit = useCallback(
    async (score) => {
      if (!user) return { isNewBest: false, score };
      try {
        const result = await api.submitArcadeScore(gameSlug, score);
        setBest(result.score);
        return result;
      } catch {
        return null;
      }
    },
    [user, gameSlug],
  );

  return { best, loaded, submit, loggedIn: !!user };
}
