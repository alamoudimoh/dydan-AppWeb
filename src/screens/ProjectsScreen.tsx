import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { PROJECTS, TASKS, getMemberById } from "../data";

export default function ProjectsScreen({ ctx }: { ctx: AppCtx }) {
  const [selected, setSelected] = useState<string | null>(null);
  const isChild = ctx.persona === "child";
  const projects = isChild ? PROJECTS.filter(p => p.owner === "liam") : PROJECTS;
  const selectedProject = selected ? projects.find(p => p.id === selected) : null;
  const projectTasks = selectedProject ? TASKS.filter(t => t.projectId === selectedProject.id) : [];

  const statusColor = (status: string) => {
    if (status === "active") return "var(--sig-done)";
    if (status === "paused") return "var(--sig-due)";
    return "var(--t-faint)";
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Projects</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Organized work with multiple tasks</div>
        </div>
        <button className="btn btn-primary" onClick={ctx.openCreate}><Icon name="plus" size={14} />New project</button>
      </div>

      <div className="px-4 md:px-7">
        <div className="grid gap-4" style={{ gridTemplateColumns: selected ? "1fr 1fr" : "1fr 1fr 1fr" }}>
          {projects.map(p => {
            const owner = getMemberById(p.owner);
            const taskCount = TASKS.filter(t => t.projectId === p.id).length;
            const isSelected = selected === p.id;
            return (
              <div key={p.id} className="card p-5 cursor-pointer" style={{ border: isSelected ? `2px solid ${p.color}` : "1px solid var(--line)" }} onClick={() => setSelected(isSelected ? null : p.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div style={{ width: 36, height: 36, borderRadius: "var(--r-md)", background: `color-mix(in srgb, ${p.color} 13%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="projects" size={18} style={{ color: p.color }} />
                  </div>
                  <span className="badge" style={{ background: `color-mix(in srgb, ${statusColor(p.status)} 10%, transparent)`, color: statusColor(p.status), fontSize: 10 }}>{p.status}</span>
                </div>
                <div className="font-bold text-primary mb-1" style={{ fontSize: 14 }}>{p.name}</div>
                <div className="text-muted mb-4" style={{ fontSize: 12 }}>{p.description}</div>
                <div className="flex justify-between text-faint mb-2" style={{ fontSize: 11 }}>
                  <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
                  <span className="font-bold" style={{ color: p.color }}>{p.progress}%</span>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                </div>
                {p.dueDate && (
                  <div className="flex items-center gap-1 mt-3 text-faint" style={{ fontSize: 11 }}>
                    <Icon name="calendar" size={11} />
                    Due {p.dueDate}
                  </div>
                )}
                {owner && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="avatar" style={{ width: 18, height: 18, background: owner.avatarColor, fontSize: 7 }}>{owner.initials}</div>
                    <span className="text-faint" style={{ fontSize: 11 }}>{owner.name}</span>
                  </div>
                )}
              </div>
            );
          })}
          {!isChild && (
            <button className="card p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed cursor-pointer hover:border-brand" style={{ borderColor: "var(--line)", minHeight: 160, borderStyle: "dashed" }} onClick={ctx.openCreate}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="plus" size={22} style={{ color: "var(--brand)" }} />
              </div>
              <span className="text-brand font-semibold" style={{ fontSize: 13 }}>New project</span>
            </button>
          )}
        </div>

        {/* Selected project detail */}
        {selectedProject && (
          <div className="card mt-5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 10, height: 10, borderRadius: "var(--r-xs)", background: selectedProject.color }} />
                <div className="font-bold text-primary" style={{ fontSize: 16 }}>{selectedProject.name}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="py-1">
              {projectTasks.length === 0 ? (
                <div className="empty-state py-10">
                  <div style={{ fontSize: 32 }}>📋</div>
                  <div className="font-bold text-primary">No tasks yet</div>
                  <button className="btn btn-primary mt-3" onClick={ctx.openCreate}><Icon name="plus" size={14} />Add task</button>
                </div>
              ) : projectTasks.map(t => (
                <div key={t.id} className="task-row" onClick={() => ctx.openTask(t)}>
                  <div className={`task-check ${t.status === "done" ? "checked" : ""}`}>
                    {t.status === "done" && <Icon name="check" size={11} style={{ color: "white" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-primary font-medium" style={{ fontSize: 14, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</div>
                    {t.subtasks && <div className="text-faint" style={{ fontSize: 11, marginTop: 2 }}>{t.subtasks.filter(s => s.done).length}/{t.subtasks.length} subtasks</div>}
                  </div>
                  {t.dueDate && <span className="text-faint" style={{ fontSize: 11 }}>{t.dueDate}</span>}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-line" style={{ borderColor: "var(--line)" }}>
              <button className="btn btn-secondary btn-sm" onClick={ctx.openCreate}><Icon name="plus" size={13} />Add task</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
