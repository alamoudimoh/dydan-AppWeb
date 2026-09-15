import { AppCtx, Icon } from "../App";
import { MAINTENANCE_ITEMS, getMemberById, formatDate } from "../data";

export default function MaintenanceScreen({ ctx }: { ctx: AppCtx }) {
  const statusColor = (s: string) => s === "overdue" ? "var(--sig-over)" : s === "due-soon" ? "var(--sig-due)" : "var(--sig-done)";
  const statusBg = (s: string) => s === "overdue" ? "var(--sig-over-bg)" : s === "due-soon" ? "var(--sig-due-bg)" : "var(--sig-done-bg)";
  const statusLabel = (s: string) => s === "overdue" ? "Overdue" : s === "due-soon" ? "Due soon" : "OK";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Maintenance</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Recurring home and asset upkeep</div>
        </div>
        <button className="btn btn-primary" onClick={ctx.openCreate}><Icon name="plus" size={14} />Add item</button>
      </div>

      <div className="px-4 md:px-7">
        {/* Alert banner */}
        {MAINTENANCE_ITEMS.some(m => m.status !== "ok") && (
          <div className="rounded-lg p-4 mb-5" style={{ background: "var(--sig-due-bg)", border: "1px solid var(--sig-due)", borderRadius: "var(--r-lg)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="error" size={15} style={{ color: "var(--sig-due)" }} />
              <span className="font-bold" style={{ fontSize: 13, color: "var(--sig-due)" }}>
                {MAINTENANCE_ITEMS.filter(m => m.status !== "ok").length} item{MAINTENANCE_ITEMS.filter(m => m.status !== "ok").length !== 1 ? "s" : ""} need attention
              </span>
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>Review and schedule overdue maintenance tasks.</div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {MAINTENANCE_ITEMS.map(item => {
            const assignee = item.assigneeId ? getMemberById(item.assigneeId) : null;
            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div style={{ width: 44, height: 44, borderRadius: "var(--r-lg)", background: `color-mix(in srgb, ${statusColor(item.status)} 10%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="font-bold text-primary" style={{ fontSize: 15 }}>{item.name}</div>
                      <span className="badge" style={{ background: statusBg(item.status), color: statusColor(item.status), fontSize: 11 }}>
                        {statusLabel(item.status)}
                      </span>
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
                    </div>
                    {assignee && (
                      <div className="flex items-center gap-1 mt-3">
                        <div className="avatar" style={{ width: 20, height: 20, background: assignee.avatarColor, fontSize: 8 }}>{assignee.initials}</div>
                        <span className="text-faint" style={{ fontSize: 11 }}>Assigned to {assignee.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="btn btn-sm btn-secondary">Mark done</button>
                    <button className="btn btn-sm btn-ghost" onClick={ctx.openCreate}>Schedule</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
