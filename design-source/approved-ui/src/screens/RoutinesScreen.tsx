import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { ROUTINES, getMemberById, Routine } from "../data";
import IconPicker from "../components/IconPicker";
import MemberPicker from "../components/MemberPicker";
import ThemeSelect from "../components/ThemeSelect";

type FilterMode = "all" | "active" | "inactive";
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;


const SCHEDULES = ["Daily", "Weekdays", "Weekends", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Weekly", "Monthly"];

export default function RoutinesScreen({ ctx }: { ctx: AppCtx }) {
  const [expanded, setExpanded] = useState<string | null>("routine-morning");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [routineItems, setRoutineItems] = useState<Routine[]>(ROUTINES);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set(ROUTINES.filter(r => r.active !== false).map(r => r.id)));
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", icon: "🌅", schedule: "Daily", time: "",
    description: "", requiresApproval: false, pointsPerTask: "10",
    taskTitles: "", assigneeId: "sarah",
  });

  const isChild = ctx.persona === "child";
  const routines = isChild ? routineItems.filter(r => r.assigneeId === "liam") : routineItems;
  const filtered = filter === "active"
    ? routines.filter(r => activeIds.has(r.id))
    : filter === "inactive"
      ? routines.filter(r => !activeIds.has(r.id))
      : routines;

  const toggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); ctx.showToast("Routine deactivated"); }
      else { next.add(id); ctx.showToast("Routine activated"); }
      return next;
    });
  };

  const emptyForm = () => ({
    name: "", icon: "🌅", schedule: "Daily", time: "",
    description: "", requiresApproval: false, pointsPerTask: "10",
    taskTitles: "", assigneeId: "sarah",
  });

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowCreate(true);
  };

  const handleSave = () => {
    const name = form.name.trim();
    const points = Number(form.pointsPerTask);
    if (!name) { ctx.showToast("Please enter a routine name"); return; }
    if (!Number.isFinite(points) || points < 0 || points > 100) {
      ctx.showToast("Points must be between 0 and 100"); return;
    }
    const values = {
      name,
      icon: form.icon,
      schedule: form.schedule,
      time: form.time || undefined,
      description: form.description.trim() || undefined,
      requiresApproval: form.requiresApproval,
      pointsPerTask: points,
      taskTitles: form.taskTitles.split("\n").map(s => s.trim()).filter(Boolean),
      assigneeId: form.assigneeId,
    };
    if (editingId) {
      setRoutineItems(prev => prev.map(r => r.id === editingId ? { ...r, ...values } : r));
      ctx.showToast("Routine modified");
    } else {
      const id = `routine-${makeId()}`;
      setRoutineItems(prev => [...prev, {
        id, ...values, streak: 0,
      }]);
      setActiveIds(prev => new Set([...prev, id]));
      setExpanded(id);
      setFilter("all");
      ctx.showToast("Routine created");
    }
    setForm(emptyForm());
    setShowCreate(false);
    setEditingId(null);
  };

  const handleStartEdit = (routine: Routine, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(routine.id);
    setForm({
      name: routine.name, icon: routine.icon, schedule: routine.schedule,
      time: routine.time ?? "", description: routine.description ?? "",
      requiresApproval: routine.requiresApproval ?? false,
      pointsPerTask: String(routine.pointsPerTask ?? 10),
      taskTitles: routine.taskTitles.join("\n"), assigneeId: routine.assigneeId ?? "",
    });
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inactiveCount = routines.filter(r => !activeIds.has(r.id)).length;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Routines</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Recurring daily and weekly flows</div>
        </div>
        {!isChild && (
          <button className="btn btn-primary" onClick={() => { if (showCreate) { setShowCreate(false); setEditingId(null); } else startNew(); }}>
            {showCreate ? <><Icon name="x" size={14} />Cancel</> : <><Icon name="plus" size={14} />New routine</>}
          </button>
        )}
      </div>

      <div className="px-4 md:px-7">
        {/* New routine panel */}
        {showCreate && (
          <div className="card mb-5">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)", background: "var(--brand-faint)" }}>
              <div className="form-title text-primary" style={{ fontSize: 15 }}>{editingId ? "Modify routine" : "New routine"}</div>
            </div>
            <div className="px-5 py-4 grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="col-span-full">
                <div className="section-label mb-2" style={{ padding: 0 }}>ICON</div>
                <IconPicker value={form.icon} onChange={icon => setForm(f => ({ ...f, icon }))} label="Routine icon" />
              </div>

              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Name</label>
                <input
                  placeholder="e.g. Morning Routine"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input w-full field-md"
                />
              </div>

              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Schedule</label>
                <ThemeSelect label="Schedule" value={form.schedule} options={SCHEDULES.map(value => ({ value, label: value }))}
                  onChange={schedule => setForm(f => ({ ...f, schedule }))} />
              </div>

              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Start time (optional)</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="input w-full field-md"
                />
              </div>

              <div>
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Points per task</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.pointsPerTask}
                  onChange={e => setForm(f => ({ ...f, pointsPerTask: e.target.value }))}
                  className="input w-full field-md"
                />
              </div>

              <div className="col-span-full">
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Description (optional)</label>
                <textarea
                  placeholder="What is this routine for?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="input w-full"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="col-span-full">
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Steps (one per line)</label>
                <textarea
                  value={form.taskTitles}
                  onChange={e => setForm(f => ({ ...f, taskTitles: e.target.value }))}
                  rows={4} className="input w-full"
                  placeholder={"First step\\nSecond step"}
                  style={{ fontFamily: "var(--font-ui)", whiteSpace: "pre-wrap" }}
                />
              </div>
              <div className="col-span-full">
                <label className="section-label" style={{ padding: "0 0 6px", display: "block" }}>Assigned to</label>
                <MemberPicker value={form.assigneeId} allowUnassigned
                  onChange={id => setForm(f => ({ ...f, assigneeId: id }))} />
              </div>
              <div className="col-span-full flex items-center gap-2">
                <input type="checkbox" id="approval" checked={form.requiresApproval}
                  onChange={e => setForm(f => ({ ...f, requiresApproval: e.target.checked }))}
                  style={{ width: 16, height: 16 }} />
                <label htmlFor="approval" className="text-primary" style={{ fontSize: 14 }}>Require approval on completion</label>
              </div>
            </div>
            <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: "var(--line)" }}>
              <button className="btn btn-primary" onClick={handleSave}>{editingId ? "Save changes" : "Create routine"}</button>
              <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditingId(null); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filter + stats row */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex gap-2">
            {([
              { id: "all" as FilterMode, label: `All (${routines.length})` },
              { id: "active" as FilterMode, label: `Active (${routines.length - inactiveCount})` },
              ...(inactiveCount > 0 ? [{ id: "inactive" as FilterMode, label: `Inactive (${inactiveCount})` }] : []),
            ]).map(f => (
              <button key={f.id} className={`btn btn-sm ${filter === f.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-faint" style={{ fontSize: 12 }}>
            {routines.reduce((sum, r) => sum + r.streak, 0)} total streak days across all routines
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const assignee = r.assigneeId ? getMemberById(r.assigneeId) : null;
            const isExpanded = expanded === r.id;
            const isActive = activeIds.has(r.id);
            const streakColor = r.streak >= 7 ? "var(--sig-done)" : r.streak >= 3 ? "var(--sig-due)" : "var(--t-faint)";

            return (
              <div key={r.id} className="card overflow-hidden" style={{ opacity: isActive ? 1 : 0.65 }}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-4 px-5 py-4"
                  style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "start", fontFamily: "var(--font-ui)" }}
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setExpanded(isExpanded ? null : r.id); } }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold text-primary" style={{ fontSize: 15 }}>{r.name}</div>
                      {!isActive && <span className="badge" style={{ background: "var(--surface-2)", color: "var(--t-muted)", fontSize: 10 }}>Inactive</span>}
                    </div>
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
                    {!isChild && (
                      <button
                        className="btn btn-sm"
                        style={{
                          background: isActive ? "var(--sig-done-bg)" : "var(--surface-2)",
                          color: isActive ? "var(--sig-done)" : "var(--t-muted)",
                          fontSize: 11, padding: "3px 10px",
                        }}
                        onClick={e => toggleActive(r.id, e)}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </button>
                    )}
                    <Icon name="chevron_down" size={16} style={{ color: "var(--t-faint)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-5 py-4" style={{ borderColor: "var(--line)" }}>
                      {/* ── Steps view ── */}
                      <div>
                        <div className="section-label mb-3" style={{ padding: 0 }}>Steps in this routine</div>
                        <div className="flex flex-col gap-2 mb-4">
                          {r.taskTitles.map((title, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                              <div className="flex items-center justify-center font-bold" style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--line)", color: "var(--t-muted)", fontSize: 11, flexShrink: 0 }}>
                                {i + 1}
                              </div>
                              <span className="text-primary flex-1" style={{ fontSize: 13 }}>{title}</span>
                            </div>
                          ))}
                        </div>
                        {!isChild && (
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-secondary" onClick={e => handleStartEdit(r, e)}>Modify routine</button>
                            <button className="btn btn-sm btn-ghost" onClick={e => toggleActive(r.id, e)}>
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button className="btn btn-sm btn-ghost" style={{ color: "var(--sig-over)" }}
                              onClick={() => ctx.showConfirm({ title: "Delete routine?", message: `"${r.name}" and all its steps will be permanently deleted.`, danger: true, confirmLabel: "Delete", onConfirm: () => { setRoutineItems(prev => prev.filter(item => item.id !== r.id)); setActiveIds(prev => { const next = new Set(prev); next.delete(r.id); return next; }); setExpanded(null); ctx.showToast("Routine deleted"); } })}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>🔄</div>
              <div className="font-bold text-primary" style={{ fontSize: 16 }}>
                {filter === "inactive" ? "No inactive routines" : "No routines yet"}
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>Routines help you build consistent habits.</div>
              {!isChild && <div className="text-faint" style={{ fontSize: 12 }}>Use new routine at the top to get started.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
