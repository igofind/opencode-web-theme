(() => {
  "use strict";

  // ===== 运行环境判断 =====
  // 这份脚本有两个使用场景：
  // 1) 浏览器打开的本地网页 http://127.0.0.1:49374 —— 由 Chrome 扩展自动注入；
  // 2) 桌面端应用窗口 oc://renderer/… —— Chrome 扩展进不去，需要在应用的 DevTools 控制台
  //    手动执行本文件。桌面端用的是自定义协议 oc:，不是 http:，所以要单独放行。
  // 其他地址一律不处理。
  const isWebPage =
    location.protocol === "http:" &&
    location.hostname === "127.0.0.1" &&
    location.port === "49374";
  const isDesktopApp =
    location.protocol === "oc:" &&
    location.hostname === "renderer";

  if (!isWebPage && !isDesktopApp) {
    return;
  }

  const NAV_VERSION = "nav-15";

  // 页面里跑的到底是哪一份脚本，控制台一眼能看出来
  console.info("[oc-nav] 已加载 " + NAV_VERSION);

  // ===== 可调参数 =====
  const SESSION_WIDTH = "90%";
  const BODY_FONT_SIZE = "15px";
  const SECONDARY_FONT_SIZE = "13.5px";
  const BODY_LINE_HEIGHT = "1.6";
  const UI_FONT = '"JetBrains Mono", "SF Mono", Menlo, "PingFang SC", monospace';
  const USER_PREFIX = "❯ ";

  const css = `
/* 全局等宽字体，并去掉外层 8px 的 shell 内边距 */
:root {
  --font-family-sans: ${UI_FONT} !important;
  --font-family-mono: ${UI_FONT} !important;
  --font-family-sans--font-feature-settings: "liga" 0, "calt" 0;
  --font-family-mono--font-feature-settings: "liga" 0, "calt" 0;
  --shell-inline-inset: 0px;
}

/* TUI opencode 主题色：浅色 */
:root {
  --tui-text: #1a1a1a;
  --tui-muted: #6f6f6f;
  --tui-code-bg: #f3f3f3;
  --tui-heading: #d68c27;
  --tui-strong: #d68c27;
  --tui-emph: #b0851f;
  --tui-code: #3d9a57;
  --tui-link: #3b7dd8;
  --tui-link-text: #318795;
  --tui-quote: #b0851f;
  --tui-hr: #8a8a8a;
  --tui-list: #3b7dd8;
  --tui-list-enum: #318795;
  --tui-table-stripe: rgba(0, 0, 0, 0.05);
}

/* 深色：跟随应用外观，不跟系统外观；正文比 TUI 的 #eee 更亮 */
:root[data-color-scheme=dark] {
  --tui-text: #fafafa;
  --tui-muted: #a0a0a0;
  --tui-code-bg: #1e1e1e;
  --tui-heading: #9d7cd8;
  --tui-strong: #f5a742;
  --tui-emph: #e5c07b;
  --tui-code: #7fd88f;
  --tui-link: #fab283;
  --tui-link-text: #56b6c2;
  --tui-quote: #e5c07b;
  --tui-hr: #808080;
  --tui-list: #fab283;
  --tui-list-enum: #56b6c2;
  --tui-table-stripe: rgba(255, 255, 255, 0.05);
}

/* 应用还没写入 data-color-scheme 时，用系统外观兜底 */
@media (prefers-color-scheme: dark) {
  :root:not([data-color-scheme]) {
    --tui-text: #fafafa;
    --tui-muted: #a0a0a0;
    --tui-code-bg: #1e1e1e;
    --tui-heading: #9d7cd8;
    --tui-strong: #f5a742;
    --tui-emph: #e5c07b;
    --tui-code: #7fd88f;
    --tui-link: #fab283;
    --tui-link-text: #56b6c2;
    --tui-quote: #e5c07b;
    --tui-hr: #808080;
    --tui-list: #fab283;
    --tui-list-enum: #56b6c2;
    --tui-table-stripe: rgba(255, 255, 255, 0.05);
  }
}

[data-component=markdown] {
  font-size: ${BODY_FONT_SIZE};
  line-height: ${BODY_LINE_HEIGHT};
  letter-spacing: 0;
  color: var(--tui-text);
}

/* 标题：缩小字号差，靠颜色和字重区分 */
[data-component=markdown] h1,
[data-component=markdown] h2,
[data-component=markdown] h3,
[data-component=markdown] h4,
[data-component=markdown] h5,
[data-component=markdown] h6 {
  color: var(--tui-heading);
  font-weight: 600;
}
[data-component=markdown] h1 { font-size: 1.2em; line-height: 1.3; margin: 1.2em 0 0.5em; }
[data-component=markdown] h2 { font-size: 1.1em; line-height: 1.35; margin: 1.1em 0 0.45em; }
[data-component=markdown] h3 { font-size: 1.05em; line-height: 1.4; margin: 1em 0 0.4em; }
[data-component=markdown] h4,
[data-component=markdown] h5,
[data-component=markdown] h6 { font-size: 1em; margin: 0.9em 0 0.35em; }

[data-component=markdown] p { margin: 0 0 0.7em; }
[data-component=markdown] ul,
[data-component=markdown] ol { margin: 0.3em 0 0.8em; padding-inline-start: 1.5em; }
[data-component=markdown] li { margin: 0.15em 0; }
[data-component=markdown] li > p { margin: 0; }
[data-component=markdown] li > ul,
[data-component=markdown] li > ol { margin: 0.15em 0; }

[data-component=markdown] strong,
[data-component=markdown] b { color: var(--tui-strong); font-weight: 600; }
[data-component=markdown] em { color: var(--tui-emph); }

[data-component=markdown] :not(pre) > code {
  color: var(--tui-code);
  background: none;
  padding: 0 1px;
  font-size: 0.95em;
  font-weight: 400;
}

[data-component=markdown] a {
  color: var(--tui-link);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in oklch, currentColor 45%, transparent);
}
[data-component=markdown] a code { color: var(--tui-link-text); }

[data-component=markdown] blockquote {
  margin: 0.7em 0;
  padding: 0.1em 0 0.1em 10px;
  border-inline-start: 2px solid var(--tui-quote);
  color: var(--tui-quote);
}
[data-component=markdown] li::marker { color: var(--tui-list); }
[data-component=markdown] ol li::marker { color: var(--tui-list-enum); }

[data-component=markdown] hr {
  height: 0;
  margin: 1.2em 0;
  border: 0;
  border-top: 1px solid var(--tui-hr);
}

/* 普通代码块：pre.highlights 自带内联背景，需要 !important 覆盖 */
[data-component=markdown] pre { margin: 0.7em 0 0.9em; }
[data-component=markdown] [data-component=markdown-code]:not([data-code-kind=shell]) > pre.highlights {
  background: var(--tui-code-bg) !important;
}

/* 表格 */
[data-component=markdown] table { margin: 0.8em 0; font-size: 0.95em; }
[data-component=markdown] th,
[data-component=markdown] td { padding: 4px 8px; }
[data-component=markdown] th { font-weight: 600; color: var(--tui-muted); }
/* 斑马纹：偶数行铺一层浅底，和奇数行区分开 */
[data-component=markdown] tbody tr:nth-child(even) td {
  background: var(--tui-table-stripe);
}

/* 消息区：去气泡、去卡片 */
[data-component=assistant-message] { gap: 6px; }
[data-component=text-part] { margin-top: 10px; }

[data-component=user-message] [data-slot=user-message-body] {
  width: 100%;
  max-width: 100%;
  margin-inline-start: 0;
  align-items: stretch;
}
[data-component=user-message] [data-slot=user-message-text] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  margin-block-end: 12px;
  padding: 8px 12px;
  background: color-mix(in oklab, var(--tui-strong) 22%, transparent) !important;
  border-radius: 0;
  border-inline-start: 3px solid var(--tui-strong);
  color: var(--tui-text);
}
[data-component=user-message] [data-slot=user-message-text]::before {
  content: ${JSON.stringify(USER_PREFIX)};
  color: var(--tui-strong);
  font-weight: 600;
}
[data-component=user-message] [data-slot=user-message-attachments] {
  justify-content: flex-start;
  margin-inline-start: 0;
}

/* 思考和 Shell 是次要信息：文字统一降灰，字号比正文小一档 */
[data-component=reasoning-part],
[data-component=reasoning-part] *,
[data-component=bash-output],
[data-component=bash-output] *,
[data-component=session-shell-message],
[data-component=session-shell-message] * {
  color: var(--tui-muted) !important;
}

[data-component=reasoning-part],
[data-component=reasoning-part] *,
[data-component=tool-part-wrapper],
[data-component=tool-part-wrapper] *,
[data-component=bash-output],
[data-component=bash-output] *,
[data-component=session-shell-message],
[data-component=session-shell-message] * {
  font-size: ${SECONDARY_FONT_SIZE} !important;
  line-height: 1.5;
}

[data-component=session-turn] [data-component=card] {
  --card-pad-y: 2px;
  --card-pad-r: 0px;
  --card-pad-l: 0px;
  border-radius: 0;
}
[data-component=task-tool-card] [data-component=task-tool-surface] {
  background: none;
  border-radius: 0;
  padding: 1px 0;
}
[data-component=collapsible] [data-slot=collapsible-trigger] { height: 26px; }

/* 布局：单列、隐藏辅助控件、输入框直角 */
[data-component=message-nav] { display: none !important; }

[data-component=text-part] [data-slot=text-part-copy-wrapper],
[data-component=user-message] [data-slot=user-message-copy-wrapper] {
  display: none;
}

[data-component=session-composer-dock] {
  border-top: 1px solid var(--v2-border-border-muted);
  padding-top: 8px;
}
/* 输入框与消息内容使用同样的左右内边距，避免输入框比正文宽 */
[data-component=session-composer-dock] > div {
  padding-inline: 16px;
}
@media (min-width: 768px) {
  [data-component=session-composer-dock] > div {
    padding-inline: 24px;
  }
}
[data-component=composer] { border-radius: 0; }

/* 输入框和占位提示共用字号与行高，避免占位文字和光标错位 */
[data-component=composer-editor],
[data-component=composer-scroll] > div.pointer-events-none,
[data-component=composer-editor] + div {
  font-size: ${BODY_FONT_SIZE};
  line-height: 1.5;
}
[data-component=composer-editor] { color: var(--tui-text); }
/* 占位文字用灰色，避免和已经输入的文字看起来一样 */
[data-component=composer-scroll] > div.pointer-events-none,
[data-component=composer-editor] + div {
  color: var(--tui-muted) !important;
}

[data-component=session-turn] [data-slot=session-turn-thinking-row] { margin-top: 8px; }

/* 右侧用户提示词导航：每个提示词一个刻度，垂直居中 */
#oc-user-nav {
  position: fixed;
  top: 50%;
  right: 48px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--oc-tick-gap, 3px);
  z-index: 40;
  pointer-events: none;
  /* 首屏刻度还没定型时先藏起来，落定后淡入；位置的微调也走过渡，不横向跳 */
  transition: right 0.12s ease, opacity 0.18s ease;
}
#oc-user-nav.is-hidden {
  opacity: 0;
  visibility: hidden;
}
/* 按钮本身透明，只负责"接住鼠标"：宽 12px + 左右各 4px 内边距 = 20px 热区；
   可见的刻度画在 ::before 上，悬停/高亮时只做横向拉伸，热区不变。 */
#oc-user-nav .oc-user-nav-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: content-box;
  width: var(--oc-tick-w, 12px);
  height: var(--oc-tick-row, 10px);
  padding: 0 4px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
#oc-user-nav .oc-user-nav-item::before {
  content: "";
  display: block;
  width: 100%;
  height: var(--oc-tick-h, 4px);
  border-radius: 1px;
  background: var(--tui-muted);
  opacity: 0.35;
  transform-origin: right center;
  transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}
#oc-user-nav .oc-user-nav-item:hover::before { opacity: 0.85; transform: scaleX(1.25); }
#oc-user-nav .oc-user-nav-item.is-active::before {
  opacity: 1;
  transform: scaleX(1.5);
  background: var(--tui-heading);
}
`;

  let headObserver;

  // 应用自己的 CSS 会在页面加载过程中陆续插入 <style>；把我们的样式保持在 head 最后，
  // 否则同优先级的规则可能被应用后插入的样式覆盖。
  function keepLast() {
    const style = document.getElementById("oc-tui-style");
    const head = document.head;
    if (!style || !head) return;
    if (style.parentNode !== head || head.lastElementChild !== style) {
      head.appendChild(style);
    }
  }

  function apply() {
    const root = document.documentElement;
    const head = document.head;
    if (!root || !head) return false;

    document.getElementById("oc-markdown-typography")?.remove();
    root.style.setProperty("--container-session", SESSION_WIDTH);

    let style = document.getElementById("oc-tui-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "oc-tui-style";
    }
    style.textContent = css;
    head.appendChild(style);

    if (!headObserver) {
      headObserver = new MutationObserver(keepLast);
      headObserver.observe(head, { childList: true });
    }
    return true;
  }

  // document_start 时 <head> 可能还没解析出来；一出现就立即注入，不等页面加载完。
  if (!apply()) {
    const waitForHead = new MutationObserver(() => {
      if (apply()) waitForHead.disconnect();
    });
    waitForHead.observe(document, { childList: true, subtree: true });
  }

  // ===== 右侧用户提示词导航（刻度条）=====
  // 每条用户提示词一个刻度，垂直居中贴在消息列右缘。
  // 列表不是"当前视口里的消息"，而是"这个会话里渲染过的用户提示词"：
  // 时间线是虚拟列表（视口外只保留 ±2 行），又会按页往前加载历史，
  // 所以这里按消息 id 去重累积，随历史加载和新消息自然增长，切换会话时清空。
  // 点击不自己算滚动位置：改写 hash（#message-<id>）并派发 popstate，
  // 由应用自身的 revealMessage 链路完成"加载 → 强制渲染该行 → 滚动"。
  const USER_NAV_ID = "oc-user-nav";
  const NAV_EDGE_MIN = 48;
  window.__ocUserNav?.destroy?.();

  const nav = {
    order: [],
    index: new Map(),
    text: new Map(),
    activeId: "",
    sessionKey: "",
    container: null,
    buttons: new Map(),
    activeBtn: null,
    host: null,
    hostTriedAt: 0,
    tickStyle: "",
    right: 10,
    destroyed: false,
  };

  function rowId(scope) {
    const row = scope.closest?.("[data-message-id]");
    return row ? row.dataset.messageId || "" : "";
  }

  // 用 textContent 而不是 innerText：innerText 会强制样式/布局计算，扫描时不该碰
  function promptText(el) {
    const text = el.querySelector("[data-slot=user-message-text]");
    return (text ? text.textContent : "").trim().replace(/\s+/g, " ");
  }

  // 当前 DOM 里的用户提示词，按文档顺序（= 会话内的时间顺序）
  function scanPrompts() {
    const out = [];
    const seen = new Set();
    for (const el of document.querySelectorAll("[data-component=user-message]")) {
      const id = rowId(el);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      // 已经记过的提示词不再读文本（只用来做悬停提示）
      out.push({ id, text: nav.text.get(id) ? "" : promptText(el) });
    }
    return out;
  }

  function rebuildIndex() {
    nav.index.clear();
    nav.order.forEach((id, i) => nav.index.set(id, i));
  }

  function insertAt(pos, items) {
    items.forEach((it) => nav.text.set(it.id, it.text));
    nav.order.splice(pos, 0, ...items.map((it) => it.id));
    rebuildIndex();
  }

  // 消息 id 里前 12 位是生成时间（十六进制）；整批都是没见过的消息时，
  // 只能靠它判断这批应该落在已有序列表的前面还是后面。
  function prefixOf(id) {
    return id.slice(4, 16);
  }

  function lowerBound(key) {
    let lo = 0;
    let hi = nav.order.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prefixOf(nav.order[mid]) < key) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function mergePrompts(batch) {
    const fresh = batch.filter((it) => !nav.index.has(it.id));
    // 文本可能上次没拿到，补上
    batch.forEach((it) => {
      if (it.text && !nav.text.get(it.id)) nav.text.set(it.id, it.text);
    });
    if (!fresh.length) return false;
    if (!nav.order.length) {
      insertAt(0, fresh);
      return true;
    }

    const anchor = batch.findIndex((it) => nav.index.has(it.id));
    if (anchor >= 0) {
      // 以批次里第一个已知项为锚，把前后的新项按批次顺序插到它旁边
      let pos = nav.index.get(batch[anchor].id);
      const before = batch.slice(0, anchor).filter((it) => !nav.index.has(it.id));
      if (before.length) {
        insertAt(pos, before);
        pos = nav.index.get(batch[anchor].id);
      }
      let cursor = pos + 1;
      for (let i = anchor + 1; i < batch.length; i++) {
        const it = batch[i];
        if (nav.index.has(it.id)) {
          cursor = nav.index.get(it.id) + 1;
          continue;
        }
        insertAt(cursor, [it]);
        cursor += 1;
      }
      return true;
    }

    // 整批全新：按生成时间判断整批在已有序列表的位置
    const key = prefixOf(fresh[0].id);
    if (key < prefixOf(nav.order[0])) insertAt(0, fresh);
    else if (key > prefixOf(nav.order[nav.order.length - 1])) insertAt(nav.order.length, fresh);
    else insertAt(lowerBound(key), fresh);
    return true;
  }

  // 只切换前后两个按钮的 class，避免每次滚动都遍历全部刻度
  function paintActive() {
    if (!nav.container) return;
    const next = nav.buttons.get(nav.activeId) || null;
    if (next === nav.activeBtn) return;
    nav.activeBtn?.classList.remove("is-active");
    next?.classList.add("is-active");
    nav.activeBtn = next;
  }

  function setActive(id) {
    if (nav.activeId === id) return;
    nav.activeId = id;
    paintActive();
  }

  // 首屏静默期：补全还没落定就往条上挂刻度，会先出现 1~2 条再变成十几条，
  // 中途还会整条重建，看起来就是反复闪。
  // 所以条先建好但保持不可见，等补全有结论或超时后再淡入，一次成型。
  const NAV_REVEAL_TIMEOUT = 1200;
  const reveal = { since: 0, shown: false };
  let revealTimer = 0;

  function silentOver() {
    return reveal.since > 0 && Date.now() - reveal.since >= NAV_REVEAL_TIMEOUT;
  }

  function removeTicks() {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = 0;
    }
    nav.container?.remove();
    nav.container = null;
    nav.buttons.clear();
    nav.activeBtn = null;
    reveal.shown = false;
  }

  function setTickLabel(btn, id, i, n) {
    const preview = nav.text.get(id) || "";
    const label = `提示词 ${i + 1}/${n}` + (preview ? `：${preview.slice(0, 40)}` : "");
    if (btn.title === label) return;
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }

  function makeTick(id, i, n) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "oc-user-nav-item";
    btn.dataset.id = id;
    btn.addEventListener("click", () => jumpTo(id));
    setTickLabel(btn, id, i, n);
    return btn;
  }

  // 只往末尾追加，不整条清空重建；中间插入时才重建"第一个对不上的位置"之后的部分。
  function syncTicks(n) {
    const kids = [...nav.container.children];
    let same = 0;
    while (same < kids.length && same < n && kids[same].dataset.id === nav.order[same]) same++;
    for (let i = kids.length - 1; i >= same; i--) kids[i].remove();
    if (same < n) {
      const frag = document.createDocumentFragment();
      for (let i = same; i < n; i++) frag.appendChild(makeTick(nav.order[i], i, n));
      nav.container.appendChild(frag);
    }
    nav.buttons.clear();
    const all = [...nav.container.children];
    all.forEach((btn, i) => {
      nav.buttons.set(nav.order[i], btn);
      setTickLabel(btn, nav.order[i], i, n);
    });
    // 高亮按钮可能刚被重建，清掉引用让 paintActive 重新挂上 class
    nav.activeBtn = null;
  }

  function maybeReveal() {
    if (reveal.shown || !nav.container || !nav.order.length) return;
    if (seed.state !== "done" && seed.state !== "failed" && !silentOver()) return;
    reveal.shown = true;
    nav.container.classList.remove("is-hidden");
  }

  // 静默期结束：还没淡入的按当前状态收敛一次
  function settleTicks() {
    if (!nav.container) return;
    maybeReveal();
  }

  // 补全可能一直没结论（会话 id 还没出现），静默期到点也要自己收敛，不能等 DOM 再变
  function scheduleReveal() {
    if (revealTimer || reveal.shown) return;
    const waited = reveal.since ? Date.now() - reveal.since : 0;
    revealTimer = setTimeout(() => {
      revealTimer = 0;
      settleTicks();
    }, Math.max(0, NAV_REVEAL_TIMEOUT - waited) + 20);
  }

  function renderTicks() {
    if (nav.destroyed || !document.body) return;
    const n = nav.order.length;
    if (!n) return;
    if (!reveal.since) reveal.since = Date.now();

    if (!nav.container) {
      nav.container = document.createElement("nav");
      nav.container.id = USER_NAV_ID;
      nav.container.addEventListener("mousemove", onNavHover);
      nav.container.addEventListener("mouseleave", clearHoverJump);
      if (!reveal.shown) nav.container.classList.add("is-hidden");
      document.body.appendChild(nav.container);
      nav.container.style.right = NAV_EDGE_MIN + "px";
      nav.right = NAV_EDGE_MIN;
      placeNav();
      settlePlace();
    }

    // 条数多时压缩刻度和间距，保证整条不超出屏幕
    const usable = Math.max(120, Math.min(window.innerHeight * 0.62, 620));
    const per = usable / n;
    const row = Math.max(8, Math.min(14, Math.floor(per * 0.7))); // 每行热区高度
    const bar = Math.max(2, Math.min(7, Math.round(row * 0.55))); // 可见刻度高度
    const gap = Math.max(0.5, Math.min(8, Math.floor((per - row) * 10) / 10));
    if (nav.tickStyle !== row + "/" + bar + "/" + gap) {
      nav.tickStyle = row + "/" + bar + "/" + gap;
      nav.container.style.setProperty("--oc-tick-row", row + "px");
      nav.container.style.setProperty("--oc-tick-h", bar + "px");
      nav.container.style.setProperty("--oc-tick-gap", gap + "px");
    }

    if (nav.container.childElementCount !== n) syncTicks(n);
    paintActive();
    placeNav();
    maybeReveal();
    if (!reveal.shown) scheduleReveal();
    mirrorState();
  }

  function scrollHost() {
    if (nav.host && nav.host.isConnected) return nav.host;
    nav.host = null;
    if (Date.now() - nav.hostTriedAt < 500) return null;
    nav.hostTriedAt = Date.now();
    const first = document.querySelector("[data-component=user-message]");
    let node = first ? first.parentElement : null;
    while (node && node !== document.body) {
      const overflowY = getComputedStyle(node).overflowY;
      if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 4) {
        nav.host = node;
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  // 消息列右缘：优先实测消息行（它就是列容器，宽 = --container-session，居中）；
  // 一行都没渲染时按布局规则算：列宽取 --container-session，居中在时间线内容层里。
  function columnRight() {
    let edge = 0;
    for (const row of document.querySelectorAll("[data-message-id]")) {
      const rect = row.getBoundingClientRect();
      if (rect.width > 0 && rect.right > edge) edge = rect.right;
    }
    if (edge) return edge;

    const content = document.querySelector("[data-timeline-virtual-content]");
    if (!content) return 0;
    const box = content.getBoundingClientRect();
    if (!box.width) return 0;
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--container-session").trim();
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return 0;
    const width = Math.min(box.width, raw.endsWith("%") ? (box.width * value) / 100 : value);
    return box.left + (box.width + width) / 2;
  }

  // 摆位状态：calls 记录调了几次，edge/right 是最后一次量到的值
  // seen 记录量到过的不同列右缘，用来判断"是不是量早了"（值会从旧值变成新值）
  const place = { calls: 0, edge: 0, right: 0, applied: false, seen: [] };

  // 刚进会话时面板宽度、滚动条、字体都还在变化，量到的列宽可能是旧值。
  // 所以在容器出现后的一段时间里反复摆几次，直到量到的值稳定。
  let settleTimers = [];
  function settlePlace() {
    settleTimers.forEach(clearTimeout);
    settleTimers = [60, 200, 500, 1000, 2000].map((ms) => setTimeout(placeNav, ms));
    settleTimers.push(
      setTimeout(() => {
        placeNav();
        console.info("[oc-nav] 位置", {
          right: nav.container ? nav.container.style.right || "(空)" : "(无导航节点)",
          edge: Math.round(place.edge),
          calls: place.calls,
          seen: place.seen,
        });
      }, 3500)
    );
  }

  // 列宽变化（面板展开/收起、窗口缩放）时重新摆位
  let columnObserver = null;
  let columnObserved = null;
  function observeColumn() {
    if (typeof ResizeObserver !== "function") return;
    const content = document.querySelector("[data-timeline-virtual-content]");
    if (!content || content === columnObserved) return;
    columnObserver ||= new ResizeObserver(() => placeNav());
    if (columnObserved) columnObserver.unobserve(columnObserved);
    columnObserved = content;
    columnObserver.observe(content);
  }

  function placeNav() {
    place.calls += 1;
    if (!nav.container) return { edge: 0, right: 0, applied: false, reason: "no-container" };
    const edge = columnRight();
    // 列右缘外侧 10px；列几乎占满窗口时至少留 NAV_EDGE_MIN，免得看起来贴在窗口边上
    const right = edge
      ? Math.max(NAV_EDGE_MIN, Math.round(window.innerWidth - edge) - 10)
      : NAV_EDGE_MIN;
    place.edge = edge;
    place.right = right;
    const rounded = Math.round(edge);
    if (rounded && place.seen[place.seen.length - 1] !== rounded) {
      place.seen.push(rounded);
      if (place.seen.length > 8) place.seen.shift();
    }
    // 差值小于 2px 不重写：既避免无意义的写入，也让过渡不抖
    if (Math.abs(right - nav.right) >= 1.5) {
      nav.right = right;
      nav.container.style.right = right + "px";
      place.applied = true;
    }
    return { edge, right, applied: place.applied };
  }

  // 用视口里最靠上的提示词行当"当前条"；一行都没渲染时保持上一次的高亮
  function updateActiveFromViewport() {
    if (!nav.container) return;
    const rows = document.querySelectorAll("[data-component=user-message]");
    if (!rows.length) return;
    const host = scrollHost();
    const fold = host
      ? host.getBoundingClientRect().top + host.clientHeight * 0.32
      : window.innerHeight * 0.32;
    let id = "";
    for (const el of rows) {
      if (el.getBoundingClientRect().top > fold) break;
      id = rowId(el) || id;
    }
    if (id && nav.index.has(id)) setActive(id);
  }

  // 鼠标停在刻度上就跳。停留 250ms 才触发，鼠标扫过整条不会连跳；
  // 换到另一条时重新计时，移出导航即取消。
  const HOVER_JUMP_DELAY = 250;
  let hoverTimer = 0;
  let hoverId = "";

  function clearHoverJump() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = 0;
    }
    hoverId = "";
  }

  function onNavHover(event) {
    const btn = event.target?.closest?.(".oc-user-nav-item");
    const id = btn ? btn.dataset.id : "";
    if (!id) {
      clearHoverJump();
      return;
    }
    if (id === hoverId) return;
    clearHoverJump();
    hoverId = id;
    hoverTimer = setTimeout(() => {
      hoverTimer = 0;
      jumpTo(id);
    }, HOVER_JUMP_DELAY);
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function rowOf(id) {
    for (const el of document.querySelectorAll("[data-message-id]")) {
      if (el.dataset.messageId === id) return el;
    }
    return null;
  }

  // 应用没有暴露"跳到某条消息"的接口，时间线又是虚拟列表（视口外只渲染 ±2 行），
  // 所以目标行不在 DOM 里时，只能把时间线滚到那一端，等应用把那一页加载出来，再滚过去。
  const REVEAL_MAX_STEPS = 16;
  const REVEAL_STEP_MS = 320;

  async function scrollUntilRendered(id, token) {
    const host = scrollHost();
    const index = nav.index.get(id);
    if (!host || index === undefined) return false;

    let firstAt = Infinity;
    let lastAt = -1;
    for (const el of document.querySelectorAll("[data-message-id]")) {
      const at = nav.index.get(el.dataset.messageId);
      if (at === undefined) continue;
      if (at < firstAt) firstAt = at;
      if (at > lastAt) lastAt = at;
    }
    const up = index < firstAt;

    let prevRows = -1;
    let prevScroll = -1;
    for (let step = 0; step < REVEAL_MAX_STEPS; step++) {
      if (token !== revealToken) return false;
      host.scrollTop = up ? 0 : host.scrollHeight;
      await sleep(REVEAL_STEP_MS);
      if (token !== revealToken) return false;
      const row = rowOf(id);
      if (row) {
        row.scrollIntoView({ block: "start" });
        return true;
      }
      // 行数和滚动位置都不再变化，说明这一端没有更多历史可加载了
      const rows = document.querySelectorAll("[data-message-id]").length;
      const scroll = Math.round(host.scrollTop);
      if (rows === prevRows && scroll === prevScroll) return false;
      prevRows = rows;
      prevScroll = scroll;
    }
    return false;
  }

  let revealToken = 0;

  async function jumpTo(id) {
    if (!id) return;
    const token = ++revealToken;
    setActive(id);

    // 网页端：改写 hash 并派发 popstate，让应用的 router 先自己试一次
    if (!isDesktopApp) {
      const hash = "#message-" + id;
      history.replaceState(history.state, "", location.pathname + location.search + hash);
      window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
    }

    // 目标已经渲染就直接滚过去；没渲染就自己把那一页加载出来
    const row = rowOf(id);
    if (row) {
      row.scrollIntoView({ block: "start" });
      return;
    }
    await sleep(280);
    if (token !== revealToken) return;
    const late = rowOf(id);
    if (late) {
      late.scrollIntoView({ block: "start" });
      return;
    }
    await scrollUntilRendered(id, token);
  }

  // 会话 id 从页面最近的接口请求里取，web 和桌面端都适用；取不到才退回标题。
  // 只认 ses_ 前缀、至少 8 位，避免把别的字段当成 id。
  const SESSION_ID_RE = /(ses_[A-Za-z0-9]{8,})/;
  // getEntriesByType 每次都会建一个几百项的新数组，扫描最多每秒一次
  let resourceCache = { at: 0, id: "" };
  function sessionIdFromResources() {
    const own = SESSION_ID_RE.exec(location.pathname || "") || SESSION_ID_RE.exec(location.hash || "");
    if (own) return own[1];
    const now = Date.now();
    if (now - resourceCache.at < 1000) return resourceCache.id;
    let id = "";
    const entries = performance.getEntriesByType?.("resource") || [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const name = entries[i].name || "";
      if (name.indexOf("ses_") < 0) continue;
      const m = SESSION_ID_RE.exec(name);
      if (m) {
        id = m[1];
        break;
      }
    }
    resourceCache = { at: now, id };
    return id;
  }

  function sessionKeyNow() {
    const id = sessionIdFromResources();
    if (id) return id;
    const title = document.querySelector("[data-session-title]");
    return (location.pathname || "") + "|" + (title ? title.textContent.trim().slice(0, 80) : "");
  }

  // ===== 首屏补全 =====
  // 应用进会话只加载最近 20 条消息，而且只渲染视口附近那几行，所以旧会话首屏可能
  // 一条提示词都不在 DOM 里。这里补拉最新一页（200 条消息）把刻度先铺出来；
  // 更早的仍然跟着滚动累积，不做全量拉取。
  const NAV_AUTH_KEY = "oc-user-nav-password";
  const NAV_ASKED_KEY = "oc-user-nav-auth-asked";
  // 补全状态：key=当前会话、state=idle/running/done/failed、tries=已试次数、timer=重试定时器
  const seed = { key: "", state: "idle", tries: 0, status: 0, error: "", timer: 0 };
  const SEED_MAX_TRIES = 8;
  const SEED_RETRY_MS = 1500;

  function seedStop() {
    if (seed.timer) clearTimeout(seed.timer);
    seed.timer = 0;
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  // 应用自己发请求时会显式加 Authorization: Basic（用户名 opencode，密码存在它的"服务器连接"里），
  // 浏览器并没有缓存 HTTP Basic 凭据，所以这里不能指望"同源就自动带凭据"。
  function authHeader() {
    const password = storageGet(NAV_AUTH_KEY);
    return password ? "Basic " + btoa("opencode:" + password) : "";
  }

  // web 端首次用 auth_token 打开时，密码就在地址里；应用挂载后会把它从地址里删掉，
  // 所以脚本在 document_start 就要读。
  function passwordFromUrl() {
    try {
      const token = new URLSearchParams(location.search).get("auth_token");
      return token && token.trim() ? token.trim() : "";
    } catch {
      return "";
    }
  }

  // 桌面端把"服务器连接"（含 url 和 password）存在 localStorage 里，web 端一般没有。
  // 扫一遍能省掉一次手输；找不到就返回空。
  function passwordFromStorage() {
    const host = "127.0.0.1:49374";
    const pick = (node, depth) => {
      if (!node || typeof node !== "object" || depth > 6) return "";
      if (typeof node.password === "string" && node.password) {
        const url = String(node.url || (node.http && node.http.url) || "");
        if (url.indexOf(host) >= 0) return node.password;
      }
      for (const value of Object.values(node)) {
        const hit = pick(value, depth + 1);
        if (hit) return hit;
      }
      return "";
    };
    let found = "";
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const raw = localStorage.getItem(localStorage.key(i));
        if (!raw || raw.indexOf(host) < 0) continue;
        try {
          found = pick(JSON.parse(raw), 0);
        } catch {
          found = "";
        }
        if (found) break;
      }
    } catch {}
    return found;
  }

  function rememberPassword() {
    if (storageGet(NAV_AUTH_KEY)) return true;
    const found = passwordFromUrl() || passwordFromStorage();
    if (!found) return false;
    storageSet(NAV_AUTH_KEY, found);
    return true;
  }

  // credentials 用 same-origin：桌面端（oc://）读 127.0.0.1 是跨源，带凭据的响应
  // 要求服务端回 Access-Control-Allow-Credentials，而它没有，会被浏览器判成
  // Failed to fetch；鉴权本来就靠下面的 Authorization 头，不依赖 cookie。
  async function navFetch(path) {
    const url = "http://127.0.0.1:49374" + path;
    const send = (auth) =>
      fetch(url, { credentials: "same-origin", headers: auth ? { Authorization: auth } : undefined });
    rememberPassword();
    let res = await send(authHeader());
    if (res.status !== 401) return res;

    // 密码是错的或没存：允许问一次，之后不再打扰（留空等于放弃补全）
    if (storageGet(NAV_AUTH_KEY) && !storageGet(NAV_ASKED_KEY)) storageSet(NAV_AUTH_KEY, "");
    if (!storageGet(NAV_ASKED_KEY)) {
      storageSet(NAV_ASKED_KEY, "1");
      const password = window.prompt(
        "OpenCode 本地服务密码（opencode service get password），留空跳过："
      );
      if (password && password.trim()) storageSet(NAV_AUTH_KEY, password.trim());
    }
    if (!storageGet(NAV_AUTH_KEY)) return res;
    return send(authHeader());
  }

  // 失败原因记下来，方便在控制台用 __ocUserNav.debug() 查。
  // 会话 id 还没出现、5xx、网络错误都值得再试；401（用户没给密码）不重试，免得反复弹。
  function seedFail(status, error, retryable) {
    seed.state = "failed";
    seed.status = status;
    seed.error = error;
    mirrorState();
    if (seed.tries === 1) console.warn("[oc-nav] 首屏补全失败", { status, error });
    if (!retryable || seed.tries >= SEED_MAX_TRIES) return;
    const key = seed.key;
    seedStop();
    seed.timer = setTimeout(() => {
      seed.timer = 0;
      if (!nav.destroyed && seed.key === key) seedFromApi();
    }, SEED_RETRY_MS);
  }

  // 地址和接口请求里都拿不到会话 id 时，问服务端"当前会话是谁"。
  // 正常情况不会走到这里：页面自己拉过消息，resource 里就有 id。
  async function resolveSessionId() {
    const known = sessionIdFromResources();
    if (known) return known;
    try {
      const res = await navFetch("/api/session/active");
      if (!res.ok) return "";
      const body = await res.json();
      return body?.data?.id || "";
    } catch {
      return "";
    }
  }

  async function seedFromApi() {
    if (seed.state === "running" || seed.state === "done") return;
    seedStop();
    // 先占位再 await，避免并发的多次 maybeSeed 各发一遍请求
    seed.state = "running";
    seed.tries += 1;
    const sessionID = await resolveSessionId();
    if (!sessionID) {
      seedFail(0, "no-session：地址和接口请求里都没有会话 id", true);
      return;
    }
    try {
      const query = "?limit=200&order=desc";
      const res = await navFetch(`/api/session/${encodeURIComponent(sessionID)}/message${query}`);
      if (!res.ok) {
        seedFail(res.status, "接口返回 " + res.status, res.status >= 500);
        return;
      }
      const body = await res.json();
      const users = (body.data || []).filter((m) => m.type === "user").reverse();
      const batch = users.map((m) => ({
        id: m.id,
        text: String(m.metadata?.displayText || m.text || "").replace(/\s+/g, " ").trim(),
      }));
      seed.state = "done";
      seed.status = 200;
      seed.error = "";
      // 即使没有新条数也要重渲染一次：静默期要靠它判断是否可以淡入了
      mergePrompts(batch);
      renderTicks();
    } catch (error) {
      seedFail(0, String(error && error.message ? error.message : error), true);
    }
  }

  // 会话变了就重置；重试由 seedFail 里的定时器自己排，不依赖 DOM 再变化
  function maybeSeed() {
    if (seed.key !== nav.sessionKey) {
      seed.key = nav.sessionKey;
      seed.state = "idle";
      seed.tries = 0;
      seed.error = "";
      seedStop();
    }
    if (seed.state === "running" || seed.state === "done" || seed.timer) return;
    seedFromApi();
  }

  function resetNav() {
    nav.order = [];
    nav.index.clear();
    nav.text.clear();
    nav.activeId = "";
    removeTicks();
    nav.host = null;
    reveal.since = 0;
    reveal.shown = false;
  }

  // content script 跑在隔离世界，页面控制台看不到它的 window（所以 __ocUserNav 读不到）。
  // 把关键状态镜像到 <html data-oc-nav>，出问题时在控制台读
  // document.documentElement.dataset.ocNav 就能看到，不用再靠现象猜。
  function mirrorState() {
    const el = document.documentElement;
    if (!el || !el.dataset) return;
    const value = [
      NAV_VERSION,
      "n=" + nav.order.length,
      "seed=" + seed.state + (seed.tries ? "/" + seed.tries : "") + (seed.error ? " " + seed.error : ""),
      "shown=" + (reveal.shown ? 1 : 0),
      "right=" + nav.right,
    ].join(" | ");
    if (el.dataset.ocNav !== value) el.dataset.ocNav = value;
  }

  function scanNav() {
    if (nav.destroyed || !document.body) return;
    const key = sessionKeyNow();
    if (key !== nav.sessionKey) {
      nav.sessionKey = key;
      resetNav();
    }
    maybeSeed();
    if (mergePrompts(scanPrompts())) renderTicks();
    observeColumn();
    placeNav();
    updateActiveFromViewport();
    mirrorState();
  }

  let navScanTimer = 0;
  function scheduleNav() {
    if (navScanTimer) return;
    navScanTimer = setTimeout(() => {
      navScanTimer = 0;
      scanNav();
    }, 150);
  }

  let navFrame = 0;
  function onNavScroll() {
    if (navFrame) return;
    navFrame = requestAnimationFrame(() => {
      navFrame = 0;
      // 位置只跟列宽有关，和滚动无关；列宽变化由 ResizeObserver 负责
      updateActiveFromViewport();
    });
  }
  function onNavResize() {
    scheduleNav();
  }

  window.addEventListener("scroll", onNavScroll, true);
  window.addEventListener("resize", onNavResize);
  const navObserver = new MutationObserver(scheduleNav);
  // document_start 时 body 还不存在，先挂在 documentElement 上，等 body 出现再切过去
  let waitForBodyObserver = null;
  function observeNavBody() {
    if (!document.body) return false;
    navObserver.observe(document.body, { childList: true, subtree: true });
    return true;
  }
  if (!observeNavBody()) {
    waitForBodyObserver = new MutationObserver(() => {
      if (observeNavBody()) waitForBodyObserver.disconnect();
    });
    waitForBodyObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  }
  scheduleNav();

  // 同一页面重复执行脚本时先清掉上一份，避免两个实例抢同一条导航
  window.__ocUserNav = {
    debug() {
      return {
        href: location.href,
        desktop: isDesktopApp,
        sessionKey: nav.sessionKey,
        sessionId: sessionIdFromResources(),
        count: nav.order.length,
        activeId: nav.activeId,
        seed: { state: seed.state, tries: seed.tries, status: seed.status, error: seed.error },
        hasPassword: !!storageGet(NAV_AUTH_KEY),
        navRight: nav.container ? nav.container.style.right || "(空)" : "(无导航节点)",
        place: { calls: place.calls, edge: Math.round(place.edge), right: place.right, seen: place.seen },
      };
    },
    placeNow() {
      return placeNav();
    },
    destroy() {
      nav.destroyed = true;
      if (navScanTimer) {
        clearTimeout(navScanTimer);
        navScanTimer = 0;
      }
      if (navFrame) {
        cancelAnimationFrame(navFrame);
        navFrame = 0;
      }
      clearHoverJump();
      seedStop();
      settleTimers.forEach(clearTimeout);
      settleTimers = [];
      columnObserver?.disconnect();
      columnObserver = null;
      columnObserved = null;
      navObserver.disconnect();
      waitForBodyObserver?.disconnect();
      window.removeEventListener("scroll", onNavScroll, true);
      window.removeEventListener("resize", onNavResize);
      nav.container?.remove();
      nav.container = null;
      nav.order = [];
      nav.index.clear();
      nav.text.clear();
    },
  };
})();
