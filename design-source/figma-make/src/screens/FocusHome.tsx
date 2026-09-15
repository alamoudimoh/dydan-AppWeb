import { AppCtx, Icon } from "../App";
import { Task, MEMBERS, PROJECTS, ROUTINES, ACTIVITY, GOALS, getMemberById, formatDate, formatTimestamp, getTodayTasks, getOverdueTasks } from "../data";

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
        <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}>
          <Icon name={icon} size={15} />
        </div>
      </div>
      <div className="font-bold text-primary" style={{ fontSize: 28, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value}</div>
      {sub && <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function TaskRow({ task, onClick, onComplete }: { task: Task; onClick: () => void; onComplete: (id: string) => void }) {
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;
  const statusColor = task.status === "overdue" ? "var(--sig-over)" : task.status === "done" ? "var(--sig-done)" : "var(--t-faint)";
  const isDone = task.status === "done";
  return (
    <div className={`task-row ${isDone ? "done" : ""}`}>
      <button
        className={`task-check ${isDone ? "checked" : ""}`}
        onClick={e => { e.stopPropagation(); if (!isDone) onComplete(task.id); }}
        aria-label={isDone ? "Completed" : "Mark complete"}
      >
        {isDone && <Icon name="check" size={11} style={{ color: "white" }} />}
      </button>
      <button className="task-row-open flex-1 min-w-0 text-start" aria-label={`Open task: ${task.title}`} onClick={onClick}>
        <div className="task-title text-primary font-medium" style={{ fontSize: 14 }}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.category && (
            <span className="badge" style={{ background: `color-mix(in srgb, ${task.categoryColor} 10%, transparent)`, color: task.categoryColor }}>{task.category}</span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{formatDate(task.dueDate)}</span>
          )}
          {task.isRecurring && <Icon name="repeat" size={11} style={{ color: "var(--t-faint)" }} />}
        </div>
      </button>
      {assignee && (
        <div className="avatar flex-shrink-0" style={{ width: 24, height: 24, background: assignee.avatarColor, fontSize: 9 }}>
          {assignee.initials}
        </div>
      )}
      {task.priority === "high" && !isDone && (
        <Icon name="flag" size={13} style={{ color: "var(--sig-over)", flexShrink: 0 }} />
      )}
    </div>
  );
}

function WorkloadRow({ member, max }: { member: typeof MEMBERS[0]; max: number }) {
  const pct = Math.round((member.tasksCompleted / max) * 100);
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="avatar" style={{ width: 28, height: 28, background: member.avatarColor, fontSize: 10 }}>{member.initials}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-primary font-medium" style={{ fontSize: 13 }}>{member.name}</span>
          <span className="text-faint font-mono" style={{ fontSize: 11 }}>{member.tasksCompleted}/{member.tasksAssigned + member.tasksCompleted}</span>
        </div>
        <div className="progress-track" style={{ height: 5 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: member.avatarColor }} />
        </div>
      </div>
    </div>
  );
}

