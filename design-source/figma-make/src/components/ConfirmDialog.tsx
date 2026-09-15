import { ConfirmDialogConfig, Icon } from "../App";
import { useRef } from "react";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";

interface Props {
  config: ConfirmDialogConfig;
  onClose: () => void;
}

export default function ConfirmDialog({ config, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(onClose, dialogRef);
  const handleConfirm = () => {
    config.onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div ref={dialogRef} className="modal-panel" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" style={{ maxWidth: 400 }} onMouseDown={e => e.stopPropagation()}>
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
              <h2 id="confirm-dialog-title" className="font-bold text-primary mb-1.5" style={{ fontSize: 17 }}>{config.title}</h2>
              <p id="confirm-dialog-message" className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{config.message}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button data-dialog-initial-focus className="btn btn-secondary flex-1" style={{ justifyContent: "center" }} onClick={onClose}>
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
