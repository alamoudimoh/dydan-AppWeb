import { ConfirmDialogConfig, Icon } from "../App";

interface Props {
  config: ConfirmDialogConfig;
  onClose: () => void;
}

export default function ConfirmDialog({ config, onClose }: Props) {
  const handleConfirm = () => {
    config.onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="p-7">
          <div className="flex items-start gap-4 mb-5">
            <div style={{
              width: 48, height: 48, borderRadius: "var(--r-md)", flexShrink: 0,
              background: config.danger ? "var(--sig-over-bg)" : "var(--brand-faint)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={config.danger ? "trash" : "info"} size={22} style={{ color: config.danger ? "var(--sig-over)" : "var(--brand)" }} />
            </div>
            <div>
              <div className="font-bold text-primary mb-1.5" style={{ fontSize: 17 }}>{config.title}</div>
              <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{config.message}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-secondary flex-1" style={{ justifyContent: "center" }} onClick={onClose}>
              {config.cancelLabel || "Cancel"}
            </button>
            <button
              className={`btn ${config.danger ? "btn-danger" : "btn-primary"} flex-1`}
              style={{ justifyContent: "center" }}
              onClick={handleConfirm}
            >
              {config.confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
