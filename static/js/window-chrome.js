/**
 * Özel başlık çubuğu: küçült, büyüt/geri al, kapat ve çift tıkla büyütme.
 */
(function initWindowChrome() {
  const titlebar = document.getElementById("app-titlebar");
  if (!titlebar) return;

  document.documentElement.classList.add("desktop-chrome");

  const minimizeBtn = document.getElementById("titlebar-minimize");
  const maximizeBtn = document.getElementById("titlebar-maximize");
  const closeBtn = document.getElementById("titlebar-close");
  const dragRegion = titlebar.querySelector(".titlebar-drag");

  /**
   * pywebview JS köprüsünü güvenli şekilde çağırır.
   * @param {string} method
   * @returns {Promise<*>}
   */
  async function callDesktopApi(method) {
    const api = window.pywebview && window.pywebview.api;
    if (!api || typeof api[method] !== "function") {
      return null;
    }
    return api[method]();
  }

  /**
   * Büyütme ikonunu pencere durumuna göre günceller.
   * @param {boolean} maximized
   */
  function setMaximizedState(maximized) {
    titlebar.classList.toggle("is-maximized", Boolean(maximized));
    if (maximizeBtn) {
      maximizeBtn.setAttribute(
        "aria-label",
        maximized ? "Önceki boyuta dön" : "Tam ekran"
      );
    }
  }

  /**
   * Maximize / restore arasında geçer.
   */
  async function toggleMaximize() {
    const maximized = await callDesktopApi("toggle_maximize");
    if (typeof maximized === "boolean") {
      setMaximizedState(maximized);
      return;
    }
    titlebar.classList.toggle("is-maximized");
  }

  minimizeBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    callDesktopApi("minimize");
  });

  maximizeBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMaximize();
  });

  closeBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    callDesktopApi("close");
  });

  dragRegion?.addEventListener("dblclick", (event) => {
    if (event.target.closest(".titlebar-controls")) return;
    toggleMaximize();
  });

  window.addEventListener("pywebviewready", async () => {
    const maximized = await callDesktopApi("is_maximized");
    if (typeof maximized === "boolean") {
      setMaximizedState(maximized);
    }
  });
})();

/* 1.1: right-click paste and native edge resizing. */
(function () {
  const input = document.getElementById('url-input');
  let pasteRequest = 0;
  input?.addEventListener('contextmenu', async (event) => {
    event.preventDefault();
    const request = ++pasteRequest;
    const previous = input.value;
    try {
      const api = window.pywebview?.api;
      const text = String(api?.get_clipboard_text
        ? await api.get_clipboard_text()
        : await navigator.clipboard.readText()).trim();
      const link = new URL(text);
      if (!['http:', 'https:'].includes(link.protocol) || !link.hostname) return;
      if (request !== pasteRequest || input.value !== previous) return;
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.focus();
      input.scrollLeft = input.scrollWidth;
    } catch (_) { /* Empty/non-link clipboard leaves the current field intact. */ }
  });

  function installResizeEdges() {
    const api = window.pywebview?.api;
    if (!api?.resize_window || document.querySelector('.window-resize-edge')) return;
    let active = null;
    async function update(drag) {
      if (drag.sending || !drag.bounds) return;
      drag.sending = true;
      try {
        while (drag.dirty) {
          drag.dirty = false;
          const b = drag.bounds, d = drag.edge;
          const dx = (drag.x - drag.startX) * drag.dpr;
          const dy = (drag.y - drag.startY) * drag.dpr;
          const width = Math.max(b.minWidth, b.width + (d.includes('e') ? dx : d.includes('w') ? -dx : 0));
          const height = Math.max(b.minHeight, b.height + (d.includes('s') ? dy : d.includes('n') ? -dy : 0));
          await api.resize_window({ width: Math.round(width), height: Math.round(height),
            x: Math.round(d.includes('w') ? b.x + b.width - width : b.x),
            y: Math.round(d.includes('n') ? b.y + b.height - height : b.y) });
        }
      } catch (_) { drag.released = true; }
      finally { drag.sending = false; if (drag.released && active === drag) active = null; }
    }
    for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
      const grip = document.createElement('div');
      grip.className = `window-resize-edge resize-${edge}`;
      grip.setAttribute('aria-hidden', 'true');
      grip.addEventListener('pointerdown', async (event) => {
        if (event.button !== 0 || active) return;
        event.preventDefault();
        grip.setPointerCapture(event.pointerId);
        const drag = active = { edge, id: event.pointerId, startX: event.screenX, startY: event.screenY,
          x: event.screenX, y: event.screenY, dpr: window.devicePixelRatio || 1,
          bounds: null, dirty: false, sending: false, released: false };
        try {
          drag.bounds = await api.resize_window(null);
          if (!drag.bounds || drag.bounds.maximized) { if (active === drag) active = null; return; }
          update(drag);
        } catch (_) { if (active === drag) active = null; }
      });
      grip.addEventListener('pointermove', event => {
        if (!active || active.id !== event.pointerId || active.released) return;
        active.x = event.screenX; active.y = event.screenY; active.dirty = true; update(active);
      });
      function finish(event) {
        if (!active || active.id !== event.pointerId) return;
        active.x = event.screenX; active.y = event.screenY; active.dirty = true; active.released = true;
        update(active);
        if (grip.hasPointerCapture(event.pointerId)) grip.releasePointerCapture(event.pointerId);
      }
      grip.addEventListener('pointerup', finish);
      grip.addEventListener('pointercancel', finish);
      document.body.appendChild(grip);
    }
  }
  window.addEventListener('pywebviewready', installResizeEdges);
  installResizeEdges();
})();
