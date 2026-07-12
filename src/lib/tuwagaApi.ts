import { getSession, signOut } from "@/lib/auth-client";

export type TournamentStatus = "setup" | "registration" | "live" | "completed";

export type TeamStatus = "approved" | "pending" | "waitlist" | "rejected";
export type MatchStatus = "live" | "scheduled" | "completed";
export type Phase = "group" | "knockout";

export type TournamentSettings = {
  maxPlayers: number;
  waitlistLimit: number;
  courts: number;
  matchDuration: number;
  teamSize: string;
  format: string;
  groupSize: number;
  qualifierCount: number;
  knockoutSeedMode: string;
  status?: TournamentStatus;
  categories: string[];
};

export type Tournament = {
  id: string;
  name: string;
  slug: string;
  venue: string;
  location: string | null;
  dateLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  status: TournamentStatus;
  description: string;
  heroImageUrl: string | null;
  entryFeePerPair: number;
  currency: string;
  settings: TournamentSettings;
  createdAt: string;
  updatedAt: string;
};

export type RegistrationTeam = {
  id: string;
  tournamentId: string;
  player: string;
  partner: string | null;
  category: string;
  level: string;
  city: string;
  paid: boolean;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  registeredAt: string;
  status: TeamStatus;
  group: string | null;
};

export type Match = {
  id: string;
  tournamentId: string;
  phase: Phase;
  group: string | null;
  round: string;
  courtId: number | null;
  time: string;
  startsAt: string | null;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  score: string;
  scoreSets: Array<{ teamA: number; teamB: number }>;
  referee: string;
  refereeId: string | null;
  status: MatchStatus;
  winnerTeamId: string | null;
  updatedAt: string;
};

export type LiveResponse = {
  activeMatches: Array<{
    id: string;
    court: string;
    courtLabel: string;
    setInfo: string;
    serving: string | null;
    teamA: LiveTeam;
    teamB: LiveTeam;
  }>;
  nextUp: Array<{
    id: string;
    time: string;
    day: string;
    teamA: string;
    teamB: string;
    venue: string;
    highlight: boolean;
  }>;
  recentResults: Array<{
    id: string;
    winner: string;
    loser: string;
    score: string;
    label: string;
  }>;
  stats: {
    totalMatches: number;
    remainingMatches: number;
    averageMatchDuration: string;
    longestRally: string;
  };
};

export type LiveTeam = {
  id: string | null;
  player1: string;
  player2: string;
  avatar: string | null;
  scores: number[];
};

export type StandingsResponse = {
  qualifierCount: number;
  groups: Array<{
    group: string;
    teams: Array<{
      teamId: string;
      teamName: string;
      seed: number | null;
      played: number;
      wins: number;
      losses: number;
      points: number;
      diff: number;
      groupRank: number;
      globalRank: number;
      qualified: boolean;
    }>;
  }>;
};

export type BracketResponse = {
  rounds: Array<{
    name: string;
    matches: Array<{
      id: string;
      label: string;
      teamA: BracketTeam | null;
      teamB: BracketTeam | null;
      winnerTeamId: string | null;
    }>;
  }>;
  championTeamId: string | null;
};

export type BracketTeam = {
  teamId: string;
  teamName: string;
  seed: number;
  group: string;
  points: number;
};

export type RegistrationSummary = {
  tournament: {
    id: string;
    name: string;
    imageUrl: string | null;
    badge: string;
    dateLabel: string;
    location: string;
    entryFeePerPair: number;
    currency: string;
  };
  fees: {
    registrationFee: number;
    serviceFee: number;
    paymentAdminFee: number;
    total: number;
  };
  support: {
    whatsapp: string;
  };
};

type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data?: T;
};

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/$/,
    "",
  );
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  return configuredUrl;
}

const apiBaseUrl = getApiBaseUrl();

let tokenPromise: Promise<string | null> | null = null;
let tokenExpiry = 0;
const TOKEN_CACHE_DURATION = 5000;

function requiresAuth(path: string) {
  return path.startsWith("/admin/");
}

function clearAuthTokenCache() {
  tokenPromise = null;
  tokenExpiry = 0;
}

async function getAuthToken() {
  const now = Date.now();

  if (tokenPromise && now < tokenExpiry) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      const session = await getSession();
      return session?.data?.session?.token ?? null;
    } catch {
      return null;
    }
  })();

  tokenExpiry = now + TOKEN_CACHE_DURATION;
  return tokenPromise;
}

