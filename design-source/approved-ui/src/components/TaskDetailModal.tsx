import { AppCtx, Icon } from "../App";
import { Task, getMemberById, formatDate } from "../data";

export default function TaskDetailModal({ task, ctx, onComplete, onDelete, onEdit, onReopen }: { task: Task; ctx: AppCtx; onComplete: (id: string) => void; onDelete: (id: string) => void; onEdit: (t: Task) => void; onReopen: (id: string) => void }) {
  const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;
  const isDone = task.status === "done";
  const isOverdue = task.status === "overdue";

  const statusColor = isDone ? "var(--sig-done)" : isOverdue ? "var(--sig-over)" : task.status === "upcoming" ? "var(--t-muted)" : "var(--sig-due)";
  const statusLabel = isDone ? "Done" : isOverdue ? "Overdue" : task.status === "upcoming" ? "Upcoming" : "To do";

  const handleDelete = () => {
    ctx.showConfirm({
      title: "Delete Task",
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        onDelete(task.id);
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={ctx.closeTask}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
          <button
            onClick={() => !isDone && onComplete(task.id)}
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
              border: `2px solid ${isDone ? "var(--sig-done)" : "var(--line-strong)"}`,
              background: isDone ? "var(--sig-done)" : "transparent",
              cursor: isDone ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            {isDone && <Icon name="check" size={14} style={{ color: "white" }} />}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-primary font-bold" style={{ fontSize: 18, margin: 0, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>{task.title}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="badge" style={{ background: `color-mix(in srgb, ${statusColor} 10%, transparent)`, color: statusColor, fontSize: 11 }}>{statusLabel}</span>
              {task.category && <span className="badge bg-surface-2 text-muted" style={{ fontSize: 11 }}>{task.category}</span>}
              {task.points && <span className="badge bg-brand-faint text-brand" style={{ fontSize: 11 }}>⭐ {task.points} pts</span>}
              {task.priority === "high" && <Icon name="flag" size={13} style={{ color: "var(--sig-flag)" }} />}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={ctx.closeTask}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 border-b border-line flex flex-col gap-3" style={{ borderColor: "var(--line)" }}>
          {task.dueDate && (
            <div className="flex items-center gap-3">
              <Icon name="calendar" size={16} style={{ color: "var(--t-muted)", flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 13 }}>Due</span>
              <span className="font-medium text-primary" style={{ fontSize: 13, color: isOverdue ? "var(--sig-over)" : undefined }}>{formatDate(task.dueDate)}</span>
            </div>
          )}
          {assignee && (
            <div className="flex items-center gap-3">
              <Icon name="user" size={16} style={{ color: "var(--t-muted)", flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 13 }}>Assigned to</span>
              <div className="flex items-center gap-1.5">
                <div className="avatar" style={{ width: 20, height: 20, background: assignee.avatarColor, fontSize: 8 }}>{assignee.initials}</div>
                <span className="font-medium text-primary" style={{ fontSize: 13 }}>{assignee.name}</span>
              </div>
            </div>
          )}
          {task.projectId && (
            <div className="flex items-center gap-3">
              <Icon name="projects" size={16} style={{ color: "var(--t-muted)", flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 13 }}>Project</span>
              <span className="font-medium text-primary" style={{ fontSize: 13 }}>{task.projectId}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="px-6 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
            <div className="section-label mb-2" style={{ padding: 0 }}>Notes</div>
            <div className="text-primary" style={{ fontSize: 14, lineHeight: 1.6 }}>{task.description}</div>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="px-6 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
            <div className="section-label mb-3" style={{ padding: 0 }}>
              Subtasks · {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
            </div>
            <div className="flex flex-col gap-2">
              {task.subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${s.done ? "var(--sig-done)" : "var(--line-strong)"}`, background: s.done ? "var(--sig-done)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {s.done && <Icon name="check" size={10} style={{ color: "white" }} />}
                  </div>
                  <span className="text-primary" style={{ fontSize: 13, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2 flex-wrap">
          {!isDone && (
            <button className="btn btn-primary" onClick={() => { onComplete(task.id); ctx.closeTask(); }}>
              <Icon name="check" size={14} />Mark done
            </button>
          )}
          {isDone && (
            <button className="btn btn-primary" onClick={() => onReopen(task.id)}>
              <Icon name="refresh" size={14} />Reopen
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => onEdit(task)}>
            <Icon name="edit" size={14} />Edit
          </button>
          <button className="btn btn-ghost text-sig-over ms-auto" onClick={handleDelete}>
            <Icon name="trash" size={14} />Delete
          </button>
        </div>
      </div>
    </div>
  );
}
