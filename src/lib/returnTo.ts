// 로그인 후 "원래 있던 화면으로 돌아가기" (기능명세서 SAV-06)
//
// 쓰는 법
//   1) 보내는 쪽: navigate("/login", { state: { from: "/save" } })
//   2) 로그인·회원가입 화면: const returnTo = getReturnTo(useLocation().state)
//      → 성공하면 navigate(returnTo)
//
// from이 없으면 기본값 "/futures"(W03 내가 저장한 미래)로 가요.
// 안전을 위해 우리 사이트 안의 주소("/"로 시작)만 받아요.
// ("//다른사이트.com" 같은 주소로 튕겨 나가는 것 방지)

export const DEFAULT_AFTER_LOGIN = "/futures";

/** location.state에서 돌아갈 주소 꺼내기 */
export function getReturnTo(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return DEFAULT_AFTER_LOGIN;
}

/** 다음 화면에도 돌아갈 주소를 그대로 넘길 때 쓰는 state (로그인 ↔ 회원가입 오갈 때) */
export function keepReturnTo(returnTo: string) {
  return returnTo === DEFAULT_AFTER_LOGIN ? undefined : { from: returnTo };
}
