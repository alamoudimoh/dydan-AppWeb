import { useState, useRef, useEffect } from "react";
import { AppCtx, Icon } from "../App";
import { TASKS, PROJECTS, ROUTINES, SHOPPING_LISTS } from "../data";

export default function SearchScreen({ ctx }: { ctx: AppCtx }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();

  const taskResults = q ? TASKS.filter(t => t.title.toLowerCase().includes(q)) : [];
  const projectResults = q ? PROJECTS.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) : [];
  const routineResults = q ? ROUTINES.filter(r => r.name.toLowerCase().includes(q)) : [];
  const shoppingResults = q ? SHOPPING_LISTS.filter(l => l.name.toLowerCase().includes(q) || l.items.some(i => i.text.toLowerCase().includes(q))) : [];

  const total = taskResults.length + projectResults.length + routineResults.length + shoppingResults.length;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 60px" }}>
      <div className="px-4 md:px-7 pt-2 pb-4">
        <div className="flex items-center gap-3 card px-4" style={{ borderRadius: "var(--r-xl)" }}>
          <Icon name="search" size={18} style={{ color: "var(--t-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="flex-1 py-4 bg-transparent text-primary outline-none"
            style={{ border: "none", fontSize: 17, fontFamily: "var(--font-ui)" }}
            placeholder="Search tasks, projects, routines, shopping..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Clear search" className="btn btn-ghost btn-icon" onClick={() => setQuery("")}>
              <Icon name="x" size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-7">
        {!q && (
          <div className="empty-state py-16">
            <div style={{ fontSize: 48 }}>🔍</div>
            <div className="font-bold text-primary" style={{ fontSize: 16 }}>Search everything</div>
            <div className="text-muted" style={{ fontSize: 13 }}>Tasks, projects, routines, shopping items</div>
          </div>
        )}

        {q && total === 0 && (
          <div className="empty-state py-16">
            <div style={{ fontSize: 48 }}>🤷</div>
            <div className="font-bold text-primary">Nothing found for "{query}"</div>
            <div className="text-muted" style={{ fontSize: 13 }}>Try a different search term</div>
            <button className="btn btn-primary mt-4" onClick={ctx.openCreate}>
              <Icon name="plus" size={14} />Create a task
            </button>
          </div>
        )}

        {taskResults.length > 0 && (
          <div className="mb-5">
            <div className="section-label" style={{ padding: "0 0 8px" }}>Tasks ({taskResults.length})</div>
            <div className="card overflow-hidden">
              {taskResults.map(t => (
                <div key={t.id} className="task-row" role="button" tabIndex={0} aria-label={`Open task: ${t.title}`} onClick={() => ctx.openTask(t)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ctx.openTask(t); } }}>
                  <div className={`task-check ${t.status === "done" ? "checked" : ""}`}>
                    {t.status === "done" && <Icon name="check" size={11} style={{ color: "white" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium" style={{ fontSize: 14, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
                    {t.category && <span className="text-faint" style={{ fontSize: 11 }}>{t.category}</span>}
                  </div>
                  {t.dueDate && <span className="text-faint" style={{ fontSize: 11 }}>{t.dueDate}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {projectResults.length > 0 && (
          <div className="mb-5">
            <div className="section-label" style={{ padding: "0 0 8px" }}>Projects ({projectResults.length})</div>
            <div className="card overflow-hidden">
              {projectResults.map(p => (
                <button key={p.id} className="task-row w-full text-start" onClick={() => ctx.navigate("projects")}>
                  <div style={{ width: 10, height: 10, borderRadius: "var(--r-xs)", background: p.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium" style={{ fontSize: 14 }}>{p.name}</div>
                    <div className="text-faint" style={{ fontSize: 11 }}>{p.description}</div>
                  </div>
                  <span className="text-faint" style={{ fontSize: 11 }}>{p.progress}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {routineResults.length > 0 && (
          <div className="mb-5">
            <div className="section-label" style={{ padding: "0 0 8px" }}>Routines ({routineResults.length})</div>
            <div className="card overflow-hidden">
              {routineResults.map(r => (
                <button key={r.id} className="task-row w-full text-start" onClick={() => ctx.navigate("routines")}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium" style={{ fontSize: 14 }}>{r.name}</div>
                    <div className="text-faint" style={{ fontSize: 11 }}>{r.schedule}</div>
                  </div>
                  <span className="badge bg-sig-done-bg text-sig-done" style={{ fontSize: 10 }}>🔥 {r.streak}d</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {shoppingResults.length > 0 && (
          <div className="mb-5">
            <div className="section-label" style={{ padding: "0 0 8px" }}>Shopping ({shoppingResults.length})</div>
            <div className="card overflow-hidden">
              {shoppingResults.map(l => (
                <button key={l.id} className="task-row w-full text-start" onClick={() => ctx.navigate("shopping")}>
                  <span style={{ fontSize: 20 }}>{l.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium" style={{ fontSize: 14 }}>{l.name}</div>
                    <div className="text-faint" style={{ fontSize: 11 }}>{l.items.filter(i => !i.done).length} items remaining</div>
                  </div>
                  {l.isShared && <span className="badge bg-brand-faint text-brand" style={{ fontSize: 10 }}>Shared</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
