import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";

// 와이어프레임 전 화면 상단에 반복되는 네비게이션 바 (기능명세서 COM-01)
// 왼쪽: 로고 / 내 미래 / 새 상황 만들기
// 오른쪽: 로그인 상태면 닉네임 칩, W03(내 미래)에서는 그 옆에 "로그아웃"
//         비로그인(체험 중 포함)이면 닉네임·로그아웃 없이 "로그인" 링크
export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const onFuturesList = location.pathname === "/futures"; // W03

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login"); // 로그아웃 → W01 (정책표 13장)
    } catch {
      // TODO(feature/toast-modal): 토스트 "로그아웃하지 못했어요. 다시 시도해 주세요." (LST-01)
    }
  };

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
        {user ? (
          <>
            {/* 닉네임 칩 (나중에 누르면 계정 메뉴: ACC-12, 시간이 남으면) */}
            <span className="app-header__nickname">{user.nickname}</span>
            {onFuturesList && (
              <button type="button" className="app-header__logout" onClick={handleLogout}>
                로그아웃
              </button>
            )}
          </>
        ) : (
          <Link to="/login" className="app-header__login">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
