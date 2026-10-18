/* Game adapter. The supplied arena-effects.js is kept unchanged. */
(function (root) {
  'use strict';
  const KEY = 'braxhorn.settings.v1';
  const valid = q => ['high', 'low', 'off'].includes(q);
  const nav = root.navigator || {};
  const mobile = /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '') ||
    (nav.maxTouchPoints > 1 && /Macintosh/i.test(nav.userAgent || ''));
  const fallback = mobile || nav.hardwareConcurrency <= 4 || nav.deviceMemory <= 4 ? 'low' : 'high';
  let quality = fallback, saved = false;
  try {
    const data = JSON.parse(root.localStorage.getItem(KEY) || '{}');
    if (valid(data.arenaEffects)) quality = data.arenaEffects;
  } catch (_) {}
  let fx = null, canvas = null, paused = null, audio = null;
  let elapsed = 0, frames = 0, previous = null, measured = false, fps = null;
  const controls = () => root.document.querySelectorAll('[data-arena-effects]');
  // Phones: three in-game buttons drive the (hidden) select, so no system picker opens.
  function segmented(select) {
    if (select.nextElementSibling?.classList?.contains('effects-choice')) return;
    const group = root.document.createElement('span'); group.className = 'effects-choice'; group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-label', 'Efekty areny');
    for (const option of select.options) { const b = root.document.createElement('button'); b.type = 'button'; b.dataset.value = option.value; b.textContent = option.textContent; b.setAttribute('role', 'radio');
      b.addEventListener('click', () => { select.value = option.value; select.dispatchEvent(new Event('change')); }); group.appendChild(b); }
    select.hidden = true; select.after(group);
  }
  function syncControls() { for (const el of controls()) { el.value = quality; segmented(el); for (const b of el.nextElementSibling?.querySelectorAll?.('button') || []) b.setAttribute('aria-checked', String(b.dataset.value === quality)); } }
  function setQuality(q) {
    if (!valid(q)) return;
    quality = q;
    try {
      let data = JSON.parse(root.localStorage.getItem(KEY) || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
      data.arenaEffects = q;
      root.localStorage.setItem(KEY, JSON.stringify(data));
      saved = true;
    } catch (_) { saved = false; }
    fx?.setQuality(q);
    // off clears immediately, including when the effects loop is paused.
    if (q === 'off') fx?.stop(); else fx?.start();
    syncControls();
  }
  function destroy() {
    fx?.destroy(); fx = null;
    canvas?.remove(); canvas = null;
    paused = null; previous = null; audio = null;
  }
  function resetMeasurement() { elapsed = frames = 0; measured = false; fps = null; previous = null; }
  function start(stage, onThunder, newMatch = false) {
    destroy();
    if (newMatch) resetMeasurement();
    if (!root.ArenaEffects) throw new Error('Brak biblioteki efektów areny');
    canvas = root.document.createElement('canvas');
    canvas.id = 'nightMarketEffects';
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);
    audio = onThunder;
    try {
      fx = root.ArenaEffects.create(canvas, {quality, fit: 'cover', onThunder: () => {
        if (!paused && !root.document.hidden) audio?.();
      }});
      fx.pause(); paused = true; fx.start();
    } catch (error) { destroy(); throw error; }
  }
  function tick(now, state) {
    if (!fx) return;
    if (!state.running || state.matchOver) { destroy(); return; }
    const nextPaused = !!(state.paused || state.cinematic || state.hidden || state.portrait || state.contextLost || state.replay);
    if (nextPaused !== paused) { paused = nextPaused; paused ? fx.pause() : fx.resume(); }
    // Count actual rendered game frames, not the effects RAF or capped physics delta.
    // Loading, intro, countdown, pauses and hidden-tab time are excluded.
    if (paused || state.preFight || state.ended || measured) { previous = null; return; }
    if (previous !== null) { elapsed += Math.max(0, now - previous); frames++; }
    previous = now;
    if (elapsed >= 3000) {
      fps = frames * 1000 / elapsed; measured = true;
      if (fps < 40 && quality === 'high') setQuality('low');
    }
  }
  function feet() {
    if (!fx || !canvas.clientHeight) return null;
    // getBoundingClientRect includes the existing combat camera transform.
    // Convert the library's CSS measure back to the stage's layout coordinates.
    const cap = quality === 'low' ? 1 : 2;
    const dpr = Math.min(root.devicePixelRatio || 1, cap);
    return fx.getFeetY() * canvas.clientHeight / (canvas.height / dpr);
  }
  for (const el of controls()) el.addEventListener('change', () => { setQuality(el.value); syncControls(); });
  syncControls();
  root.addEventListener('pagehide', destroy);
  root.document.addEventListener('visibilitychange', () => {
    previous = null;
    if (root.document.hidden && fx) { fx.pause(); paused = true; }
  });
  root.BRAX_NIGHT_MARKET = {start, destroy, tick, feet, setQuality, resetMeasurement,
    resize: () => fx?.resize(),
    report: () => ({quality, saved, active: !!fx, fps, measuredMs: elapsed, frames, measured})};
})(window);
