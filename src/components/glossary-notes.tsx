"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, X } from "lucide-react";

type GlossaryEntry = { term: string; definition: string };

const GlossaryContext = createContext<{
  entries: GlossaryEntry[];
  open: (entry: GlossaryEntry) => void;
} | null>(null);

export function GlossaryNotes({ entries, children }: { entries: GlossaryEntry[]; children: ReactNode }) {
  const [selected, setSelected] = useState<GlossaryEntry | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selected) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab" && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]")];
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [selected]);

  const value = useMemo(() => ({ entries, open: setSelected }), [entries]);

  return <GlossaryContext.Provider value={value}>
    {children}
    {selected && <div className="term-note-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setSelected(null);
    }}>
      <section ref={dialogRef} className="term-note-dialog" role="dialog" aria-modal="true" aria-labelledby="term-note-title" aria-describedby="term-note-definition">
        <header>
          <span className="term-note-icon"><BookOpen aria-hidden="true" /></span>
          <div><small>용어 설명</small><h2 id="term-note-title">{selected.term}</h2></div>
          <button ref={closeRef} type="button" className="term-note-x" onClick={() => setSelected(null)} aria-label="용어 설명 닫기"><X aria-hidden="true" /></button>
        </header>
        <p id="term-note-definition">{selected.definition}</p>
        <button type="button" className="term-note-close" onClick={() => setSelected(null)}>닫기</button>
      </section>
    </div>}
  </GlossaryContext.Provider>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function GlossaryText({ text }: { text: string }) {
  const context = useContext(GlossaryContext);
  if (!context || !context.entries.length) return text;
  const byTerm = new Map(context.entries.map((entry) => [entry.term, entry]));
  const terms = [...byTerm.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})\\*?`, "g");
  const seen = new Set<string>();
  return <>{text.split(pattern).map((part, index) => {
    const entry = byTerm.get(part);
    if (!entry || seen.has(part)) return <span key={`${part}-${index}`}>{part.replace(/\*$/, "")}</span>;
    seen.add(part);
    return <button key={`${part}-${index}`} type="button" className="term-note-trigger" aria-haspopup="dialog" aria-label={`${part} 뜻 보기`} onClick={() => context.open(entry)}>[{part}]</button>;
  })}</>;
}
