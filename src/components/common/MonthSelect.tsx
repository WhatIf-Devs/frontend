interface MonthSelectProps {
  value: string; // "YYYY-MM" 또는 아직 안 골랐으면 ""
  onChange: (value: string) => void;
  min?: string; // 고를 수 있는 가장 이른 달 "YYYY-MM"
  max?: string; // 고를 수 있는 가장 늦은 달
  id?: string;
}

// 연·월 고르기. <input type="month">는 Safari에서 그냥 빈 글자칸으로 보여서
// 무엇을 입력해야 하는지 알 수 없으므로, 연도·월 선택 상자 두 개로 대신함.
export function MonthSelect({ value, onChange, min, max, id }: MonthSelectProps) {
  const thisYear = new Date().getFullYear();
  const minYear = min ? Number(min.slice(0, 4)) : thisYear - 1;
  const maxYear = max ? Number(max.slice(0, 4)) : thisYear + 10;
  const [year, month] = value ? value.split("-") : ["", ""];

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  // 고른 연도에서 min~max 안에 드는 달만 보여줌 (계산 기간 밖은 선택 불가, INP-10)
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).filter((m) => {
    if (!year) return true;
    const ym = `${year}-${m}`;
    return (!min || ym >= min) && (!max || ym <= max);
  });

  const pick = (y: string, m: string) => {
    if (!y) return onChange("");
    // 연도만 바꿨는데 그 달이 범위 밖이면, 범위 안의 첫 달로 맞춤
    let ym = `${y}-${m || "01"}`;
    if (min && ym < min) ym = min;
    if (max && ym > max) ym = max;
    onChange(ym);
  };

  return (
    <span className="month-select">
      <select id={id} value={year} onChange={(e) => pick(e.target.value, month)}>
        <option value="">연도</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      <select value={month} onChange={(e) => pick(year, e.target.value)} disabled={!year}>
        <option value="">월</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {Number(m)}월
          </option>
        ))}
      </select>
    </span>
  );
}
