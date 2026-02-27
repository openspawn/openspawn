/**
 * ConfirmModal — destructive action confirmation with underwater theme.
 */

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ animation: 'fade-in 0.15s ease-out' }}>
      <div className="absolute inset-0 bg-[rgba(3,14,26,0.6)]" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(6,42,69,0.98) 0%, rgba(3,14,26,0.99) 100%)',
          border: '1px solid rgba(255,71,87,0.25)',
          boxShadow: '0 0 40px rgba(255,71,87,0.1)',
          animation: 'scale-in 0.2s ease-out',
        }}
      >
        <div className="text-base font-bold mb-2" style={{ color: '#FF4757', fontFamily: '"Baloo 2", cursive' }}>
          ⚠️ {title}
        </div>
        <p className="text-sm mb-6" style={{ color: 'rgba(184,228,247,0.6)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(74,174,217,0.1)',
              border: '1px solid rgba(74,174,217,0.2)',
              color: '#B8E4F7',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: 'rgba(255,71,87,0.2)',
              border: '1px solid rgba(255,71,87,0.4)',
              color: '#FF4757',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
