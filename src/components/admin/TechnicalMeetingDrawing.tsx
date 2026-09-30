"use client";

import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  ConfettiIcon,
  CopyIcon,
  CornersInIcon,
  CornersOutIcon,
  DiceFiveIcon,
  FloppyDiskIcon,
  HourglassHighIcon,
  PinwheelIcon,
  ShuffleIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  TargetIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RegistrationTeam, Tournament } from "@/lib/tuwagaApi";

interface TechnicalMeetingDrawingProps {
  tournament: Tournament;
  teams: RegistrationTeam[];
  categories: string[];
  defaultGroupSize?: number;
  onApplyDraw: (
    assignments: Array<{ teamId: string; group: string; seed: number | null }>,
  ) => Promise<void>;
}

// Wheel slices use mid/dark brand tones so the white labels stay legible
// and neighbouring slices always contrast (warm, neutral, warm, …).
const WHEEL_COLORS = [
  "#e06d30", // brand-500
  "#232220", // ink-900
  "#8c7148", // cream-600
  "#ba501c", // brand-600
  "#484641", // ink-700
  "#2a7645", // emerald-700
  "#9c421d", // brand-700
  "#6c5535", // cream-700
  "#33312e", // ink-800
  "#a36102", // amber-700
  "#5f5c55", // ink-600
  "#7b351a", // brand-800
];

interface DrawnTeamEntry {
  team: RegistrationTeam;
  groupName: string;
  slotIndex: number;
}

// Synthesized sound effects using Web Audio API
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  playFanfare() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    } catch {
      // AudioContext fallback
    }
  }
}

const sfx = new SoundEffects();

