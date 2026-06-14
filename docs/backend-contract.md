# Tuwaga Frontend Backend Contract

This document describes what the Tuwaga frontend needs from the backend.
It is written for backend implementation, so each feature includes expected
data models, API paths, request bodies, responses, and frontend pages that use
them.

Important: the current frontend has no real API calls yet. Tournament data,
registrations, matches, and admin runtime state are currently static or stored
in `localStorage`. The backend should replace those mock/local flows.

## 1. Frontend Structure

```text
src/
|-- app/
|   |-- page.tsx
|   |-- admin/
|   |   |-- page.tsx
|   |   `-- tournaments/
|   |       |-- new/page.tsx
|   |       `-- [id]/page.tsx
|   |-- register/page.tsx
|   |-- tournaments/
|   |   |-- page.tsx
|   |   |-- live/page.tsx
|   |   `-- bracket/page.tsx
|   |-- courts/page.tsx
|   |-- community/page.tsx
|   `-- partner-info/page.tsx
|-- components/
|   |-- Navbar.tsx
|   |-- RegistrationShell.tsx
|   |-- admin/
|   |   |-- AdminTournamentList.tsx
|   |   `-- TournamentControlRoom.tsx
|   `-- ...
`-- lib/
    `-- adminTournaments.ts
```

## 2. Current Mock State To Replace

The backend should replace these frontend-only sources:

```text
src/lib/adminTournaments.ts
```

Static tournament list.

```text
localStorage key: tuwaga-admin-tournaments
```

Created tournament drafts from `/admin/tournaments/new`.

```text
localStorage key: tuwaga-admin-runtime:<tournamentId>
```

Tournament control room runtime data: teams, matches, settings, and status
message.

## 3. Base API Convention

Recommended API base:

```text
NEXT_PUBLIC_API_URL=https://api.tuwaga.example.com
```

Recommended frontend client usage:

```text
GET ${NEXT_PUBLIC_API_URL}/api/tournaments
```

If the backend is built inside the same Next.js app, paths can simply be:

```text
/api/tournaments
```

All JSON endpoints should use:

```http
Content-Type: application/json
```

Standard error response:

```json
{
  "error": "Human readable error message"
}
```

## 4. Authentication And Roles

The current frontend has no login integration yet, but backend should be ready
for these roles:

```text
public: can view home, tournament list, live scores, brackets, and registration page
admin: can create tournaments, manage registrations, payment status, draw, courts, matches, and settings
referee: can update assigned match score and status
participant: can view own registration and payment status
```

Admin routes must require an authenticated admin:

```text
/admin
/admin/tournaments/new
/admin/tournaments/:id
```

API authorization rules:

```text
GET public tournament/live/bracket endpoints: public
POST registration endpoint: public or authenticated participant
Admin mutation endpoints: admin only
Match score endpoint: admin or assigned referee
```

Unauthorized:

```json
{ "error": "Unauthorized" }
```

Use status:

```text
401 missing/invalid session
403 valid user but wrong role
```

## 5. Core Data Models

### Tournament

Used by admin list, control room, public pages, registration summary, live page,
and bracket page.

```ts
type TournamentStatus = "setup" | "registration" | "live" | "completed";

type Tournament = {
  id: string;
  name: string;
  slug: string;
  venue: string;
  location: string;
  dateLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  status: TournamentStatus;
  description: string;
  heroImageUrl: string | null;
  entryFeePerPlayer: number;
  currency: "IDR";
  settings: TournamentSettings;
  createdAt: string;
  updatedAt: string;
};
```

### Tournament Settings

```ts
type TournamentSettings = {
  maxPlayers: number;
  waitlistLimit: number;
  courts: number;
  matchDuration: number;
  teamSize: "Singles" | "Doubles" | string;
  format: string;
  groupSize: number;
  qualifierCount: number;
  knockoutSeedMode: "standings" | "manual";
};
```

Defaults from current UI:

```json
{
  "maxPlayers": 64,
  "waitlistLimit": 12,
  "courts": 4,
  "matchDuration": 30,
  "teamSize": "Doubles",
  "format": "Group stage + knockout",
  "groupSize": 4,
  "qualifierCount": 16,
  "knockoutSeedMode": "standings"
}
```

### Registration / Team

The admin control room currently treats each doubles registration as one team.

