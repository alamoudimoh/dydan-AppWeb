import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { Task, MEMBERS, getMemberById, formatDate, getTodayTasks, getOverdueTasks } from "../data";

function TaskRow({ task, onOpen, onComplete, compact }: { task: Task; onOpen: () => void; onComplete: (id: string) => void; compact?: boolean }) {
  const isDone = task.status === "done";
  const isOverdue = task.status === "overdue";
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;
  return (
    <div className={`task-row ${isDone ? "done" : ""}`} onClick={onOpen} style={{ padding: compact ? "8px 12px" : "11px 14px" }}>
      <button
        className={`task-check ${isDone ? "checked" : ""}`}
        onClick={e => { e.stopPropagation(); if (!isDone) onComplete(task.id); }}
        aria-label={isDone ? "Completed" : "Mark complete"}
      >
        {isDone && <Icon name="check" size={11} style={{ color: "white" }} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="task-title font-medium" style={{ fontSize: 14, color: isDone ? "var(--t-muted)" : "var(--t-primary)" }}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.category && <span className="badge" style={{ background: `color-mix(in srgb, ${task.categoryColor} 10%, transparent)`, color: task.categoryColor }}>{task.category}</span>}
          {task.dueTime && <span className="text-faint" style={{ fontSize: 11 }}>{task.dueTime}</span>}
          {isOverdue && <span className="text-sig-over font-bold" style={{ fontSize: 11 }}>Overdue</span>}
          {task.subtasks && <span className="text-faint" style={{ fontSize: 11 }}>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} steps</span>}
          {task.isRecurring && <Icon name="repeat" size={11} style={{ color: "var(--t-faint)" }} />}
          {task.points && !isDone && <span className="text-brand font-bold font-mono" style={{ fontSize: 11 }}>+{task.points}pts</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {assignee && <div className="avatar" style={{ width: 22, height: 22, background: assignee.avatarColor, fontSize: 9 }}>{assignee.initials}</div>}
        {task.priority === "high" && !isDone && <Icon name="flag" size={13} style={{ color: "var(--sig-over)" }} />}
      </div>
    </div>
  );
}

