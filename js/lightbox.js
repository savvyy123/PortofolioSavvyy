// ============================================
//  写真・動画をクリックすると拡大して見せる（Figma 179:67）
//  - 白い画面の 1200 幅の枠に、切らずに収める
//  - 右上の × / Esc / 写真の外をクリックで閉じる
//  - 左右の < > / ← → キーで前後へ（端まで行ったら反対の端に戻る）
//  - 3 秒操作がなければ × と < > をフェードアウトし、カーソルも消す。操作があれば戻す
//
//  作品ページ：メイン画像（YouTube は除く）と下の写真。同じ写真が 2 回出てくるときは 1 枚として数える
//    拡大用の高解像度の画像は、同じフォルダの zoom/ に同じ名前で置く
//    （例：assets/yourBalm/02.webp → assets/yourBalm/zoom/02.webp）。無いときはふつうの画像を出す
//  Movie：一覧の動画（js/movie.js が付けた data-order = 新しい順に送る）とメインの動画（いま流れている動画を開く）
// ============================================

(() => {
  const IDLE_MS = 3000;

  const sources = [...document.querySelectorAll("img.work-hero__image, .work-gallery img, video.movie-tile")]
    .map((el, i) => ({ el, order: Number(el.dataset.order ?? i) }))
    .sort((a, b) => a.order - b.order)
    .map(({ el }) => el);
  if (sources.length === 0) return;

  const srcOf = (el) => el.currentSrc || el.src;
  const zoomUrl = (src) => src.replace(/\/([^/]+)$/, "/zoom/$1");

  // 同じもの（src が同じ）はまとめる
  const items = [];
  const indexOf = new Map();
  sources.forEach((el) => {
    const src = srcOf(el);
    if (indexOf.has(src)) return;
    indexOf.set(src, items.length);
    items.push(el.tagName === "VIDEO"
      ? { type: "video", src, poster: el.poster, label: el.getAttribute("aria-label") || "" }
      : { type: "image", src, zoom: zoomUrl(src), label: el.alt, ready: null });
  });

  // 高解像度の画像を読み込む（1 枚につき 1 回だけ）。読めなかったらふつうの画像を使う
  function load(item) {
    if (item.type !== "image") return Promise.resolve(item.src);
    if (!item.ready) {
      item.ready = new Promise((resolve) => {
        const pre = new Image();
        pre.onload = () => resolve(item.zoom);
        pre.onerror = () => resolve(item.src);
        pre.src = item.zoom;
      });
    }
    return item.ready;
  }

  // ---- 拡大表示の画面（線は Figma と同じ 1.5px の黒） ----
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "拡大表示");
  box.innerHTML = `
    <div class="lightbox__frame">
      <img class="lightbox__image" alt="">
      <video class="lightbox__video" muted loop playsinline hidden></video>
      <button class="lightbox__close" type="button" aria-label="閉じる">
        <svg width="35.36" height="35.36" viewBox="0 0 35.36 35.36" aria-hidden="true"><path d="M0 35.36 35.36 0M35.36 35.36 0 0" vector-effect="non-scaling-stroke"/></svg>
      </button>
      <button class="lightbox__prev" type="button" aria-label="前へ">
        <svg width="17.68" height="35.36" viewBox="0 0 17.68 35.36" aria-hidden="true"><path d="M17.68 0 0 17.68l17.68 17.68"/></svg>
      </button>
      <button class="lightbox__next" type="button" aria-label="次へ">
        <svg width="17.68" height="35.36" viewBox="0 0 17.68 35.36" aria-hidden="true"><path d="M0 0l17.68 17.68L0 35.36"/></svg>
      </button>
    </div>`;
  document.body.append(box);
  box.tabIndex = -1;

  const image = box.querySelector(".lightbox__image");
  const video = box.querySelector(".lightbox__video");
  const closeButton = box.querySelector(".lightbox__close");
  const single = items.length < 2;
  box.querySelector(".lightbox__prev").hidden = single;
  box.querySelector(".lightbox__next").hidden = single;

  let current = 0;
  let showing = 0;          // 表示の切り替えごとに増やす（読み込みが遅れて届いたときに古いものを出さないため）
  let opener = null;        // 閉じたらフォーカスを戻す写真・動画
  let byKeyboard = false;   // キーボードで開いたか（マウスのときは × に枠を出さない）
  let pausedOnPage = [];    // 開いている間止めておく、ページの動画

  function stopVideo() {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];
    const token = ++showing;

    if (item.type === "video") {
      image.hidden = true;
      video.hidden = false;
      video.poster = item.poster;
      video.src = item.src;
      video.setAttribute("aria-label", item.label);
      video.play().catch(() => {});
      return;
    }

    // 画像：高解像度の画像が届いてから出す。1.5 秒かかるときは、先にふつうの画像を出す
    stopVideo();
    video.hidden = true;
    image.hidden = false;
    image.alt = item.label;
    image.classList.add("is-loading");
    let fellBack = false;
    const timer = setTimeout(() => {
      if (token !== showing) return;
      fellBack = true;
      image.src = item.src;
      image.classList.remove("is-loading");
    }, 1500);
    load(item).then((url) => {
      if (token !== showing || fellBack) return;
      clearTimeout(timer);
      image.src = url;
      image.classList.remove("is-loading");
    });
    // 前後も先に読み込んでおく
    if (!single) {
      load(items[(current + 1) % items.length]);
      load(items[(current - 1 + items.length) % items.length]);
    }
  }

  // ---- 3 秒操作がなければ × と < > とカーソルを隠す ----
  let idleTimer = 0;
  function wake() {
    box.classList.remove("is-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => box.classList.add("is-idle"), IDLE_MS);
  }
  ["mousemove", "mousedown", "keydown", "touchstart", "wheel"].forEach((type) => {
    document.addEventListener(type, () => {
      if (box.classList.contains("is-open")) wake();
    }, { passive: true, capture: true });
  });

  function open(index, from, viaKeyboard) {
    opener = from;
    byKeyboard = viaKeyboard;
    // ページで流れている動画は、開いている間止めておく
    pausedOnPage = [...document.querySelectorAll("video")].filter((v) => v !== video && !v.paused);
    pausedOnPage.forEach((v) => v.pause());
    show(index);
    box.classList.add("is-open");
    document.documentElement.classList.add("is-lightbox-open");
    (viaKeyboard ? closeButton : box).focus({ preventScroll: true });
    wake();
  }

  function close() {
    box.classList.remove("is-open", "is-idle");
    clearTimeout(idleTimer);
    document.documentElement.classList.remove("is-lightbox-open");
    stopVideo();
    pausedOnPage.forEach((v) => v.play().catch(() => {}));
    pausedOnPage = [];
    if (byKeyboard && opener) opener.focus({ preventScroll: true });
    else document.activeElement?.blur();
  }

  // ---- クリック（キーボードでは Enter / Space）で開く ----
  function makeZoomable(el, getIndex) {
    el.classList.add("is-zoomable");
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    const label = el.alt || el.getAttribute("aria-label") || "";
    if (el.tagName === "IMG") el.setAttribute("aria-label", `${label}（拡大して見る）`);
    el.addEventListener("click", () => open(getIndex(), el, false));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(getIndex(), el, true); }
    });
  }

  sources.forEach((el) => {
    const index = indexOf.get(srcOf(el));
    makeZoomable(el, () => index);
    // 写真はマウスを乗せた時点で高解像度の画像を読み込み始める
    if (el.tagName === "IMG") el.addEventListener("pointerenter", () => load(items[index]), { once: true });
  });

  // Movie のメインの動画：いま流れている動画を開く
  const hero = document.getElementById("movie-hero");
  if (hero) makeZoomable(hero, () => indexOf.get(srcOf(hero)) ?? 0);

  // ---- 閉じる・前後 ----
  closeButton.addEventListener("click", close);
  box.querySelector(".lightbox__prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lightbox__next").addEventListener("click", () => show(current + 1));

  // 写真・動画とボタン以外（白いところ）をクリックしたら閉じる
  box.addEventListener("click", (e) => {
    if (!e.target.closest(".lightbox__image, .lightbox__video, button")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && !single) show(current - 1);
    else if (e.key === "ArrowRight" && !single) show(current + 1);
  });

  // スマホ：左右にスワイプで前後へ（横に 50px 以上、縦より大きく動かしたとき）
  let touchX = null;
  let touchY = null;
  box.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { touchX = null; return; }
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (touchX === null || single) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    touchX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