async function forceSignOutAndRedirect() {
  if (typeof window === "undefined") return;

  clearAuthTokenCache();

  const callbackUrl = encodeURIComponent(window.location.pathname);

  try {
    await signOut();
  } catch {
    // Redirect below still takes the user back through the auth flow.
  }

  window.location.href = `/login?callbackUrl=${callbackUrl}`;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();
  const authRequired = requiresAuth(path);

  if (authRequired && !token) {
    await forceSignOutAndRedirect();
    throw new Error("No authentication token available.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || envelope?.status === "error") {
    if (response.status === 401) {
      await forceSignOutAndRedirect();
    }

    throw new Error(envelope?.message || `Request failed: ${response.status}`);
  }

  if (!envelope?.data) {
    throw new Error("API response did not include data.");
  }

  return envelope.data;
}

export async function listTournaments() {
  const data = await apiRequest<{ tournaments: Tournament[] }>("/tournaments");
  return data.tournaments;
}

export async function getTournament(id: string) {
  const data = await apiRequest<{ tournament: Tournament }>(
    `/tournaments/${id}`,
  );
  return data.tournament;
}

export async function getCurrentTournament() {
  const tournaments = await listTournaments();
  return tournaments.find((t) => t.status !== "setup") ?? null;
}

export async function createTournament(input: {
  name: string;
  venue: string;
  dateLabel: string;
  startsAt?: string;
  endsAt?: string;
  description?: string;
  entryFeePerPair?: number;
  currency?: string;
  maxPlayers: number;
  waitlistLimit: number;
  courts: number;
  matchDuration: number;
  teamSize: string;
  format: string;
  categories?: string[];
}) {
  const data = await apiRequest<{ tournament: Tournament }>(
    "/admin/tournaments",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.tournament;
}

export async function deleteTournament(id: string) {
  return apiRequest<{ id: string }>(`/admin/tournaments/${id}`, {
    method: "DELETE",
  });
}

export async function listRegistrations(tournamentId: string) {
  const data = await apiRequest<{ teams: RegistrationTeam[] }>(
    `/admin/tournaments/${tournamentId}/registrations?status=all`,
  );
  return data.teams;
}

export async function updateRegistration(
  tournamentId: string,
  teamId: string,
  input: Partial<
    Pick<RegistrationTeam, "paid" | "paymentStatus" | "status" | "group">
  >,
) {
  const data = await apiRequest<{ team: RegistrationTeam }>(
    `/admin/tournaments/${tournamentId}/registrations/${teamId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return data.team;
}

export async function listMatches(tournamentId: string) {
  const data = await apiRequest<{ matches: Match[] }>(
    `/tournaments/${tournamentId}/matches`,
  );
  return data.matches;
}

export async function getLive(tournamentId: string) {
  return apiRequest<LiveResponse>(`/tournaments/${tournamentId}/live`);
}

export async function getStandings(tournamentId: string) {
  return apiRequest<StandingsResponse>(
    `/tournaments/${tournamentId}/standings`,
  );
}

export async function getBracket(tournamentId: string) {
  return apiRequest<BracketResponse>(`/tournaments/${tournamentId}/bracket`);
}

export async function getRegistrationSummary(tournamentId: string) {
  return apiRequest<RegistrationSummary>(
    `/tournaments/${tournamentId}/registration-summary`,
  );
}

export async function createRegistration(
  tournamentId: string,
  input: {
    acceptedTerms: boolean;
    category: string;
    player: {
      fullName: string;
      email: string;
      phone: string;
      nationality: string;
      skillLevel: string;
      city?: string | null;
      membershipId?: string | null;
    };
    partner?: {
      fullName: string;
      email: string;
      skillLevel: string;
      membershipId?: string | null;
    };
  },
) {
  return apiRequest<{
    registration: RegistrationTeam;
    payment: { status: string; redirectUrl: string | null };
  }>(`/tournaments/${tournamentId}/registrations`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type AdminCreateRegistrationInput = {
  player: {
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    skillLevel: string;
    city?: string | null;
    membershipId?: string | null;
  };
  partner?: {
    fullName: string;
    email: string;
    skillLevel: string;
    membershipId?: string | null;
  };
  category?: string;
  paid?: boolean;
  paymentStatus?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  status?: TeamStatus;
};

export async function adminCreateRegistration(
  tournamentId: string,
  input: AdminCreateRegistrationInput,
) {
  const data = await apiRequest<{ team: RegistrationTeam }>(
    `/admin/tournaments/${tournamentId}/registrations`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.team;
}

export async function updateMatch(
  tournamentId: string,
  matchId: string,
  input: Partial<
    Pick<
      Match,
      | "courtId"
      | "status"
      | "score"
      | "scoreSets"
      | "winnerTeamId"
      | "referee"
      | "refereeId"
    >
  >,
) {
  const data = await apiRequest<{ match: Match }>(
    `/admin/tournaments/${tournamentId}/matches/${matchId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return data.match;
}

export async function updateSettings(
  tournamentId: string,
  input: Partial<TournamentSettings>,
) {
  const data = await apiRequest<{ settings: TournamentSettings }>(
    `/admin/tournaments/${tournamentId}/settings`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return data.settings;
}

export async function generateDraw(tournamentId: string) {
  return apiRequest<{ message: string; matches: Match[] }>(
    `/admin/tournaments/${tournamentId}/generate-draw`,
    {
      method: "POST",
      body: JSON.stringify({
        mode: "group-stage-plus-knockout",
        includeOnlyPaidApprovedTeams: true,
        overwriteExistingMatches: true,
      }),
    },
  );
}
