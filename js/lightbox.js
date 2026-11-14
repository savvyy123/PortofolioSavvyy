// ============================================
//  作品ページ：写真をクリックすると拡大して見せる（Figma 179:67）
//  - 白い画面の 1200 幅の枠に、写真を切らずに収める
//  - 右上の × / Esc / 写真の外をクリックで閉じる
//  - 左右の < > / ← → キーで前後の写真へ（端まで行ったら反対の端に戻る）
//  対象：メイン画像（YouTube は除く）と下の写真。同じ写真が 2 回出てくるときは 1 枚として数える
//
//  拡大用の高解像度の画像は、同じフォルダの zoom/ に同じ名前で置く
//  （例：assets/yourBalm/02.webp → assets/yourBalm/zoom/02.webp）。無いときはふつうの画像を出す
// ============================================

(() => {
  const sources = [...document.querySelectorAll("img.work-hero__image, .work-gallery img")];
  if (sources.length === 0) return;

  const zoomUrl = (src) => src.replace(/\/([^/]+)$/, "/zoom/$1");

  // 同じ写真（src が同じ）はまとめる
  const photos = [];
  const indexOf = new Map();
  sources.forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!indexOf.has(src)) {
      indexOf.set(src, photos.length);
      photos.push({ src, zoom: zoomUrl(src), alt: img.alt, ready: null });
    }
  });

  // 高解像度の画像を読み込む（1 枚につき 1 回だけ）。読めなかったらふつうの画像を使う
  function load(photo) {
    if (!photo.ready) {
      photo.ready = new Promise((resolve) => {
        const pre = new Image();
        pre.onload = () => resolve(photo.zoom);
        pre.onerror = () => resolve(photo.src);
        pre.src = photo.zoom;
      });
    }
    return photo.ready;
  }

  // ---- 拡大表示の画面（線は Figma と同じ 1.5px の黒） ----
  const box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "写真の拡大表示");
  box.innerHTML = `
    <div class="lightbox__frame">
      <img class="lightbox__image" alt="">
      <button class="lightbox__close" type="button" aria-label="閉じる">
        <svg width="35.36" height="35.36" viewBox="0 0 35.36 35.36" aria-hidden="true"><path d="M0 35.36 35.36 0M35.36 35.36 0 0"/></svg>
      </button>
      <button class="lightbox__prev" type="button" aria-label="前の写真">
        <svg width="17.68" height="35.36" viewBox="0 0 17.68 35.36" aria-hidden="true"><path d="M17.68 0 0 17.68l17.68 17.68"/></svg>
      </button>
      <button class="lightbox__next" type="button" aria-label="次の写真">
        <svg width="17.68" height="35.36" viewBox="0 0 17.68 35.36" aria-hidden="true"><path d="M0 0l17.68 17.68L0 35.36"/></svg>
      </button>
    </div>`;
  document.body.append(box);
  box.tabIndex = -1;

  const image = box.querySelector(".lightbox__image");
  const closeButton = box.querySelector(".lightbox__close");
  const single = photos.length < 2;
  box.querySelector(".lightbox__prev").hidden = single;
  box.querySelector(".lightbox__next").hidden = single;

  let current = 0;
  let showing = 0;          // 表示の切り替えごとに増やす（読み込みが遅れて届いたときに古い写真を出さないため）
  let opener = null;        // 閉じたらフォーカスを戻す写真
  let byKeyboard = false;   // キーボードで開いたか（マウスのときは × に枠を出さない）

  // 高解像度の画像が届いてから出す。1.5 秒かかるときは、先にふつうの画像を出す
  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    const token = ++showing;
    let fellBack = false;
    image.alt = photo.alt;
    image.classList.add("is-loading");
    const timer = setTimeout(() => {
      if (token !== showing) return;
      fellBack = true;
      image.src = photo.src;
      image.classList.remove("is-loading");
    }, 1500);
    load(photo).then((url) => {
      if (token !== showing || fellBack) return;
      clearTimeout(timer);
      image.src = url;
      image.classList.remove("is-loading");
    });
    // 前後の写真も先に読み込んでおく
    if (!single) {
      load(photos[(current + 1) % photos.length]);
      load(photos[(current - 1 + photos.length) % photos.length]);
    }
  }

  function open(index, from, viaKeyboard) {
    opener = from;
    byKeyboard = viaKeyboard;
    show(index);
    box.classList.add("is-open");
    document.documentElement.classList.add("is-lightbox-open");
    (viaKeyboard ? closeButton : box).focus({ preventScroll: true });
  }

  function close() {
    box.classList.remove("is-open");
    document.documentElement.classList.remove("is-lightbox-open");
    if (byKeyboard && opener) opener.focus({ preventScroll: true });
    else document.activeElement?.blur();
  }

  // ---- 写真をクリック（キーボードでは Enter / Space）で開く ----
  sources.forEach((img) => {
    const index = indexOf.get(img.currentSrc || img.src);
    img.classList.add("is-zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `${img.alt}（拡大して見る）`);
    // マウスを乗せた時点で高解像度の画像を読み込み始める
    img.addEventListener("pointerenter", () => load(photos[index]), { once: true });
    img.addEventListener("click", () => open(index, img, false));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(index, img, true); }
    });
  });

  // ---- 閉じる・前後 ----
  closeButton.addEventListener("click", close);
  box.querySelector(".lightbox__prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lightbox__next").addEventListener("click", () => show(current + 1));

  // 写真とボタン以外（白いところ）をクリックしたら閉じる
  box.addEventListener("click", (e) => {
    if (!e.target.closest(".lightbox__image, button")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && !single) show(current - 1);
    else if (e.key === "ArrowRight" && !single) show(current + 1);
  });
})();
