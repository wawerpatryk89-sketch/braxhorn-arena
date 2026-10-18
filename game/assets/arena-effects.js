/*!
 * arena-effects.js: animowane efekty areny „Nocny targ w burzy”
 * Bez zależności. Rysuje na przezroczystym <canvas> nałożonym na obraz areny
 * (arena-nocny-targ.webp, 1672×941). Canvas ma leżeć POMIĘDZY tłem a zawodnikami
 * i mieć pointer-events:none. Kamera jest nieruchoma, ożywione jest tylko tło.
 *
 * Użycie:
 *   const fx = ArenaEffects.create(canvas, {
 *     quality: 'high',          // 'high' | 'low' | 'off'
 *     fit: 'cover',             // jak obraz tła jest dopasowany do canvasu: 'cover' | 'contain'
 *     onThunder: function(){},  // opcjonalnie: gra odtwarza własny dźwięk grzmotu
 *     effects: { rain:1, thunder:1, fog:1, neon:1, lanterns:1, traffic:1 }
 *   });
 *   fx.start();                 // uruchom
 *   fx.pause(); fx.resume();    // pauza gry
 *   fx.setQuality('low');       // zmiana jakości w locie
 *   fx.setEffect('rain', false);
 *   fx.getFeetY();              // linia stóp zawodników w pikselach CSS canvasu
 *   fx.strike();                // wymuś błyskawicę
 *   fx.destroy();               // sprzątanie po walce
 *
 * Dźwięk: najlepiej podaj onThunder i odtwarzaj prawdziwe nagranie.
 * fx.setSound(true) włącza awaryjny dźwięk syntetyczny (tylko po geście użytkownika).
 */
