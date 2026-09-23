import { useState } from "react";
import { AppCtx, Icon } from "../App";
import IconPicker from "../components/IconPicker";
import MemberPicker from "../components/MemberPicker";
import DateField from "../components/DateField";
import ThemeSelect from "../components/ThemeSelect";
import { MAINTENANCE_ITEMS, METERS, THINGS, MaintenanceItem, Meter, Thing, getMemberById, formatDate } from "../data";

type TabId = "assets" | "meters" | "things";
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
type Editor = { kind: TabId; id: string | null } | null;
type ItemForm = {
  name: string; icon: string; description: string; category: string;
  intervalDays: string; nextDue: string; assigneeId: string;
  unit: string; currentReading: string; reminderDays: string; notes: string;
  type: Thing["type"]; state: string;
};
const isoToday = () => new Date().toLocaleDateString("en-CA");
const formatMaintenanceTimestamp = (date: string) => new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};
const statusForDue = (date: string): MaintenanceItem["status"] => {
  const gap = (new Date(`${date}T12:00:00Z`).getTime() - new Date(`${isoToday()}T12:00:00Z`).getTime()) / 86400000;
  return gap < 0 ? "overdue" : gap <= 7 ? "due-soon" : "ok";
};
const blankForm = (): ItemForm => ({
  name: "", icon: "🔧", description: "", category: "Home",
  intervalDays: "30", nextDue: isoToday(), assigneeId: "",
  unit: "", currentReading: "0", reminderDays: "30", notes: "",
  type: "toggle", state: "off",
});

const statusColor = (s: string) => s === "overdue" ? "var(--sig-over)" : s === "due-soon" ? "var(--sig-due)" : "var(--sig-done)";
const statusBg = (s: string) => s === "overdue" ? "var(--sig-over-bg)" : s === "due-soon" ? "var(--sig-due-bg)" : "var(--sig-done-bg)";
const statusLabel = (s: string) => s === "overdue" ? "Overdue" : s === "due-soon" ? "Due soon" : "OK";

