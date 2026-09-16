import { useState } from "react";
import { Icon, LogoMark, Theme } from "../App";

type AuthStep = "signin" | "mfa" | "forgot";

interface Props {
  theme: Theme;
  onAuthenticated: () => void;
  isSessionExpired?: boolean;
}

export default function AuthScreen({ theme, onAuthenticated, isSessionExpired }: Props) {
  const [step, setStep] = useState<AuthStep>("signin");
  const [email, setEmail] = useState("sarah@mitchells.home");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSignIn = () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (password === "wrong") { setError("Incorrect password. Please try again."); return; }
      setStep("mfa");
    }, 900);
  };

  const handleMFA = () => {
    if (mfaCode.length !== 6) { setError("Enter the 6-digit code."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onAuthenticated(); }, 700);
  };

  const handleForgot = () => {
    if (!email) { setError("Enter your email address to reset your password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setForgotSent(true); }, 800);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--page)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="card" style={{ padding: "40px 36px", borderRadius: "var(--r-2xl)" }}>
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <LogoMark size={36} theme={theme} />
            <div>
              <div className="font-bold text-primary" style={{ fontSize: 20 }}>Dydan</div>
              <div className="text-faint" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em" }}>Household Management</div>
            </div>
          </div>

          {/* Session-expired banner */}
          {isSessionExpired && step === "signin" && (
            <div className="mb-5 flex items-start gap-3 p-4" style={{ background: "var(--sig-due-bg)", border: "1px solid var(--sig-due)", borderRadius: "var(--r-md)" }}>
              <Icon name="lock" size={15} style={{ color: "var(--sig-due)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="font-bold" style={{ fontSize: 13, color: "var(--sig-due)" }}>Session expired</div>
                <div style={{ fontSize: 12, color: "var(--t-muted)", marginTop: 2, lineHeight: 1.5 }}>
                  Your session ended after inactivity. Sign in again to continue — your data is safe.
                </div>
              </div>
            </div>
          )}

          {step === "signin" && (
            <>
              <h1 className="text-primary font-bold" style={{ fontSize: 22, margin: "0 0 4px" }}>
                {isSessionExpired ? "Sign back in" : "Welcome back"}
              </h1>
              <div className="text-muted mb-7" style={{ fontSize: 14 }}>Mitchell household</div>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="sign-in-email" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Email</label>
                  <input id="sign-in-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="sign-in-password" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Password</label>
                  <input
                    id="sign-in-password"
                    className="input" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    autoComplete="current-password"
                    onKeyDown={e => e.key === "Enter" && handleSignIn()}
                  />
                </div>
                {error && <div role="alert" style={{ fontSize: 12, color: "var(--sig-over)", fontWeight: 600 }}>{error}</div>}
                <button className="btn btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: 4 }} onClick={handleSignIn} disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand)", fontSize: 13 }} onClick={() => setStep("forgot")}>
                  Forgot password?
                </button>
              </div>

              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
                <div className="text-faint text-center mb-3" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Demo: sign in as</div>
                <div className="flex gap-2">
                  {[
                    { label: "Sarah (admin)", email: "sarah@mitchells.home" },
                    { label: "Liam (child)", email: "liam@mitchells.home" },
                  ].map(u => (
                    <button key={u.email} className="btn btn-secondary btn-sm flex-1"
                      style={{ fontSize: 11, justifyContent: "center" }}
                      onClick={() => { setEmail(u.email); setPassword("demo"); }}>
                      {u.label}
                    </button>
                  ))}
                </div>
                <div className="text-faint text-center mt-2" style={{ fontSize: 11 }}>Password auto-filled · enter any 6-digit MFA code</div>
              </div>
            </>
          )}

          {step === "mfa" && (
            <>
              <div style={{ width: 48, height: 48, borderRadius: "var(--r-md)", background: "var(--brand-faint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Icon name="lock" size={22} style={{ color: "var(--brand)" }} />
              </div>
              <h1 className="text-primary font-bold" style={{ fontSize: 22, margin: "0 0 6px" }}>Two-factor verification</h1>
              <div className="text-muted mb-7" style={{ fontSize: 14, lineHeight: 1.5 }}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="mfa-code" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Verification code</label>
                  <input
                    id="mfa-code"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    style={{ letterSpacing: "0.3em", fontSize: 24, fontFamily: "var(--font-mono)", textAlign: "center" }}
                    onKeyDown={e => e.key === "Enter" && handleMFA()}
                    autoFocus
                  />
                </div>
                {error && <div role="alert" style={{ fontSize: 12, color: "var(--sig-over)", fontWeight: 600 }}>{error}</div>}
                <button className="btn btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: 4 }} onClick={handleMFA} disabled={loading}>
                  {loading ? "Verifying…" : "Verify and sign in"}
                </button>
                <div className="flex justify-between items-center">
                  <button className="btn btn-ghost btn-sm text-muted" onClick={() => { setStep("signin"); setMfaCode(""); setError(""); }}>← Back</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand)", fontSize: 12 }} onClick={() => setError("A new verification code has been sent.")}>Resend code</button>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-lg text-center" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                <div className="text-faint" style={{ fontSize: 11 }}>Enter any 6 digits for the demo</div>
              </div>
            </>
          )}

          {step === "forgot" && (
            <>
              <h1 className="text-primary font-bold" style={{ fontSize: 22, margin: "0 0 6px" }}>Reset password</h1>
              <div className="text-muted mb-7" style={{ fontSize: 14 }}>Enter your email and we'll send a reset link.</div>

              {forgotSent ? (
                <div className="text-center">
                  <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
                  <div className="text-primary font-bold mb-2" style={{ fontSize: 17 }}>Check your inbox</div>
                  <div className="text-muted mb-6" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    A reset link was sent to <strong>{email}</strong>. Check your inbox and follow the link.
                  </div>
                  <button className="btn btn-secondary" style={{ justifyContent: "center", width: "100%" }} onClick={() => { setStep("signin"); setForgotSent(false); }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                  <label htmlFor="reset-email" className="block font-semibold text-primary mb-1.5" style={{ fontSize: 13 }}>Email</label>
                    <input id="reset-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <button className="btn btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: 4 }} onClick={handleForgot} disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep("signin")}>← Back to sign in</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="text-center text-faint mt-4" style={{ fontSize: 11 }}>Dydan v2.4.1 · Your data stays in your household</div>
      </div>
    </div>
  );
}
