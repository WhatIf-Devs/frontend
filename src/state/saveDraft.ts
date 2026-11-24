import type { SaveTarget } from "../types/version";

// W10 저장 화면에 입력하던 이름·메모·저장 방식 "초안" (CodeRabbit 리뷰 반영, PR #17)
// '로그인하고 저장'으로 로그인 화면에 다녀오면 저장 화면이 처음부터 다시 그려져서
// 입력값이 기본값으로 돌아가요. 그래서 떠나기 직전에 여기 적어 두고, 돌아오면 꺼내 써요.
// - sessionStorage: 탭을 닫기 전까지 남는 저장소 (작업 중인 상황과 같은 곳)
// - 같은 저장 대상(같은 상황·같은 버전)일 때만 복원해요. 다른 걸 저장하러 왔으면 무시
// - 저장에 성공하면 지워요

const KEY = "whatif:save-draft";

export type SaveMode = "new" | "overwrite";

export interface SaveDraft {
  targetKey: string;
  name: string;
  memo: string;
  mode: SaveMode;
}

/**
 * 저장 대상을 구분하는 글자: "작업 고유 id : 버전 번호"
 * 새 상황은 원래 상황 id가 없고 V1 제목도 늘 '기존 플랜'이라, 예전 방식(원래 id·번호·제목)으로는
 * 서로 다른 새 상황끼리 키가 같아져 남의 초안이 채워질 수 있었어요 (CodeRabbit 리뷰 반영, PR #17)
 */
export function saveTargetKey(target: SaveTarget): string {
  return `${target.workingId}:${target.version.no}`;
}

/** 초안 적어 두기. 저장소를 못 쓰면 false */
export function writeSaveDraft(draft: SaveDraft): boolean {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/** 같은 저장 대상의 초안이 있으면 꺼내기 (없거나 다른 대상이면 null) */
export function readSaveDraft(targetKey: string): SaveDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as SaveDraft;
    return draft.targetKey === targetKey ? draft : null;
  } catch {
    return null;
  }
}

/** 초안 지우기 (저장 성공 후) */
export function clearSaveDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // 못 지워도 다음에 다른 대상이면 무시되니 괜찮음
  }
}
