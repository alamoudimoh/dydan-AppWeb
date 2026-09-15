import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { Task, MEMBERS, getMemberById, formatDate } from "../data";

type GroupBy = "status" | "assignee" | "category" | "priority";
type Filter = "all" | "todo" | "done" | "overdue" | "upcoming";

function TaskRow({ task, onOpen, onComplete }: { task: Task; onOpen: () => void; onComplete: (id: string) => void }) {
  const isDone = task.status === "done";
  const isOverdue = task.status === "overdue";
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;
  const statusColor = isOverdue ? "var(--sig-over)" : isDone ? "var(--sig-done)" : task.status === "upcoming" ? "var(--brand)" : "var(--t-faint)";

  return (
    <div className={`task-row ${isDone ? "done" : ""}`}>
      <button className={`task-check ${isDone ? "checked" : ""}`} aria-label={isDone ? `${task.title} completed` : `Mark ${task.title} complete`} onClick={e => { e.stopPropagation(); if (!isDone) onComplete(task.id); }}>
        {isDone && <Icon name="check" size={11} style={{ color: "white" }} />}
      </button>
      <button className="task-row-open flex-1 min-w-0 text-start" aria-label={`Open task: ${task.title}`} onClick={onOpen}>
        <div className="task-title font-medium text-primary" style={{ fontSize: 14 }}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.category && <span className="badge" style={{ background: `color-mix(in srgb, ${task.categoryColor} 10%, transparent)`, color: task.categoryColor }}>{task.category}</span>}
          {task.dueDate && <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>{formatDate(task.dueDate)}</span>}
          {task.isRecurring && <Icon name="repeat" size={11} style={{ color: "var(--t-faint)" }} />}
          {task.projectId && <Icon name="projects" size={11} style={{ color: "var(--brand)" }} />}
        </div>
      </button>
      {assignee && <div className="avatar flex-shrink-0" style={{ width: 22, height: 22, background: assignee.avatarColor, fontSize: 9 }}>{assignee.initials}</div>}
      {task.priority === "high" && !isDone && <Icon name="flag" size={12} style={{ color: "var(--sig-over)", flexShrink: 0 }} />}
    </div>
  );
}

