/* Atamation Arkanoid — isolated easter egg, no downloader dependencies. */
(function initArkanoid() {
  'use strict';
  const overlay = document.getElementById('runner-overlay');
  const canvas = document.getElementById('runner-canvas');
  const closeBtn = document.getElementById('runner-close');
  if (!overlay || !canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 880, H = 420, STEP = 1 / 240;
  const colors = ['#818cf8', '#22d3ee', '#2dd4bf', '#50accd', '#617dd9'];
  const BEST_KEY = 'atamation.arkanoid.best';
  const keys = new Set();
  let open = false, raf = 0, last = 0, accumulator = 0, previousFocus = null;
  let score = 0, best = 0, lives = 3, level = 1, mode = 'ready', pausedFrom = 'ready';
  let paddle = { x: W / 2 - 58, y: H - 42, w: 116, h: 12 };
  let ball = { x: W / 2, y: H - 50, r: 7, vx: 0, vy: 0 };
  let bricks = [], particles = [], trail = [];
  try { best = Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0); } catch (_) {}
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function persistBest() {
    best = Math.max(best, score);
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) {}
  }
  function buildBricks() {
    bricks = [];
    const rows = Math.min(6, 4 + level);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < 10; col++) {
        bricks.push({ x: 29 + col * 83, y: 65 + row * 28, w: 75, h: 19,
          color: colors[row % colors.length], points: (rows - row) * 10, alive: true });
      }
    }
  }
  function placeBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
    ball.vx = ball.vy = 0;
    trail = [];
  }
  function resetGame() {
    score = 0; lives = 3; level = 1; mode = 'ready';
    paddle.x = W / 2 - paddle.w / 2;
    particles = []; buildBricks(); placeBall();
  }
  function launch() {
    if (mode === 'paused') { mode = pausedFrom; last = 0; return; }
    if (mode === 'over') resetGame();
    if (mode !== 'ready') return;
    const speed = Math.min(560, 335 + (level - 1) * 30);
    ball.vx = speed * .36; ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
    mode = 'playing';
  }
  function pause() {
    if (mode === 'paused') { mode = pausedFrom; last = 0; }
    else if (mode === 'playing' || mode === 'ready') { pausedFrom = mode; mode = 'paused'; }
    keys.clear();
  }
  function typing(target) {
    return target instanceof HTMLElement &&
      (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
  }
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function burst(brick) {
    for (let i = 0; i < 9; i++) particles.push({
      x: ball.x, y: ball.y, vx: (Math.random() - .5) * 160,
      vy: (Math.random() - .6) * 160, life: .45, color: brick.color
    });
  }
  function step(dt) {
    if (mode !== 'playing' && mode !== 'ready') return;
    const dir = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'));
    paddle.x = clamp(paddle.x + dir * 660 * dt, 16, W - 16 - paddle.w);
    if (mode === 'ready') { placeBall(); return; }
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    const px = ball.x, py = ball.y;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x - ball.r < 14) { ball.x = 14 + ball.r; ball.vx = Math.abs(ball.vx); }
    if (ball.x + ball.r > W - 14) { ball.x = W - 14 - ball.r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - ball.r < 46) { ball.y = 46 + ball.r; ball.vy = Math.abs(ball.vy); }
    if (ball.vy > 0 && py + ball.r <= paddle.y + 2 && ball.y + ball.r >= paddle.y &&
      ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w) {
      const offset = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1);
      const angle = offset * 1.05;
      const speed = Math.min(620, Math.hypot(ball.vx, ball.vy) + 4);
      ball.vx = speed * Math.sin(angle);
      if (Math.abs(ball.vx) < 45) ball.vx = 45 * (ball.vx < 0 ? -1 : 1);
      ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
      ball.y = paddle.y - ball.r - .1;
    }
    for (const brick of bricks) {
      if (!brick.alive) continue;
      const nearX = clamp(ball.x, brick.x, brick.x + brick.w);
      const nearY = clamp(ball.y, brick.y, brick.y + brick.h);
      if ((ball.x - nearX) ** 2 + (ball.y - nearY) ** 2 > ball.r ** 2) continue;
      brick.alive = false; score += brick.points; best = Math.max(best, score); burst(brick);
      if (px + ball.r <= brick.x) { ball.x = brick.x - ball.r - .1; ball.vx = -Math.abs(ball.vx); }
      else if (px - ball.r >= brick.x + brick.w) { ball.x = brick.x + brick.w + ball.r + .1; ball.vx = Math.abs(ball.vx); }
      else if (py + ball.r <= brick.y) { ball.y = brick.y - ball.r - .1; ball.vy = -Math.abs(ball.vy); }
      else if (py - ball.r >= brick.y + brick.h) { ball.y = brick.y + brick.h + ball.r + .1; ball.vy = Math.abs(ball.vy); }
      else { ball.vy = -ball.vy; ball.y += Math.sign(ball.vy) * 2; }
      break;
    }
    if (!bricks.some(b => b.alive)) {
      persistBest(); level++; buildBricks(); mode = 'ready'; particles = []; placeBall(); return;
    }
    if (ball.y - ball.r > H) {
      lives--; persistBest();
      if (lives <= 0) mode = 'over';
      else { mode = 'ready'; placeBall(); }
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * .5, 110, 20, W * .5, 170, W * .65);
    glow.addColorStop(0, '#10243a'); glow.addColorStop(1, '#070b14');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(154,171,199,.06)'; ctx.lineWidth = 1;
    for (let x = 28; x < W; x += 28) {
      for (let y = 56; y < H; y += 28) { ctx.fillStyle = 'rgba(154,171,199,.11)'; ctx.fillRect(x, y, 1, 1); }
    }
    ctx.strokeStyle = 'rgba(34,211,238,.19)';
    ctx.beginPath(); ctx.moveTo(14, H - 14); ctx.lineTo(14, 46); ctx.lineTo(W - 14, 46); ctx.lineTo(W - 14, H - 14); ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillStyle = '#9aabc7';
    ctx.textAlign = 'left'; ctx.fillText(`SCORE  ${String(score).padStart(5, '0')}`, 24, 24);
    ctx.fillStyle = '#647596'; ctx.fillText(`BEST  ${String(best).padStart(5, '0')}`, 166, 24);
    ctx.textAlign = 'center'; ctx.fillStyle = '#22d3ee'; ctx.fillText(`LEVEL  ${String(level).padStart(2, '0')}`, W / 2, 24);
    ctx.textAlign = 'right'; ctx.fillStyle = '#9aabc7'; ctx.fillText('LIVES', W - 91, 24);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? '#22d3ee' : '#263146';
      ctx.beginPath(); ctx.arc(W - 70 + i * 20, 24, 4, 0, Math.PI * 2); ctx.fill();
    }
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.globalAlpha = .86; ctx.fillStyle = b.color; roundRect(b.x, b.y, b.w, b.h, 4); ctx.fill();
      ctx.globalAlpha = .25; ctx.fillStyle = '#fff'; ctx.fillRect(b.x + 6, b.y + 3, b.w - 12, 1);
    }
    ctx.globalAlpha = 1;
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / .45, 0, 1); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    if (mode === 'playing') { trail.push({ x: ball.x, y: ball.y }); if (trail.length > 10) trail.shift(); }
    trail.forEach((p, i) => {
      ctx.globalAlpha = i / 10 * .22; ctx.fillStyle = '#22d3ee';
      ctx.beginPath(); ctx.arc(p.x, p.y, ball.r * i / 12, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 18; ctx.shadowColor = '#22d3ee';
    const paddleFill = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
    paddleFill.addColorStop(0, '#2dd4bf'); paddleFill.addColorStop(.5, '#a5f3fc'); paddleFill.addColorStop(1, '#22d3ee');
    ctx.fillStyle = paddleFill; roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6); ctx.fill();
    ctx.shadowBlur = 12; ctx.fillStyle = '#e8fcff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    if (mode !== 'playing') {
      const label = mode === 'over' ? 'OYUN BİTTİ' : mode === 'paused' ? 'DURAKLATILDI' : level > 1 ? `SEVİYE ${level}` : 'ARKANOID';
      const hint = mode === 'over' ? '↑ / SPACE / TIKLA · YENİDEN BAŞLA' : mode === 'paused' ? 'P / SPACE · DEVAM ET' : '↑ / SPACE / TIKLA · TOPU GÖNDER';
      ctx.fillStyle = 'rgba(7,11,20,.88)'; roundRect(W / 2 - 215, 242, 430, 78, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(34,211,238,.15)'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = mode === 'over' ? '#f97316' : '#e8eef8';
      ctx.font = '600 21px Inter, sans-serif'; ctx.fillText(label, W / 2, 267);
      ctx.fillStyle = '#9aabc7'; ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillText(hint, W / 2, 296);
    }
  }
  function loop(stamp) {
    if (!open) return;
    const elapsed = last ? Math.min(.05, (stamp - last) / 1000) : 0;
    last = stamp; accumulator += elapsed;
    while (accumulator >= STEP) { step(STEP); accumulator -= STEP; }
    draw(); raf = requestAnimationFrame(loop);
  }
  function openGame() {
    if (open) return;
    open = true; last = accumulator = 0; keys.clear(); resetGame();
    previousFocus = document.activeElement;
    overlay.classList.remove('hidden'); overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { if (open) overlay.classList.add('is-visible'); });
    canvas.tabIndex = 0; canvas.focus(); fitCanvas();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function closeGame() {
    if (!open) return;
    open = false; keys.clear(); cancelAnimationFrame(raf); persistBest();
    overlay.classList.remove('is-visible', 'is-open'); overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  closeBtn?.addEventListener('click', closeGame);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGame(); });
  canvas.addEventListener('pointermove', e => {
    if (!open || mode === 'paused' || mode === 'over') return;
    const bounds = canvas.getBoundingClientRect();
    paddle.x = clamp((e.clientX - bounds.left) * W / bounds.width - paddle.w / 2, 16, W - 16 - paddle.w);
  });
  canvas.addEventListener('pointerdown', e => { if (e.button === 0) { e.preventDefault(); canvas.focus(); launch(); } });
  window.addEventListener('keydown', e => {
    if (!open) {
      if (e.key === 'ArrowUp' && !e.repeat && !typing(e.target) &&
        !document.querySelector('#process-overlay:not(.hidden), #result-modal:not(.hidden)')) {
        e.preventDefault(); openGame();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); closeGame(); return; }
    if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === canvas ? closeBtn : canvas)?.focus(); return; }
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { e.preventDefault(); keys.add(e.key); return; }
    if (e.key === 'ArrowUp' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) launch(); return; }
    if (e.key.toLowerCase() === 'p' && !e.repeat) { e.preventDefault(); pause(); }
  });
  window.addEventListener('keyup', e => keys.delete(e.key));
  function suspend() { keys.clear(); if (open && mode === 'playing') pause(); }
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
  window.addEventListener('resize', () => { if (open) fitCanvas(); });
})();
