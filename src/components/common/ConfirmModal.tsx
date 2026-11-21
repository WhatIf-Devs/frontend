import { useEffect, useRef } from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);

  // 키보드 사용자를 위해 (COM-10):
  // 열리면 커서(포커스)를 창 안 첫 버튼으로 옮기고, Tab을 눌러도 창 밖으로 나가지 않게 가둠.
  // 닫히면 원래 있던 곳(예: 삭제 버튼)으로 포커스를 돌려놓음.
  useEffect(() => {
    const previous = document.activeElement;
    const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>("button");
    const first = buttons?.[0];
    const last = buttons?.[buttons.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key !== "Tab" || !first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      {/* 모달 안쪽을 눌렀을 때는 닫히지 않게 클릭이 바깥으로 퍼지는 걸 막음 */}
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title} // 화면 낭독기가 "이 상황을 정말로 삭제하시겠습니까? 대화상자"처럼 읽음
        onClick={(e) => e.stopPropagation()}
      >
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
