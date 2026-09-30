"use client";

import {
  CircleNotchIcon,
  PaperPlaneTiltIcon,
  RobotIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  type AiDirectorProposedAction,
  askAiDirector,
  type ChatMessage,
  createTournament,
  type SportType,
  type Tournament,
  type TournamentFormat,
  updateSettings,
} from "@/lib/tuwagaApi";

interface AiDirectorCopilotProps {
  tournament?: Tournament | null;
  onSettingsUpdated?: () => void;
}

export default function AiDirectorCopilot({
  tournament,
  onSettingsUpdated,
}: AiDirectorCopilotProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your **Hermes Tournament Director Copilot**.\n\nTell me your requirements (e.g., *'70 players across 2 categories, single elimination, 1st, 2nd, and 3rd place champions'*) and I will compute the bracket math, byes, and schedule rules for you.",
    },
  ]);
  const [latestAction, setLatestAction] =
    useState<AiDirectorProposedAction | null>(null);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput("");
    const userMessage: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);
    setNotice(null);

    try {
      const response = await askAiDirector(newMessages, tournament?.id);
      setMessages(response.messages);
      if (response.proposedAction) {
        setLatestAction(response.proposedAction);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to connect to AI Director"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyAction() {
    if (!latestAction?.settings) return;
    setApplying(true);
    try {
      if (tournament?.id) {
        const patch: Record<string, unknown> = {};
        if (latestAction.settings.sport)
          patch.sport = latestAction.settings.sport;
        if (latestAction.settings.format)
          patch.format = latestAction.settings.format;
        if (latestAction.settings.categories)
          patch.categories = latestAction.settings.categories;
        if (latestAction.settings.division_settings) {
          patch.divisionSettings = latestAction.settings.division_settings;
        }
        await updateSettings(tournament.id, patch);
        setNotice("Settings applied successfully to tournament!");
        onSettingsUpdated?.();
      } else {
        const sportName = latestAction.settings.sport
          ? latestAction.settings.sport.replace("_", " ").toUpperCase()
          : "NATIONAL";
        const newTournament = await createTournament({
          name: `${sportName} Championship 2026`,
          venue: "National Sports Center",
          dateLabel: "Season 2026",
          maxPlayers: latestAction.plan?.total_players ?? 64,
          waitlistLimit: 16,
          courts: 4,
          matchDuration: 30,
          teamSize: "Doubles",
          format:
            (latestAction.settings.format as TournamentFormat) ||
            "Single elimination",
          categories: latestAction.settings.categories ?? ["Open Division"],
          sport: latestAction.settings.sport as SportType | undefined,
          scoringRules: latestAction.settings.scoringRules,
          divisionSettings: latestAction.settings.division_settings,
        });
        setNotice("Tournament created! Opening control room...");
        window.location.href = `/admin/tournaments/${newTournament.id}`;
      }
    } catch (err) {
      setNotice(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setApplying(false);
    }
  }

  // Only users with role "admin" can see and access the Hermes Director Bot
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-ink-950 shadow-xl shadow-ink-950/10 transition-all hover:bg-brand-400 hover:-translate-y-0.5 active:scale-95"
      >
        <RobotIcon className="text-lg" aria-hidden="true" weight="bold" />
        <span>Hermes Director</span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="flex h-full w-full max-w-lg flex-col border-l border-ink-200 bg-ink-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-900/20 bg-ink-950 px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <RobotIcon
                  className="text-xl text-cream-300"
                  aria-hidden="true"
                  weight="duotone"
                />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                    Tournament Director AI
                  </h2>
                  <p className="text-[11px] font-medium text-cream-200/70">
                    Self-Hosted Hermes Agent & Bracket Solver
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              >
                <XIcon className="text-base" aria-hidden="true" weight="bold" />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex gap-2 overflow-x-auto border-b border-ink-200 bg-white p-3 text-xs scrollbar-none">
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "I have 70 players, separate into 2 categories, knockout phase, take 1st, 2nd, and 3rd champion in each",
                  )
                }
                className="shrink-0 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 font-medium text-ink-700 transition hover:bg-ink-100"
              >
                70 Players / 2 Categories / 1st-3rd
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Set up Badminton tournament with BWF 21-point rally rules and deuce cap at 30",
                  )
                }
                className="shrink-0 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 font-medium text-ink-700 transition hover:bg-ink-100"
              >
                Badminton BWF Rules
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Set up Padel tournament: 16 pairs, Golden Point at 40-40, tiebreak to 7",
                  )
                }
                className="shrink-0 rounded-xl border border-ink-200 bg-ink-50 px-2.5 py-1.5 font-medium text-ink-700 transition hover:bg-ink-100"
              >
                Padel Golden Point
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={`msg-${index}-${msg.role}`}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-brand-500 font-medium text-ink-950 shadow-sm"
                          : "border border-ink-200 bg-white text-ink-800 shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-ink-500">
                  <CircleNotchIcon
                    className="animate-spin text-base"
                    aria-hidden="true"
                    weight="bold"
                  />
                  <span>Hermes is calculating bracket math...</span>
                </div>
              )}

              {/* Proposed Action Card */}
              {latestAction?.settings && (
                <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Action Proposal
                    </span>
                    <span className="rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-800">
                      {latestAction.settings.sport || "Sport"}
                    </span>
                  </div>

                  {latestAction.settings.plan && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium">
                      <div className="rounded-xl border border-ink-100 bg-ink-50 p-2.5">
                        <div className="text-[10px] uppercase text-ink-400">
                          Bracket Size
                        </div>
                        <div className="text-sm font-bold text-ink-900">
                          {latestAction.settings.plan.bracket_size}-Draw
                        </div>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50 p-2.5">
                        <div className="text-[10px] uppercase text-ink-400">
                          Byes Assigned
                        </div>
                        <div className="text-sm font-bold text-ink-900">
                          {latestAction.settings.plan.byes_count} Byes
                        </div>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50 p-2.5">
                        <div className="text-[10px] uppercase text-ink-400">
                          Bronze Match
                        </div>
                        <div className="text-sm font-bold text-emerald-700">
                          {latestAction.settings.plan.bronze_match_included
                            ? "3rd Place"
                            : "None"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-ink-100 bg-ink-50 p-2.5">
                        <div className="text-[10px] uppercase text-ink-400">
                          Total Matches
                        </div>
                        <div className="text-sm font-bold text-ink-900">
                          {latestAction.settings.plan.total_tournament_matches}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={applying}
                    onClick={handleApplyAction}
                    className="mt-3 w-full rounded-xl bg-brand-500 py-2.5 text-xs font-extrabold uppercase tracking-wider text-ink-950 shadow-md shadow-ink-950/10 transition hover:bg-brand-400 disabled:opacity-50 active:scale-95"
                  >
                    {applying
                      ? tournament?.id
                        ? "Applying to Tournament..."
                        : "Drafting Tournament..."
                      : tournament?.id
                        ? "Apply Configuration"
                        : "Draft & Create Tournament"}
                  </button>

                  {notice && (
                    <div className="mt-2 text-center text-xs font-medium text-ink-700">
                      {notice}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="border-t border-ink-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Hermes: e.g. 70 players, 2 categories..."
                  className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2 text-xs font-medium text-ink-900 outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-ink-950 transition hover:bg-brand-400 disabled:opacity-40"
                >
                  <PaperPlaneTiltIcon
                    className="text-base"
                    aria-hidden="true"
                    weight="bold"
                  />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
