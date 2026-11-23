import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import logoBadge from "../../assets/login/logo-badge.png";
import logoWordmark from "../../assets/login/logo-wordmark.svg";

// 와이어프레임 전 화면 상단에 반복되는 네비게이션 바 (기능명세서 COM-01)
// 왼쪽: 로고(아이콘 + What If?) / 내 미래 / 새 상황 만들기 — 지금 있는 메뉴는 굵게
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
        {/* 로고 → "/" : 로그인 상태면 W03, 아니면 W01 (App.tsx) */}
        <Link to="/" className="app-header__logo" aria-label="What If? 처음으로">
          <img className="app-header__badge" src={logoBadge} width={45} height={42} alt="" />
          {/* 모바일(768px 미만)에서는 자리가 좁아 글자 로고를 숨기고 아이콘만 보여요 (App.css) */}
          <img className="app-header__wordmark" src={logoWordmark} width={105} height={27} alt="What If?" />
        </Link>
        <nav className="app-header__nav">
          {/* NavLink: 지금 주소와 같으면 is-active 클래스가 붙어 굵게 보임.
              end: "/futures"가 "/futures/new"에서도 켜지지 않도록 정확히 같을 때만 */}
          <NavLink to="/futures" end className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            내 미래
          </NavLink>
          <NavLink to="/futures/new" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            새 상황 만들기
          </NavLink>
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
