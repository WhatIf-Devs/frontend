import type { ToastTone } from "../../state/toast";
import "./toast.css";

interface ToastProps {
  message: string;
  tone: ToastTone;
}

// 토스트 한 개의 "보이는" 모양 (띄우고 지우는 건 ToastProvider가 해요)
// 스크린리더가 읽어 주는 건 ToastProvider의 알림 영역이 따로 맡아서,
// 여기는 aria-hidden으로 두 번 읽히지 않게 해요
export default function Toast({ message, tone }: ToastProps) {
  return (
    <div className={`toast toast--${tone}`} aria-hidden="true">
      <span className="toast__icon">{tone === "error" ? "!" : "✓"}</span>
      <span className="toast__message">{message}</span>
    </div>
  );
}