export default function TodayScreen({ ctx, tasks, onComplete }: { ctx: AppCtx; tasks: Task[]; onComplete: (id: string) => void }) {
  const [filter, setFilter] = useState<"all" | "mine" | "family">("all");
  const isChild = ctx.persona === "child";
  const isSolo = ctx.persona === "solo";

  const todayBase = getTodayTasks().map(t => tasks.find(x => x.id === t.id) || t);
  const overdue = getOverdueTasks().map(t => tasks.find(x => x.id === t.id) || t);

  const filteredToday = todayBase.filter(t => {
    if (filter === "mine") return t.assigneeId === (isChild ? "liam" : "sarah");
    if (filter === "family") return t.assigneeId !== "sarah";
    return true;
  });

  const done = filteredToday.filter(t => t.status === "done");
  const todo = filteredToday.filter(t => t.status !== "done");
  const totalPoints = done.reduce((a, t) => a + (t.points || 0), 0);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <div className="text-faint" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Friday, 15 August 2026
          </div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Today</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {done.length} of {filteredToday.length} tasks complete
            {totalPoints > 0 && <span className="ms-2 text-brand font-bold">+{totalPoints} pts</span>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={ctx.openCreate}>
          <Icon name="plus" size={14} />New task
        </button>
      </div>

      <div className="px-4 md:px-7">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-faint mb-1.5" style={{ fontSize: 11 }}>
            <span>Daily progress</span>
            <span className="font-bold" style={{ color: "var(--brand)" }}>
              {filteredToday.length ? Math.round((done.length / filteredToday.length) * 100) : 0}%
            </span>
          </div>
          <div className="progress-track" style={{ height: 8 }}>
            <div className="progress-fill done" style={{ width: filteredToday.length ? `${(done.length / filteredToday.length) * 100}%` : "0%" }} />
          </div>
        </div>

        {/* Filter tabs */}
        {!isSolo && !isChild && (
          <div className="flex gap-1 mb-4">
            {(["all", "mine", "family"] as const).map(f => (
              <button key={f} className="btn btn-sm capitalize"
                style={{ background: filter === f ? "var(--brand)" : "var(--surface-2)", color: filter === f ? "var(--brand-contrast)" : "var(--t-muted)", border: "none" }}
                onClick={() => setFilter(f)}>
                {f === "mine" ? "Mine" : f === "family" ? "Household" : "All"}
              </button>
            ))}
          </div>
        )}

        {/* Overdue banner */}
        {overdue.length > 0 && (
          <div className="rounded-lg p-4 mb-4" style={{ background: "var(--sig-over-bg)", border: "1px solid var(--sig-over)", borderRadius: "var(--r-lg)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="error" size={15} style={{ color: "var(--sig-over)" }} />
              <span className="font-bold text-sig-over" style={{ fontSize: 13 }}>Overdue</span>
            </div>
            {overdue.map(t => <TaskRow key={t.id} task={t} onOpen={() => ctx.openTask(t)} onComplete={onComplete} compact />)}
          </div>
        )}

        {/* Todo tasks */}
        {todo.length > 0 && (
          <div className="card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-line flex items-center gap-2" style={{ borderColor: "var(--line)" }}>
              <span className="font-bold text-primary" style={{ fontSize: 14 }}>To do</span>
              <span className="badge bg-surface-2 text-muted">{todo.length}</span>
            </div>
            {todo.map(t => <TaskRow key={t.id} task={t} onOpen={() => ctx.openTask(t)} onComplete={onComplete} />)}
          </div>
        )}

        {/* Done tasks */}
        {done.length > 0 && (
          <div className="card overflow-hidden mb-4" style={{ opacity: 0.9 }}>
            <div className="px-4 py-3 border-b border-line flex items-center gap-2" style={{ borderColor: "var(--line)" }}>
              <Icon name="check" size={14} style={{ color: "var(--sig-done)" }} />
              <span className="font-bold text-primary" style={{ fontSize: 14 }}>Completed</span>
              <span className="badge bg-sig-done-bg text-sig-done">{done.length}</span>
            </div>
            {done.map(t => <TaskRow key={t.id} task={t} onOpen={() => ctx.openTask(t)} onComplete={onComplete} />)}
          </div>
        )}

        {/* Empty state */}
        {filteredToday.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>🎉</div>
            <div className="font-bold text-primary" style={{ fontSize: 18 }}>Nothing due today!</div>
            <div className="text-muted" style={{ fontSize: 14 }}>Enjoy your free time or add something new.</div>
            <button className="btn btn-primary mt-2" onClick={ctx.openCreate}>
              <Icon name="plus" size={15} />Add a task
            </button>
          </div>
        )}

        {/* Household section - family only */}
        {!isSolo && !isChild && (
          <div className="mt-6">
            <div className="section-label mb-2">Household members</div>
            <div className="grid grid-cols-3 gap-3">
              {MEMBERS.map(m => {
                const memberTasks = todayBase.filter(t => t.assigneeId === m.id);
                const memberDone = memberTasks.filter(t => t.status === "done");
                return (
                  <div key={m.id} className="card p-3 text-center">
                    <div className="avatar mx-auto mb-2" style={{ width: 36, height: 36, background: m.avatarColor, fontSize: 13 }}>{m.initials}</div>
                    <div className="font-semibold text-primary" style={{ fontSize: 12 }}>{m.name}</div>
                    <div className="text-faint" style={{ fontSize: 11 }}>{memberDone.length}/{memberTasks.length} done</div>
                    <div className="progress-track mt-1.5" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: memberTasks.length ? `${(memberDone.length / memberTasks.length) * 100}%` : "0%", background: m.avatarColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
