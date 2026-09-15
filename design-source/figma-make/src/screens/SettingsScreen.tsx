import { useRef, useState } from "react";
import { AppCtx, Icon, Theme, View } from "../App";
import { MEMBERS } from "../data";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";

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

function Row({ icon, label, sub, children, onClick }: { icon?: string; label: string; sub?: string; children?: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0"
      style={{ borderColor: "var(--line)", cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    >
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
      aria-label="Toggle setting"
      aria-pressed={on}
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

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      aria-label="Setting option"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)",
        color: "var(--t-primary)", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600,
        padding: "5px 10px", cursor: "pointer", outline: "none"
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ─── Invite modal ────────────────────── */
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (email: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(onClose, dialogRef);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!inviteEmail.includes("@")) { setError("Please enter a valid email."); return; }
    setError("");
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      onSuccess(inviteEmail);
    }, 900);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div ref={dialogRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title" aria-describedby="invite-dialog-description" style={{ maxWidth: 440 }} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 id="invite-dialog-title" className="font-bold text-primary" style={{ fontSize: 17 }}>Invite to your Circle</h2>
          <button aria-label="Close invite dialog" className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="p-6">
          {!sent ? (
            <>
              <p id="invite-dialog-description" className="text-muted mb-5" style={{ fontSize: 14, lineHeight: 1.6 }}>
                Invite a family member or partner. They'll get an email to join your household. Family features become active once they accept.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="invite-email" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Their email address</label>
                  <input
                    id="invite-email" data-dialog-initial-focus
                    className="input"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="name@example.com"
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    autoFocus
                  />
                </div>
                {error && <div role="alert" style={{ fontSize: 12, color: "var(--sig-over)", fontWeight: 600 }}>{error}</div>}
                <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: "var(--brand-faint)", borderRadius: "var(--r-md)" }}>
                  <Icon name="info" size={15} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: "var(--t-muted)" }}>
                    A pending invitation does not enable Family mode — that only activates when they accept and become an active member.
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-secondary flex-1" style={{ justifyContent: "center" }} onClick={onClose}>Cancel</button>
                  <button className="btn btn-primary flex-1" style={{ justifyContent: "center" }} onClick={handleSend} disabled={sending}>
                    {sending ? "Sending…" : "Send invitation"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
              <div className="font-bold text-primary mb-2" style={{ fontSize: 17 }}>Invitation sent!</div>
              <div className="text-muted mb-2" style={{ fontSize: 14, lineHeight: 1.6 }}>
                An invitation was sent to <strong>{inviteEmail}</strong>. Family features will activate once they join.
              </div>
              <div className="badge mb-6" style={{ background: "var(--sig-due-bg)", color: "var(--sig-due)", fontSize: 11 }}>Pending invitation</div>
              <button className="btn btn-primary" style={{ justifyContent: "center", width: "100%" }} onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Edit profile modal ──────────────── */
function EditProfileModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, email: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(onClose, dialogRef);
  const currentUser = MEMBERS.find(m => m.isCurrentUser)!;
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div ref={dialogRef} className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" style={{ maxWidth: 440 }} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
          <h2 id="profile-dialog-title" className="font-bold text-primary" style={{ fontSize: 17 }}>Edit Profile</h2>
          <button aria-label="Close profile dialog" className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="avatar" style={{ width: 64, height: 64, background: currentUser.avatarColor, fontSize: 22 }}>{currentUser.initials}</div>
              <div>
                <button className="btn btn-secondary btn-sm">Change photo</button>
                <div className="text-faint mt-1" style={{ fontSize: 11 }}>JPG, PNG or GIF · max 2 MB</div>
              </div>
            </div>
            <div>
              <label htmlFor="profile-name" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Display name</label>
              <input id="profile-name" data-dialog-initial-focus className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="profile-email" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Email</label>
              <input id="profile-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" style={{ justifyContent: "center" }} onClick={onClose}>Cancel</button>
              <button className="btn btn-primary flex-1" style={{ justifyContent: "center" }} onClick={() => { onSave(name, email); onClose(); }}>Save changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Active sessions sub-panel ───────── */
const SESSIONS = [
  { id: "s1", device: "Chrome on macOS", location: "London, UK", lastActive: "Now", current: true, icon: "monitor" },
  { id: "s2", device: "Safari on iPhone 15", location: "London, UK", lastActive: "2h ago", current: false, icon: "phone" },
  { id: "s3", device: "Chrome on Windows", location: "Manchester, UK", lastActive: "3 days ago", current: false, icon: "monitor" },
];

export default function SettingsScreen({ ctx, isSolo }: Props) {
  const currentUser = MEMBERS.find(m => m.isCurrentUser)!;
  const isRTL = document.documentElement.dir === "rtl";
  const isChild = ctx.persona === "child";

  /* ─ local state ─ */
  const [showInvite, setShowInvite] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  /* Appearance */
  const [notifToggles, setNotifToggles] = useState({
    taskReminders: true, routineNudges: true, familyActivity: false, rewards: true, weeklySummary: false, quietHours: false,
  });

  /* Account & security */
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [activityVisible, setActivityVisible] = useState(true);

  /* Localization */
  const [locale, setLocale] = useState({
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    firstDay: "monday",
    currency: "GBP",
    timezone: "Europe/London",
  });

  const setLocaleField = (field: keyof typeof locale, value: string) => setLocale(prev => ({ ...prev, [field]: value }));

  const toggleNotif = (key: keyof typeof notifToggles) => setNotifToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 80px" }}>
        <div className="page-header pb-5">
          <div>
            <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Settings</h1>
            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Manage your account and preferences</div>
          </div>
        </div>

        <div className="px-4 md:px-7">

          {/* ── Profile ── */}
          <Section title="Profile">
            <div className="flex items-center gap-5 px-5 py-5 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <div className="avatar" style={{ width: 56, height: 56, background: currentUser.avatarColor, fontSize: 22 }}>{currentUser.initials}</div>
              <div className="flex-1">
                <div className="font-bold text-primary" style={{ fontSize: 16 }}>{currentUser.name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{currentUser.email}</div>
                <div className="badge bg-brand-faint text-brand mt-1" style={{ fontSize: 11 }}>{currentUser.role}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProfile(true)}>Edit</button>
            </div>
            <Row icon="user" label="Display name" sub={currentUser.name}>
              <button className="btn btn-ghost btn-sm text-brand" onClick={() => setShowEditProfile(true)}>Change</button>
            </Row>
            <Row icon="mail" label="Email" sub={currentUser.email}>
              <button className="btn btn-ghost btn-sm text-brand" onClick={() => setShowEditProfile(true)}>Change</button>
            </Row>
            <Row icon="lock" label="Password" sub="Last changed 90 days ago">
              <button className="btn btn-ghost btn-sm text-brand">Update</button>
            </Row>
          </Section>

          {/* ── Account & Security ── */}
          <Section title="Account &amp; Security">
            <Row icon="shield" label="Two-factor authentication" sub={mfaEnabled ? "Enabled — SMS verification" : "Not enabled"}>
              <Toggle on={mfaEnabled} onChange={() => {
                if (mfaEnabled) {
                  ctx.showConfirm({
                    title: "Disable two-factor authentication?",
                    message: "This makes your account less secure. Are you sure you want to disable 2FA?",
                    confirmLabel: "Disable",
                    danger: true,
                    onConfirm: () => { setMfaEnabled(false); ctx.showToast("2FA disabled"); },
                  });
                } else {
                  setMfaEnabled(true);
                  ctx.showToast("2FA enabled");
                }
              }} />
            </Row>
            <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <div className="font-medium text-primary mb-3" style={{ fontSize: 14 }}>Active sessions</div>
              <div className="flex flex-col gap-3">
                {SESSIONS.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={s.icon} size={16} style={{ color: "var(--t-muted)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-primary truncate" style={{ fontSize: 13 }}>{s.device}</div>
                      <div className="text-faint" style={{ fontSize: 11 }}>{s.location} · {s.lastActive}</div>
                    </div>
                    {s.current ? (
                      <span className="badge bg-sig-done-bg text-sig-done" style={{ fontSize: 10 }}>Current</span>
                    ) : (
                      <button className="btn btn-ghost btn-sm text-sig-over" style={{ fontSize: 11 }}
                        onClick={() => ctx.showConfirm({ title: "Sign out this device?", message: `This will end the session on ${s.device}.`, confirmLabel: "Sign out", danger: true, onConfirm: () => ctx.showToast("Device signed out") })}>
                        Sign out
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm mt-4" style={{ fontSize: 12 }}
                onClick={() => ctx.showConfirm({ title: "Sign out all other devices?", message: "All other sessions will be ended. You'll stay signed in on this device.", confirmLabel: "Sign out all", danger: true, onConfirm: () => ctx.showToast("All other devices signed out") })}>
                Sign out all other devices
              </button>
            </div>
            <Row icon="clock" label="Demo: simulate session expiry" sub="Forces re-authentication — shows the recovery flow">
              <button className="btn btn-secondary btn-sm" onClick={ctx.triggerSessionExpiry}>Try it</button>
            </Row>
            <Row icon="log_out" label="Sign out" sub="End your current session">
              <button className="btn btn-danger btn-sm"
                onClick={() => ctx.showConfirm({ title: "Sign out?", message: "You'll need to sign in again to access Dydan.", confirmLabel: "Sign out", danger: true, onConfirm: ctx.signOut })}>
                Sign out
              </button>
            </Row>
          </Section>

          {/* ── Appearance ── */}
          <Section title="Appearance">
            <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
              <div className="font-medium text-primary mb-3" style={{ fontSize: 14 }}>Theme</div>
              <div className="grid grid-cols-2 gap-3">
                {(["dydan", "sovereign"] as Theme[]).map(t => (
                  <button key={t} onClick={() => ctx.setTheme(t)}
                    className="p-4 text-start border-2 transition-all"
                    style={{
                      borderRadius: "var(--r-xl)",
                      borderColor: ctx.theme === t ? "var(--brand)" : "var(--line)",
                      background: ctx.theme === t ? "var(--brand-faint)" : "var(--surface-2)",
                      cursor: "pointer", fontFamily: "var(--font-ui)"
                    }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: t === "dydan" ? "#4326EA" : "#1A1A1A", border: "2px solid var(--line)" }} />
                      <span className="font-bold text-primary" style={{ fontSize: 13 }}>
                        {t === "dydan" ? "Dydan" : "Sovereign"}
                      </span>
                      {ctx.theme === t && <Icon name="check" size={13} style={{ color: "var(--brand)" }} />}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {t === "dydan" ? "Momentum Violet + Flow Aqua" : "Onyx + Golden Yellow"}
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
            <Row icon="bars" label="Compact mode" sub="Reduce spacing for more content density">
              <Toggle on={false} onChange={() => ctx.showToast("Coming in v2.5")} />
            </Row>
          </Section>

          {/* ── Localization ── */}
          <Section title="Localization">
            <Row icon="globe" label="Language" sub="App language and text direction">
              <SelectField
                value={locale.language}
                onChange={v => { setLocaleField("language", v); if (v === "ar") ctx.toggleRTL(); ctx.showToast("Language updated"); }}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                ]}
              />
            </Row>
            <Row icon="calendar" label="Date format">
              <SelectField
                value={locale.dateFormat}
                onChange={v => { setLocaleField("dateFormat", v); ctx.showToast("Date format updated"); }}
                options={[
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                ]}
              />
            </Row>
            <Row icon="clock" label="Time format">
              <SelectField
                value={locale.timeFormat}
                onChange={v => { setLocaleField("timeFormat", v); ctx.showToast("Time format updated"); }}
                options={[
                  { value: "24h", label: "24-hour" },
                  { value: "12h", label: "12-hour (AM/PM)" },
                ]}
              />
            </Row>
            <Row icon="today" label="First day of week">
              <SelectField
                value={locale.firstDay}
                onChange={v => { setLocaleField("firstDay", v); ctx.showToast("Week start updated"); }}
                options={[
                  { value: "monday", label: "Monday" },
                  { value: "sunday", label: "Sunday" },
                  { value: "saturday", label: "Saturday" },
                ]}
              />
            </Row>
            <Row icon="tag" label="Currency" sub="For shopping and budget estimates">
              <SelectField
                value={locale.currency}
                onChange={v => { setLocaleField("currency", v); ctx.showToast("Currency updated"); }}
                options={[
                  { value: "GBP", label: "£ GBP" },
                  { value: "USD", label: "$ USD" },
                  { value: "EUR", label: "€ EUR" },
                  { value: "AED", label: "AED" },
                  { value: "SAR", label: "SAR" },
                ]}
              />
            </Row>
            <Row icon="map" label="Timezone" sub={locale.timezone}>
              <button className="btn btn-ghost btn-sm text-brand">Change</button>
            </Row>
          </Section>

          {/* ── Notifications ── */}
          <Section title="Notifications">
            {([
              { key: "taskReminders" as const, label: "Task reminders", sub: "Alerts for upcoming and overdue tasks" },
              { key: "routineNudges" as const, label: "Routine nudges", sub: "Remind me when a routine is due" },
              { key: "familyActivity" as const, label: "Family activity", sub: "When a household member completes something" },
              { key: "rewards" as const, label: "Rewards available", sub: "When Liam has enough points to redeem" },
              { key: "weeklySummary" as const, label: "Weekly summary", sub: "Friday digest of the week's progress" },
              { key: "quietHours" as const, label: "Quiet hours (10 pm – 8 am)", sub: "Suppress notifications during this window" },
            ]).map(n => (
              <Row key={n.key} label={n.label} sub={n.sub}>
                <Toggle on={notifToggles[n.key]} onChange={() => toggleNotif(n.key)} />
              </Row>
            ))}
          </Section>

          {/* ── Household / Circle ── */}
          {!isSolo && !isChild ? (
            <Section title="Household">
              <Row icon="users" label="Household members" sub={`${MEMBERS.length} active members`}>
                <button className="btn btn-secondary btn-sm">Manage</button>
              </Row>
              <div className="px-5 py-4 border-b border-line" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-col gap-3">
                  {MEMBERS.map(m => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 34, height: 34, background: m.avatarColor, fontSize: 12 }}>{m.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-primary" style={{ fontSize: 13 }}>{m.name}</div>
                        <div className="text-faint" style={{ fontSize: 11, textTransform: "capitalize" }}>{m.role} · {m.email}</div>
                      </div>
                      {m.isCurrentUser && <span className="badge bg-brand-faint text-brand" style={{ fontSize: 10 }}>You</span>}
                      {!m.isCurrentUser && (
                        <button className="btn btn-ghost btn-sm text-sig-over" style={{ fontSize: 11 }}
                          onClick={() => ctx.showConfirm({ title: `Remove ${m.name}?`, message: `${m.name} will lose access to the household. Their tasks will remain.`, confirmLabel: "Remove", danger: true, onConfirm: () => ctx.showToast(`${m.name} removed`) })}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {ctx.pendingInvite && (
                    <div className="flex items-center gap-3">
                      <div className="avatar" style={{ width: 34, height: 34, background: "var(--line-strong)", fontSize: 12 }}>?</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-primary" style={{ fontSize: 13 }}>{ctx.pendingInvite}</div>
                        <div className="text-faint" style={{ fontSize: 11 }}>Invitation pending · not yet active</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={ctx.acceptInvite}>Demo: Accept</button>
                    </div>
                  )}
                </div>
              </div>
              <Row icon="plus" label="Invite a member" sub="Send an invitation link to join your household">
                <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>Invite</button>
              </Row>
            </Section>
          ) : !isChild ? (
            <Section title="Circle">
              <div className="px-5 py-5">
                <div className="flex items-center gap-4 mb-4">
                  <div style={{ fontSize: 40, lineHeight: 1 }}>🏠</div>
                  <div>
                    <div className="font-bold text-primary" style={{ fontSize: 15 }}>Currently solo</div>
                    <div className="text-muted" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>
                      Invite someone to unlock shared lists, family goals, household workload, and more.
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
                  <Icon name="plus" size={14} />
                  Invite someone
                </button>
                {ctx.pendingInvite && (
                  <div className="mt-4 p-3 flex items-center gap-3 rounded-lg" style={{ background: "var(--sig-due-bg)", borderRadius: "var(--r-md)" }}>
                    <Icon name="clock" size={15} style={{ color: "var(--sig-due)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ fontSize: 13, color: "var(--sig-due)" }}>Invitation pending</div>
                      <div style={{ fontSize: 12, color: "var(--t-muted)" }}>{ctx.pendingInvite} has been invited but has not yet joined.</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ background: "var(--surface)", border: "1px solid var(--line)" }} onClick={ctx.acceptInvite}>Demo: Accept</button>
                  </div>
                )}
              </div>
            </Section>
          ) : null}

          {/* ── Privacy & Data ── */}
          <Section title="Privacy &amp; Data">
            <Row icon="eye" label="Activity visible to household" sub="Other members can see your completed tasks">
              <Toggle on={activityVisible} onChange={() => setActivityVisible(v => !v)} />
            </Row>
            <Row icon="download" label="Export my data" sub="Download a full copy of your Dydan data (JSON)">
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.showToast("Export started — check your email")}>Export</button>
            </Row>
            <Row icon="upload" label="Import data" sub="Restore from a previous export">
              <button className="btn btn-secondary btn-sm">Import</button>
            </Row>
            <Row icon="database" label="Storage used" sub="Approximately 1.2 MB of data">
              <span className="text-faint font-mono" style={{ fontSize: 12 }}>1.2 MB</span>
            </Row>
            <Row icon="trash" label="Delete my account" sub="Permanently remove your account and all data">
              <button className="btn btn-ghost btn-sm text-sig-over"
                onClick={() => ctx.showConfirm({
                  title: "Delete your account?",
                  message: "This is permanent. All your tasks, goals, and household data will be deleted. This cannot be undone.",
                  confirmLabel: "Delete account",
                  danger: true,
                  onConfirm: () => ctx.showToast("Account deletion requested"),
                })}>
                Delete
              </button>
            </Row>
          </Section>

          {/* ── Demo flows ── */}
          <Section title="Demo">
            <Row icon="zap" label="New user onboarding" sub="Walk through the first-use setup flow">
              <button className="btn btn-secondary btn-sm" onClick={ctx.goToOnboarding}>Demo</button>
            </Row>
            <Row icon="error" label="Error reporting flow" sub="See the full error and support flow">
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.navigate("error")}>Open</button>
            </Row>
            <Row icon="wifi_off" label="Offline state" sub="Demo the disconnected experience">
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.navigate("offline")}>Open</button>
            </Row>
            <Row icon="database" label="Unavailable data state" sub="Demo failed data loading">
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.navigate("unavailable")}>Open</button>
            </Row>
            <Row icon="lock" label="Permission denied state" sub="Demo restricted access">
              <button className="btn btn-secondary btn-sm" onClick={() => ctx.navigate("permission-denied")}>Open</button>
            </Row>
          </Section>

          {/* ── Support ── */}
          <Section title="Support">
            <Row icon="help" label="Help &amp; documentation" sub="Guides, tutorials, and FAQs">
              <Icon name="chevron_right" size={15} style={{ color: "var(--t-faint)" }} />
            </Row>
            <Row icon="send" label="Contact support" sub="Get help from the Dydan team">
              <Icon name="chevron_right" size={15} style={{ color: "var(--t-faint)" }} />
            </Row>
            <Row icon="error" label="Report a problem" sub="Send feedback or a bug report">
              <button className="btn btn-ghost btn-sm" onClick={() => ctx.navigate("error")}>Open</button>
            </Row>
          </Section>

          {/* ── About ── */}
          <Section title="About">
            <Row icon="info" label="Version" sub="Dydan 2.4.1 · Build 20260815">
              <span className="badge bg-sig-done-bg text-sig-done" style={{ fontSize: 10 }}>Up to date</span>
            </Row>
            <Row icon="eye" label="Privacy policy" sub="How we handle your data">
              <Icon name="external" size={14} style={{ color: "var(--t-faint)" }} />
            </Row>
            <Row icon="clipboard" label="Terms of service">
              <Icon name="external" size={14} style={{ color: "var(--t-faint)" }} />
            </Row>
            <Row icon="award" label="Open-source licences">
              <Icon name="chevron_right" size={15} style={{ color: "var(--t-faint)" }} />
            </Row>
            <div className="px-5 py-4 text-center">
              <div className="text-faint" style={{ fontSize: 12 }}>Made with care for families everywhere</div>
              <div className="text-faint" style={{ fontSize: 11, marginTop: 4 }}>© 2026 Dydan. All rights reserved.</div>
            </div>
          </Section>

        </div>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={(email) => { setShowInvite(false); ctx.inviteMember(email); }}
        />
      )}

      {showEditProfile && (
        <EditProfileModal
          onClose={() => setShowEditProfile(false)}
          onSave={(_n, _e) => { ctx.showToast("Profile updated"); }}
        />
      )}
    </>
  );
}
