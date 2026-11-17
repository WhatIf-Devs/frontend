import { Link } from "react-router-dom";

interface HeaderProps {
  nickname?: string; // 로그인 상태면 "다연" 같은 닉네임 표시, 비로그인이면 "로그인" 링크
}

// 와이어프레임 전 화면 상단에 반복되는 네비게이션 바 (로고 / 내 미래 / 새 상황 만들기 / 닉네임·로그인)
export function Header({ nickname }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link to="/" className="app-header__logo">
          What If?
        </Link>
        <nav className="app-header__nav">
          <Link to="/futures">내 미래</Link>
          <Link to="/futures/new">새 상황 만들기</Link>
        </nav>
      </div>
      <div className="app-header__right">
        {nickname ? <span>{nickname}</span> : <Link to="/login">로그인</Link>}
      </div>
    </header>
  );
}
