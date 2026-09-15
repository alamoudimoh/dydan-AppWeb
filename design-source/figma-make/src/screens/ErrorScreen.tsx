import { useState } from "react";
import { AppCtx, Icon } from "../App";

const ERROR_REPORT = `Dydan Error Report
-------------------
Timestamp: 2026-08-15T09:42:11.312Z
Session: sess_8af3c2e1
User: sarah@mitchells.home
Version: 2.4.1 / Build 20260815
Platform: Web (Chrome 127)

Error: Failed to sync task completion
Code: SYNC_CONFLICT_409
Module: tasks/sync
Message: Optimistic update conflict — remote state was modified
          between local update and push.

Stack trace:
  at SyncEngine.push (sync.ts:214)
  at TaskStore.complete (tasks.ts:88)
  at TaskRow.handleCheck (TaskRow.tsx:52)
  at onClick (TaskRow.tsx:61)

Network: online
Last sync: 2026-08-15T09:41:58.021Z
Pending writes: 1

Did we capture anything sensitive?
No passwords, payment data, or message content is included.
The report contains task IDs and a partial username.`;

export default function ErrorScreen({ ctx }: { ctx: AppCtx }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);

  const copyReport = () => {
    navigator.clipboard.writeText(ERROR_REPORT).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitReport = () => {
    setReported(true);
    ctx.showToast("Problem report sent — thank you!");
    setTimeout(() => ctx.navigate("home"), 2000);
  };

  if (reported) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 400, padding: 40 }}>
        <div style={{ fontSize: 56 }}>✅</div>
        <div className="font-bold text-primary mt-4" style={{ fontSize: 20 }}>Report sent — thank you!</div>
        <div className="text-muted mt-2" style={{ fontSize: 14, textAlign: "center", maxWidth: 360 }}>
          We review every report and use them to improve Dydan. Returning you home now.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 0 60px" }}>
      <div className="px-4 md:px-7 pt-6">
        {/* Error card */}
        <div className="card p-6 mb-5" style={{ border: "1px solid var(--sig-over)", borderRadius: "var(--r-xl)" }}>
          <div className="flex items-start gap-4">
            <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--sig-over-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="error" size={24} style={{ color: "var(--sig-over)" }} />
            </div>
            <div>
              <h2 className="font-bold text-primary mb-1" style={{ fontSize: 18 }}>Something went wrong</h2>
              <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                We couldn't sync your last action. Your data is safe — this is a temporary issue.
              </div>
              <div className="badge mt-2" style={{ background: "var(--sig-over-bg)", color: "var(--sig-over)", fontSize: 11 }}>
                SYNC_CONFLICT_409
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mb-5">
          <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => ctx.navigate("home")}>
            <Icon name="refresh" size={16} />
            Retry
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: "center" }} onClick={() => ctx.navigate("home")}>
            Dismiss and continue
          </button>
        </div>

        {/* Report section */}
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)" }}
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-center gap-3">
              <Icon name="info" size={16} style={{ color: "var(--t-muted)" }} />
              <span className="font-medium text-primary" style={{ fontSize: 14 }}>Report this problem</span>
            </div>
            <Icon name="chevron_down" size={16} style={{ color: "var(--t-faint)", transform: showDetails ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {showDetails && (
            <div className="border-t border-line px-5 py-4 flex flex-col gap-4" style={{ borderColor: "var(--line)" }}>
              <div className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Sending a report helps us fix this faster. The report contains diagnostic details — no passwords or personal messages.
              </div>

              <button
                className="flex items-center gap-2 text-brand"
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontFamily: "var(--font-ui)", fontWeight: 600 }}
                onClick={() => setShowPayload(!showPayload)}>
                <Icon name="eye" size={14} />
                {showPayload ? "Hide" : "Show"} what gets sent
              </button>

              {showPayload && (
                <div className="rounded-lg p-4 overflow-x-auto" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                  <pre className="text-primary" style={{ fontSize: 11, fontFamily: "var(--font-mono)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{ERROR_REPORT}</pre>
                </div>
              )}

              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" style={{ justifyContent: "center" }} onClick={submitReport}>
                  Send report
                </button>
                <button className="btn btn-secondary" onClick={copyReport} title="Copy to clipboard">
                  <Icon name={copied ? "check" : "copy"} size={14} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
