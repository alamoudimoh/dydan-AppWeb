import { useState } from "react";
import { Icon, LogoMark, Theme, View } from "../App";

type Step = "welcome" | "profile" | "view" | "done";

interface Props {
  theme: Theme;
  onComplete: (view: View, name: string) => void;
}

export default function OnboardingScreen({ theme, onComplete }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [selectedView, setSelectedView] = useState<View>("focus");

  const progressMap: Record<Step, number> = { welcome: 0, profile: 1, view: 2, done: 3 };
  const currentProgress = progressMap[step];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--page)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <LogoMark size={28} theme={theme} />
        {step !== "done" && step !== "welcome" && (
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: i === currentProgress ? 20 : 8, height: 8, borderRadius: 99,
                background: i <= currentProgress ? "var(--brand)" : "var(--line)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>
        )}
        {step !== "done" && (
          <button className="btn btn-ghost btn-sm text-muted" style={{ fontSize: 12 }} onClick={() => onComplete("focus", "")}>Skip</button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px 60px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {step === "welcome" && (
            <div className="text-center">
              <div style={{ marginBottom: 24 }}>
                <LogoMark size={72} theme={theme} />
              </div>
              <h1 className="text-primary font-bold mb-3" style={{ fontSize: 28, lineHeight: 1.2 }}>Welcome to Dydan</h1>
              <p className="text-muted mb-8" style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
                Your household, organised. Tasks, routines, goals and shared lists — all in one place.
              </p>
              <div className="flex flex-col gap-3 mb-8 text-start">
                {[
                  { icon: "tasks", title: "Tasks & routines", desc: "Organise household responsibilities together" },
                  { icon: "goals", title: "Goals & rewards", desc: "Set targets and celebrate progress as a family" },
                  { icon: "shopping", title: "Shared lists", desc: "Shopping lists everyone can update in real time" },
                ].map((f, i) => (
                  <div key={i} className="card flex items-center gap-4 p-4">
                    <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={f.icon} size={18} style={{ color: "var(--brand)" }} />
                    </div>
                    <div>
                      <div className="font-bold text-primary" style={{ fontSize: 14 }}>{f.title}</div>
                      <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" style={{ justifyContent: "center", width: "100%" }} onClick={() => setStep("profile")}>
                Get started
              </button>
              <button className="btn btn-ghost btn-sm mt-3" style={{ width: "100%", justifyContent: "center", color: "var(--t-muted)" }} onClick={() => onComplete("focus", "")}>
                I already have an account — sign in
              </button>
            </div>
          )}

          {step === "profile" && (
            <>
              <div className="mb-8">
                <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
                <h1 className="text-primary font-bold mb-2" style={{ fontSize: 24 }}>What should we call you?</h1>
                <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>This is how you'll appear to household members you invite later.</p>
              </div>
              <div className="mb-3">
                <label htmlFor="onboarding-name" className="sr-only">Your name</label>
                <input
                  id="onboarding-name"
                  className="input"
                  style={{ fontSize: 18, padding: "14px 16px" }}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && name.trim() && setStep("view")}
                />
              </div>
              <div className="text-faint mb-6" style={{ fontSize: 12 }}>You can change this any time in Settings.</div>
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={() => setStep("welcome")}>Back</button>
                <button className="btn btn-primary flex-1" style={{ justifyContent: "center" }} onClick={() => setStep("view")} disabled={!name.trim()}>
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "view" && (
            <>
              <div className="mb-8">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                <h1 className="text-primary font-bold mb-2" style={{ fontSize: 24 }}>How do you like to work?</h1>
                <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Choose your default view. You can switch between them any time.</p>
              </div>
              <div className="flex flex-col gap-3 mb-8">
                {([
                  {
                    v: "focus" as View,
                    icon: "zap",
                    title: "Focus",
                    badge: "Recommended for adults",
                    desc: "Execution-first. Manage tasks, priorities, workload, and planning. Clear and direct.",
                  },
                  {
                    v: "quest" as View,
                    icon: "star",
                    title: "Quest",
                    badge: "Great for families",
                    desc: "Motivation-first. Progress, points, goals, and rewards. Engaging for children too.",
                  },
                ]).map(opt => (
                  <button key={opt.v} onClick={() => setSelectedView(opt.v)}
                    style={{
                      border: selectedView === opt.v ? "2px solid var(--brand)" : "1px solid var(--line)",
                      background: selectedView === opt.v ? "var(--brand-faint)" : "var(--surface)",
                      borderRadius: "var(--r-xl)",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      fontFamily: "var(--font-ui)",
                      padding: 20,
                      textAlign: "start",
                      transition: "all 0.15s ease",
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: selectedView === opt.v ? "var(--brand)" : "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name={opt.icon} size={18} style={{ color: selectedView === opt.v ? "var(--brand-contrast)" : "var(--brand)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-primary" style={{ fontSize: 16 }}>{opt.title}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{opt.badge}</div>
                      </div>
                      {selectedView === opt.v && <Icon name="check" size={18} style={{ color: "var(--brand)" }} />}
                    </div>
                    <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary" onClick={() => setStep("profile")}>Back</button>
                <button className="btn btn-primary flex-1" style={{ justifyContent: "center" }} onClick={() => setStep("done")}>
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🎉</div>
              <h1 className="text-primary font-bold mb-3" style={{ fontSize: 28 }}>
                {name ? `You're all set, ${name}!` : "You're all set!"}
              </h1>
              <p className="text-muted mb-8" style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
                You're starting solo. Your tasks, goals and lists are private to you until you invite someone to your household.
              </p>
              <div className="card p-5 mb-6 text-start">
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="users" size={18} style={{ color: "var(--brand)" }} />
                  </div>
                  <div>
                    <div className="font-bold text-primary" style={{ fontSize: 14 }}>Invite when you're ready</div>
                    <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Settings → Circle → Invite someone</div>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ justifyContent: "center", width: "100%" }} onClick={() => onComplete(selectedView, name)}>
                Start using Dydan
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
