import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupWithEmail } from "../api/auth";

// W02 · 회원가입
export function SignupPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }
    if (!agreed) {
      setError("서비스 이용약관에 동의해주세요.");
      return;
    }
    setError(null);
    try {
      await signupWithEmail({ email, password });
      navigate("/futures");
    } catch {
      setError("회원가입에 실패했어요.");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-page__intro">
        <h1>내 손 안에 가장 쉬운 자산 시뮬레이터</h1>
        <p>계좌 연동 없이, 대략 아는 숫자만으로 미래 자산을 시뮬레이션해요.</p>
      </section>

      <section className="auth-page__form">
        <h2>회원가입</h2>
        <p>이메일로 가입하고 내 미래를 저장하세요.</p>
        <form onSubmit={handleSubmit}>
          <label>
            닉네임
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} required />
          </label>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dayeon@example.com"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자 이상, 영문·숫자·특수문자 포함"
              required
            />
          </label>
          <label>
            비밀번호 확인
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </label>
          <label className="auth-page__checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            [필수] 서비스 이용약관 및 개인정보 수집·이용 동의
          </label>
          {error && <p className="auth-page__error">{error}</p>}
          <button type="submit">가입하고 시작하기</button>
        </form>
        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </div>
  );
}