export default function AllTasksScreen({ ctx, tasks, onComplete }: { ctx: AppCtx; tasks: Task[]; onComplete: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const isChild = ctx.persona === "child";

  const displayTasks = isChild ? tasks.filter(t => t.assigneeId === "liam") : tasks;

  const filtered = displayTasks.filter(t => {
    if (filter === "todo") return t.status === "todo";
    if (filter === "done") return t.status === "done";
    if (filter === "overdue") return t.status === "overdue";
    if (filter === "upcoming") return t.status === "upcoming";
    return true;
  }).filter(t => search ? t.title.toLowerCase().includes(search.toLowerCase()) : true);

  type Group = { key: string; label: string; tasks: Task[] };

  const groups: Group[] = (() => {
    if (groupBy === "status") {
      const order = ["overdue", "todo", "upcoming", "done"];
      const labels: Record<string, string> = { overdue: "Overdue", todo: "To do", upcoming: "Upcoming", done: "Completed" };
      return order.map(s => ({ key: s, label: labels[s], tasks: filtered.filter(t => t.status === s) })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === "assignee") {
      return MEMBERS.map(m => ({ key: m.id, label: m.name, tasks: filtered.filter(t => t.assigneeId === m.id) })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === "category") {
      const cats = [...new Set(filtered.map(t => t.category || "Uncategorized"))];
      return cats.map(c => ({ key: c, label: c, tasks: filtered.filter(t => (t.category || "Uncategorized") === c) }));
    }
    if (groupBy === "priority") {
      return [
        { key: "high", label: "High priority", tasks: filtered.filter(t => t.priority === "high") },
        { key: "medium", label: "Medium priority", tasks: filtered.filter(t => t.priority === "medium") },
        { key: "low", label: "Low priority", tasks: filtered.filter(t => t.priority === "low") },
      ].filter(g => g.tasks.length > 0);
    }
    return [{ key: "all", label: "All tasks", tasks: filtered }];
  })();

  const statusCounts = {
    overdue: displayTasks.filter(t => t.status === "overdue").length,
    todo: displayTasks.filter(t => t.status === "todo").length,
    upcoming: displayTasks.filter(t => t.status === "upcoming").length,
    done: displayTasks.filter(t => t.status === "done").length,
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>All Tasks</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {filtered.length} task{filtered.length !== 1 ? "s" : ""} {search ? `matching "${search}"` : ""}
          </div>
        </div>
        <button className="btn btn-primary" onClick={ctx.openCreate}>
          <Icon name="plus" size={14} />New task
        </button>
      </div>

      <div className="px-4 md:px-7">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {statusCounts.overdue > 0 && (
            <button onClick={() => setFilter("overdue")} className="badge bg-sig-over-bg text-sig-over" style={{ cursor: "pointer", padding: "5px 11px", fontSize: 12 }}>
              {statusCounts.overdue} overdue
            </button>
          )}
          <button onClick={() => setFilter("todo")} className="badge bg-surface-2 text-muted" style={{ cursor: "pointer", padding: "5px 11px", fontSize: 12 }}>
            {statusCounts.todo} to do
          </button>
          <button onClick={() => setFilter("upcoming")} className="badge bg-brand-faint text-brand" style={{ cursor: "pointer", padding: "5px 11px", fontSize: 12 }}>
            {statusCounts.upcoming} upcoming
          </button>
          <button onClick={() => setFilter("done")} className="badge bg-sig-done-bg text-sig-done" style={{ cursor: "pointer", padding: "5px 11px", fontSize: 12 }}>
            {statusCounts.done} done
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Icon name="search" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--t-faint)" }} />
            <input
              className="input"
              style={{ paddingLeft: 34, fontSize: 14 }}
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className={`btn btn-secondary ${showFilters ? "border-brand text-brand" : ""}`} onClick={() => setShowFilters(!showFilters)}>
            <Icon name="bars" size={15} />
            Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-4 mb-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="section-label mb-2" style={{ padding: 0 }}>Status</div>
                <div className="flex flex-wrap gap-1">
                  {(["all", "todo", "overdue", "upcoming", "done"] as Filter[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className="btn btn-sm capitalize"
                      style={{ background: filter === f ? "var(--brand)" : "var(--surface-2)", color: filter === f ? "var(--brand-contrast)" : "var(--t-muted)", border: "none" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {!isChild && (
                <div>
                  <div className="section-label mb-2" style={{ padding: 0 }}>Group by</div>
                  <div className="flex flex-wrap gap-1">
                    {(["status", "assignee", "category", "priority"] as GroupBy[]).map(g => (
                      <button key={g} onClick={() => setGroupBy(g)}
                        className="btn btn-sm capitalize"
                        style={{ background: groupBy === g ? "var(--brand)" : "var(--surface-2)", color: groupBy === g ? "var(--brand-contrast)" : "var(--t-muted)", border: "none" }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Task groups */}
        {groups.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>🔍</div>
            <div className="font-bold text-primary" style={{ fontSize: 16 }}>No tasks found</div>
            <div className="text-muted" style={{ fontSize: 13 }}>{search ? "Try a different search." : "Add your first task to get started."}</div>
            <button className="btn btn-primary mt-2" onClick={ctx.openCreate}>
              <Icon name="plus" size={15} />Add task
            </button>
          </div>
        ) : groups.map(group => (
          <div key={group.key} className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="font-bold text-primary" style={{ fontSize: 13 }}>{group.label}</span>
              <span className="badge bg-surface-2 text-muted" style={{ fontSize: 11 }}>{group.tasks.length}</span>
            </div>
            <div className="card overflow-hidden">
              {group.tasks.map((t, i) => (
                <div key={t.id} style={{ borderBottom: i < group.tasks.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <TaskRow task={t} onOpen={() => ctx.openTask(t)} onComplete={onComplete} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
