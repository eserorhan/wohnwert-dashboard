"use client";
import { useState, ReactNode } from "react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: ReactNode;
}

export default function CollapsibleSection({ title, defaultOpen = false, badge, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{title}</span>
          {badge && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span className="text-slate-400 text-xs">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
