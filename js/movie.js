// ============================================
//  Movie ページ
//  - 一覧：日付の新しい順に、2 列のうち下端が上にある方へ詰めて並べる
//  - 一覧の動画：画面に見えているものだけ再生（音なし・ループ）
//  - メイン：新しい順に 1 本ずつ再生し、最後まで行ったら最初に戻る
// ============================================

// 動画を足すときはここに 1 行追加する（tools/encode-movie.swift で mp4 とサムネイルを作る）
// date: 撮影フォルダの日付 / file: assets/movie/ のファイル名 / vertical: 縦動画なら true
// 同じ日付のものは、あとに書いた方を新しいとみなして上に出す
const MOVIES = [
  { date: "2026-09-03", file: "0903" },
  { date: "2026-09-13", file: "0913", vertical: true },
  { date: "2026-09-14", file: "0914" },
  { date: "2026-09-17", file: "0917" },
  { date: "2026-09-19", file: "0919", vertical: true },
  { date: "2026-09-22", file: "0922", vertical: true },
  { date: "2026-09-25", file: "0925" },
  { date: "2026-09-26", file: "0926" },
  { date: "2026-09-27", file: "0927" },
  { date: "2026-09-27", file: "0927-3" },
];

(() => {
  const BASE = "assets/movie/";
  const movies = MOVIES
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.i - a.i);
  const src = (m) => `${BASE}${m.file}.mp4`;
  const poster = (m) => `${BASE}${m.file}.webp`;

  // ---- 一覧 ----
  // 列幅を 1 としたときの高さ：横 338/600、縦 600/600
  const columns = [...document.querySelectorAll(".movie-grid__col")];
  const heights = columns.map(() => 0);
  const tiles = [];

  movies.forEach((m) => {
    const i = heights[1] < heights[0] ? 1 : 0;
    heights[i] += m.vertical ? 1 : 338 / 600;

    const video = document.createElement("video");
    video.className = "movie-tile" + (m.vertical ? " movie-tile--vertical" : "");
    video.src = src(m);
    video.poster = poster(m);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-label", m.date.replaceAll("-", "."));
    columns[i].append(video);
    tiles.push(video);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  tiles.forEach((v) => observer.observe(v));

  // ---- メイン ----
  const hero = document.getElementById("movie-hero");
  let current = 0;

  function playHero(index) {
    current = index;
    hero.src = src(movies[current]);
    hero.poster = poster(movies[current]);
    hero.play().catch(() => {});
  }

  hero.muted = true;
  hero.addEventListener("ended", () => playHero((current + 1) % movies.length));
  playHero(0);
})();
