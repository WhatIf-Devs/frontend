import { createContext, useContext } from "react";
import type { AuthUser } from "../types/user";

// 로그인 상태 (기능명세서 COM-01, LST-01)
// 앱 전체가 "지금 로그인한 사람"을 같이 보는 곳이에요.
// - 화면에서 쓰는 법: const { user, signIn, signOut } = useAuth();
// - user가 null이면 비로그인(로그인 없이 체험 중 포함)
//
// 지금은 로그인이 가짜(mock)라서 로그인 정보를 이 브라우저(localStorage)에 기억해요.
// TODO(feature/auth-api): Firebase를 연결하면 AuthProvider 안쪽만
//   onAuthStateChanged(로그인 상태 변화 알림)로 바꾸면 되고, 화면 쪽 코드는 그대로 둬요.

/** 화면에서 쓰는 로그인 사용자 정보 */
export interface SessionUser {
  uid: string;
  email: string | null;
  nickname: string;
}

export interface AuthContextValue {
  user: SessionUser | null;
  /** 로그인·회원가입 성공 후 호출 → 로그인 상태로 기억 */
  signIn: (user: SessionUser) => void;
  /** 로그아웃 → 화면의 계정 정보를 지움 (정책표 13장) */
  signOut: () => Promise<void>;
}

// AuthProvider(src/state/AuthProvider.tsx)가 값을 채워 넣어요
export const AuthContext = createContext<AuthContextValue | null>(null);

/** 지금 로그인 상태 가져오기 (AuthProvider 안쪽 화면에서만 쓸 수 있어요) */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return value;
}

/**
 * 로그인 API 결과 → 화면용 사용자 정보
 * 닉네임 우선순위: 직접 넘긴 닉네임(회원가입 입력값) → 계정 이름 → 이메일 @ 앞부분
 */
export function toSessionUser(user: AuthUser, nickname?: string): SessionUser {
  const name = nickname?.trim() || user.displayName?.trim() || user.email?.split("@")[0] || "나";
  return { uid: user.uid, email: user.email, nickname: name };
}