(function (root) {
  'use strict';

  var IW = 1672, IH = 941, FEET = 780;
  var PRESETS = {
    high: { drops: 560, ripples: 75, clouds: true, blur: true, fogs: 7, steam: 3, dpr: 2 },
    low:  { drops: 220, ripples: 28, clouds: false, blur: false, fogs: 4, steam: 1.2, dpr: 1 }
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function create(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var cfg = {
      quality: opts.quality || 'high',
      fit: opts.fit === 'contain' ? 'contain' : 'cover',
      pauseWhenHidden: opts.pauseWhenHidden !== false,
      respectReducedMotion: opts.respectReducedMotion !== false,
      onThunder: typeof opts.onThunder === 'function' ? opts.onThunder : null
    };
    var on = { rain: 1, thunder: 1, fog: 1, neon: 1, lanterns: 1, traffic: 1, debug: 0 };
    if (opts.effects) for (var key in opts.effects) on[key] = opts.effects[key] ? 1 : 0;
    var off = cfg.quality === 'off';
    var P = PRESETS[cfg.quality] || PRESETS.high;

    var W = 1, H = 1, S = 1, ox = 0, oy = 0, dpr = 1;
    var t = 0, raf = 0, last = 0, wantRun = false, paused = false, hidden = false, dirty = true, destroyed = false;
    var reduce = cfg.respectReducedMotion && root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- dane sceny (współrzędne w pikselach obrazu 1672×941) ---------- */
    var lanterns = [[17,255,30],[240,300,38],[315,335,30],[437,360,28],[357,350,18],[77,285,26],[538,275,14],[1438,22,38],[1645,170,48],[1285,310,20],[1171,315,16],[1393,380,22],[1533,322,26],[1232,400,12],
      [645,393,12],[672,395,12],[722,390,12],[750,392,12],[777,387,12],[927,382,12],[949,381,12],[983,378,12],[1010,375,12]]
      .map(function (a) { return { x: a[0], y: a[1], r: a[2], p: rnd(0, 6.3) }; });
    var PK = '255,60,180', CY = '60,230,255', WP = '255,170,230';
    var neons = [[170,0,170,90,PK,0],[336,90,336,210,PK,1],[510,100,510,180,PK,0],[1272,125,1272,215,PK,0],[1080,305,1080,370,PK,1],[704,295,704,340,PK,0],
      [418,175,418,245,CY,1],[436,210,436,275,CY,0],[381,185,381,212,CY,0],[932,390,932,430,CY,0],[1235,375,1330,370,PK,1],[1625,442,1672,440,PK,0],[1262,405,1262,430,WP,0]]
      .map(function (a) { return { x1: a[0], y1: a[1], x2: a[2], y2: a[3], c: a[4], f: a[5], p: rnd(0, 6.3) }; });
    var drops = []; for (var i = 0; i < PRESETS.high.drops; i++) drops.push({ x: rnd(0, IW + 500), y: rnd(0, IH), z: rnd(.35, 1) });
    var ripples = [], rAcc = 0, wet = .12;
    var puddles = [[300,830,170,'255,140,60'],[540,730,140,'255,70,190'],[840,790,200,'70,200,255'],[1110,705,150,'200,80,255'],[1390,850,190,'255,150,70'],[1570,745,140,'255,80,200'],[660,905,150,'90,210,255'],[1010,880,170,'255,100,200']]
      .map(function (a) { return { x: a[0], y: a[1], rx: a[2], c: a[3], k: rnd(0, 1) }; });
    var clouds = []; for (i = 0; i < 6; i++) clouds.push({ x: i * 300, y: rnd(40, 230), r: rnd(260, 420), v: rnd(12, 26), a: rnd(.28, .4) });
    var fogs = []; for (i = 0; i < 7; i++) fogs.push({ x: i * 260, y: rnd(480, 600), r: rnd(220, 380), v: rnd(8, 20) * (i % 2 ? -1 : 1), a: rnd(.05, .09) });
    var steamSrc = [[300,440],[1448,498],[1578,452]], steam = [], sAcc = 0;
    var cars = [], carT = 1;
    var people = []; for (i = 0; i < 4; i++) people.push({ x: rnd(620, 1100), d: Math.random() < .5 ? 1 : -1, v: rnd(8, 16), p: rnd(0, 6) });
    var flashT = rnd(2, 4), fe = 0, fe2 = -1, thunderAt = -1, bolt = { pts: [], br: [], a: 0 };

    /* ---------- rozmiar ---------- */
    function resize() {
      var r = canvas.getBoundingClientRect();
      var cap = (PRESETS[cfg.quality] || PRESETS.high).dpr;
      dpr = Math.min(root.devicePixelRatio || 1, cap);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      W = canvas.width; H = canvas.height;
      S = cfg.fit === 'contain' ? Math.min(W / IW, H / IH) : Math.max(W / IW, H / IH);
      ox = (W - IW * S) / 2; oy = (H - IH * S) / 2;
      dirty = true;
    }

    /* ---------- błyskawica ---------- */
    function strike() {
      fe = 1; fe2 = .2;
      var x = rnd(380, 1350), y = -10, yEnd = rnd(300, 400), pts = [[x, y]], br = [];
      while (y < yEnd) {
        y += rnd(18, 38); x += rnd(-34, 34); pts.push([x, y]);
        if (Math.random() < .22) {
          var bx = x, by = y, b = [[bx, by]], n = 3 + Math.floor(Math.random() * 4), sd = Math.random() < .5 ? -1 : 1;
          for (var j = 0; j < n; j++) { by += rnd(14, 28); bx += rnd(10, 34) * sd; b.push([bx, by]); }
          br.push(b);
        }
      }
      bolt.pts = pts; bolt.br = br; bolt.a = 1; thunderAt = rnd(.35, 1.6);
      dirty = true;
    }

    /* ---------- dźwięk awaryjny (syntetyczny) ---------- */
    var ac = null, rainGain = null, soundOn = false;
    function audioOn() {
      var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return;
      if (!ac) {
        ac = new AC();
        var rb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), rd = rb.getChannelData(0);
        for (var q = 0; q < rd.length; q++) rd[q] = Math.random() * 2 - 1;
        var src = ac.createBufferSource(); src.buffer = rb; src.loop = true;
        var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
        var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
        rainGain = ac.createGain(); rainGain.gain.value = 0;
        src.connect(hp); hp.connect(lp); lp.connect(rainGain); rainGain.connect(ac.destination); src.start();
      }
      ac.resume(); rainGain.gain.setTargetAtTime(on.rain ? .07 : 0, ac.currentTime, .3);
    }
    function audioOff() { if (ac) rainGain.gain.setTargetAtTime(0, ac.currentTime, .2); }
    function rumble() {
      if (!soundOn || !ac) return;
      var n = ac.sampleRate * 4, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), l = 0;
      for (var q = 0; q < n; q++) { l = l * .985 + (Math.random() * 2 - 1) * .06; d[q] = l * 3 * (1 - q / n); }
      var s = ac.createBufferSource(); s.buffer = b;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
      var g = ac.createGain(), t0 = ac.currentTime;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.7, t0 + .08); g.gain.exponentialRampToValueAtTime(.001, t0 + 3.6);
      s.connect(lp); lp.connect(g); g.connect(ac.destination); s.start();
    }

    /* ---------- aktualizacja ---------- */
    function update(dt) {
      var i, d, c, p;
      if (on.rain) {
        for (i = 0; i < P.drops; i++) {
          d = drops[i]; var sp = (1000 + 700 * d.z) * d.z; d.y += sp * dt; d.x -= sp * .28 * dt;
          if (d.y > IH + 30) { d.y = -30; d.x = rnd(0, IW + 500); }
        }
        wet = Math.min(1, wet + dt * .025); rAcc += dt * P.ripples;
        while (rAcc > 1) {
          p = puddles[Math.floor(Math.random() * puddles.length)];
          var u = Math.random() < .7;
          ripples.push(u ? { x: p.x + rnd(-1, 1) * p.rx * .75 * wet, y: p.y + rnd(-1, 1) * p.rx * .1 * wet, a: 0, m: rnd(.6, 1.2) }
                         : { x: rnd(60, 1620), y: rnd(600, 930), a: 0, m: rnd(.6, 1.2) });
          rAcc--;
        }
      }
      for (i = ripples.length - 1; i >= 0; i--) { ripples[i].a += dt / ripples[i].m; if (ripples[i].a > 1) ripples.splice(i, 1); }
      if (on.thunder) { flashT -= dt; if (flashT <= 0) { flashT = rnd(4.5, 12); strike(); } }
      if (fe2 >= 0) { fe2 -= dt; if (fe2 < 0) { fe = Math.max(fe, .75); fe2 = -1; } }
      fe *= Math.pow(.02, dt); bolt.a *= Math.pow(.0008, dt);
      if (thunderAt >= 0) { thunderAt -= dt; if (thunderAt < 0) { thunderAt = -1; if (cfg.onThunder) cfg.onThunder(); else rumble(); } }
      if (on.rain && P.clouds) for (i = 0; i < clouds.length; i++) { c = clouds[i]; c.x += c.v * dt; if (c.x > IW + c.r) c.x = -c.r; }
      if (on.fog) {
        for (i = 0; i < P.fogs; i++) { var f = fogs[i]; f.x += f.v * dt; if (f.x > IW + f.r) f.x = -f.r; if (f.x < -f.r) f.x = IW + f.r; }
        sAcc += dt * P.steam * steamSrc.length;
        while (sAcc > 1) { var s = steamSrc[Math.floor(Math.random() * steamSrc.length)]; steam.push({ x: s[0] + rnd(-6, 6), y: s[1], vx: rnd(-5, 9), vy: -rnd(16, 28), l: 0, sp: rnd(.22, .35) }); sAcc--; }
        for (i = steam.length - 1; i >= 0; i--) { var st = steam[i]; st.x += st.vx * dt; st.y += st.vy * dt; st.l += st.sp * dt; if (st.l > 1) steam.splice(i, 1); }
      }
      if (on.traffic) {
        carT -= dt;
        if (carT <= 0) { carT = rnd(2, 5.5); var dir = Math.random() < .5 ? 1 : -1; cars.push({ x: dir > 0 ? 540 : 1140, d: dir, v: rnd(55, 95), y: dir > 0 ? 461 : 469 }); }
        for (i = cars.length - 1; i >= 0; i--) { c = cars[i]; c.x += c.d * c.v * dt; if (c.x < 520 || c.x > 1160) cars.splice(i, 1); }
        for (i = 0; i < people.length; i++) { p = people[i]; p.x += p.d * p.v * dt; p.p += dt * 7; if (p.x > 1120) p.d = -1; if (p.x < 600) p.d = 1; }
      }
    }

    /* ---------- rysowanie (wszystko we współrzędnych obrazu) ---------- */
    function glow(x, y, r, c, a, yr) {
      ctx.save(); ctx.translate(x, y); ctx.scale(1, yr || 1);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, 'rgba(' + c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore();
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

    function draw() {
      var i, n, c, p, d, k, v;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      if (off) return;
      ctx.setTransform(S, 0, 0, S, ox, oy);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, IW, IH); ctx.clip();

      if (on.rain) {
        ctx.fillStyle = 'rgba(4,6,22,.2)'; ctx.fillRect(0, 0, IW, IH);
        if (P.clouds) for (i = 0; i < clouds.length; i++) { c = clouds[i]; glow(c.x, c.y, c.r, '6,8,28', c.a, .3); }
      }
      ctx.globalCompositeOperation = 'lighter';
      glow(1088, 85, 160, '190,205,255', .09 + .04 * Math.sin(t * .5));
      if (on.rain) for (i = 0; i < puddles.length; i++) {
        p = puddles[i]; var w = wet * (.4 + .6 * p.k);
        glow(p.x, p.y, p.rx * w, p.c, .24 * w, .2); glow(p.x, p.y, p.rx * .55 * w, '255,255,255', .07 * w, .18);
      }
      if (on.fog) {
        for (i = 0; i < P.fogs; i++) { var f = fogs[i]; glow(f.x, f.y, f.r, '190,170,235', f.a, .28); }
        for (i = 0; i < steam.length; i++) { var s = steam[i]; k = s.l < .15 ? s.l / .15 : 1; glow(s.x, s.y, 10 + s.l * 30, '235,220,255', .1 * (1 - s.l) * k); }
      }
      if (on.lanterns) for (i = 0; i < lanterns.length; i++) {
        var l = lanterns[i]; k = .78 + .22 * Math.sin(t * 1.6 + l.p) + .05 * Math.sin(t * 9 + l.p * 3);
        glow(l.x, l.y, l.r * 3.4, '255,150,40', .3 * k);
      }
      if (on.neon) for (i = 0; i < neons.length; i++) {
        n = neons[i];
        v = n.f && Math.sin(t * 23 + n.p) * Math.sin(t * 7.3 + n.p * 2) > .9 ? .25 : (.85 + .15 * Math.sin(t * 2 + n.p));
        ctx.lineCap = 'round';
        if (P.blur) { ctx.shadowColor = 'rgb(' + n.c + ')'; ctx.shadowBlur = 22 * S; }
        ctx.strokeStyle = 'rgba(' + n.c + ',' + (.4 * v) + ')'; ctx.lineWidth = P.blur ? 7 : 10;
        ctx.beginPath(); ctx.moveTo(n.x1, n.y1); ctx.lineTo(n.x2, n.y2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,' + (.35 * v) + ')'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.shadowBlur = 0;
      if (fe > .01) {
        var g = ctx.createLinearGradient(0, 0, 0, IH);
        g.addColorStop(0, 'rgba(170,190,255,' + (.5 * fe) + ')'); g.addColorStop(.45, 'rgba(170,190,255,' + (.16 * fe) + ')');
        g.addColorStop(.62, 'rgba(170,190,255,' + (.05 * fe) + ')'); g.addColorStop(.85, 'rgba(190,200,255,' + (.12 * fe) + ')');
        g.addColorStop(1, 'rgba(190,200,255,' + (.05 * fe) + ')');
        ctx.fillStyle = g; ctx.fillRect(0, 0, IW, IH);
        if (bolt.a > .02 && bolt.pts.length) {
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          var path = function (pts) { ctx.beginPath(); for (var q = 0; q < pts.length; q++) q ? ctx.lineTo(pts[q][0], pts[q][1]) : ctx.moveTo(pts[q][0], pts[q][1]); ctx.stroke(); };
          if (P.blur) { ctx.shadowColor = 'rgb(170,190,255)'; ctx.shadowBlur = 26 * S; }
          ctx.strokeStyle = 'rgba(170,195,255,' + (.7 * bolt.a) + ')'; ctx.lineWidth = 7; path(bolt.pts);
          for (i = 0; i < bolt.br.length; i++) { ctx.lineWidth = 4; path(bolt.br[i]); }
          ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,' + bolt.a + ')'; ctx.lineWidth = 2.6; path(bolt.pts);
          for (i = 0; i < bolt.br.length; i++) { ctx.lineWidth = 1.4; path(bolt.br[i]); }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (on.traffic) {
        for (i = 0; i < cars.length; i++) { c = cars[i]; ctx.fillStyle = 'rgba(6,6,22,.88)'; rr(c.x - 13, c.y - 5, 26, 6, 2); ctx.fill(); }
        for (i = 0; i < people.length; i++) {
          p = people[i]; var y = 472, sw = Math.sin(p.p) * 2.2;
          ctx.fillStyle = 'rgba(6,5,20,.92)'; ctx.strokeStyle = 'rgba(6,5,20,.92)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(p.x, y - 13, 2.1, 0, 7); ctx.fill();
          rr(p.x - 2.2, y - 11, 4.4, 6.5, 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(p.x, y - 5); ctx.lineTo(p.x + sw, y); ctx.moveTo(p.x, y - 5); ctx.lineTo(p.x - sw, y); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < cars.length; i++) {
          c = cars[i]; var fx = c.x + c.d * 13, rx = c.x - c.d * 13;
          glow(fx, c.y - 2, 13, '255,240,200', .85); glow(rx, c.y - 2, 10, '255,40,50', .8); glow(fx + c.d * 18, c.y - 1, 20, '255,235,190', .18, .4);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (on.rain) {
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < ripples.length; i++) {
          var r = ripples[i], kk = r.a, sc = .5 + (r.y - 560) / 380 * .9, rx2 = (6 + kk * 34) * sc;
          ctx.strokeStyle = 'rgba(210,225,255,' + (.75 * (1 - kk)) + ')'; ctx.lineWidth = 1.4 * sc;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, rx2, rx2 * .26, 0, 0, 7); ctx.stroke();
        }
        var A = [.18, .3, .45], LW = [.8, 1.2, 1.7];
        for (var ly = 0; ly < 3; ly++) {
          ctx.strokeStyle = 'rgba(190,210,255,' + A[ly] + ')'; ctx.lineWidth = LW[ly]; ctx.beginPath();
          for (i = 0; i < P.drops; i++) {
            d = drops[i]; if (Math.min(2, Math.floor((d.z - .35) / .22)) !== ly) continue;
            var len = (14 + 34 * d.z) * d.z; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - len * .28, d.y - len);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (on.debug) {
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.moveTo(0, FEET); ctx.lineTo(IW, FEET); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        [560, 1110].forEach(function (x) { rr(x - 40, FEET - 300, 80, 300, 30); ctx.fill(); });
      }
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /* ---------- pętla ---------- */
    function frame(now) {
      raf = 0;
      if (destroyed) return;
      if (!wantRun || off) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); return; }
      raf = root.requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, .05); last = now;
      if (paused || hidden || reduce) { if (dirty) { draw(); dirty = false; } return; }
      t += dt; update(dt); draw(); dirty = false;
    }
    function ensureLoop() { if (wantRun && !off && !raf && !destroyed) { last = root.performance.now(); raf = root.requestAnimationFrame(frame); } }

    function onVis() { hidden = cfg.pauseWhenHidden && document.hidden; if (!hidden) last = root.performance.now(); }
    document.addEventListener('visibilitychange', onVis);
    var ro = null, onWin = null;
    if (root.ResizeObserver) { ro = new root.ResizeObserver(resize); ro.observe(canvas); }
    else { onWin = resize; root.addEventListener('resize', onWin); }
    resize();

    /* ---------- API ---------- */
    return {
      start: function () { wantRun = true; ensureLoop(); },
      stop: function () { wantRun = false; if (raf) { root.cancelAnimationFrame(raf); raf = 0; } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); },
      pause: function () { paused = true; },
      resume: function () { paused = false; last = root.performance.now(); },
      setQuality: function (q) {
        if (q !== 'high' && q !== 'low' && q !== 'off') return;
        cfg.quality = q; off = q === 'off'; if (!off) P = PRESETS[q];
        resize(); dirty = true; ensureLoop();
      },
      getQuality: function () { return cfg.quality; },
      setEffect: function (name, value) {
        if (!(name in on)) return; on[name] = value ? 1 : 0; dirty = true;
        if (name === 'rain' && ac && soundOn) rainGain.gain.setTargetAtTime(on.rain ? .07 : 0, ac.currentTime, .3);
      },
      setSound: function (value) { soundOn = !!value; if (soundOn) audioOn(); else audioOff(); },
      strike: strike,
      resize: resize,
      getFeetY: function () { return (FEET * S + oy) / dpr; },
      destroy: function () {
        destroyed = true; wantRun = false; if (raf) root.cancelAnimationFrame(raf); raf = 0;
        document.removeEventListener('visibilitychange', onVis);
        if (ro) ro.disconnect(); if (onWin) root.removeEventListener('resize', onWin);
        if (ac) { try { ac.close(); } catch (e) {} ac = null; }
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }

  var api = { create: create, IMAGE_WIDTH: IW, IMAGE_HEIGHT: IH, FEET_RATIO: FEET / IH };
  root.ArenaEffects = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
