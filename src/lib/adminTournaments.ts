import type { DivisionSettings, OopSettings } from "@/lib/tuwagaApi";

export type AdminTournament = {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: "setup" | "registration" | "live" | "completed";
  description: string;
  settings: {
    maxPlayers: number;
    waitlistLimit: number;
    courts: number;
    matchDuration: number;
    teamSize: string;
    format: string;
    groupSize: number;
    qualifierCount: number;
    divisionSettings?: Record<string, DivisionSettings>;
    oop?: OopSettings;
    status: "setup" | "registration" | "live" | "completed";
    categories: string[];
    name?: string;
    venue?: string;
    dateLabel?: string;
    startsAt?: string;
    endsAt?: string;
    description?: string;
  };
};
