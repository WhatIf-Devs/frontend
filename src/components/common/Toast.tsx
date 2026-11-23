import type { ToastTone } from "../../state/toast";
import "./toast.css";

interface ToastProps {
  message: string;
  tone: ToastTone;
}

// 토스트 한 개의 모양 (띄우고 지우는 건 ToastProvider가 해요)
export default function Toast({ message, tone }: ToastProps) {
  return (
    <div
      className={`toast toast--${tone}`}
      // 스크린리더가 읽어 줘요. 실패는 바로(alert), 완료는 하던 말을 끝낸 뒤(status)
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="toast__icon" aria-hidden="true">
        {tone === "error" ? "!" : "✓"}
      </span>
      <span className="toast__message">{message}</span>
    </div>
  );
}
