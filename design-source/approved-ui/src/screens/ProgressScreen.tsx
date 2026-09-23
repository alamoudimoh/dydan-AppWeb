import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { MEMBERS, GOALS, ACTIVITY, Task, getMemberById } from "../data";

type Range = "7d" | "30d" | "90d";

const RANGE_LABELS: Record<Range, string> = { "7d": "7 days", "30d": "30 days", "90d": "90 days" };

const CATEGORIES = ["Family", "Cleaning", "School", "Finance", "Health", "Home", "Household", "Shopping", "Pet Care", "Maintenance"];

export default function ProgressScreen({ ctx, tasks }: { ctx: AppCtx; tasks: Task[] }) {
  const [range, setRange] = useState<Range>("30d");

  const doneTasks = tasks.filter(t => t.status === "done");
  const overdueTasks = tasks.filter(t => t.status === "overdue");
  const upcomingTasks = tasks.filter(t => t.status === "upcoming");
  const activeTasks = tasks.filter(t => t.status === "todo");
  const totalTasks = tasks.length;
  const completionRate = totalTasks ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const memberStats = MEMBERS.map(m => ({
    member: m,
    completed: tasks.filter(t => t.assigneeId === m.id && t.status === "done").length,
    assigned: tasks.filter(t => t.assigneeId === m.id).length,
    points: m.points,
    streak: m.streak,
  }));

  const catStats = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const catDone = catTasks.filter(t => t.status === "done");
    return { cat, total: catTasks.length, done: catDone.length };
  }).filter(c => c.total > 0);

  const goalsDone = GOALS.filter(g => g.progress >= g.target).length;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Progress</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>team workload and completion reporting</div>
        </div>
        {/* Range selector */}
        <div className="flex gap-1 p-1 rounded-full" style={{ background: "var(--surface-2)", borderRadius: "var(--r-full)" }}>
          {(["7d", "30d", "90d"] as Range[]).map(r => (
            <button key={r}
              onClick={() => setRange(r)}
              className="px-4 py-1.5 font-semibold"
              style={{
                background: range === r ? "var(--brand)" : "transparent",
                color: range === r ? "var(--brand-contrast)" : "var(--t-muted)",
                border: "none", cursor: "pointer", borderRadius: "var(--r-full)",
                fontSize: 12, fontFamily: "var(--font-ui)", transition: "all 0.15s",
              }}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-7 flex flex-col gap-6">

        {/* Overview stat row */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {[
            { label: "Completed", value: doneTasks.length, icon: "check", color: "var(--sig-done)", bg: "var(--sig-done-bg)" },
            { label: "Active", value: activeTasks.length, icon: "tasks", color: "var(--brand)", bg: "var(--brand-faint)" },
            { label: "Overdue", value: overdueTasks.length, icon: "error", color: "var(--sig-over)", bg: "var(--sig-over-bg)" },
            { label: "Upcoming", value: upcomingTasks.length, icon: "calendar", color: "var(--t-muted)", bg: "var(--surface-2)" },
            { label: "Completion rate", value: `${completionRate}%`, icon: "award", color: "var(--accent)", bg: "var(--accent-bg)" },
            { label: "Goals achieved", value: `${goalsDone}/${GOALS.length}`, icon: "star", color: "var(--sig-flag)", bg: "var(--sig-flag-bg)" },
          ].map(stat => (
            <div key={stat.label} className="card p-4">
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon name={stat.icon} size={16} style={{ color: stat.color }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--t-primary)" }}>{stat.value}</div>
              <div className="text-faint mt-0.5" style={{ fontSize: 11 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Member breakdown */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <div className="font-bold text-primary" style={{ fontSize: 15 }}>Completion by member</div>
            <div className="text-muted mt-0.5" style={{ fontSize: 12 }}>Tasks completed and points earned</div>
          </div>
          <div>
            {memberStats.map((ms, i) => {
              const pct = ms.assigned > 0 ? Math.round((ms.completed / ms.assigned) * 100) : 0;
              const isLast = i === memberStats.length - 1;
              return (
                <div key={ms.member.id} className="px-5 py-4 flex items-center gap-4"
                  style={{ borderBottom: isLast ? "none" : "1px solid var(--line)" }}>
                  <div className="avatar" style={{ width: 38, height: 38, background: ms.member.avatarColor, fontSize: 13 }}>
                    {ms.member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-primary" style={{ fontSize: 14 }}>{ms.member.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted" style={{ fontSize: 12 }}>{ms.completed}/{ms.assigned} tasks</span>
                        <span className="badge" style={{ background: "var(--brand-faint)", color: "var(--brand)", fontWeight: 700 }}>
                          {ms.points} pts
                        </span>
                        <span className="badge" style={{ background: "var(--sig-due-bg)", color: "var(--sig-due)" }}>
                          🔥 {ms.streak}d
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="progress-track flex-1" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: ms.member.avatarColor }} />
                      </div>
                      <span className="text-faint font-semibold" style={{ fontSize: 11, minWidth: 30 }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two columns: Category breakdown + Goals */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Category breakdown */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="font-bold text-primary" style={{ fontSize: 15 }}>By category</div>
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {catStats.map(cs => {
                const pct = cs.total > 0 ? Math.round((cs.done / cs.total) * 100) : 0;
                const catColor = TASKS.find(t => t.category === cs.cat)?.categoryColor || "var(--brand)";
                return (
                  <div key={cs.cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-primary" style={{ fontSize: 13 }}>{cs.cat}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>{cs.done}/{cs.total}</span>
                    </div>
                    <div className="progress-track" style={{ height: 5 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: catColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals progress */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
              <div className="font-bold text-primary" style={{ fontSize: 15 }}>Goals</div>
            </div>
            <div className="px-5 py-3 flex flex-col gap-4">
              {GOALS.map(g => {
                const pct = Math.min(Math.round((g.progress / g.target) * 100), 100);
                const done = g.progress >= g.target;
                return (
                  <div key={g.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 18 }}>{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-primary font-semibold truncate" style={{ fontSize: 13 }}>{g.name}</span>
                          {done && <span className="badge" style={{ background: "var(--sig-done-bg)", color: "var(--sig-done)", fontSize: 10 }}>Done!</span>}
                        </div>
                        <div className="text-faint" style={{ fontSize: 11 }}>{g.progress}/{g.target} {g.unit}</div>
                      </div>
                    </div>
                    <div className="progress-track" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: done ? "var(--sig-done)" : g.color }} />
                    </div>
                  </div>
                );
              })}
              <button className="btn btn-secondary btn-sm mt-1" onClick={() => ctx.navigate("goals")}>
                <Icon name="star" size={13} />View all goals
              </button>
            </div>
          </div>
        </div>

        {/* Workload by time horizon */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <div className="font-bold text-primary" style={{ fontSize: 15 }}>Workload overview</div>
            <div className="text-muted mt-0.5" style={{ fontSize: 12 }}>upcoming task load across the team</div>
          </div>
          <div className="px-5 py-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {[
              { label: "Today", count: tasks.filter(t => t.dueDate === "2026-08-15" && t.status !== "done").length, color: "var(--sig-over)", icon: "clock" },
              { label: "Next 7 days", count: upcomingTasks.slice(0, 4).length, color: "var(--sig-due)", icon: "calendar" },
              { label: "Unassigned", count: tasks.filter(t => !t.assigneeId && t.status !== "done").length, color: "var(--t-muted)", icon: "user" },
              { label: "Overdue", count: overdueTasks.length, color: "var(--sig-over)", icon: "error" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: `color-mix(in srgb, ${item.color} 10%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={item.icon} size={16} style={{ color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-primary)" }}>{item.count}</div>
                  <div className="text-faint" style={{ fontSize: 11 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity summary */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
            <div className="font-bold text-primary" style={{ fontSize: 15 }}>Recent activity</div>
            <button className="btn btn-sm btn-ghost" onClick={() => ctx.navigate("activity")}>
              View all <Icon name="chevron_right" size={13} />
            </button>
          </div>
          <div className="px-5 py-3 flex flex-col gap-2">
            {ACTIVITY.slice(0, 5).map(item => {
              const actor = getMemberById(item.actorId);
              return (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  {actor && <div className="avatar" style={{ width: 24, height: 24, background: actor.avatarColor, fontSize: 9 }}>{actor.initials}</div>}
                  <span className="flex-1 text-muted" style={{ fontSize: 13 }}>{item.text}</span>
                  {item.points != null && (
                    <span className="text-sig-done font-semibold" style={{ fontSize: 12, color: "var(--sig-done)" }}>+{item.points}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