export default function MaintenanceScreen({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<TabId>("assets");
  const [assets, setAssets] = useState<MaintenanceItem[]>(MAINTENANCE_ITEMS);
  const [meters, setMeters] = useState<Meter[]>(METERS);
  const [things, setThings] = useState<Thing[]>(THINGS);
  const [inactive, setInactive] = useState<Set<string>>(new Set());
  const [expandedThing, setExpandedThing] = useState<string | null>(null);
  const [expandedMeter, setExpandedMeter] = useState<string | null>(null);
  const [readingInputs, setReadingInputs] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Editor>(null);
  const [form, setForm] = useState<ItemForm>(blankForm);

  const field = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openNew = (kind: TabId) => {
    setForm(blankForm());
    setTab(kind);
    setEditor({ kind, id: null });
  };

  const openModify = (kind: TabId, id: string) => {
    const draft = blankForm();
    if (kind === "assets") {
      const item = assets.find(a => a.id === id);
      if (!item) return;
      Object.assign(draft, {
        name: item.name, icon: item.icon, description: item.description ?? "",
        category: item.category, intervalDays: String(item.intervalDays),
        nextDue: item.nextDue, assigneeId: item.assigneeId ?? "",
      });
    } else if (kind === "meters") {
      const item = meters.find(m => m.id === id);
      if (!item) return;
      Object.assign(draft, {
        name: item.name, icon: item.icon, unit: item.unit,
        currentReading: String(item.currentReading), reminderDays: String(item.reminderDays),
        nextDue: item.nextDue, notes: item.notes ?? "",
        assigneeId: item.assigneeId ?? "",
      });
    } else {
      const item = things.find(t => t.id === id);
      if (!item) return;
      Object.assign(draft, { name: item.name, icon: item.icon, category: item.category ?? "",
        type: item.type, state: item.state });
    }
    setTab(kind);
    setForm(draft);
    setEditor({ kind, id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveItem = () => {
    if (!editor) return;
    const name = form.name.trim();
    if (!name) { ctx.showToast("Name is required"); return; }
    if (editor.kind === "assets") {
      const days = Number(form.intervalDays);
      if (!Number.isInteger(days) || days < 1 || !form.nextDue) {
        ctx.showToast("Provide a valid next due date and interval"); return;
      }
      const old = assets.find(a => a.id === editor.id);
      const item: MaintenanceItem = {
        id: old?.id ?? `asset-${makeId()}`,
        name, description: form.description.trim(), icon: form.icon || "🔧",
        category: form.category.trim() || "Other", intervalDays: days,
        nextDue: form.nextDue, assigneeId: form.assigneeId || undefined,
        status: statusForDue(form.nextDue), lastDone: old?.lastDone,
      };
      setAssets(prev => old ? prev.map(a => a.id === item.id ? item : a) : [...prev, item]);
    } else if (editor.kind === "meters") {
      const value = Number(form.currentReading);
      const days = Number(form.reminderDays);
      if (!form.unit.trim() || !Number.isFinite(value) || value < 0 || !Number.isInteger(days) || days < 1 || !form.nextDue) {
        ctx.showToast("Provide valid units, reading, reminder days, and next due date"); return;
      }
      const old = meters.find(m => m.id === editor.id);
      const changedReading = old != null && old.currentReading !== value;
      const item: Meter = {
        id: old?.id ?? `meter-${makeId()}`,
        name, icon: form.icon || "📟", unit: form.unit.trim(),
        currentReading: value, previousReading: changedReading ? old.currentReading : old?.previousReading,
        lastUpdated: changedReading || !old ? isoToday() : old.lastUpdated,
        reminderDays: days, nextDue: form.nextDue, status: statusForDue(form.nextDue),
        assigneeId: form.assigneeId || undefined, notes: form.notes.trim() || undefined,
      };
      setMeters(prev => old ? prev.map(m => m.id === item.id ? item : m) : [...prev, item]);
    } else {
      if (!form.state.trim()) { ctx.showToast("State is required"); return; }
      const old = things.find(t => t.id === editor.id);
      const now = new Date().toISOString();
      const state = form.state.trim();
      const updatedState = old == null || old.state !== state;
      const item: Thing = {
        id: old?.id ?? `thing-${makeId()}`,
        name, icon: form.icon || "⚙️", type: form.type, state,
        category: form.category.trim() || "Other",
        lastChanged: updatedState ? now : old?.lastChanged ?? now,
        history: updatedState ? [{ value: state, at: now }, ...(old?.history ?? [])] : old?.history ?? [],
      };
      setThings(prev => old ? prev.map(t => t.id === item.id ? item : t) : [...prev, item]);
    }
    ctx.showToast(editor.id ? "Item modified" : "Item created");
    setEditor(null);
  };

  const changeActive = (id: string, name: string) => {
    const shouldDeactivate = !inactive.has(id);
    if (shouldDeactivate) {
      ctx.showConfirm({
        title: `Deactivate ${name}?`,
        message: "The item will remain in the list but actions and reminders will be paused.",
        confirmLabel: "Deactivate",
        onConfirm: () => { setInactive(prev => new Set([...prev, id])); ctx.showToast("Item deactivated"); },
      });
    } else {
      setInactive(prev => { const next = new Set(prev); next.delete(id); return next; });
      ctx.showToast("Item activated");
    }
  };

  const deleteItem = (kind: TabId, id: string, name: string) => {
    ctx.showConfirm({
      title: `Delete ${name}?`,
      message: "This item will be permanently removed from this preview.",
      confirmLabel: "Delete", danger: true,
      onConfirm: () => {
        if (kind === "assets") setAssets(prev => prev.filter(a => a.id !== id));
        if (kind === "meters") setMeters(prev => prev.filter(m => m.id !== id));
        if (kind === "things") setThings(prev => prev.filter(t => t.id !== id));
        setInactive(prev => { const next = new Set(prev); next.delete(id); return next; });
        setExpandedThing(prev => prev === id ? null : prev);
        setExpandedMeter(prev => prev === id ? null : prev);
        setEditor(prev => prev?.id === id ? null : prev);
        ctx.showToast("Item deleted");
      },
    });
  };

  const markDone = (id: string) => {
    if (inactive.has(id)) return;
    const today = isoToday();
    setAssets(prev => prev.map(a => a.id === id ? {
      ...a, lastDone: today, nextDue: addDays(today, a.intervalDays), status: "ok",
    } : a));
    ctx.showToast("Asset marked done");
  };

  const saveReading = (meter: Meter) => {
    if (inactive.has(meter.id)) return;
    const raw = readingInputs[meter.id];
    const value = Number(raw);
    if (raw == null || raw.trim() === "" || !Number.isFinite(value) || value < 0) {
      ctx.showToast("Enter a valid meter reading"); return;
    }
    const today = isoToday();
    setMeters(prev => prev.map(m => m.id === meter.id ? {
      ...m, previousReading: m.currentReading, currentReading: value, lastUpdated: today,
      nextDue: addDays(today, m.reminderDays), status: "ok",
    } : m));
    setReadingInputs(prev => ({ ...prev, [meter.id]: "" }));
    ctx.showToast("Reading saved");
  };

  const toggleThing = (id: string) => {
    if (inactive.has(id)) return;
    const thing = things.find(t => t.id === id);
    if (!thing) return;
    if (thing.type !== "toggle") { ctx.showToast("Use Modify to change this state"); return; }
    const current = thing.state;
    const next = current === "on" || current === "yes" || current === "locked"
      ? current === "locked" ? "unlocked" : current === "yes" ? "no" : "off"
      : current === "unlocked" ? "locked" : current === "no" ? "yes" : "on";
    const now = new Date().toISOString();
    setThings(prev => prev.map(t => t.id === id ? {
      ...t, state: next, lastChanged: now, history: [{ value: next, at: now }, ...t.history],
    } : t));
    ctx.showToast(`Updated to ${next}`);
  };

  const alertCount = assets.filter(a => !inactive.has(a.id) && a.status !== "ok").length
    + meters.filter(m => !inactive.has(m.id) && m.status !== "ok").length;

  const thingStateColor = (state: string) => {
    if (["on", "yes", "locked", "clean", "running"].includes(state)) return "var(--sig-done)";
    if (["off", "no", "unlocked", "dirty"].includes(state)) return "var(--t-muted)";
    return "var(--brand)";
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Maintenance</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Assets, meters, and smart-home things</div>
        </div>
        <button className="btn btn-primary" onClick={() => openNew(tab)}>
          <Icon name="plus" size={14} />
          {tab === "assets" ? "New asset" : tab === "meters" ? "New meter" : "New thing"}
        </button>
      </div>

      <div className="px-4 md:px-7">
        {editor && (
          <div className="card p-5 mb-5" role="region" aria-label={editor.id ? "Modify item" : "New item"}>
            <div className="flex items-center justify-between mb-4">
              <div className="form-title text-primary" style={{ fontSize: 16 }}>
                {editor.id ? "Modify" : "New"} {editor.kind === "assets" ? "asset" : editor.kind === "meters" ? "meter" : "thing"}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditor(null)} aria-label="Close form">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {([
                ["name", "Name", "text"], ["icon", "Icon", "text"],
                ...(editor.kind === "assets" ? [
                  ["description", "Description", "text"], ["category", "Category", "text"],
                  ["intervalDays", "Interval (days)", "number"], ["nextDue", "Next due", "date"],
                ] : editor.kind === "meters" ? [
                  ["unit", "Unit", "text"], ["currentReading", "Current reading", "number"],
                  ["reminderDays", "Reminder (days)", "number"], ["nextDue", "Next due", "date"],
                  ["notes", "Notes", "text"],
                ] : [
                  ["category", "Category", "text"], ["state", "State", "text"],
                ]),
              ] as Array<[keyof ItemForm, string, string]>).map(([key, label, type]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="section-label" style={{ padding: 0 }}>{label}</label>
                  {key === "icon"
                    ? <IconPicker value={form.icon} label="Maintenance icon" onChange={icon => field("icon", icon)} />
                    : type === "date"
                    ? <DateField value={form.nextDue} label="Next due date" onChange={date => field("nextDue", date)} />
                    : <input className="input" type={type} value={form[key]}
                        min={type === "number" ? "0" : undefined}
                        step={key === "currentReading" ? "any" : undefined}
                        onChange={e => field(key, e.target.value)}
                        style={{ fontFamily: "var(--font-ui)", color: "var(--t-primary)" }} />}
                </div>
              ))}
              {editor.kind === "things" && (
                <div className="flex flex-col gap-1.5">
                  <span className="section-label" style={{ padding: 0 }}>TYPE</span>
                  <ThemeSelect label="Thing type" value={form.type}
                    onChange={value => field("type", value as Thing["type"])}
                    options={[
                      { value: "toggle", label: "Toggle" },
                      { value: "numeric", label: "Numeric" },
                      { value: "text", label: "Text" },
                    ]} />
                </div>
              )}
              {editor.kind !== "things" && (
                <label className="flex flex-col gap-1.5">
                  <span className="section-label" style={{ padding: 0 }}>Assigned to</span>
                  <MemberPicker value={form.assigneeId} allowUnassigned
                    label="Maintenance assignee" onChange={id => field("assigneeId", id)} />
                </label>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn btn-primary" onClick={saveItem}>{editor.id ? "Save changes" : "Create"}</button>
              <button className="btn btn-secondary" onClick={() => setEditor(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Alert banner */}
        {alertCount > 0 && (
          <div className="rounded-lg p-4 mb-5" style={{ background: "var(--sig-due-bg)", border: "1px solid var(--sig-due)", borderRadius: "var(--r-lg)" }}>
            <div className="flex items-center gap-2">
              <Icon name="error" size={15} style={{ color: "var(--sig-due)" }} />
              <span className="font-bold" style={{ fontSize: 13, color: "var(--sig-due)" }}>
                {alertCount} item{alertCount !== 1 ? "s" : ""} need attention
              </span>
            </div>
          </div>
        )}

        {/* Tab strip */}
        <div className="flex gap-1 mb-5 p-1" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
          {([
            { id: "assets" as TabId, label: "Assets", count: assets.length },
            { id: "meters" as TabId, label: "Meters", count: meters.length },
            { id: "things" as TabId, label: "Things", count: things.length },
          ]).map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setEditor(null); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 font-semibold"
              style={{
                background: tab === t.id ? "var(--surface)" : "transparent",
                color: tab === t.id ? "var(--t-primary)" : "var(--t-muted)",
                border: "none", cursor: "pointer", borderRadius: "var(--r-sm)",
                fontSize: 13, fontFamily: "var(--font-ui)",
                boxShadow: tab === t.id ? "var(--shadow-xs)" : "none",
                transition: "all 0.15s",
              }}>
              {t.label}
              <span className="badge" style={{ background: "var(--line)", color: "var(--t-muted)", fontSize: 10 }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── Assets tab ── */}
        {tab === "assets" && (
          <div className="flex flex-col gap-3">
            {assets.map(item => {
              const assignee = item.assigneeId ? getMemberById(item.assigneeId) : null;
              return (
                <div key={item.id} className="card p-5" style={{ opacity: inactive.has(item.id) ? 0.68 : 1 }}>
                  <div className="flex items-start gap-4">
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--r-lg)",
                      background: `color-mix(in srgb, ${statusColor(item.status)} 10%, transparent)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-bold text-primary" style={{ fontSize: 15 }}>{item.name}</div>
                        {inactive.has(item.id)
                          ? <span className="badge bg-surface-2 text-muted">Inactive</span>
                          : <span className="badge" style={{ background: statusBg(item.status), color: statusColor(item.status), fontSize: 11 }}>{statusLabel(item.status)}</span>}
                      </div>
                      {item.description && <div className="text-muted mb-2" style={{ fontSize: 12, marginTop: 2 }}>{item.description}</div>}
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div>
                          <div className="text-faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Next due</div>
                          <div className="font-semibold" style={{ fontSize: 13, color: statusColor(item.status) }}>{formatDate(item.nextDue)}</div>
                        </div>
                        {item.lastDone && (
                          <div>
                            <div className="text-faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last done</div>
                            <div className="text-muted" style={{ fontSize: 13 }}>{formatDate(item.lastDone)}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Interval</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>Every {item.intervalDays} days</div>
                        </div>
                        <div>
                          <div className="text-faint" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</div>
                          <div className="text-muted" style={{ fontSize: 13 }}>{item.category}</div>
                        </div>
                      </div>
                      {assignee && (
                        <div className="flex items-center gap-1 mt-3">
                          <div className="avatar" style={{ width: 20, height: 20, background: assignee.avatarColor, fontSize: 8 }}>{assignee.initials}</div>
                          <span className="text-faint" style={{ fontSize: 11 }}>Assigned to {assignee.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-secondary" disabled={inactive.has(item.id)} onClick={() => markDone(item.id)}>Mark done</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openModify("assets", item.id)}>Modify</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => changeActive(item.id, item.name)}>
                        {inactive.has(item.id) ? "Activate" : "Deactivate"}
                      </button>
                      <button className="btn btn-sm btn-ghost" style={{ color: "var(--sig-over)" }} onClick={() => deleteItem("assets", item.id, item.name)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Meters tab ── */}
        {tab === "meters" && (
          <div className="flex flex-col gap-3">
            {meters.map(meter => {
              const assignee = meter.assigneeId ? getMemberById(meter.assigneeId) : null;
              const isExpanded = expandedMeter === meter.id;
              const delta = meter.previousReading != null ? meter.currentReading - meter.previousReading : null;

              return (
                <div key={meter.id} className="card overflow-hidden" style={{ opacity: inactive.has(meter.id) ? 0.68 : 1 }}>
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4"
                    style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "start", fontFamily: "var(--font-ui)" }}
                    onClick={() => setExpandedMeter(isExpanded ? null : meter.id)}
                  >
                    <div style={{ fontSize: 28, lineHeight: 1 }}>{meter.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-bold text-primary" style={{ fontSize: 15 }}>{meter.name}</div>
                        {inactive.has(meter.id)
                          ? <span className="badge bg-surface-2 text-muted">Inactive</span>
                          : <span className="badge" style={{ background: statusBg(meter.status), color: statusColor(meter.status), fontSize: 11 }}>{statusLabel(meter.status)}</span>}
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--t-primary)" }}>{meter.currentReading.toLocaleString()}</span>
                        <span className="text-muted" style={{ fontSize: 13 }}>{meter.unit}</span>
                        {delta != null && (
                          <span className="ms-2 text-muted" style={{ fontSize: 12 }}>
                            (+{delta.toFixed(1)} since last reading)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-faint" style={{ fontSize: 11 }}>Updated {formatDate(meter.lastUpdated)}</span>
                        <span className="text-faint" style={{ fontSize: 11 }}>Due {formatDate(meter.nextDue)}</span>
                        {assignee && (
                          <div className="flex items-center gap-1">
                            <div className="avatar" style={{ width: 16, height: 16, background: assignee.avatarColor, fontSize: 7 }}>{assignee.initials}</div>
                            <span className="text-faint" style={{ fontSize: 11 }}>{assignee.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron_down" size={16} style={{ color: "var(--t-faint)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  </button>

                  {isExpanded && (
                    <div className="border-t px-5 py-4" style={{ borderColor: "var(--line)" }}>
                      {meter.notes && (
                        <div className="text-muted mb-3" style={{ fontSize: 13 }}>{meter.notes}</div>
                      )}
                      <div className="section-label mb-3" style={{ padding: 0 }}>Add reading</div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0" step="any"
                          value={readingInputs[meter.id] ?? ""}
                          onChange={e => setReadingInputs(prev => ({ ...prev, [meter.id]: e.target.value }))}
                          disabled={inactive.has(meter.id)}
                          placeholder={`Current reading in ${meter.unit}`}
                          className="flex-1 px-3 py-2 rounded-lg border font-mono"
                          style={{ background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--t-primary)", fontSize: 13, fontFamily: "var(--font-mono)", borderRadius: "var(--r-md)" }}
                        />
                        <button className="btn btn-sm btn-primary" disabled={inactive.has(meter.id)} onClick={() => saveReading(meter)}>Save</button>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="btn btn-sm btn-secondary" disabled={inactive.has(meter.id)} onClick={() => ctx.showToast("Snooze reminder is not connected in the UI preview")}>Snooze reminder</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => openModify("meters", meter.id)}>Modify</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => changeActive(meter.id, meter.name)}>
                          {inactive.has(meter.id) ? "Activate" : "Deactivate"}
                        </button>
                        <button className="btn btn-sm btn-ghost" style={{ color: "var(--sig-over)" }} onClick={() => deleteItem("meters", meter.id, meter.name)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Things tab ── */}
        {tab === "things" && (
          <div>
            {things.length === 0 && (
              <div className="empty-state">
                <div className="font-bold text-primary">No things yet</div>
                <button className="btn btn-primary" onClick={() => openNew("things")}>New thing</button>
              </div>
            )}
            {/* Group by category */}
            {Array.from(new Set(things.map(t => t.category ?? "Other"))).map(cat => {
              const catThings = things.filter(t => (t.category ?? "Other") === cat);
              return (
                <div key={cat} className="mb-5">
                  <div className="section-label mb-2">{cat}</div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                    {catThings.map(thing => {
                      const state = thing.state;
                      const stateColor = thingStateColor(state);
                      const isExpanded = expandedThing === thing.id;

                      return (
                        <div key={thing.id} className="card overflow-hidden" style={{ opacity: inactive.has(thing.id) ? 0.68 : 1 }}>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div style={{ fontSize: 28, lineHeight: 1 }}>{thing.icon}</div>
                              {thing.type === "toggle" ? (
                                <button
                                  className="font-bold px-3 py-1"
                                  style={{
                                    background: stateColor === "var(--sig-done)" ? "var(--sig-done-bg)" : "var(--surface-2)",
                                    color: stateColor,
                                    border: "none", cursor: "pointer", borderRadius: "var(--r-full)",
                                    fontSize: 11, fontFamily: "var(--font-ui)", textTransform: "uppercase", letterSpacing: "0.06em",
                                    transition: "all 0.15s",
                                  }}
                                  disabled={inactive.has(thing.id)}
                                  onClick={() => toggleThing(thing.id)}
                                >
                                  {state}
                                </button>
                              ) : (
                                <span className="badge" style={{ background: `color-mix(in srgb, ${stateColor} 10%, transparent)`, color: stateColor, fontSize: 11 }}>
                                  {state}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-primary" style={{ fontSize: 14 }}>{thing.name}</div>
                            {inactive.has(thing.id) && <span className="badge bg-surface-2 text-muted">Inactive</span>}
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <button className="btn btn-sm btn-secondary" onClick={() => openModify("things", thing.id)}>Modify</button>
                              <button className="btn btn-sm btn-ghost" onClick={() => changeActive(thing.id, thing.name)}>
                                {inactive.has(thing.id) ? "Activate" : "Deactivate"}
                              </button>
                              <button className="btn btn-sm btn-ghost" style={{ color: "var(--sig-over)" }} onClick={() => deleteItem("things", thing.id, thing.name)}>Delete</button>
                            </div>
                            <div className="text-faint mt-0.5" style={{ fontSize: 11 }}>Changed {formatMaintenanceTimestamp(thing.lastChanged)}</div>

                            <button
                              className="mt-2 flex items-center gap-1 text-faint"
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-ui)", fontSize: 11 }}
                              onClick={() => setExpandedThing(isExpanded ? null : thing.id)}
                            >
                              <Icon name="clock" size={11} />
                              History
                              <Icon name="chevron_down" size={11} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="border-t px-4 py-3" style={{ borderColor: "var(--line)" }}>
                              <div className="flex flex-col gap-1">
                                {thing.history.slice(0, 5).map((h, i) => (
                                  <div key={i} className="flex items-center justify-between">
                                    <span className="text-muted" style={{ fontSize: 12 }}>{h.value}</span>
                                    <span className="text-faint" style={{ fontSize: 11 }}>{formatMaintenanceTimestamp(h.at)}</span>
                                  </div>
                                ))}
                              </div>
 
                            </div>
                          )}
                        </div>
                      );
                    })}
    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
