// ============================================
//  ローディング：S ロゴ スイープアニメーション
//  上下の扇形を 0° → 270° に広げ、縦線 1 本からロゴを描く。
//  Cavalry 版（ロゴモーション_作業メモ.md）を SVG 座標に移植したもの。
// ============================================

(() => {
  // ---- 設定 (logo.svg 実測値。SVG 座標：Y 下向き、角度はプラスが時計回り) ----
  const R = 50;
  const UPPER = { x: 973.54, y: 448.98, start: 90 };   // 上の円：真下の半径から
  const LOWER = { x: 973.54, y: 504.53, start: 270 };  // 下の円：真上の半径から
  const SWEEP_MAX = 270;

  // ---- タイミング (ms) ----
  const SWEEP_DURATION = 2000;  // 扇形が開き切るまで（Cavalry のフレーム 0→50）
  const TOTAL_DURATION = 2400;  // 文字が出切るまで（フレーム 60）

  const loader = document.getElementById("loader");
  const mark = document.getElementById("loader-mark");

  // CSS の ease-in-out と同じ曲線（Cavalry の SlowInSlowOut の代わり）
  const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

  function piePath(c, sweepDeg) {
    const a0 = c.start * Math.PI / 180;
    const a1 = (c.start + sweepDeg) * Math.PI / 180;
    const x0 = c.x + R * Math.cos(a0);
    const y0 = c.y + R * Math.sin(a0);
    let d = `M${c.x},${c.y}L${x0},${y0}`;
    if (sweepDeg > 0.001) {
      const x1 = c.x + R * Math.cos(a1);
      const y1 = c.y + R * Math.sin(a1);
      const largeArc = sweepDeg > 180 ? 1 : 0;
      d += `A${R},${R} 0 ${largeArc} 1 ${x1},${y1}`;
    }
    return d + "Z";
  }

  function draw(t) {
    const sweep = SWEEP_MAX * t;
    mark.setAttribute("d", piePath(UPPER, sweep) + piePath(LOWER, sweep));
  }

  function play() {
    return new Promise((resolve) => {
      loader.classList.add("is-playing");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        draw(1);
        resolve();
        return;
      }

      const startTime = performance.now();
      function frame(now) {
        const elapsed = now - startTime;
        draw(easeInOut(Math.min(elapsed / SWEEP_DURATION, 1)));
        if (elapsed < TOTAL_DURATION) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function finish() {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  }

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  // 文字のフォントを読み込んでから再生し、読み込みが早くても最後まで見せる
  draw(0);
  document.fonts.load('42.95px "Neue Haas Grotesk Display Round"')
    .catch(() => {})
    .then(play)
    .then(() => pageLoaded)
    .then(finish);

  // ---- cubic-bezier(x1, y1, x2, y2) のイージング関数 ----
  function cubicBezier(x1, y1, x2, y2) {
    const bez = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
    return (x) => {
      if (x <= 0 || x >= 1) return x;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 30; i++) {
        t = (lo + hi) / 2;
        if (bez(x1, x2, t) < x) lo = t; else hi = t;
      }
      return bez(y1, y2, t);
    };
  }
})();
