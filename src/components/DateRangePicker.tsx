"use client";

import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

export function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (startDate === endDate) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdays = [
  ["sun", "S"],
  ["mon", "M"],
  ["tue", "T"],
  ["wed", "W"],
  ["thu", "T"],
  ["fri", "F"],
  ["sat", "S"],
] as const;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function calendarDays(monthDate: Date) {
  const firstOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: toDateKey(date),
      label: date.getDate(),
      currentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

export default function DateRangePicker({
  startsAt,
  endsAt,
  onChange,
}: {
  startsAt: string;
  endsAt: string;
  onChange: (startsAt: string, endsAt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (startsAt) {
      const parsed = new Date(`${startsAt}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const hasRange = Boolean(startsAt && endsAt && endsAt >= startsAt);

  const selectDate = (dateKey: string) => {
    if (!startsAt || endsAt) {
      onChange(dateKey, "");
      return;
    }

    if (dateKey < startsAt) {
      setOpen(false);
      onChange(dateKey, startsAt);
      return;
    }

    setOpen(false);
    onChange(startsAt, dateKey);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-ink-300/50 bg-white px-3 text-left text-sm font-semibold text-ink-950 outline-none transition-colors hover:border-brand-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
      >
        <span className={hasRange ? "text-ink-950" : "text-ink-600"}>
          {hasRange ? formatDateRange(startsAt, endsAt) : "Select date range"}
        </span>
        <CalendarBlankIcon
          className="text-lg text-ink-600"
          aria-hidden="true"
          weight="bold"
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-ink-300/40 bg-white p-4 shadow-[0_16px_40px_rgba(23,23,23,0.14)] sm:left-auto sm:right-0 sm:w-[320px]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth((current) => addMonths(current, -1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              aria-label="Previous month"
            >
              <CaretLeftIcon
                className="text-xl"
                aria-hidden="true"
                weight="duotone"
              />
            </button>
            <p className="text-sm font-extrabold text-ink-950">
              {monthFormatter.format(visibleMonth)}
            </p>
            <button
              type="button"
              onClick={() =>
                setVisibleMonth((current) => addMonths(current, 1))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              aria-label="Next month"
            >
              <CaretRightIcon
                className="text-xl"
                aria-hidden="true"
                weight="duotone"
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-ink-600">
            {weekdays.map(([key, label]) => (
              <span key={key}>{label}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays(visibleMonth).map((day) => {
              const isStart = day.key === startsAt;
              const isEnd = day.key === endsAt;
              const isInRange =
                startsAt && endsAt && day.key > startsAt && day.key < endsAt;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => selectDate(day.key)}
                  className={`h-9 rounded-lg text-sm font-bold transition-colors ${
                    isStart || isEnd
                      ? "bg-brand-500 text-ink-950"
                      : isInRange
                        ? "bg-brand-500/10 text-brand-600"
                        : day.currentMonth
                          ? "text-ink-950 hover:bg-ink-100"
                          : "text-ink-600/50 hover:bg-ink-100"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-300/20 pt-3">
            <p className="min-w-0 text-xs font-semibold text-ink-600">
              {startsAt && endsAt
                ? formatDateRange(startsAt, endsAt)
                : startsAt
                  ? "Select an end date"
                  : "Select a start date"}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg bg-brand-500 px-4 text-xs font-bold text-ink-950 transition-colors hover:bg-brand-500/90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
