// 모든 백엔드 응답의 공통 래퍼 (API 명세서 기준)
export interface ApiEnvelope<T> {
  isSuccess: boolean;
  code: string; // 예: "SCENARIO409_1", "CONDITION400_3", "COMMON400_1"
  message: string;
  result: T | null;
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}