```ts
type TeamStatus = "approved" | "pending" | "waitlist" | "rejected";
type SkillLevel = "beginner" | "intermediate" | "advanced" | "professional";

type RegistrationTeam = {
  id: string;
  tournamentId: string;
  player: {
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    skillLevel: SkillLevel;
    city: string | null;
    membershipId: string | null;
  };
  partner: {
    fullName: string;
    email: string;
    skillLevel: SkillLevel;
    membershipId: string | null;
  };
  displayName: string;
  level: string;
  city: string;
  paid: boolean;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  registeredAt: string;
  status: TeamStatus;
  group: string | null;
};
```

Admin table currently reads these simplified fields:

```ts
type TeamRow = {
  id: string;
  player: string;
  partner: string;
  level: string;
  city: string;
  paid: boolean;
  registeredAt: string;
  status: "approved" | "pending" | "waitlist";
  group: string;
};
```

### Match

```ts
type MatchStatus = "scheduled" | "live" | "completed";
type MatchPhase = "group" | "knockout";

type Match = {
  id: string;
  tournamentId: string;
  phase: MatchPhase;
  group: string | null;
  round: string;
  courtId: number | null;
  time: string;
  startsAt: string | null;
  teamAId: string | null;
  teamBId: string | null;
  score: string;
  scoreSets: Array<{ teamA: number; teamB: number }>;
  referee: string;
  refereeId: string | null;
  status: MatchStatus;
  winnerTeamId: string | null;
  updatedAt: string;
};
```

### Court

```ts
type Court = {
  id: number;
  tournamentId: string;
  name: string;
  label: string;
  status: "available" | "scheduled" | "live" | "maintenance";
  currentMatchId: string | null;
};
```

### Group Standing

```ts
type GroupStanding = {
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
};
```

## 6. Tournament APIs

### `GET /api/tournaments`

Used by:

```text
/admin
/tournaments
/register
home current tournament section
```

Query params:

```text
status=setup|registration|live|completed optional
limit=number optional
```

Response:

```json
{
  "tournaments": [
    {
      "id": "arena-championship",
      "name": "Arena Championship",
      "slug": "arena-championship",
      "venue": "Main Arena",
      "location": "Jakarta, Indonesia",
      "dateLabel": "June 2026",
      "startsAt": null,
      "endsAt": null,
      "status": "registration",
      "description": "Primary MVP tournament for live scoring, referee flow, and bracket operations.",
      "heroImageUrl": "/arena.png",
      "entryFeePerPlayer": 250000,
      "currency": "IDR",
      "settings": {
        "maxPlayers": 64,
        "waitlistLimit": 12,
        "courts": 4,
        "matchDuration": 30,
        "teamSize": "Doubles",
        "format": "Group stage + knockout",
        "groupSize": 4,
        "qualifierCount": 16,
        "knockoutSeedMode": "standings"
      },
      "createdAt": "2026-06-11T00:00:00.000Z",
      "updatedAt": "2026-06-11T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/tournaments/:id`

Used by:

```text
/admin/tournaments/[id]
/register
/tournaments/live
/tournaments/bracket
```

Response:

```json
{
  "tournament": {
    "id": "arena-championship",
    "name": "Arena Championship",
    "slug": "arena-championship",
    "venue": "Main Arena",
    "location": "Jakarta, Indonesia",
    "dateLabel": "June 2026",
    "status": "registration",
    "description": "Primary MVP tournament for live scoring, referee flow, and bracket operations.",
    "entryFeePerPlayer": 250000,
    "currency": "IDR",
    "settings": {
      "maxPlayers": 64,
      "waitlistLimit": 12,
      "courts": 4,
      "matchDuration": 30,
      "teamSize": "Doubles",
      "format": "Group stage + knockout",
      "groupSize": 4,
      "qualifierCount": 16,
      "knockoutSeedMode": "standings"
    },
    "createdAt": "2026-06-11T00:00:00.000Z",
    "updatedAt": "2026-06-11T00:00:00.000Z"
  }
}
```

### `POST /api/admin/tournaments`

Admin only.

Used by:

```text
/admin/tournaments/new
```

Request:

