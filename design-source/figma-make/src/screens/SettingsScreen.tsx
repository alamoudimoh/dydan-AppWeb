import { AppCtx, Icon, Theme, View } from "../App";
import { MEMBERS } from "../data";

interface Props {
  ctx: AppCtx;
  isSolo: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="section-label" style={{ padding: "0 0 8px" }}>{title}</div>
      <div className="card overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ icon, label, sub, children }: { icon?: string; label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0" style={{ borderColor: "var(--line)" }}>
      {icon && <Icon name={icon} size={18} style={{ color: "var(--t-muted)", flexShrink: 0 }} />}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-primary" style={{ fontSize: 14 }}>{label}</div>
        {sub && <div className="text-muted" style={{ fontSize: 12, marginTop: 1 }}>{sub}</div>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, background: on ? "var(--brand)" : "var(--line-strong)",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", padding: 0
      }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }} />
    </button>
  );
}

export default function SettingsScreen({ ctx, isSolo }: Props) {
  const currentUser = MEMBERS.find(m => m.isCurrentUser)!;
  const isRTL = document.documentElement.dir === "rtl";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 60px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Settings</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Manage your account and preferences</div>
        </div>
      </div>

      <div className="px-4 md:px-7">
        {/* Profile */}
        <Section title="Profile">
          <div className="flex items-center gap-5 px-5 py-5 border-b border-line" style={{ borderColor: "var(--line)" }}>
            <div className="avatar" style={{ width: 56, height: 56, background: currentUser.avatarColor, fontSize: 22 }}>{currentUser.initials}</div>
            <div className="flex-1">
              <div className="font-bold text-primary" style={{ fontSize: 16 }}>{currentUser.name}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>{currentUser.email}</div>
              <div className="badge bg-brand-faint text-brand mt-1" style={{ fontSize: 11 }}>{currentUser.role}</div>
            </div>
            <button className="btn btn-secondary btn-sm">Edit</button>
          </div>
          <Row icon="user" label="Display name" sub={currentUser.name}>
            <button className="btn btn-ghost btn-sm text-brand">Change</button>
          </Row>
          <Row icon="mail" label="Email" sub={currentUser.email}>
            <button className="btn btn-ghost btn-sm text-brand">Change</button>
          </Row>
          <Row icon="lock" label="Password" sub="Last changed 90 days ago">
            <button className="btn btn-ghost btn-sm text-brand">Update</button>
          </Row>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
            <div className="font-medium text-primary mb-3" style={{ fontSize: 14 }}>Theme</div>
            <div className="grid grid-cols-2 gap-3">
              {(["daydan", "sovereign"] as Theme[]).map(t => (
                <button key={t} onClick={() => ctx.setTheme(t)}
                  className={`p-4 rounded-xl text-start border-2 transition-all`}
                  style={{
                    borderColor: ctx.theme === t ? "var(--brand)" : "var(--line)",
                    background: ctx.theme === t ? "var(--brand-faint)" : "var(--surface-2)",
                    cursor: "pointer", fontFamily: "var(--font-ui)"
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: t === "daydan" ? "#4326EA" : "#1A1A1A", border: "2px solid var(--line)" }} />
                    <span className="font-bold text-primary" style={{ fontSize: 13 }}>
                      {t === "daydan" ? "DayDan" : "Sovereign"}
                    </span>
                    {ctx.theme === t && <Icon name="check" size={13} style={{ color: "var(--brand)" }} />}
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {t === "daydan" ? "Momentum Violet + Flow Aqua" : "Onyx + Golden Yellow"}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
            <div className="font-medium text-primary mb-3" style={{ fontSize: 14 }}>Default view</div>
            <div className="view-toggle" style={{ display: "inline-flex" }}>
              {(["focus", "quest"] as View[]).map(v => (
                <button key={v} className={`view-toggle-btn ${ctx.view === v ? "active" : ""}`} onClick={() => ctx.setView(v)}>
                  {v === "focus" ? "⚡ Focus" : "✨ Quest"}
                </button>
              ))}
            </div>
          </div>
          <Row icon="rtl" label="Right-to-left layout" sub="Arabic and other RTL language support">
            <Toggle on={isRTL} onChange={ctx.toggleRTL} />
          </Row>
        </Section>

        {/* Household / Circle */}
        {!isSolo && (
          <Section title="Household">
            <Row icon="users" label="Household members" sub={`${MEMBERS.length} active members`}>
              <button className="btn btn-secondary btn-sm">Manage</button>
            </Row>
            <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <div className="flex flex-col gap-3">
                {MEMBERS.map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="avatar" style={{ width: 32, height: 32, background: m.avatarColor, fontSize: 12 }}>{m.initials}</div>
                    <div className="flex-1">
                      <div className="font-medium text-primary" style={{ fontSize: 13 }}>{m.name}</div>
                      <div className="text-faint" style={{ fontSize: 11 }}>{m.role} · {m.email}</div>
                    </div>
                    {!m.isCurrentUser && <button className="btn btn-ghost btn-sm text-sig-over">Remove</button>}
                    {m.isCurrentUser && <span className="badge bg-brand-faint text-brand" style={{ fontSize: 10 }}>You</span>}
                  </div>
                ))}
              </div>
            </div>
            <Row icon="plus" label="Invite a member" sub="Send an invitation link">
              <button className="btn btn-primary btn-sm">Invite</button>
            </Row>
          </Section>
        )}

        {isSolo && (
          <Section title="Circle">
            <div className="px-5 py-5">
              <div className="flex items-center gap-4 mb-4">
                <div style={{ fontSize: 40 }}>🏠</div>
                <div>
                  <div className="font-bold text-primary" style={{ fontSize: 15 }}>Currently solo</div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>Invite others to unlock shared lists, family goals, and household tools.</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm">Invite someone</button>
            </div>
          </Section>
        )}

        {/* Notifications */}
        <Section title="Notifications">
          {[
            { label: "Task reminders", sub: "Alerts for upcoming and overdue tasks", on: true },
            { label: "Routine nudges", sub: "Remind me when a routine is due", on: true },
            { label: "Family activity", sub: "When a household member completes something", on: false },
            { label: "Rewards available", sub: "When Liam has enough points to redeem", on: true },
            { label: "Weekly summary", sub: "Friday digest of the week's progress", on: false },
          ].map((n, i) => (
            <Row key={i} label={n.label} sub={n.sub}>
              <Toggle on={n.on} onChange={() => {}} />
            </Row>
          ))}
        </Section>

        {/* Privacy */}
        <Section title="Privacy & Data">
          <Row icon="eye" label="Activity visible to household" sub="Other members can see your completed tasks">
            <Toggle on={true} onChange={() => {}} />
          </Row>
          <Row icon="download" label="Export my data" sub="Download a copy of your DayDan data">
            <button className="btn btn-secondary btn-sm">Export</button>
          </Row>
          <Row icon="trash" label="Delete my account" sub="Permanently remove your data">
            <button className="btn btn-ghost btn-sm text-sig-over">Delete</button>
          </Row>
        </Section>

        {/* Support */}
        <Section title="Support">
          <Row icon="help" label="Help & documentation">
            <Icon name="chevron_right" size={15} style={{ color: "var(--t-faint)" }} />
          </Row>
          <Row icon="error" label="Report a problem" sub="Send feedback to the DayDan team">
            <button className="btn btn-ghost btn-sm" onClick={() => ctx.navigate("error")}>Open</button>
          </Row>
          <Row icon="info" label="About DayDan" sub="Version 2.4.1 · Build 20260815">
            <Icon name="chevron_right" size={15} style={{ color: "var(--t-faint)" }} />
          </Row>
        </Section>
      </div>
    </div>
  );
}
