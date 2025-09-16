import headerLogo from "./assets/header.png";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-3 bg-white shadow-sm">
      {/* Logo */}
      <div className="flex items-center">
        <img src={headerLogo} alt="Cool English" className="h-12 w-auto" />
      </div>

      {/* 導覽列 */}
      <nav className="flex items-center space-x-6 text-[16px] font-medium">
        <a href="#">課程專區</a>
        <a href="#">比賽專區</a>
        <a href="#">協助中心</a>

        {/* 搜尋框 */}
        <div className="flex items-center border border-[#28A0B0] rounded-full overflow-hidden">
          <input
            type="text"
            placeholder="今天想上什麼課?"
            className="px-4 py-1 w-48 focus:outline-none"
          />
          <button className="bg-[#28A0B0] px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <a href="#">登入</a>
        <a href="#">註冊</a>
        <a href="#">English</a>
      </nav>
    </header>
  );
}