```json
{
  "name": "Jakarta Summer Open",
  "venue": "Main Arena",
  "dateLabel": "July 2026",
  "description": "Tournament operating notes.",
  "maxPlayers": 64,
  "waitlistLimit": 12,
  "courts": 4,
  "matchDuration": 30,
  "teamSize": "Doubles",
  "format": "Group stage + knockout"
}
```

Validation:

```text
name required
venue required
dateLabel required
maxPlayers between 8 and 256
waitlistLimit between 0 and 128
courts between 1 and 12
matchDuration one of 20, 30, 45, 60
```

Response:

```json
{
  "tournament": {
    "id": "jakarta-summer-open",
    "slug": "jakarta-summer-open",
    "name": "Jakarta Summer Open",
    "venue": "Main Arena",
    "dateLabel": "July 2026",
    "status": "setup",
    "description": "Tournament operating notes.",
    "settings": {
      "maxPlayers": 64,
      "waitlistLimit": 12,
      "courts": 4,
      "matchDuration": 30,
      "teamSize": "Doubles",
      "format": "Group stage + knockout",
      "groupSize": 4,
      "qualifierCount": 16,
      "knockoutSeedMode": "standings"
    },
    "createdAt": "2026-06-11T00:00:00.000Z",
    "updatedAt": "2026-06-11T00:00:00.000Z"
  }
}
```

### `PATCH /api/admin/tournaments/:id/settings`

Admin only.

Used by:

```text
Tournament control room Save setup button
```

Request:

```json
{
  "maxPlayers": 64,
  "waitlistLimit": 12,
  "courts": 4,
  "matchDuration": 30,
  "teamSize": "Doubles",
  "format": "Group stage + knockout",
  "groupSize": 4,
  "qualifierCount": 16,
  "knockoutSeedMode": "standings"
}
```

Response:

```json
{
  "settings": {
    "maxPlayers": 64,
    "waitlistLimit": 12,
    "courts": 4,
    "matchDuration": 30,
    "teamSize": "Doubles",
    "format": "Group stage + knockout",
    "groupSize": 4,
    "qualifierCount": 16,
    "knockoutSeedMode": "standings"
  }
}
```

## 7. Registration APIs

### `GET /api/tournaments/:id/registration-summary`

Used by:

```text
/register summary card
```

Response:

```json
{
  "tournament": {
    "id": "arena-championship",
    "name": "Jakarta Arena Championship",
    "imageUrl": "/arena.png",
    "badge": "MVP Event",
    "dateLabel": "Aug 16 - Aug 18, 2026",
    "location": "Jakarta, Indonesia",
    "entryFeePerPlayer": 250000,
    "currency": "IDR"
  },
  "fees": {
    "registrationFee": 500000,
    "serviceFee": 30000,
    "paymentAdminFee": 7500,
    "total": 537500
  },
  "support": {
    "whatsapp": "+62 812-3456-7890"
  }
}
```

### `POST /api/tournaments/:id/registrations`

Used by:

```text
/register
```

Request:

```json
{
  "player": {
    "fullName": "Bima Pratama",
    "email": "bima@tuwaga.id",
    "phone": "+6281234567890",
    "nationality": "ID",
    "skillLevel": "intermediate",
    "city": "Jakarta Selatan",
    "membershipId": null
  },
  "partner": {
    "fullName": "Raka Wijaya",
    "email": "raka@tuwaga.id",
    "skillLevel": "intermediate",
    "membershipId": "TWG-123456"
  },
  "payment": {
    "method": "card",
    "token": "payment-provider-token"
  },
  "acceptedTerms": true
}
```

Backend should not receive raw card number, expiry, or CVV. The frontend should
later tokenize card data with the payment provider and send only a payment
token.

Validation:

```text
player.fullName required
player.email required and valid
player.phone required
player.nationality required
player.skillLevel required
partner.fullName required
partner.email required and valid
partner.skillLevel required
acceptedTerms must be true
tournament status must be registration or live if late registration is allowed
```

Response:

```json
{
  "registration": {
    "id": "T-1048",
    "tournamentId": "arena-championship",
    "displayName": "Bima Pratama / Raka Wijaya",
    "status": "pending",
    "paymentStatus": "pending",
    "paid": false,
    "registeredAt": "2026-06-11T08:00:00.000Z"
  },
  "payment": {
    "status": "pending",
    "redirectUrl": null
  }
}
```

## 8. Admin Registration APIs

