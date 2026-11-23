import { createContext, useContext } from "react";

// 토스트 (기능명세서 ACC-03, LST-01, LST-05, LST-08)
// 화면 아래에 잠깐 떴다가 저절로 사라지는 작은 알림이에요.
// - 화면에서 쓰는 법: const showToast = useToast();
//                     showToast("‘상황 1’을 삭제했어요.");
//                     showToast("삭제하지 못했어요. 다시 시도해 주세요.", "error");
// - 토스트는 한 번에 하나만 보여요. 새 토스트가 오면 이전 것을 바로 바꿔요.

/** success: 완료 안내(초록 체크) / error: 실패 안내(빨간 느낌표) */
export type ToastTone = "success" | "error";

export type ShowToast = (message: string, tone?: ToastTone) => void;

// ToastProvider(src/state/ToastProvider.tsx)가 값을 채워 넣어요
export const ToastContext = createContext<ShowToast | null>(null);

/** 어느 화면에서든 토스트를 띄우는 함수를 꺼내 써요 */
export function useToast(): ShowToast {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast는 <ToastProvider> 안에서만 쓸 수 있어요 (main.tsx 확인)");
  }
  return showToast;
}
