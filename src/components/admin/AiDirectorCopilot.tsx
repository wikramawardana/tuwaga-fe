"use client";

import { useState } from "react";
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
          content: `⚠️ Error: ${err instanceof Error ? err.message : "Failed to connect to AI Director"}`,
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
        setNotice("✅ Settings applied successfully to tournament!");
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
        setNotice("🎉 Tournament created! Opening control room...");
        window.location.href = `/admin/tournaments/${newTournament.id}`;
      }
    } catch (err) {
      setNotice(
        `❌ Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border-3 border-black bg-[#246bfe] px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[4px_4px_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0_#000]"
      >
        <span className="material-symbols-outlined text-xl">smart_toy</span>
        <span>Hermes Director</span>
      </button>

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="flex h-full w-full max-w-lg flex-col border-l-4 border-black bg-[#f4f0ea] shadow-[-8px_0_0_#000]">
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-black bg-[#246bfe] px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">
                  smart_toy
                </span>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide">
                    Tournament Director AI
                  </h2>
                  <p className="text-xs text-blue-100 font-bold">
                    Self-Hosted Hermes Agent & Bracket Solver
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex gap-2 overflow-x-auto border-b-2 border-black bg-white p-3 text-xs scrollbar-none">
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "I have 70 players, separate into 2 categories, knockout phase, take 1st, 2nd, and 3rd champion in each",
                  )
                }
                className="shrink-0 rounded-lg border-2 border-black bg-amber-200 px-2.5 py-1 font-extrabold shadow-[2px_2px_0_#000] hover:bg-amber-300"
              >
                🏆 70 Players / 2 Categories / 1st-3rd
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Set up Badminton tournament with BWF 21-point rally rules and deuce cap at 30",
                  )
                }
                className="shrink-0 rounded-lg border-2 border-black bg-emerald-200 px-2.5 py-1 font-extrabold shadow-[2px_2px_0_#000] hover:bg-emerald-300"
              >
                🏸 Badminton BWF Rules
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Set up Padel tournament: 16 pairs, Golden Point at 40-40, tiebreak to 7",
                  )
                }
                className="shrink-0 rounded-lg border-2 border-black bg-purple-200 px-2.5 py-1 font-extrabold shadow-[2px_2px_0_#000] hover:bg-purple-300"
              >
                🎾 Padel Golden Point
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
                      className={`max-w-[88%] rounded-xl border-3 border-black p-3 text-sm leading-relaxed shadow-[3px_3px_0_#000] ${
                        isUser
                          ? "bg-[#246bfe] font-bold text-white"
                          : "bg-white text-slate-900"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-600">
                  <span className="material-symbols-outlined animate-spin text-base">
                    progress_activity
                  </span>
                  <span>Hermes is calculating bracket math...</span>
                </div>
              )}

              {/* Proposed Action Card */}
              {latestAction?.settings && (
                <div className="rounded-xl border-3 border-black bg-amber-100 p-4 shadow-[4px_4px_0_#000]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      ⚡ Action Proposal
                    </span>
                    <span className="rounded-md border border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase">
                      {latestAction.settings.sport || "Sport"}
                    </span>
                  </div>

                  {latestAction.settings.plan && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="rounded-lg border border-black bg-white p-2">
                        <div className="text-[10px] uppercase text-slate-500">
                          Bracket Size
                        </div>
                        <div className="text-base font-black">
                          {latestAction.settings.plan.bracket_size}-Draw
                        </div>
                      </div>
                      <div className="rounded-lg border border-black bg-white p-2">
                        <div className="text-[10px] uppercase text-slate-500">
                          Byes Assigned
                        </div>
                        <div className="text-base font-black">
                          {latestAction.settings.plan.byes_count} Byes
                        </div>
                      </div>
                      <div className="rounded-lg border border-black bg-white p-2">
                        <div className="text-[10px] uppercase text-slate-500">
                          Bronze Match
                        </div>
                        <div className="text-base font-black text-emerald-600">
                          {latestAction.settings.plan.bronze_match_included
                            ? "✅ 3rd Place"
                            : "None"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-black bg-white p-2">
                        <div className="text-[10px] uppercase text-slate-500">
                          Total Matches
                        </div>
                        <div className="text-base font-black">
                          {latestAction.settings.plan.total_tournament_matches}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={applying}
                    onClick={handleApplyAction}
                    className="mt-3 w-full rounded-lg border-2 border-black bg-black py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0_#000] transition hover:bg-slate-800 disabled:opacity-50"
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
                    <div className="mt-2 text-center text-xs font-bold text-slate-800">
                      {notice}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="border-t-3 border-black bg-white p-3">
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
                  className="flex-1 rounded-xl border-2 border-black bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#246bfe] text-white shadow-[2px_2px_0_#000] hover:bg-blue-600 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    send
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
