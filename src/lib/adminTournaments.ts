export type AdminTournament = {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: "setup" | "registration" | "live";
  description: string;
  settings: {
    maxPlayers: number;
    waitlistLimit: number;
    courts: number;
    matchDuration: number;
    teamSize: string;
    format: string;
  };
};

export const adminTournaments: AdminTournament[] = [
  {
    id: "arena-championship",
    name: "Arena Championship",
    venue: "Main Arena",
    date: "June 2026",
    status: "registration",
    description:
      "Primary MVP tournament for live scoring, referee flow, and bracket operations.",
    settings: {
      maxPlayers: 64,
      waitlistLimit: 12,
      courts: 4,
      matchDuration: 30,
      teamSize: "Doubles",
      format: "Group stage + knockout",
    },
  },
  {
    id: "jakarta-open",
    name: "Jakarta Open",
    venue: "South Padel Club",
    date: "July 2026",
    status: "setup",
    description:
      "Upcoming tournament prepared for registration limits and court planning.",
    settings: {
      maxPlayers: 96,
      waitlistLimit: 24,
      courts: 6,
      matchDuration: 45,
      teamSize: "Doubles",
      format: "Swiss pairing",
    },
  },
  {
    id: "community-cup",
    name: "Community Cup",
    venue: "East Wing Courts",
    date: "August 2026",
    status: "setup",
    description:
      "Smaller community event for beginner and intermediate player groups.",
    settings: {
      maxPlayers: 32,
      waitlistLimit: 8,
      courts: 3,
      matchDuration: 30,
      teamSize: "Doubles",
      format: "Round robin",
    },
  },
];

export function getAdminTournament(tournamentId: string): AdminTournament {
  return (
    adminTournaments.find((tournament) => tournament.id === tournamentId) ??
    adminTournaments[0]
  );
}
