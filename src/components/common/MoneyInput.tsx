import { useState } from "react";

interface MoneyInputProps {
  value: number; // 만원 단위 정수
  onChange: (value: number) => void;
  max?: number;
  placeholder?: string;
  id?: string;
}

// 금액 입력칸 (만원). type="number" 대신 글자 입력칸을 써서
// - 키보드로 바로 입력할 수 있고 (모바일에서는 숫자 키패드)
// - 숫자 말고는 입력되지 않으며 (마이너스 불가, INP-03)
// - 1,000처럼 쉼표가 자동으로 붙음 (COM-04)
export function MoneyInput({ value, onChange, max = 1_000_000, placeholder = "0", id }: MoneyInputProps) {
  // 입력 중인 글자. 0이면 빈칸으로 보여서 '0' 뒤에 숫자가 붙는 일이 없게 함
  const [text, setText] = useState(value ? value.toLocaleString() : "");

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, ""); // 숫자만 남김
    const n = Math.min(Number(digits || 0), max); // 범위 초과는 최대값으로 막음
    setText(digits ? n.toLocaleString() : "");
    onChange(n);
  };

  return (
    <span className="money-input">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
      />
      <span className="money-input__unit">만원</span>
    </span>
  );
}
