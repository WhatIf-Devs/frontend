import { useCallback, useEffect, useState, type ReactNode } from "react";
import Toast from "../components/common/Toast";
import { ToastContext, type ToastTone } from "./toast";

/** 토스트가 보이는 시간 (ms). 한 문장을 읽기에 넉넉한 3초 */
const VISIBLE_MS = 3000;

interface ToastState {
  id: number; // 같은 문구를 연달아 띄워도 "새 토스트"로 알아보게 하는 번호
  message: string;
  tone: ToastTone;
}

// 앱 전체를 감싸서, 어느 화면에서든 useToast()로 토스트를 띄울 수 있게 해요 (main.tsx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  // useCallback: 이 함수를 매번 새로 만들지 않게 해서, 쓰는 화면이 불필요하게 다시 그려지지 않게 해요
  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  // 토스트가 뜨면 3초 뒤에 지워요. 그 전에 새 토스트가 오면 타이머를 새로 시작해요
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* 스크린리더(화면 낭독기)용 알림 영역: 처음부터 항상 있고 "내용만" 바꿔요.
          영역이 메시지와 동시에 생기면 낭독기가 놓칠 수 있어서예요 (W3C 상태 메시지 기법).
          눈에는 안 보이고, 완료는 하던 말을 끝낸 뒤(status) / 실패는 바로(alert) 읽어요 */}
      <div className="toast-live" role="status" aria-live="polite" aria-atomic="true">
        {toast?.tone === "success" ? toast.message : ""}
      </div>
      <div className="toast-live" role="alert" aria-live="assertive" aria-atomic="true">
        {toast?.tone === "error" ? toast.message : ""}
      </div>

      {/* 눈에 보이는 토스트. key가 바뀌면 React가 새 요소로 보고 등장 애니메이션을 다시 재생해요 */}
      {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} />}
    </ToastContext.Provider>
  );
}
