"use client";

import { useState } from "react";
import "react-day-picker/dist/style.css";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "./modal";
import { Button } from "./button";

function timeToOptions(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

export function DateTimePickerField({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate
}: {
  label: string;
  dateValue: string; // yyyy-MM-dd
  timeValue: string; // HH:mm
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const times = timeToOptions();

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-brand-charcoal">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 flex-1 items-center gap-2 rounded-md border-2 border-black bg-white px-3 text-left text-sm hover:bg-brand-yellowMuted"
        >
          <CalIcon className="h-4 w-4" />
          {dateValue ? format(new Date(dateValue + "T00:00:00"), "EEE, MMM d, yyyy") : "Select date"}
        </button>
        <div className="flex h-11 items-center gap-2 rounded-md border-2 border-black bg-white px-3">
          <Clock className="h-4 w-4" />
          <select
            className="bg-transparent text-sm outline-none"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
          >
            {times.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Choose ${label}`} className="max-w-md">
        <DayPicker
          mode="single"
          selected={dateValue ? new Date(dateValue + "T00:00:00") : undefined}
          onSelect={(d) => {
            if (d) {
              onDateChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={minDate ? { before: minDate } : undefined}
          className={cn("mx-auto")}
          modifiersClassNames={{
            selected: "bg-brand-charcoal text-white",
            today: "border-2 border-brand-charcoal"
          }}
        />
      </Modal>
    </div>
  );
}
