import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { ROUTINES, getMemberById } from "../data";

export default function RoutinesScreen({ ctx }: { ctx: AppCtx }) {
  const [expanded, setExpanded] = useState<string | null>("routine-morning");
  const isChild = ctx.persona === "child";
  const routines = isChild ? ROUTINES.filter(r => r.assigneeId === "liam") : ROUTINES;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Routines</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Recurring daily and weekly flows</div>
        </div>
        {!isChild && <button className="btn btn-primary" onClick={ctx.openCreate}><Icon name="plus" size={14} />New routine</button>}
      </div>

      <div className="px-4 md:px-7 flex flex-col gap-3">
        {routines.map(r => {
          const assignee = r.assigneeId ? getMemberById(r.assigneeId) : null;
          const isExpanded = expanded === r.id;
          const streakColor = r.streak >= 7 ? "var(--sig-done)" : r.streak >= 3 ? "var(--sig-due)" : "var(--t-faint)";

          return (
            <div key={r.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-4"
                style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "start", fontFamily: "var(--font-ui)" }}
                onClick={() => setExpanded(isExpanded ? null : r.id)}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-primary" style={{ fontSize: 15 }}>{r.name}</div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-muted" style={{ fontSize: 12 }}>{r.schedule}{r.time ? ` · ${r.time}` : ""}</span>
                    <span className="badge" style={{ background: `color-mix(in srgb, ${streakColor} 10%, transparent)`, color: streakColor, fontSize: 11 }}>
                      🔥 {r.streak}-day streak
                    </span>
                    {assignee && (
                      <div className="flex items-center gap-1">
                        <div className="avatar" style={{ width: 16, height: 16, background: assignee.avatarColor, fontSize: 7 }}>{assignee.initials}</div>
                        <span className="text-faint" style={{ fontSize: 11 }}>{assignee.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-sig-done-bg text-sig-done" style={{ fontSize: 10 }}>Active</span>
                  <Icon name="chevron_down" size={16} style={{ color: "var(--t-faint)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-line px-5 py-4" style={{ borderColor: "var(--line)" }}>
                  <div className="section-label mb-3" style={{ padding: 0 }}>Steps in this routine</div>
                  <div className="flex flex-col gap-2">
                    {r.taskTitles.map((title, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                        <div className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--line)", color: "var(--t-muted)", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span className="text-primary" style={{ fontSize: 13 }}>{title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="btn btn-sm btn-secondary">Edit routine</button>
                    {!isChild && <button className="btn btn-sm btn-ghost text-sig-over">Delete</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {routines.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>🔄</div>
            <div className="font-bold text-primary" style={{ fontSize: 16 }}>No routines yet</div>
            <div className="text-muted" style={{ fontSize: 13 }}>Routines help you build consistent habits.</div>
            <button className="btn btn-primary mt-2" onClick={ctx.openCreate}><Icon name="plus" size={15} />Create routine</button>
          </div>
        )}
      </div>
    </div>
  );
}
