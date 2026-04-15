"use client";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const KLASSEN: Record<string, { bg: string; text: string; label: string }> = {
  exzellent:             { bg: "bg-teal-600",    text: "text-white", label: "Exzellent" },
  gut:                   { bg: "bg-blue-600",    text: "text-white", label: "Gut" },
  durchschnittlich:      { bg: "bg-slate-500",   text: "text-white", label: "Durchschnitt" },
  unterdurchschnittlich: { bg: "bg-amber-600",   text: "text-white", label: "Unter Ø" },
  mangelhaft:            { bg: "bg-red-600",     text: "text-white", label: "Mangelhaft" },
};

export function WohnwertBadge({ score, klasse, size = "md" }: {
  score?: number | null;
  klasse?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const k = klasse ? KLASSEN[klasse] ?? KLASSEN["durchschnittlich"] : KLASSEN["durchschnittlich"];
  const sz = size === "sm" ? "text-xs px-1.5 py-0.5" : size === "lg" ? "text-base px-3 py-1.5 font-bold" : "text-sm px-2 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${k.bg} ${k.text} ${sz}`}>
      {score != null && <span>{Math.round(score)}</span>}
      <span>{k.label}</span>
    </span>
  );
}

const RADAR_LABELS: Record<string, string> = {
  preis: "Preis",
  standort: "Standort",
  infrastruktur: "Infrastruktur",
  ausstattung: "Ausstattung",
  mobilitaet: "Mobilität",
};

export function WohnwertBar({ dims }: {
  dims: {
    preis: number; standort: number; infrastruktur: number;
    ausstattung: number; mobilitaet: number;
  };
}) {
  const data = Object.entries(dims).map(([key, value]) => ({
    dim: RADAR_LABELS[key] ?? key,
    wert: Math.round(value ?? 0),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-52">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <Radar
            name="WohnWert"
            dataKey="wert"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(v: number) => [`${v} / 100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
