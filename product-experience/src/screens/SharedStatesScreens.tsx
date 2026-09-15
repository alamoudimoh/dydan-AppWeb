import { AppCtx, Icon } from "../App";

export function OfflineScreen({ ctx }: { ctx: AppCtx }) {
  return (
    <div className="flex flex-col items-center justify-center px-4" style={{ height: "calc(100vh - 140px)" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="wifi_off" size={32} style={{ color: "var(--t-muted)" }} />
      </div>
      <h2 className="text-primary font-bold" style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>You're offline</h2>
      <p className="text-muted" style={{ fontSize: 14, textAlign: "center", maxWidth: 300, marginBottom: 24, lineHeight: 1.5 }}>
        Dydan is currently offline. Any changes you make will be saved locally and synced when you reconnect.
      </p>
      <div className="flex gap-3">
        <button className="btn btn-secondary" onClick={() => ctx.navigate("home")}>Go to Home</button>
        <button className="btn btn-primary" onClick={() => ctx.showToast("Still offline...")}><Icon name="refresh" size={14} />Try again</button>
      </div>
    </div>
  );
}

export function UnavailableScreen({ ctx }: { ctx: AppCtx }) {
  return (
    <div className="flex flex-col items-center justify-center px-4" style={{ height: "calc(100vh - 140px)" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="database" size={32} style={{ color: "var(--t-muted)" }} />
      </div>
      <h2 className="text-primary font-bold" style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>Data unavailable</h2>
      <p className="text-muted" style={{ fontSize: 14, textAlign: "center", maxWidth: 300, marginBottom: 24, lineHeight: 1.5 }}>
        We couldn't load this content right now. Please check your connection or try again later.
      </p>
      <button className="btn btn-primary" onClick={() => { ctx.showToast("Retrying..."); setTimeout(() => ctx.navigate("home"), 1000); }}><Icon name="refresh" size={14} />Retry</button>
    </div>
  );
}

export function PermissionDeniedScreen({ ctx }: { ctx: AppCtx }) {
  return (
    <div className="flex flex-col items-center justify-center px-4" style={{ height: "calc(100vh - 140px)" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--sig-over-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Icon name="lock" size={32} style={{ color: "var(--sig-over)" }} />
      </div>
      <h2 className="text-primary font-bold" style={{ fontSize: 20, marginBottom: 8, textAlign: "center" }}>Access restricted</h2>
      <p className="text-muted" style={{ fontSize: 14, textAlign: "center", maxWidth: 300, marginBottom: 24, lineHeight: 1.5 }}>
        You don't have permission to view this content. This area is reserved for household admins.
      </p>
      <button className="btn btn-primary" onClick={() => ctx.navigate("home")}>Return to Home</button>
    </div>
  );
}
