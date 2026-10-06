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
  { date: "2026-09-17", file: "0917" },
  { date: "2026-09-19", file: "0919", vertical: true },
  { date: "2026-09-22", file: "0922", vertical: true },
  { date: "2026-09-22", file: "0922-4" },
  { date: "2026-09-25", file: "0925" },
  { date: "2026-09-26", file: "0926" },
  { date: "2026-09-27", file: "0927" },
  { date: "2026-09-27", file: "0927-3" },
  { date: "2026-10-01", file: "1001" },
  { date: "2026-10-06", file: "1006" },
];

(() => {
  const BASE = "assets/movie/";
  const movies = MOVIES
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.i - a.i);
  const src = (m) => `${BASE}${m.file}.mp4`;
  const poster = (m) => `${BASE}${m.file}.webp`;

  // ---- 一覧 ----
  const columns = [...document.querySelectorAll(".movie-grid__col")];
  const tiles = [];

  layoutColumns(movies).forEach(({ movie: m, column: i }) => {

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

// ---- 2 列への振り分け ----
// 守ること：縦動画どうしを、左右に並べない・同じ列で上下に続けない
//           左右の列の長さの差を、縦動画 1 本分ちょっとまでにする
// そのうえで：日付順（新しいものが先）の崩れがいちばん小さい並べ方を探す
// 見つからないとき（縦動画ばかりが続くなど）は、段で組み立てる方法に切り替える
// 戻り値：置く順の [{ movie, column }]（column は 0 = 左 / 1 = 右）
function layoutColumns(movies) {
  const H = 338 / 600, V = 1, EPS = 1e-6;  // 列幅を 1 としたときの高さ
  const LOOKAHEAD = 4;     // 何本先まで順番を入れ替えてよいか
  const MAX_DIFF = 1.2;    // 左右の列の長さの差の上限
  const MAX_STEPS = 300000;

  let best = null, bestCost = Infinity, steps = 0;

  (function search(remaining, heights, last, spans, placed, cost) {
    if (++steps > MAX_STEPS || cost >= bestCost) return;
    if (remaining.length === 0) { bestCost = cost; best = placed.slice(); return; }
    for (let k = 0; k < Math.min(LOOKAHEAD, remaining.length); k++) {
      const m = remaining[k];
      const size = m.vertical ? V : H;
      for (const c of heights[1] < heights[0] - EPS ? [1, 0] : [0, 1]) {
        const top = heights[c];
        if (Math.abs(top + size - heights[1 - c]) > MAX_DIFF) continue;
        if (m.vertical) {
          if (last[c]) continue;  // 上下に続く
          if (spans[1 - c].some(([a, b]) => a < top + size - EPS && top < b - EPS)) continue;  // 左右に並ぶ
        }
        const nh = heights.slice(); nh[c] += size;
        const nl = last.slice(); nl[c] = !!m.vertical;
        const ns = m.vertical ? spans.map((s, j) => (j === c ? [...s, [top, top + size]] : s)) : spans;
        placed.push({ movie: m, column: c });
        search(remaining.filter((_, j) => j !== k), nh, nl, ns, placed, cost + k);  // k = 飛ばした本数
        placed.pop();
      }
    }
  })(movies, [0, 0], [false, false], [[], []], [], 0);

  return best || layoutByRows(movies);
}

// 段で組み立てる方法（layoutColumns で見つからないときの代わり）
//   縦の段 … 縦動画 1 本の横に、横動画 2 本を縦に積む（600 と 338×2 でほぼ同じ高さ）
//   横の段 … 横動画 2 本を左右に並べる
// 縦動画を置く列は段ごとに左右入れ替える。横動画が足りない最後の縦動画は条件を守れないことがある
function layoutByRows(movies) {
  const rows = [];        // { vertical, sideV, horizontals: [] }
  let openPair = null;    // 横の段で、まだ 1 本しか入っていないもの
  let nextSide = 0;       // 次の縦動画を置く列

  movies.forEach((m) => {
    if (m.vertical) {
      const row = { vertical: m, sideV: nextSide, horizontals: [] };
      nextSide = 1 - nextSide;
      // 1 本だけの横の段があれば、その横動画をこの縦の段に移す
      if (openPair) {
        row.horizontals.push(openPair.horizontals[0]);
        rows.splice(rows.indexOf(openPair), 1);
        openPair = null;
      }
      rows.push(row);
      return;
    }
    // 横動画：横動画が足りない縦の段があれば、古い段から埋める
    const waiting = rows.find((r) => r.vertical && r.horizontals.length < 2);
    if (waiting) { waiting.horizontals.push(m); return; }
    if (openPair) { openPair.horizontals.push(m); openPair = null; return; }
    openPair = { vertical: null, horizontals: [m] };
    rows.push(openPair);
  });

  const placed = [];
  rows.forEach((r) => {
    if (r.vertical) {
      placed.push({ movie: r.vertical, column: r.sideV });
      r.horizontals.forEach((h) => placed.push({ movie: h, column: 1 - r.sideV }));
    } else {
      r.horizontals.forEach((h, j) => placed.push({ movie: h, column: j }));
    }
  });
  return placed;
}
