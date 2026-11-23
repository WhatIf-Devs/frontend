import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue, type SessionUser } from "./auth";

// 로그인 상태를 앱 전체에 나눠 주는 상자 (main.tsx에서 <App />을 감싸요)
// 피그마로 치면 모든 페이지가 참조하는 전역 변수(Variable)를 여기서 만들어 두는 거예요.

const STORAGE_KEY = "whatif:auth-user";

// 브라우저에 기억해 둔 로그인 정보 읽기 (새로고침해도 로그인 유지)
function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    // 모양이 이상하면(직접 고쳤거나 옛날 형식) 로그인 안 한 것으로 봄
    if (typeof parsed.uid !== "string" || typeof parsed.nickname !== "string") return null;
    return { uid: parsed.uid, email: parsed.email ?? null, nickname: parsed.nickname };
  } catch {
    return null; // 저장소를 못 쓰는 환경(프라이빗 모드 등)
  }
}

function writeStoredUser(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장 실패는 무시: 이번 방문 동안은 화면에서 로그인 상태가 유지돼요
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // useState(함수): 처음 한 번만 저장소에서 읽어 옴
  const [user, setUser] = useState<SessionUser | null>(readStoredUser);

  const signIn = useCallback((next: SessionUser) => {
    setUser(next);
    writeStoredUser(next);
  }, []);

  const signOut = useCallback(async () => {
    // TODO(feature/auth-api): Firebase 연결 시 여기서 await firebaseSignOut(auth) 호출
    setUser(null);
    writeStoredUser(null);
  }, []);

  // user가 바뀔 때만 새 값을 만들어서, 쓸데없이 모든 화면이 다시 그려지지 않게 함
  const value = useMemo<AuthContextValue>(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
