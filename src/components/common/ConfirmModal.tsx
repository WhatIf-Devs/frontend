import { useEffect } from "react";

interface ConfirmModalProps {
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean; // 삭제처럼 되돌릴 수 없는 동작이면 true
  onConfirm: () => void;
  onCancel: () => void;
}

// 한 번 더 묻는 확인 모달 (COM-02).
// 바깥 어두운 영역을 누르거나 ESC를 누르면 '취소'와 같게 닫힘.
export function ConfirmModal({ title, description, confirmLabel, danger, onConfirm, onCancel }: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      {/* 모달 안쪽을 눌렀을 때는 닫히지 않게 클릭이 바깥으로 퍼지는 걸 막음 */}
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
        <div className="modal__actions">
          <button type="button" onClick={onCancel}>
            취소
          </button>
          <button type="button" className={danger ? "button--danger" : "button--primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