### `GET /api/admin/tournaments/:id/registrations`

Admin only.

Used by:

```text
Tournament control room Registrations tab
```

Query params:

```text
status=all|approved|pending|waitlist optional
```

Response:

```json
{
  "teams": [
    {
      "id": "T-1042",
      "tournamentId": "arena-championship",
      "player": "Raka Pratama",
      "partner": "Dimas Arya",
      "level": "Intermediate",
      "city": "Jakarta Selatan",
      "paid": true,
      "paymentStatus": "paid",
      "registeredAt": "2026-06-09T08:12:00.000Z",
      "status": "approved",
      "group": "A"
    }
  ],
  "summary": {
    "approved": 1,
    "pending": 0,
    "waitlist": 0,
    "paid": 1,
    "capacityPercent": 2
  }
}
```

### `PATCH /api/admin/tournaments/:id/registrations/:teamId`

Admin only.

Used by:

```text
Mark paid
Approve
Move to waitlist
Change group
```

Request examples:

```json
{ "paid": true, "paymentStatus": "paid" }
```

```json
{ "status": "approved" }
```

```json
{ "status": "waitlist" }
```

```json
{ "group": "B" }
```

Response:

```json
{
  "team": {
    "id": "T-1042",
    "player": "Raka Pratama",
    "partner": "Dimas Arya",
    "level": "Intermediate",
    "city": "Jakarta Selatan",
    "paid": true,
    "paymentStatus": "paid",
    "registeredAt": "2026-06-09T08:12:00.000Z",
    "status": "approved",
    "group": "B"
  }
}
```

Business rules:

```text
Cannot approve beyond maxPlayers unless backend intentionally allows overflow.
If approved capacity is full, use waitlist.
Only paid teams should be eligible for draw generation.
Group must be one of configured groups.
```

## 9. Match And Draw APIs

### `GET /api/tournaments/:id/matches`

Public.

Used by:

```text
/tournaments/live
/tournaments/bracket
Tournament control room Draw, Courts, Match details
```

Query params:

```text
status=live|scheduled|completed optional
phase=group|knockout optional
```

Response:

```json
{
  "matches": [
    {
      "id": "M-021",
      "tournamentId": "arena-championship",
      "phase": "group",
      "group": "A",
      "round": "Group A",
      "courtId": 1,
      "time": "10:30",
      "startsAt": "2026-06-11T10:30:00.000Z",
      "teamAId": "T-1042",
      "teamBId": "T-1046",
      "teamAName": "Raka Pratama / Dimas Arya",
      "teamBName": "Andre Salim / Yusuf Malik",
      "score": "6-4, 2-1",
      "scoreSets": [
        { "teamA": 6, "teamB": 4 },
        { "teamA": 2, "teamB": 1 }
      ],
      "referee": "Tania",
      "refereeId": null,
      "status": "live",
      "winnerTeamId": null,
      "updatedAt": "2026-06-11T10:50:00.000Z"
    }
  ]
}
```

### `POST /api/admin/tournaments/:id/generate-draw`

Admin only.

Used by:

```text
Generate draw
Regenerate draw
```

Request:

```json
{
  "mode": "group-stage-plus-knockout",
  "includeOnlyPaidApprovedTeams": true,
  "overwriteExistingMatches": true
}
```

Response:

```json
{
  "message": "Arena Championship draw generated from 16 approved paid teams.",
  "matches": [
    {
      "id": "M-G1",
      "phase": "group",
      "group": "A",
      "round": "Group A",
      "courtId": 1,
      "time": "10:00",
      "teamAId": "T-1042",
      "teamBId": "T-1046",
      "score": "Not started",
      "referee": "Unassigned",
      "status": "scheduled",
      "winnerTeamId": null
    }
  ]
}
```

Error if not enough teams:

```json
{
  "error": "Need at least two approved paid teams before generating draw."
}
```

### `PATCH /api/admin/tournaments/:id/matches/:matchId`

Admin or assigned referee.

Used by:

```text
Match details side panel
```

Request examples:

```json
{ "courtId": 2 }
```

```json
{ "status": "live" }
```

```json
{ "score": "6-4, 6-3", "scoreSets": [{ "teamA": 6, "teamB": 4 }, { "teamA": 6, "teamB": 3 }] }
```

```json
{ "winnerTeamId": "T-1042", "status": "completed" }
```

