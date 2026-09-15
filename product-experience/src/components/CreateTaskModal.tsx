import { useRef, useState } from "react";
import { AppCtx, Icon } from "../App";
import { MEMBERS, Task } from "../data";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";

export default function CreateTaskModal({ ctx, onCreated, taskToEdit }: { ctx: AppCtx; onCreated?: (title: string, details?: Partial<Task>) => void; taskToEdit?: Task }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(ctx.closeCreate, dialogRef);
  const [title, setTitle] = useState(taskToEdit?.title || "");
  const [assigneeId, setAssigneeId] = useState(taskToEdit?.assigneeId || "sarah");
  const [dueDate, setDueDate] = useState(taskToEdit?.dueDate || "2026-08-20");
  const [priority, setPriority] = useState<"medium" | "high">(taskToEdit?.priority === "high" ? "high" : "medium");
  const [category, setCategory] = useState(taskToEdit?.category || "household");
  const [points, setPoints] = useState(taskToEdit?.points || 20);

  const categories = ["household", "personal", "work", "school", "health", "finance"];

  const submit = () => {
    if (!title.trim()) return;
    onCreated?.(title.trim(), { assigneeId, dueDate, priority, category, points });
    ctx.showToast(taskToEdit ? `Task "${title.trim()}" updated` : `"${title.trim()}" added`);
    ctx.closeCreate();
  };

  return (
    <div className="modal-overlay" onMouseDown={ctx.closeCreate}>
      <div ref={dialogRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
          <h2 id="task-dialog-title" className="text-primary font-bold" style={{ fontSize: 18, margin: 0 }}>{taskToEdit ? "Edit task" : "New task"}</h2>
          <button aria-label="Close task dialog" className="btn btn-ghost btn-icon" onClick={ctx.closeCreate}><Icon name="x" size={18} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Title</label>
            <input
              id="task-title" data-dialog-initial-focus
              className="input w-full"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              autoFocus
              style={{ fontSize: 15, padding: "12px 14px" }}
            />
          </div>

          <div className="task-form-grid grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Assigned to</label>
              <div className="flex flex-col gap-2">
                {MEMBERS.map(m => (
                  <button key={m.id}
                    onClick={() => setAssigneeId(m.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      border: `2px solid ${assigneeId === m.id ? "var(--brand)" : "var(--line)"}`,
                      background: assigneeId === m.id ? "var(--brand-faint)" : "var(--surface-2)",
                      borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "var(--font-ui)"
                    }}>
                    <div className="avatar" style={{ width: 22, height: 22, background: m.avatarColor, fontSize: 9 }}>{m.initials}</div>
                    <span className="text-primary" style={{ fontSize: 13 }}>{m.name}</span>
                    {assigneeId === m.id && <Icon name="check" size={12} style={{ color: "var(--brand)", marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Due date */}
              <div>
                <label htmlFor="task-due-date" className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Due date</label>
                <input id="task-due-date" type="date" className="input w-full" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              {/* Priority */}
              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Priority</label>
                <div className="flex gap-2">
                  {(["medium", "high"] as const).map(p => (
                    <button key={p}
                      onClick={() => setPriority(p)}
                      className="flex-1 py-2 rounded-lg font-semibold text-center"
                      style={{
                        border: `2px solid ${priority === p ? (p === "high" ? "var(--sig-flag)" : "var(--brand)") : "var(--line)"}`,
                        background: priority === p ? (p === "high" ? "var(--sig-flag-bg)" : "var(--brand-faint)") : "var(--surface-2)",
                        cursor: "pointer", fontSize: 12, fontFamily: "var(--font-ui)",
                        color: priority === p ? (p === "high" ? "var(--sig-flag)" : "var(--brand)") : "var(--t-muted)"
                      }}>
                      {p === "high" ? "🚩 High" : "Normal"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points */}
              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Points ⭐ {points}</label>
                <input aria-label="Task points" type="range" min={5} max={100} step={5} value={points} onChange={e => setPoints(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--brand)" }} />
                <div className="flex justify-between text-faint" style={{ fontSize: 10 }}><span>5</span><span>100</span></div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c}
                  onClick={() => setCategory(c)}
                  className="badge"
                  style={{
                    cursor: "pointer", fontSize: 12, padding: "5px 12px",
                    background: category === c ? "var(--brand)" : "var(--surface-2)",
                    color: category === c ? "white" : "var(--t-muted)",
                    border: `1px solid ${category === c ? "var(--brand)" : "var(--line)"}`
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button className="btn btn-secondary flex-1" style={{ justifyContent: "center" }} onClick={ctx.closeCreate}>Cancel</button>
          <button
            className="btn btn-primary flex-1"
            style={{ justifyContent: "center" }}
            onClick={submit}
            disabled={!title.trim()}>
            {taskToEdit ? (
              <>
                <Icon name="check" size={14} />Save changes
              </>
            ) : (
              <>
                <Icon name="plus" size={14} />Create task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