export default function TechnicalMeetingDrawing({
  tournament,
  teams,
  categories,
  defaultGroupSize = 4,
  onApplyDraw,
}: TechnicalMeetingDrawingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return categories[0] ?? "all";
  });
  const [statusFilter, setStatusFilter] = useState<
    "all_active" | "approved" | "all"
  >("all_active");
  const [groupCount, setGroupCount] = useState<number>(() => {
    return defaultGroupSize >= 2 ? defaultGroupSize : 4;
  });
  const [soundOn, setSoundOn] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawnList, setDrawnList] = useState<DrawnTeamEntry[]>([]);
  const [latestWinner, setLatestWinner] = useState<DrawnTeamEntry | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  // Filter teams for eligible TM participants based on category & status filter
  const eligibleTeams = useMemo(() => {
    return teams.filter((t) => {
      const categoryMatch =
        selectedCategory === "all" || t.category === selectedCategory;
      if (!categoryMatch) return false;

      if (statusFilter === "approved") {
        return t.status === "approved";
      }
      if (statusFilter === "all_active") {
        return t.status !== "rejected";
      }
      return true;
    });
  }, [teams, selectedCategory, statusFilter]);

  // Remaining teams that have not yet been drawn
  const drawnTeamIds = useMemo(
    () => new Set(drawnList.map((d) => d.team.id)),
    [drawnList],
  );

  const remainingTeams = useMemo(
    () => eligibleTeams.filter((t) => !drawnTeamIds.has(t.id)),
    [eligibleTeams, drawnTeamIds],
  );

  // Group letters
  const groupLetters = useMemo(() => {
    return Array.from({ length: groupCount }, (_, i) =>
      String.fromCharCode(65 + i),
    );
  }, [groupCount]);

  // Determine current group target for next draw
  const nextTargetGroup = useMemo(() => {
    const totalDrawn = drawnList.length;
    const groupIdx = totalDrawn % groupCount;
    const slotIdx = Math.floor(totalDrawn / groupCount) + 1;
    return {
      groupLetter: groupLetters[groupIdx] ?? "A",
      groupName: `Group ${groupLetters[groupIdx] ?? "A"}`,
      slotIndex: slotIdx,
    };
  }, [drawnList.length, groupCount, groupLetters]);

  // Draw the wheel on canvas
  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 16;

      ctx.clearRect(0, 0, size, size);

      const items = remainingTeams.length > 0 ? remainingTeams : eligibleTeams;

      if (items.length === 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#171717";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#484641";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#33312e";
        ctx.fill();
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#5f5c55";
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#a7a399";
        ctx.textAlign = "center";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("Belum Ada Tim untuk Diundi", center, center - 10);
        ctx.fillStyle = "#78746c";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(
          "Ubah filter status / kategori di atas",
          center,
          center + 14,
        );
        ctx.restore();
        return;
      }

      const count = Math.max(items.length, 1);
      const arc = (2 * Math.PI) / count;

      // Outer glow and border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
      ctx.fillStyle = "#171717";
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#e06d30";
      ctx.stroke();

      // Outer golden dots (lights)
      const lightCount = 24;
      for (let i = 0; i < lightCount; i++) {
        const dotAngle = (i * 2 * Math.PI) / lightCount;
        const x = center + (radius + 4) * Math.cos(dotAngle);
        const y = center + (radius + 4) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = i % 2 === 0 ? "#eddebd" : "#ffffff";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      ctx.restore();

      // Wheel slices
      for (let i = 0; i < count; i++) {
        const start = angle + i * arc;
        const end = start + arc;
        const team = items[i];

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.closePath();

        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length] ?? "#e06d30";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Label text along radial
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = count > 16 ? "bold 10px sans-serif" : "bold 12px sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 3;

        const displayName = team
          ? `${team.player}${team.partner ? ` & ${team.partner}` : ""}`
          : `Slot ${i + 1}`;
        const truncated =
          displayName.length > 20
            ? `${displayName.slice(0, 18)}…`
            : displayName;

        ctx.fillText(truncated, radius - 18, 4);
        ctx.restore();

        ctx.restore();
      }

      // Center Hub Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, 44, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#e06d30";
      ctx.stroke();

      // Center Inner Hub
      ctx.beginPath();
      ctx.arc(center, center, 36, 0, 2 * Math.PI);
      ctx.fillStyle = "#33312e";
      ctx.fill();

      // TUWAGA center text
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "black 11px sans-serif";
      ctx.fillText("TUWAGA", center, center - 2);
      ctx.fillStyle = "#e06d30";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("DRAW", center, center + 10);
      ctx.restore();

      // Top Indicator Pointer (Triangle arrow pointing down into 12 o'clock)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center - 16, 2);
      ctx.lineTo(center + 16, 2);
      ctx.lineTo(center, 30);
      ctx.closePath();
      ctx.fillStyle = "#e11d48"; // Rose-600
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    },
    [eligibleTeams, remainingTeams],
  );

  // Re-draw wheel on state changes
  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  // Confetti celebration animation
  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth ?? 800;
    canvas.height = canvas.parentElement?.clientHeight ?? 600;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vr: number;
      alpha: number;
    }> = [];

    // Confetti in the brand palette: orange, cream, charcoal, gold, court green.
    const colors = [
      "#e06d30",
      "#f7905b",
      "#eddebd",
      "#ffffff",
      "#232220",
      "#febc23",
      "#45b569",
    ];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height / 2 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "#e06d30",
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        alpha: 1,
      });
    }

    let frame = 0;
    function renderConfetti() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.rotation += p.vr;
        if (frame > 20) p.alpha -= 0.015;

        if (p.alpha > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      }
      frame++;
      if (alive) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(renderConfetti);
  }, []);

  // Spin wheel action
  const spinWheel = useCallback(() => {
    if (isSpinning || remainingTeams.length === 0) return;

    setIsSpinning(true);
    setShowCelebration(false);
    setLatestWinner(null);

    const count = remainingTeams.length;
    const arc = (2 * Math.PI) / count;

    // Pick random winner index among remaining teams
    const winningIndex = Math.floor(Math.random() * count);
    const winningTeam = remainingTeams[winningIndex];
    if (!winningTeam) {
      setIsSpinning(false);
      return;
    }

    // Pointer is at top: 12 o'clock = 3 * Math.PI / 2
    // We want slice `winningIndex` center to land at 3 * Math.PI / 2
    const sliceCenter = winningIndex * arc + arc / 2;
    const targetOffset = (3 * Math.PI) / 2 - sliceCenter;

    // Add 5 to 8 full rotations for suspense
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    const startAngle = currentAngleRef.current;
    // Current angle modulo 2PI normalized
    const normalizedStart = startAngle % (2 * Math.PI);
    let delta = targetOffset - normalizedStart;
    while (delta < 0) delta += 2 * Math.PI;
    const totalRotation = extraSpins + delta;
    const finalAngle = startAngle + totalRotation;

    const duration = 4800; // 4.8 seconds spin
    const startTime = performance.now();

    function easeOutQuart(t: number): number {
      return 1 - (1 - t) ** 4;
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = startAngle + totalRotation * eased;
      currentAngleRef.current = current;

      // Tick sound when passing slice
      const currentSlice = Math.floor((current / arc) % count);
      if (currentSlice !== lastTickIndexRef.current) {
        lastTickIndexRef.current = currentSlice;
        sfx.playTick();
      }

      drawWheel(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentAngleRef.current = finalAngle;
        drawWheel(finalAngle);
        setIsSpinning(false);
        sfx.playFanfare();
        triggerConfetti();

        // Record drawn team
        const entry: DrawnTeamEntry = {
          team: winningTeam,
          groupName: nextTargetGroup.groupName,
          slotIndex: nextTargetGroup.slotIndex,
        };
        setDrawnList((prev) => [...prev, entry]);
        setLatestWinner(entry);
        setShowCelebration(true);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, remainingTeams, nextTargetGroup, drawWheel, triggerConfetti]);

  // Cancel animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Quick auto draw all remaining teams
  const handleAutoDrawAll = () => {
    if (isSpinning || remainingTeams.length === 0) return;
    const shuffled = [...remainingTeams].sort(() => Math.random() - 0.5);
    const newEntries: DrawnTeamEntry[] = [];
    const baseOffset = drawnList.length;

    shuffled.forEach((team, idx) => {
      const overallIndex = baseOffset + idx;
      const groupIdx = overallIndex % groupCount;
      const slotIdx = Math.floor(overallIndex / groupCount) + 1;
      newEntries.push({
        team,
        groupName: `Group ${groupLetters[groupIdx] ?? "A"}`,
        slotIndex: slotIdx,
      });
    });

    setDrawnList((prev) => [...prev, ...newEntries]);
    triggerConfetti();
    sfx.playFanfare();
  };

  // Reset drawing
  const handleReset = () => {
    if (
      drawnList.length > 0 &&
      !window.confirm("Apakah Anda yakin ingin me-reset hasil undian ini?")
    ) {
      return;
    }
    setDrawnList([]);
    setLatestWinner(null);
    setShowCelebration(false);
  };

  // Apply drawn groups to tournament schedule
  const handleApplyToSchedule = async () => {
    if (drawnList.length === 0) return;
    setApplying(true);
    setApplyMessage(null);
    try {
      const assignments = drawnList.map((entry) => ({
        teamId: entry.team.id,
        group: entry.groupName,
        seed: entry.slotIndex,
      }));
      await onApplyDraw(assignments);
      setApplyMessage(
        "Hasil drawing berhasil disimpan dan jadwal pertandingan dibuat!",
      );
    } catch (err) {
      setApplyMessage(
        err instanceof Error ? err.message : "Gagal menerapkan hasil drawing.",
      );
    } finally {
      setApplying(false);
    }
  };

  // Copy for WhatsApp
  const handleCopyWhatsapp = () => {
    const lines: string[] = [
      `🏆 *HASIL DRAWING TECHNICAL MEETING - ${tournament.name.toUpperCase()}*`,
      `Kategori: ${selectedCategory === "all" ? "Semua Kategori" : selectedCategory}`,
      `Total Tim Terundi: ${drawnList.length} Tim`,
      "",
    ];

    groupLetters.forEach((letter) => {
      const gName = `Group ${letter}`;
      const groupTeams = drawnList.filter((d) => d.groupName === gName);
      lines.push(`*${gName.toUpperCase()}*`);
      if (groupTeams.length === 0) {
        lines.push("  _(Belum ada tim)_");
      } else {
        groupTeams.forEach((item, idx) => {
          lines.push(
            `  ${idx + 1}. ${item.team.player}${item.team.partner ? ` / ${item.team.partner}` : ""} (${item.team.city || "ID"})`,
          );
        });
      }
      lines.push("");
    });

    lines.push("Semangat bertanding! Dikelola resmi melalui sistem *TUWAGA*.");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  // Grouped teams by group name
  const groupedData = useMemo(() => {
    const map: Record<string, DrawnTeamEntry[]> = {};
    groupLetters.forEach((letter) => {
      map[`Group ${letter}`] = [];
    });
    drawnList.forEach((item) => {
      if (!map[item.groupName]) map[item.groupName] = [];
      map[item.groupName]?.push(item);
    });
    return map;
  }, [drawnList, groupLetters]);

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-[200] overflow-y-auto bg-ink-950 p-6 text-white" : ""}`}
    >
      {/* Confetti Overlay Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none absolute inset-0 z-50 h-full w-full"
      />

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-ink-200/80 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-100 text-cream-700">
              <DiceFiveIcon
                className="text-xl"
                aria-hidden="true"
                weight="duotone"
              />
            </span>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream-700">
              Live Drawing Ceremony
            </p>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink-950">
            Technical Meeting & Undian Grup
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            Putar roda keberuntungan interaktif secara live di depan peserta
            atau siaran streaming.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              sfx.enabled = next;
            }}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
              soundOn
                ? "border-cream-200 bg-cream-50 text-cream-700"
                : "border-ink-200 bg-ink-100 text-ink-400"
            }`}
            title={soundOn ? "Suara Aktif" : "Mute"}
          >
            {soundOn ? (
              <SpeakerHighIcon
                className="text-base"
                weight="bold"
                aria-hidden="true"
              />
            ) : (
              <SpeakerSlashIcon
                className="text-base"
                weight="bold"
                aria-hidden="true"
              />
            )}
            <span>{soundOn ? "Audio On" : "Mute"}</span>
          </button>

          {/* Fullscreen presentation toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-xs font-bold text-ink-700 shadow-sm transition hover:bg-ink-50"
          >
            {isFullscreen ? (
              <CornersInIcon
                className="text-base"
                weight="bold"
                aria-hidden="true"
              />
            ) : (
              <CornersOutIcon
                className="text-base"
                weight="bold"
                aria-hidden="true"
              />
            )}
            <span>
              {isFullscreen ? "Keluar Layar Penuh" : "Mode Presentasi TM"}
            </span>
          </button>
        </div>
      </div>

      {/* Control Strip (Filter Division, Status & Group Count) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Divisi / Kategori
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setDrawnList([]);
              setLatestWinner(null);
            }}
            disabled={isSpinning}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-xs font-extrabold text-ink-800 outline-none hover:border-brand-400 focus:border-brand-500 transition"
          >
            <option value="all">Semua Kategori ({teams.length} tim)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({teams.filter((t) => t.category === cat).length} tim)
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Status Tim Diundi
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value as "all_active" | "approved" | "all",
              );
              setDrawnList([]);
              setLatestWinner(null);
            }}
            disabled={isSpinning}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-xs font-extrabold text-ink-800 outline-none hover:border-brand-400 focus:border-brand-500 transition"
          >
            <option value="all_active">
              Semua Tim Aktif (
              {teams.filter((t) => t.status !== "rejected").length} tim)
            </option>
            <option value="approved">
              Hanya Approved (
              {teams.filter((t) => t.status === "approved").length} tim)
            </option>
            <option value="all">Semua Status ({teams.length} tim)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Jumlah Grup Dibentuk
          </span>
          <select
            value={groupCount}
            onChange={(e) => {
              setGroupCount(Number(e.target.value));
              setDrawnList([]);
              setLatestWinner(null);
            }}
            disabled={isSpinning}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-xs font-extrabold text-ink-800 outline-none hover:border-brand-400 focus:border-brand-500 transition"
          >
            <option value={2}>2 Grup (Grup A & B)</option>
            <option value={4}>4 Grup (Grup A, B, C, D)</option>
            <option value={6}>6 Grup (Grup A s/d F)</option>
            <option value={8}>8 Grup (Grup A s/d H)</option>
          </select>
        </label>

        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoDrawAll}
              disabled={isSpinning || remainingTeams.length === 0}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream-200 bg-cream-50 px-3 text-xs font-extrabold text-cream-700 transition hover:bg-cream-100 disabled:opacity-50"
            >
              <ShuffleIcon
                className="text-base"
                aria-hidden="true"
                weight="bold"
              />
              Acak Semua
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSpinning || drawnList.length === 0}
              className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-ink-200 px-3 text-xs font-bold text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
              title="Reset Undian"
            >
              <ArrowClockwiseIcon
                className="text-base"
                aria-hidden="true"
                weight="bold"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Drawing Arena: Wheel + Live Group Board */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Wheel (5 cols on lg) */}
        <div className="flex flex-col items-center justify-between rounded-3xl border border-ink-200/80 bg-gradient-to-b from-white to-ink-50/50 p-6 shadow-sm lg:col-span-5">
          {/* Target Group Indicator */}
          <div className="w-full text-center">
            {eligibleTeams.length === 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-extrabold text-amber-800">
                <WarningIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  Belum ada tim yang dapat diundi di kategori/status ini
                </span>
              </div>
            ) : remainingTeams.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-cream-50 px-4 py-1.5 text-xs font-extrabold text-cream-800 animate-pulse">
                <TargetIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  Putaran Selanjutnya:{" "}
                  <strong>{nextTargetGroup.groupName}</strong> (Slot{" "}
                  {nextTargetGroup.slotIndex})
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-extrabold text-emerald-800">
                <CheckCircleIcon
                  className="text-sm"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  Semua {drawnList.length > 0 ? `(${drawnList.length}) ` : ""}
                  tim telah berhasil diundi!
                </span>
              </div>
            )}
          </div>

          {/* Wheel Canvas */}
          <div className="relative my-6 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="max-h-[380px] max-w-[380px] sm:max-h-[440px] sm:max-w-[440px] drop-shadow-2xl"
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={spinWheel}
              disabled={isSpinning || remainingTeams.length === 0}
              className="relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-brand-500 to-cream-600 px-6 text-base font-black uppercase tracking-wider text-white shadow-xl shadow-ink-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ink-950/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSpinning ? (
                <HourglassHighIcon
                  className="animate-spin text-2xl"
                  weight="duotone"
                  aria-hidden="true"
                />
              ) : (
                <PinwheelIcon
                  className="animate-spin text-2xl"
                  weight="duotone"
                  aria-hidden="true"
                />
              )}
              <span>
                {isSpinning
                  ? "Sedang Memutar Roda…"
                  : eligibleTeams.length === 0
                    ? "Tidak Ada Tim untuk Diundi"
                    : remainingTeams.length === 0
                      ? "Undian Selesai"
                      : `Putar Roda (${remainingTeams.length} Tersisa)`}
              </span>
            </button>

            <p className="text-center text-[11px] font-medium text-ink-400">
              {eligibleTeams.length === 0
                ? "Ganti pilihan status atau pilih kategori lain yang memiliki pendaftar"
                : `${remainingTeams.length} dari ${eligibleTeams.length} tim belum diundi`}
            </p>
          </div>
        </div>

        {/* Right Column: Live Groups Board (7 cols on lg) */}
        <div className="flex flex-col justify-between rounded-3xl border border-ink-200/80 bg-white p-6 shadow-sm lg:col-span-7">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-ink-950">
                  Papan Hasil Drawing Grup
                </h3>
                <p className="mt-0.5 text-xs text-ink-500">
                  Tim yang ditarik otomatis mengisi slot grup sesuai urutan TM.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsapp}
                  disabled={drawnList.length === 0}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-xs font-bold text-ink-700 hover:bg-ink-50 transition disabled:opacity-40"
                >
                  <CopyIcon
                    className="text-sm"
                    aria-hidden="true"
                    weight="bold"
                  />
                  <span>{copiedWhatsapp ? "Tersalin!" : "Salin ke WA"}</span>
                </button>
              </div>
            </div>

            {/* Winner Announcement Toast Banner */}
            {showCelebration && latestWinner && (
              <div className="my-4 flex items-center justify-between rounded-2xl border border-cream-300 bg-gradient-to-r from-cream-50 via-brand-50 to-amber-50 p-4 shadow-sm animate-bounce">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-600 text-lg text-white">
                    <ConfettiIcon
                      className="text-xl"
                      weight="fill"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-cream-700">
                      Terundi Masuk {latestWinner.groupName}!
                    </p>
                    <p className="font-black text-ink-900 text-sm">
                      {latestWinner.team.player}{" "}
                      {latestWinner.team.partner
                        ? `/ ${latestWinner.team.partner}`
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-cream-600 px-3 py-1 text-xs font-black text-white">
                  Slot #{latestWinner.slotIndex}
                </span>
              </div>
            )}

            {/* Groups Grid */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {groupLetters.map((letter) => {
                const gName = `Group ${letter}`;
                const members = groupedData[gName] ?? [];
                const isTarget =
                  remainingTeams.length > 0 &&
                  nextTargetGroup.groupName === gName;

                return (
                  <div
                    key={letter}
                    className={`rounded-2xl border p-4 transition ${
                      isTarget
                        ? "border-cream-400 bg-cream-50/30 ring-2 ring-cream-200"
                        : "border-ink-200 bg-ink-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-ink-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-black text-white">
                          {letter}
                        </span>
                        <span className="font-black text-ink-900 text-sm">
                          {gName}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-ink-500">
                        {members.length} Tim
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {members.length === 0 ? (
                        <p className="py-4 text-center text-xs text-ink-400 italic">
                          Menunggu giliran undian…
                        </p>
                      ) : (
                        members.map((entry, idx) => (
                          <div
                            key={entry.team.id}
                            className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-ink-200/80 text-xs shadow-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10px] font-black text-ink-600">
                                {idx + 1}
                              </span>
                              <span className="truncate font-bold text-ink-900">
                                {entry.team.player}
                                {entry.team.partner
                                  ? ` / ${entry.team.partner}`
                                  : ""}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-ink-400 shrink-0 ml-2">
                              {entry.team.city || "ID"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions: Save to Tournament */}
          <div className="mt-6 border-t border-ink-100 pt-5">
            {applyMessage && (
              <div className="mb-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs font-bold text-brand-800">
                {applyMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-ink-500">
                {drawnList.length > 0
                  ? `${drawnList.length} tim siap dimasukkan ke bagan resmi turnamen.`
                  : "Mulai undian untuk membagi tim ke grup pertandingan."}
              </p>
              <button
                type="button"
                onClick={handleApplyToSchedule}
                disabled={applying || drawnList.length === 0}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-lg shadow-ink-950/10 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <FloppyDiskIcon
                  className="text-base"
                  aria-hidden="true"
                  weight="bold"
                />
                <span>
                  {applying
                    ? "Menyimpan ke Jadwal…"
                    : "Terapkan Hasil Drawing ke Jadwal Turnamen"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