```json
{ "referee": "Tania", "refereeId": "user-id" }
```

Response:

```json
{
  "match": {
    "id": "M-021",
    "courtId": 2,
    "score": "6-4, 6-3",
    "referee": "Tania",
    "status": "completed",
    "winnerTeamId": "T-1042",
    "updatedAt": "2026-06-11T11:30:00.000Z"
  }
}
```

Business rules:

```text
winnerTeamId must be teamAId or teamBId.
Setting winnerTeamId should mark match completed unless backend supports another state.
courtId must be between 1 and tournament.settings.courts.
Referee can update only assigned matches.
```

## 10. Court APIs

### `GET /api/tournaments/:id/courts`

Public or admin.

Used by:

```text
/tournaments/live Court Map
Tournament control room Courts tab
```

Response:

```json
{
  "courts": [
    {
      "id": 1,
      "tournamentId": "arena-championship",
      "name": "Court 1",
      "label": "Main Arena",
      "status": "live",
      "currentMatchId": "M-021"
    },
    {
      "id": 2,
      "tournamentId": "arena-championship",
      "name": "Court 2",
      "label": "South Wing",
      "status": "scheduled",
      "currentMatchId": "M-022"
    }
  ]
}
```

## 11. Standings And Bracket APIs

### `GET /api/tournaments/:id/standings`

Public.

Used by:

```text
/tournaments/bracket group stage view
Tournament control room Group Stage tab
```

Response:

```json
{
  "qualifierCount": 16,
  "groups": [
    {
      "group": "A",
      "teams": [
        {
          "teamId": "T-1042",
          "teamName": "Raka Pratama / Dimas Arya",
          "seed": 1,
          "played": 3,
          "wins": 2,
          "losses": 1,
          "points": 6,
          "diff": 8,
          "groupRank": 1,
          "globalRank": 1,
          "qualified": true
        }
      ]
    }
  ]
}
```

### `PATCH /api/admin/tournaments/:id/qualification-settings`

Admin only.

Used by:

```text
/tournaments/bracket qualifier buttons later if moved to admin
```

Request:

```json
{
  "qualifierCount": 16,
  "knockoutSeedMode": "standings"
}
```

Validation:

```text
qualifierCount currently expected values: 8, 16, 24, 32
knockoutSeedMode: standings or manual
```

Response:

```json
{
  "qualifierCount": 16,
  "knockoutSeedMode": "standings"
}
```

### `GET /api/tournaments/:id/bracket`

Public.

Used by:

```text
/tournaments/bracket bracket view
```

Response:

```json
{
  "rounds": [
    {
      "name": "Round of 16",
      "matches": [
        {
          "id": "R16-1",
          "label": "Match 1",
          "teamA": {
            "teamId": "T-1042",
            "teamName": "Raka Pratama / Dimas Arya",
            "seed": 1,
            "group": "A",
            "points": 9
          },
          "teamB": {
            "teamId": "T-1064",
            "teamName": "Opponent Team",
            "seed": 16,
            "group": "D",
            "points": 4
          },
          "winnerTeamId": null
        }
      ]
    },
    {
      "name": "Quarter-finals",
      "matches": []
    },
    {
      "name": "Semi-finals",
      "matches": []
    },
    {
      "name": "Final",
      "matches": []
    }
  ],
  "championTeamId": null
}
```

## 12. Live Scores API

### `GET /api/tournaments/:id/live`

Public.

Used by:

```text
/tournaments/live
```

Response:

```json
{
  "activeMatches": [
    {
      "id": "M-021",
      "court": "Court 1",
      "courtLabel": "Main Arena",
      "setInfo": "Set 2 - 45'",
      "serving": "Raka Pratama",
      "teamA": {
        "id": "T-1042",
        "player1": "Raka Pratama",
        "player2": "Dimas Arya",
        "avatar": null,
        "scores": [6, 3]
      },
      "teamB": {
        "id": "T-1046",
        "player1": "Andre Salim",
        "player2": "Yusuf Malik",
        "avatar": null,
        "scores": [4, 2]
      }
    }
  ],
  "nextUp": [
    {
      "id": "M-022",
      "time": "14:30",
      "day": "Today",
      "teamA": "Team A",
      "teamB": "Team B",
      "venue": "Court 3 - East Wing",
      "highlight": true
    }
  ],
  "recentResults": [
    {
      "id": "M-020",
      "winner": "Team A",
      "loser": "Team B",
      "score": "6-3, 7-5",
      "label": "Semi-Final"
    }
  ],
  "stats": {
    "totalMatches": 32,
    "remainingMatches": 8,
    "averageMatchDuration": "1h 24m",
    "longestRally": "42 shots"
  }
}
```

