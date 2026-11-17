// ============================================
//  Blog：Figma の 1440 幅の配置をそのまま使っているので、
//  窓が狭いとき（本文の幅が 1200 より狭いとき）は全体を同じ割合で縮める
//  スマホ（767px 以下）は上から順に並べる組み方なので縮めない
// ============================================

(() => {
  const blog = document.querySelector(".blog");
  if (!blog) return;
  const phone = matchMedia("(max-width: 767px)");

  function fit() {
    const scale = phone.matches ? 1 : Math.min(1, blog.clientWidth / 1200);
    blog.style.setProperty("--blog-scale", scale);
  }

  new ResizeObserver(fit).observe(blog);
  fit();
})();
