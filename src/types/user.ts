// W01(로그인) / W02(회원가입)에서 쓰는 사용자 정보.
// 실제 백엔드에는 별도 회원 테이블이 없고 Firebase Authentication을 그대로 쓰며,
// 백엔드는 프론트가 보낸 Firebase ID 토큰에서 user_uid만 추출해서 사용함.

export interface AuthUser {
  uid: string; // Firebase UID
  email: string | null;
  displayName: string | null; // 닉네임 입력 필드 자체를 둘지는 기능명세서상 아직 미정(PM 확인 필요)
}

export interface EmailPasswordPayload {
  email: string;
  password: string;
}
