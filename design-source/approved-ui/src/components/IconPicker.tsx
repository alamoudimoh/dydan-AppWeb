import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../App";

/* Compact icon library: add new [emoji, searchable label] pairs without increasing form height. */
export const ICON_LIBRARY = [
  ["🎁","gift"],["🎬","movie"],["🎮","gaming"],["🕹️","video games"],["🍿","popcorn"],["🍕","pizza"],
  ["🍔","burger"],["🎂","cake"],["🏆","trophy"],["⭐","star"],["🎨","art"],["📚","books"],
  ["🚴","cycling"],["⚽","football"],["🏖️","beach"],["🎟️","tickets"],["🎵","music"],
  ["🎧","headphones"],["🧩","puzzle"],["🛍️","shopping"],["🌙","late night"],["🧸","toy"],
  ["🍦","ice cream"],["🚀","adventure"],["🎯","goal"],["💪","workout"],["🏡","home"],
  ["🧹","cleaning"],["🌱","garden"],["📖","reading"],["💻","computer"],["🧑‍🍳","cooking"],
  ["🔧","tools"],["📟","meter"],["⚙️","settings"],["🔔","reminder"],["🎉","celebration"],
  ["🌅","morning"],["☀️","sun"],["🏃","running"],["🧘","meditation"],["💧","water"],
  ["💡","light"],["🧺","laundry"],["🚗","car"],["🍎","food"],["🛒","groceries"],
  ["🏅","medal"],["🎤","karaoke"],["📷","camera"],["🎲","board games"],["🎹","piano"],
] as const;

export default function IconPicker({
  value, onChange, label = "Icon",
}: { value: string; onChange: (icon: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => ICON_LIBRARY.filter(([icon, name]) =>
    (icon + " " + name).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query]);
  useEffect(() => {
    if (!open) return;
    filterRef.current?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  const choose = (icon: string) => {
    onChange(icon);
    setQuery("");
    setCustom("");
    setOpen(false);
  };
  return (
    <div className="theme-field" ref={root}>
      <button type="button" className="input themed-trigger" aria-label={label}
        aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(old => !old)}>
        <span className="flex items-center gap-2">
          <span style={{ fontSize: 23, lineHeight: 1 }}>{value || "🎁"}</span>
          <span className="text-muted" style={{ fontSize: 12 }}>choose an icon</span>
        </span>
        <Icon name="chevron_down" size={15} style={{ color: "var(--t-muted)" }} />
      </button>
      {open && (
        <div className="theme-popover icon-popover" role="dialog" aria-label="Choose an icon"
          onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } }}>
          <input type="search" className="input w-full" ref={filterRef}
            placeholder="search icons…" aria-label="Search icons"
            value={query} onChange={event => setQuery(event.target.value)} />
          <div className="icon-options mt-2" role="group" aria-label="Available icons">
            {matches.map(([icon, name]) => (
              <button key={name} type="button" className="icon-option"
                aria-label={name} title={name} aria-pressed={value === icon}
                onClick={() => choose(icon)}>{icon}</button>
            ))}
          </div>
          {matches.length === 0 && <p className="text-muted mt-2" style={{ fontSize: 11 }}>No matching icons</p>}
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--line)" }}>
            <label htmlFor="custom-icon-input" className="text-muted" style={{ fontSize: 11 }}>
              use another emoji or symbol
            </label>
            <div className="flex gap-2 mt-1">
              <input id="custom-icon-input" className="input min-w-0" placeholder="paste icon"
                value={custom} maxLength={16} onChange={event => setCustom(event.target.value)} />
              <button type="button" className="btn btn-secondary btn-sm" disabled={!custom.trim()}
                onClick={() => choose(custom.trim())}>use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
