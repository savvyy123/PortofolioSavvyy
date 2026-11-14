// ============================================
//  スマホのメニュー（Figma: iPhone 14 & 15 Pro - 2）
//  右上の三本線で、白い画面にメニューを出す（三本線は × に変わる）
//  閉じる：× / メニューのリンク / Esc / 画面を PC の幅に広げたとき
// ============================================

(() => {
  const button = document.querySelector(".header__menu");
  const nav = document.getElementById("site-nav");
  if (!button || !nav) return;
  const root = document.documentElement;

  function set(open) {
    root.classList.toggle("is-menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  }

  button.addEventListener("click", () => set(!root.classList.contains("is-menu-open")));
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a[href]")) set(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-menu-open")) set(false);
  });
  matchMedia("(min-width: 768px)").addEventListener("change", (e) => {
    if (e.matches) set(false);
  });
})();
