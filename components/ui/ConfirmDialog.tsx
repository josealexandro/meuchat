"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 active:bg-red-600 text-white"
      : "bg-accent-500 hover:bg-accent-600 active:bg-accent-600 text-white";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      onClick={loading ? undefined : onCancel}
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden bg-gradient-to-b from-primary-800 to-primary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
            {variant === "danger" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-300"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/80"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            )}
          </div>
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-white mb-2"
          >
            {title}
          </h2>
          <p id="confirm-dialog-desc" className="text-sm text-white/80 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl border border-white/30 text-white/90 hover:bg-white/10 active:bg-white/15 font-medium transition-colors touch-manipulation disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors touch-manipulation disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Apagando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
