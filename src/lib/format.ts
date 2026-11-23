// 금액·날짜 표기 함수 모음 (기능명세서 COM-02, 정책표 금액 표기)
// 모든 화면이 같은 모양으로 숫자를 보여 주도록 여기서만 만들고, 화면에서는 가져다 써요.
// 사용 예: import { formatMoney } from "../lib/format";
//
// 금액은 모두 "만원 단위 숫자"로 받아요. (예: 1050 → 1,050만원)
// 소수가 있으면 천원 단위까지 있는 금액으로 봐요. (예: 5.8 → 5만 8천원)
// 천원 단위로 딱 떨어지지 않아 반올림했을 때만 "약"을 붙여요. (예: 5.8333… → 약 5만 8천원)

const MINUS = "−"; // 명세서 표기: 하이픈(-)이 아닌 진짜 마이너스 기호(U+2212)

// ---------- 금액 ----------

/**
 * 만원 단위 금액 → 화면 표기
 * - 정수: 천 단위 쉼표  → 1050 → "1,050만원", 0 → "0만원"
 * - 천원 단위까지 있는 금액: "N만 N천원"  → 5.8 → "5만 8천원", 0.8 → "8천원"
 * - 천원 단위로 반올림해야 하는 금액(계산 결과 등)만 앞에 "약"
 *     70 ÷ 12 = 5.8333… → "약 5만 8천원", 12.04 → "약 12만원"
 * - 음수: 앞에 "−"  → -70 → "−70만원", -5.8 → "−5만 8천원"
 */
export function formatMoney(man: number): string {
  if (!Number.isFinite(man)) return "-";
  const sign = man < 0 ? MINUS : "";
  const abs = Math.abs(man);

  if (Number.isInteger(abs)) {
    return `${sign}${abs.toLocaleString("ko-KR")}만원`;
  }

  // 천원 단위로 반올림: 5.8만원 = 58천원 → 만 자리 5, 천 자리 8
  const totalCheon = Math.round(abs * 10);
  // 반올림 전후가 같으면 딱 떨어지는 금액 → "약" 없음
  // (컴퓨터 소수 계산은 5.8 × 10 = 58.00000000000001처럼 아주 작은 오차가 생겨서, 작은 차이는 같다고 봄)
  const rounded = Math.abs(abs * 10 - totalCheon) > 1e-9;
  const prefix = rounded ? "약 " : "";
  const manPart = Math.floor(totalCheon / 10);
  const cheonPart = totalCheon % 10;

  if (cheonPart === 0) return `${prefix}${sign}${manPart.toLocaleString("ko-KR")}만원`;
  if (manPart === 0) return `${prefix}${sign}${cheonPart}천원`;
  return `${prefix}${sign}${manPart.toLocaleString("ko-KR")}만 ${cheonPart}천원`;
}

/**
 * 늘고 줄어든 금액 → 부호를 붙인 표기
 * 50 → "+50만원", -70 → "−70만원", 0 → "0만원"
 */
export function formatSignedMoney(man: number): string {
  if (man > 0) return `+${formatMoney(man)}`.replace("+약 ", "약 +"); // "약"은 부호보다 앞에
  return formatMoney(man);
}

/** 증감 방향: 증가 "up"(초록) · 감소 "down"(빨강) · 변화 없음 "flat" */
export type MoneyTone = "up" | "down" | "flat";

export function moneyTone(man: number): MoneyTone {
  if (man > 0) return "up";
  if (man < 0) return "down";
  return "flat";
}

// ---------- 날짜 ----------

/**
 * 연월 → "2027.11"
 * "2027-11" 같은 글자나 Date 둘 다 받아요.
 */
export function formatYearMonth(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}.${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const match = /^(\d{4})-(\d{1,2})/.exec(value);
  if (!match) return value; // 모르는 모양이면 받은 그대로
  return `${match[1]}.${match[2].padStart(2, "0")}`;
}

/**
 * 수정 시각 → "11.05 21:10" (내 컴퓨터 시간대 기준)
 * ISO 글자("2026-11-05T12:10:00Z")나 Date 둘 다 받아요.
 */
export function formatUpdatedAt(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(date.getMonth() + 1)}.${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
}
