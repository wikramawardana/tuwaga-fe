"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { pickFeatured } from "@/lib/featuredTournament";
import { listTournaments, type Tournament } from "@/lib/tuwagaApi";

type FeaturedTournamentState = {
  tournament: Tournament | null;
  loading: boolean;
};

const FeaturedTournamentContext = createContext<FeaturedTournamentState>({
  tournament: null,
  loading: false,
});

/**
 * Shares the landing page's featured tournament. The server passes it in
 * when it could reach the API; otherwise it is fetched in the browser.
 */
export function FeaturedTournamentProvider({
  initial,
  children,
}: {
  initial: Tournament | null;
  children: ReactNode;
}) {
  const [tournament, setTournament] = useState(initial);
  const [loading, setLoading] = useState(initial === null);

  useEffect(() => {
    if (initial) return;
    let active = true;
    listTournaments()
      .then((tournaments) => {
        if (active) setTournament(pickFeatured(tournaments));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initial]);

  return (
    <FeaturedTournamentContext.Provider value={{ tournament, loading }}>
      {children}
    </FeaturedTournamentContext.Provider>
  );
}

export function useFeaturedTournament() {
  return useContext(FeaturedTournamentContext);
}
