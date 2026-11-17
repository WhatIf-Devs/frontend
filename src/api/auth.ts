import type { AuthUser, EmailPasswordPayload } from "../types/user";

// W01(로그인) / W02(회원가입) 전용.
//
// 중요: 실제로는 백엔드에 로그인/회원가입 REST API가 없습니다.
// 이 서비스는 Firebase Authentication(이메일/비밀번호 + Google)을 그대로 쓰고,
// 백엔드는 프론트가 Authorization 헤더로 보낸 Firebase ID 토큰에서 user_uid만
// 추출해서 다른 API(상황 저장 등) 호출을 식별합니다.
//
// 그래서 여기 USE_MOCK=false로 바꿀 때는 fetch가 아니라 Firebase JS SDK를
// 붙여야 합니다. 대략:
//   import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
//            signInWithPopup, GoogleAuthProvider } from "firebase/auth";
//   const auth = getAuth(firebaseApp);
// 로그인 성공 후에는 auth.currentUser.getIdToken()으로 받은 토큰을
// 다른 api/*.ts 호출의 Authorization: Bearer <token> 헤더에 넣어주면 됨.

const USE_MOCK = true;

export async function loginWithEmail(payload: EmailPasswordPayload): Promise<AuthUser> {
  if (USE_MOCK) {
    return Promise.resolve({ uid: "mock-uid", email: payload.email, displayName: null });
  }
  // const cred = await signInWithEmailAndPassword(auth, payload.email, payload.password);
  // return toAuthUser(cred.user);
  throw new Error("Firebase Authentication 연동 필요");
}

export async function signupWithEmail(payload: EmailPasswordPayload): Promise<AuthUser> {
  if (USE_MOCK) {
    return Promise.resolve({ uid: "mock-uid", email: payload.email, displayName: null });
  }
  // const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
  // return toAuthUser(cred.user);
  throw new Error("Firebase Authentication 연동 필요");
}

export async function loginWithGoogle(): Promise<AuthUser> {
  if (USE_MOCK) {
    return Promise.resolve({ uid: "mock-uid", email: "mock@example.com", displayName: "다연" });
  }
  // const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  // return toAuthUser(cred.user);
  throw new Error("Firebase Authentication 연동 필요");
}
