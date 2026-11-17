import { useCallback, useEffect, useState } from "react";
import type { Future } from "../types/future";

// 로그인 없이 "체험하기"로 들어온 사용자의 상황을 브라우저에 저장/조회하는 훅.
// W01의 "로그인 없이 체험하기", D화면의 "이 브라우저에만 저장" 버튼과 짝을 이룸.
// 나중에 로그인 기능이 붙으면, 이 훅의 안쪽 구현만 백엔드 호출로 바꾸고
// 화면 쪽 코드(FuturesListPage, FutureResultPage)는 그대로 둘 수 있도록
// save/remove/list 인터페이스를 고정해둠.

const STORAGE_KEY = "whatif:guest-futures";

function readFromStorage(): Future[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Future[]) : [];
  } catch {
    // localStorage 접근이 막힌 환경(프라이빗 모드 등) 대비
    return [];
  }
}

function writeToStorage(futures: Future[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(futures));
  } catch {
    // 저장 실패는 조용히 무시 (용량 초과 등) - 추후 토스트 등으로 안내 가능
  }
}

export function useLocalFutures() {
  const [futures, setFutures] = useState<Future[]>(() => readFromStorage());

  useEffect(() => {
    writeToStorage(futures);
  }, [futures]);

  const saveFuture = useCallback((future: Future) => {
    setFutures((prev) => {
      const exists = prev.some((f) => f.id === future.id);
      return exists
        ? prev.map((f) => (f.id === future.id ? future : f))
        : [...prev, future];
    });
  }, []);

  const removeFuture = useCallback((id: string) => {
    setFutures((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { futures, saveFuture, removeFuture };
}