export default function FocusHome({ ctx, tasks, isSolo, onComplete }: { ctx: AppCtx; tasks: Task[]; isSolo: boolean; onComplete: (id: string) => void }) {
  const currentUser = MEMBERS.find(m => m.isCurrentUser)!;
  const todayTasks = getTodayTasks().map(t => tasks.find(x => x.id === t.id) || t);
  const overdue = getOverdueTasks().map(t => tasks.find(x => x.id === t.id) || t);
  const myTasks = todayTasks.filter(t => t.assigneeId === currentUser.id);
  const done = myTasks.filter(t => t.status === "done");
  const upcoming = tasks.filter(t => t.status === "upcoming").slice(0, 4);
  const maxCompleted = Math.max(...MEMBERS.map(m => m.tasksCompleted));
  const activeGoal = GOALS[0];

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Hero greeting */}
      <div className="page-header pb-6">
        <div>
          <div className="text-faint" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Friday, 15 August 2026
          </div>
          <h1 className="text-primary" style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Good morning, {currentUser.name}
          </h1>
          <p className="text-muted" style={{ fontSize: 14, margin: "6px 0 0" }}>
            {overdue.length > 0 ? `${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue — let's clear them first.` : `You're on track. ${done.length} of ${myTasks.length} tasks done today.`}
          </p>
        </div>
        <button className="btn btn-secondary hidden md:flex" onClick={ctx.openCreate}>
          <Icon name="plus" size={15} />
          New task
        </button>
      </div>

      <div className="px-4 md:px-7">
        {/* Stats row */}
        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <StatCard label="Done today" value={`${done.length}/${myTasks.length}`} sub="your tasks" color="var(--sig-done)" icon="check" />
          <StatCard label="Overdue" value={overdue.length} sub="need attention" color="var(--sig-over)" icon="error" />
          <StatCard label="Upcoming" value={upcoming.length} sub="next 7 days" color="var(--brand)" icon="calendar" />
          {!isSolo && <StatCard label="House streak" value={`${MEMBERS.find(m => m.isCurrentUser)!.streak}d`} sub="consecutive days" color="var(--accent-text)" icon="fire" />}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="mb-5 rounded-lg p-4 flex items-start gap-3" style={{ background: "var(--sig-over-bg)", border: "1px solid var(--sig-over)", borderRadius: "var(--r-lg)" }}>
            <Icon name="error" size={18} style={{ color: "var(--sig-over)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="font-bold" style={{ fontSize: 14, color: "var(--sig-over)" }}>
                {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}
              </div>
              {overdue.map(t => (
                <div key={t.id} className="flex items-center gap-1 mt-1" style={{ fontSize: 13, color: "var(--sig-over)" }}>
                  <span>•</span> {t.title}
                  <span className="text-faint ms-1" style={{ fontSize: 11 }}>{t.dueDate && formatDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="focus-home-grid grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Left: Today's tasks */}
          <div className="flex flex-col gap-6">
            {/* Today section */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
                <div>
                  <div className="font-bold text-primary" style={{ fontSize: 15 }}>Today</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{done.length} of {myTasks.length} completed</div>
                </div>
                <div className="progress-track" style={{ height: 6, width: 80 }}>
                  <div className="progress-fill done" style={{ width: myTasks.length ? `${Math.round((done.length / myTasks.length) * 100)}%` : "0%" }} />
                </div>
              </div>
              <div className="py-1">
                {myTasks.length === 0 ? (
                  <div className="empty-state py-10">
                    <div style={{ fontSize: 32 }}>🎉</div>
                    <div className="font-bold text-primary">All done for today!</div>
                  </div>
                ) : myTasks.map(t => (
                  <TaskRow key={t.id} task={t} onClick={() => ctx.openTask(t)} onComplete={onComplete} />
                ))}
              </div>
              <div className="px-4 py-3 border-t border-line" style={{ borderColor: "var(--line)" }}>
                <button className="btn btn-ghost btn-sm text-brand w-full" onClick={() => ctx.navigate("today")}>
                  View all today →
                </button>
              </div>
            </div>

            {/* Upcoming */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
                <div className="font-bold text-primary" style={{ fontSize: 15 }}>Coming up</div>
              </div>
              <div className="py-1">
                {upcoming.map(t => (
                  <TaskRow key={t.id} task={t} onClick={() => ctx.openTask(t)} onComplete={onComplete} />
                ))}
              </div>
              <div className="px-4 py-3 border-t border-line" style={{ borderColor: "var(--line)" }}>
                <button className="btn btn-ghost btn-sm text-brand w-full" onClick={() => ctx.navigate("calendar")}>
                  Open calendar →
                </button>
              </div>
            </div>
          </div>

          {/* Right: Household + goals */}
          <div className="flex flex-col gap-6">
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New task", icon: "plus", action: () => ctx.openCreate() },
                { label: "Shopping", icon: "shopping", action: () => ctx.navigate("shopping") },
                { label: "Calendar", icon: "calendar", action: () => ctx.navigate("calendar") },
                { label: "Routines", icon: "routines", action: () => ctx.navigate("routines") },
              ].map(a => (
                <button key={a.label} className="btn btn-secondary flex flex-col gap-1" style={{ height: 64, borderRadius: "var(--r-lg)", fontSize: 12 }} onClick={a.action}>
                  <Icon name={a.icon} size={18} style={{ color: "var(--brand)" }} />
                  {a.label}
                </button>
              ))}
            </div>

            {/* Family goal */}
            {!isSolo && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-primary" style={{ fontSize: 14 }}>Family goal</div>
                  <span style={{ fontSize: 20 }}>{activeGoal.emoji}</span>
                </div>
                <div className="text-primary font-semibold mb-1" style={{ fontSize: 13 }}>{activeGoal.name}</div>
                <div className="flex justify-between text-faint mb-2" style={{ fontSize: 12 }}>
                  <span>{activeGoal.progress} of {activeGoal.target} {activeGoal.unit}</span>
                  <span className="font-bold" style={{ color: "var(--brand)" }}>{Math.round((activeGoal.progress / activeGoal.target) * 100)}%</span>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${(activeGoal.progress / activeGoal.target) * 100}%` }} />
                </div>
                {activeGoal.reward && (
                  <div className="flex items-center gap-1 mt-3 text-faint" style={{ fontSize: 12 }}>
                    <Icon name="gift" size={12} style={{ color: "var(--sig-flag)" }} />
                    Reward: {activeGoal.reward}
                  </div>
                )}
              </div>
            )}

            {/* Workload (family only) */}
            {!isSolo && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-primary" style={{ fontSize: 14 }}>Household workload</div>
                  <button className="btn btn-ghost btn-sm text-brand" style={{ fontSize: 11 }} onClick={() => ctx.navigate("activity")}>Details</button>
                </div>
                {MEMBERS.map(m => <WorkloadRow key={m.id} member={m} max={maxCompleted} />)}
              </div>
            )}

            {/* Active projects */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-primary" style={{ fontSize: 14 }}>Active projects</div>
                <button className="btn btn-ghost btn-sm text-brand" style={{ fontSize: 11 }} onClick={() => ctx.navigate("projects")}>All projects</button>
              </div>
              {PROJECTS.filter(p => p.status === "active").map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-line" style={{ borderColor: "var(--line)" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "var(--r-xs)", background: p.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium truncate" style={{ fontSize: 13 }}>{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="progress-track flex-1" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                      </div>
                      <span className="text-faint font-mono" style={{ fontSize: 10 }}>{p.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm w-full mt-2 text-brand" onClick={ctx.openCreate}>
                <Icon name="plus" size={13} /> New project
              </button>
            </div>

            {/* Recent activity */}
            {!isSolo && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-primary" style={{ fontSize: 14 }}>Recent activity</div>
                  <button className="btn btn-ghost btn-sm text-brand" style={{ fontSize: 11 }} onClick={() => ctx.navigate("activity")}>See all</button>
                </div>
                {ACTIVITY.slice(0, 4).map(a => {
                  const actor = getMemberById(a.actorId);
                  return (
                    <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-line" style={{ borderColor: "var(--line)" }}>
                      <div className="avatar" style={{ width: 26, height: 26, background: actor?.avatarColor || "var(--brand)", fontSize: 9, flexShrink: 0 }}>
                        {actor?.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-primary" style={{ fontSize: 12 }}>{a.text}</div>
                        <div className="text-faint" style={{ fontSize: 10 }}>{formatTimestamp(a.timestamp)}</div>
                      </div>
                      {a.points && <span className="text-brand font-bold font-mono" style={{ fontSize: 11 }}>+{a.points}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
