// ============================================
//  University ページ
//  授業名にホバー（キーボードではフォーカス）すると、その作品の写真を背景に出し、文字を白にする
//  写真は university.html の .university-backdrop に、id="bg-<data-bg の名前>" で置く
// ============================================

(() => {
  const page = document.body;
  const links = document.querySelectorAll(".university__courses [data-bg]");
  let current = null;

  function show(key) {
    if (current) current.classList.remove("is-active");
    current = key ? document.getElementById(`bg-${key}`) : null;
    if (current) current.classList.add("is-active");
    page.classList.toggle("is-backdrop", !!current);
  }

  // タッチだけの画面（スマホ）ではホバーがないので出さない（タップした瞬間に写真がちらつくのを防ぐ）
  if (!matchMedia("(hover: hover)").matches) return;

  links.forEach((link) => {
    const key = link.dataset.bg;
    link.addEventListener("pointerenter", () => show(key));
    link.addEventListener("pointerleave", () => show(null));
    link.addEventListener("focus", () => show(key));
    link.addEventListener("blur", () => show(null));
  });
})();