For live updates, recommended options:

```text
Option A: poll every 5-10 seconds
Option B: Server-Sent Events at /api/tournaments/:id/live/events
Option C: WebSocket channel tournament:<id>:live
```

## 13. Page To Backend Mapping

### Home

File:

```text
src/app/page.tsx
```

Needs:

```text
GET /api/tournaments?status=registration&limit=1
```

### Register

File:

```text
src/app/register/page.tsx
```

Needs:

```text
GET  /api/tournaments/:id/registration-summary
POST /api/tournaments/:id/registrations
```

### Admin Tournament List

Files:

```text
src/app/admin/page.tsx
src/components/admin/AdminTournamentList.tsx
```

Needs:

```text
GET /api/tournaments
```

### Create Tournament

File:

```text
src/app/admin/tournaments/new/page.tsx
```

Needs:

```text
POST /api/admin/tournaments
```

### Tournament Control Room

Files:

```text
src/app/admin/tournaments/[id]/page.tsx
src/components/admin/TournamentControlRoom.tsx
```

Needs:

```text
GET   /api/tournaments/:id
GET   /api/admin/tournaments/:id/registrations
PATCH /api/admin/tournaments/:id/registrations/:teamId
GET   /api/tournaments/:id/matches
POST  /api/admin/tournaments/:id/generate-draw
PATCH /api/admin/tournaments/:id/matches/:matchId
GET   /api/tournaments/:id/courts
GET   /api/tournaments/:id/standings
PATCH /api/admin/tournaments/:id/settings
```

### Live Scores

File:

```text
src/app/tournaments/live/page.tsx
```

Needs:

```text
GET /api/tournaments/:id/live
GET /api/tournaments/:id/courts
```

### Bracket

File:

```text
src/app/tournaments/bracket/page.tsx
```

Needs:

```text
GET /api/tournaments/:id/standings
GET /api/tournaments/:id/bracket
```

## 14. Recommended Database Tables

Minimum backend tables:

```text
users
tournaments
tournament_settings
registrations
teams
players
payments
courts
matches
match_sets
group_standings or computed view
audit_logs
```

Useful constraints:

```text
tournaments.slug unique
teams.id unique
registrations.email + tournament_id indexed
matches.tournament_id + phase indexed
matches.status indexed
teams.tournament_id + status indexed
only one active match per court if required by operations
```

## 15. Implementation Priority

Build backend in this order:

1. `GET /api/tournaments` and `GET /api/tournaments/:id`.
2. `POST /api/admin/tournaments`.
3. `GET /api/admin/tournaments/:id/registrations`.
4. `POST /api/tournaments/:id/registrations`.
5. `PATCH /api/admin/tournaments/:id/registrations/:teamId`.
6. `GET /api/tournaments/:id/matches`.
7. `POST /api/admin/tournaments/:id/generate-draw`.
8. `PATCH /api/admin/tournaments/:id/matches/:matchId`.
9. `GET /api/tournaments/:id/standings`.
10. `GET /api/tournaments/:id/live`.
11. `GET /api/tournaments/:id/bracket`.
12. Authentication and admin/referee role enforcement.

## 16. Backend Done Checklist

Backend is compatible when:

1. Admin tournament list loads from backend, not `adminTournaments.ts`.
2. New tournament creation saves to backend, not `localStorage`.
3. Control room reload keeps teams, matches, settings, and message from backend.
4. Public registration creates a backend registration/team.
5. Admin can approve, waitlist, mark paid, and change group.
6. Draw generation uses approved paid teams only.
7. Match court, status, score, winner, and referee persist.
8. Live scores page reads active, scheduled, and completed matches from backend.
9. Bracket page reads standings and knockout seed data from backend.
10. Settings changes persist and affect capacity, courts, draw, and bracket rules.
11. Admin/referee mutations require proper auth.
12. Error responses consistently use `{ "error": "..." }`.

