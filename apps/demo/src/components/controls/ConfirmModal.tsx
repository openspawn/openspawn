/**
 * ConfirmModal — destructive action confirmation with underwater theme.
 */

import { ModalContainer } from "../ui/modal-container";
import { ActionButton } from "../ui/action-button";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ModalContainer intent="destructive" size="sm" onClose={onCancel}>
      <div className="text-base font-bold font-display text-bb-coral-500 mb-2">⚠️ {title}</div>
      <p className="text-sm font-body text-bb-ocean-200/60 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3">
        <ActionButton intent="ocean" size="lg" fullWidth onClick={onCancel}>
          Cancel
        </ActionButton>
        <ActionButton intent="coral" size="lg" fullWidth className="font-bold" onClick={onConfirm}>
          {confirmLabel}
        </ActionButton>
      </div>
    </ModalContainer>
  );
}
