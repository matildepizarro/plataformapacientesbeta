/* =====================================================================
   VozLive — monitor de voz en tiempo real (captura + detector + gráfico)
   Consultorio Vocal · sin dependencias · se monta en cualquier <div>

   Uso:
     var vl = VozLive.mount(document.getElementById('root'), {
       getTarget: function(){ return {min:160, max:220}; },   // rango de práctica (o null)
       setTarget: function(min, max){ ... },                  // el usuario lo cambió aquí
       onLog:     function(msg){ ... },
       onFrame:   function(info){ ... }                       // cada cuadro con detección
     });
     vl.start() / vl.stop() / vl.stream / vl.currentF0() / vl.stats()
   ===================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------ textos ------------------------------ */
  var T = {
    es: {
      title: 'Monitor de voz en vivo', start: 'Iniciar micrófono', stop: 'Detener',
      idle: 'Listo para escuchar', listening: 'Escuchando… habla, lee o sostén una vocal', noVoice: 'Sin tono claro',
      noSignal: 'Sin señal — revisa que tu micrófono no esté silenciado',
      inRange: 'En tu rango de práctica', above: 'Un poco más agudo', below: 'Un poco más grave',
      goDown: 'Baja un poco', goUp: 'Sube un poco', noTarget: 'Sin rango definido',
      volume: 'Volumen', pitch: 'Tono', note: 'Nota', myRange: 'Mi rango', min: 'mín', max: 'máx',
      gSuave: 'Grave', gNeutro: 'Neutro', gAgudo: 'Agudo',
      stInRange: 'En rango', stAvg: 'Promedio', stSpan: 'Variación', stVoice: 'Con voz',
      settings: 'Ajustes', mic: 'Micrófono', window: 'Ventana del gráfico', sens: 'Sensibilidad',
      sensLow: 'Baja', sensHigh: 'Alta', calib: 'Calibrar volumen', calibRef: 'dB de referencia',
      calibDone: 'Calibración aplicada', calibFail: 'No se detectó señal para calibrar',
      freeze: 'Congelar', unfreeze: 'Seguir', reset: 'Reiniciar datos', compact: 'Compacto', expand: 'Ampliar',
      approxDb: 'Volumen aproximado (no es un sonómetro profesional)',
      ago: 'hace', secs: 's', time: 'tiempo',
      errDenied: 'Permiso de micrófono denegado. Permítelo en el navegador y recarga la página.',
      errNotFound: 'No se encontró ningún micrófono.',
      errBusy: 'Otra aplicación está usando el micrófono.',
      errInsecure: 'El micrófono necesita que la página se abra con https.',
      errGeneric: 'No se pudo acceder al micrófono.', errEnded: 'El micrófono se desconectó.',
      aria: 'Gráfico en vivo del tono de la voz'
    },
    en: {
      title: 'Live voice monitor', start: 'Start microphone', stop: 'Stop',
      idle: 'Ready to listen', listening: 'Listening… speak, read or hold a vowel', noVoice: 'No clear pitch',
      noSignal: 'No signal — check that your microphone is not muted',
      inRange: 'In your practice range', above: 'A bit higher', below: 'A bit lower',
      goDown: 'Lower a little', goUp: 'Higher a little', noTarget: 'No range set',
      volume: 'Volume', pitch: 'Pitch', note: 'Note', myRange: 'My range', min: 'min', max: 'max',
      gSuave: 'Low', gNeutro: 'Neutral', gAgudo: 'High',
      stInRange: 'In range', stAvg: 'Average', stSpan: 'Variation', stVoice: 'Voiced',
      settings: 'Settings', mic: 'Microphone', window: 'Graph window', sens: 'Sensitivity',
      sensLow: 'Low', sensHigh: 'High', calib: 'Calibrate volume', calibRef: 'Reference dB',
      calibDone: 'Calibration applied', calibFail: 'No signal detected to calibrate',
      freeze: 'Freeze', unfreeze: 'Resume', reset: 'Reset data', compact: 'Compact', expand: 'Expand',
      approxDb: 'Approximate volume (not a professional sound level meter)',
      ago: '', secs: 's ago', time: 'time',
      errDenied: 'Microphone permission denied. Allow it in your browser and reload the page.',
      errNotFound: 'No microphone found.', errBusy: 'Another app is using the microphone.',
      errInsecure: 'The microphone requires the page to be opened over https.',
      errGeneric: 'Could not access the microphone.', errEnded: 'The microphone was disconnected.',
      aria: 'Live graph of voice pitch'
    },
    pt: {
      title: 'Monitor de voz ao vivo', start: 'Iniciar microfone', stop: 'Parar',
      idle: 'Pronto para ouvir', listening: 'Ouvindo… fale, leia ou sustente uma vogal', noVoice: 'Sem tom claro',
      noSignal: 'Sem sinal — verifique se o microfone não está silenciado',
      inRange: 'Na sua faixa de prática', above: 'Um pouco mais agudo', below: 'Um pouco mais grave',
      goDown: 'Desça um pouco', goUp: 'Suba um pouco', noTarget: 'Sem faixa definida',
      volume: 'Volume', pitch: 'Tom', note: 'Nota', myRange: 'Minha faixa', min: 'mín', max: 'máx',
      gSuave: 'Grave', gNeutro: 'Neutro', gAgudo: 'Agudo',
      stInRange: 'Na faixa', stAvg: 'Média', stSpan: 'Variação', stVoice: 'Com voz',
      settings: 'Ajustes', mic: 'Microfone', window: 'Janela do gráfico', sens: 'Sensibilidade',
      sensLow: 'Baixa', sensHigh: 'Alta', calib: 'Calibrar volume', calibRef: 'dB de referência',
      calibDone: 'Calibração aplicada', calibFail: 'Nenhum sinal para calibrar',
      freeze: 'Congelar', unfreeze: 'Continuar', reset: 'Reiniciar dados', compact: 'Compacto', expand: 'Ampliar',
      approxDb: 'Volume aproximado (não é um decibelímetro profissional)',
      ago: 'há', secs: 's', time: 'tempo',
      errDenied: 'Permissão de microfone negada. Permita no navegador e recarregue a página.',
      errNotFound: 'Nenhum microfone encontrado.', errBusy: 'Outro aplicativo está usando o microfone.',
      errInsecure: 'O microfone exige que a página seja aberta com https.',
      errGeneric: 'Não foi possível acessar o microfone.', errEnded: 'O microfone foi desconectado.',
      aria: 'Gráfico ao vivo do tom da voz'
    }
  };
  function lang() {
    var l = (global.CV_I18N && global.CV_I18N.lang) || document.documentElement.lang || 'es';
    l = String(l).slice(0, 2).toLowerCase();
    return T[l] ? l : 'es';
  }
  function tr(k) { return (T[lang()] && T[lang()][k]) || T.es[k] || k; }

  /* ------------------------------ utilidades ------------------------------ */
  var NOTE_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  function hzToMidi(f) { return 69 + 12 * Math.log2(f / 440); }
  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function noteInfo(f) {
    var m = hzToMidi(f), r = Math.round(m);
    return { name: NOTE_NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1), cents: Math.round((m - r) * 100) };
  }
  function median(a) {
    var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function cssVar(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fb;
  }

  /* ------------------------------ detector YIN ------------------------------
     Mejoras sobre el YIN básico: media removida, rango de búsqueda acotado a
     la voz humana, interpolación parabólica y medida de "claridad" (0–1).      */
  var _d = new Float32Array(2048), _x = null;
  function yin(buf, sr, fmin, fmax) {
    var n = buf.length;
    if (!_x || _x.length !== n) _x = new Float32Array(n);
    var mean = 0, i, tau;
    for (i = 0; i < n; i++) mean += buf[i];
    mean /= n;
    for (i = 0; i < n; i++) _x[i] = buf[i] - mean;

    var maxTau = Math.min(Math.floor(sr / fmin), (n >> 1) + 200);
    var minTau = Math.max(2, Math.floor(sr / fmax));
    var W = n - maxTau;
    if (W < 256) return null;
    if (_d.length < maxTau + 2) _d = new Float32Array(maxTau + 2);

    var run = 0; _d[0] = 1;
    for (tau = 1; tau <= maxTau; tau++) {
      var s = 0;
      for (i = 0; i < W; i++) { var df = _x[i] - _x[i + tau]; s += df * df; }
      run += s;
      _d[tau] = run === 0 ? 1 : s * tau / run;
    }
    var best = -1, thr = 0.15;
    for (tau = minTau; tau < maxTau; tau++) {
      if (_d[tau] < thr) {
        while (tau + 1 < maxTau && _d[tau + 1] < _d[tau]) tau++;
        best = tau; break;
      }
    }
    if (best === -1) {              // sin cruce claro: tomar el mínimo global si es razonable
      var mv = 1, mt = -1;
      for (tau = minTau; tau < maxTau; tau++) if (_d[tau] < mv) { mv = _d[tau]; mt = tau; }
      if (mt === -1 || mv > 0.32) return null;
      best = mt;
    }
    var bt = best;
    if (best > 1 && best < maxTau) {
      var s0 = _d[best - 1], s1 = _d[best], s2 = _d[best + 1], den = 2 * s1 - s2 - s0;
      if (den !== 0) bt = best + (s2 - s0) / (2 * den);
    }
    var f = sr / bt;
    if (!(f >= fmin && f <= fmax)) return null;
    return { f: f, clarity: clamp(1 - _d[best], 0, 1) };
  }

  /* ------------------------------ estilos ------------------------------ */
  var CSS = [
    '.vl{--vl-in:#3fae8a;--vl-up:#f08a4b;--vl-dn:#4a9fd8;background:var(--card,#fff);border:1px solid var(--border,#eadff0);border-radius:18px;box-shadow:var(--shadow,0 10px 30px rgba(0,0,0,.08));padding:14px;color:var(--text,#2f2a3d);font-family:inherit}',
    '.vl *{box-sizing:border-box}',
    '.vl.is-compact{position:sticky;top:6px;z-index:40}',
    '.vl-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.vl-title{font-weight:800;font-size:15px;display:flex;align-items:center;gap:8px;flex:1;min-width:150px}',
    '.vl-dot{width:10px;height:10px;border-radius:50%;background:#bbb;flex:none}',
    '.vl.is-live .vl-dot{background:var(--vl-in);box-shadow:0 0 0 0 rgba(63,174,138,.6);animation:vlpulse 1.6s infinite}',
    '@keyframes vlpulse{70%{box-shadow:0 0 0 8px rgba(63,174,138,0)}100%{box-shadow:0 0 0 0 rgba(63,174,138,0)}}',
    '.vl-btn{border:1px solid var(--border,#ddd);background:transparent;color:inherit;border-radius:12px;padding:9px 13px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}',
    '.vl-btn:hover{filter:brightness(.97)}',
    '.vl-btn.primary{background:linear-gradient(135deg,var(--primary-deep,#e783ad),var(--accent,#c9a8e0));border-color:transparent;color:#fff}',
    '.vl-btn.live{background:#d9506f;color:#fff;border-color:transparent}',
    '.vl-btn.icon{padding:9px 11px;min-width:40px}',
    '.vl-btn[aria-pressed=true]{background:var(--bg-2,#f4eefb)}',
    '.vl-status{width:100%;font-size:12.5px;color:var(--muted,#7a7390);min-height:16px}',
    '.vl-status.err{color:#d14b6b;font-weight:700}',
    '.vl-read{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px;margin-top:10px}',
    '.vl-tile{background:var(--bg-2,#f6f1fb);border-radius:14px;padding:10px 12px;min-width:0}',
    '.vl-lab{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#7a7390)}',
    '.vl-hz{font-size:34px;font-weight:800;line-height:1.05;font-variant-numeric:tabular-nums;font-family:"IBM Plex Mono",ui-monospace,monospace}',
    '.vl-hz small{font-size:14px;font-weight:700;margin-left:3px;color:var(--muted,#7a7390)}',
    '.vl-note{font-size:22px;font-weight:800;line-height:1.1}',
    '.vl-cents{font-size:12.5px;color:var(--muted,#7a7390);font-variant-numeric:tabular-nums}',
    '.vl-chip{display:inline-flex;align-items:center;gap:6px;border-radius:99px;padding:6px 12px;font-weight:800;font-size:13px;margin-top:10px;background:var(--bg-2,#eee);color:var(--muted,#555);transition:background .15s,color .15s}',
    '.vl-chip.in{background:rgba(63,174,138,.16);color:#2a8a6b}',
    '.vl-chip.up{background:rgba(240,138,75,.18);color:#b9602a}',
    '.vl-chip.dn{background:rgba(74,159,216,.18);color:#2a77ad}',
    '.vl-db{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}',
    '.vl-bar{height:8px;border-radius:99px;background:var(--border,#e6ddf3);overflow:hidden;margin-top:8px}',
    '.vl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--vl-dn),var(--vl-in),var(--vl-up));transition:width .06s}',
    '.vl-gauge{position:relative;height:26px;margin-top:10px;border-radius:99px;background:var(--bg-2,#f6f1fb);overflow:hidden}',
    '.vl-gauge .band{position:absolute;top:0;bottom:0;background:rgba(63,174,138,.22);border-left:2px dashed rgba(63,174,138,.7);border-right:2px dashed rgba(63,174,138,.7)}',
    '.vl-gauge .mark{position:absolute;top:3px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:var(--vl-in);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:left .08s linear,background .15s;opacity:0}',
    '.vl-gauge .mark.on{opacity:1}',
    '.vl-gauge .lo,.vl-gauge .hi{position:absolute;top:5px;font-size:11px;font-weight:700;color:var(--muted,#7a7390)}',
    '.vl-gauge .lo{left:10px}.vl-gauge .hi{right:10px}',
    '.vl-plotwrap{position:relative;margin-top:12px;border-radius:14px;overflow:hidden;background:var(--bg-2,#f6f1fb);touch-action:pan-y}',
    '.vl-plotwrap canvas{display:block;width:100%;height:100%}',
    '.vl-plotwrap{height:260px}',
    '.vl-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}',
    '.vl-range{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:10px;font-size:13px}',
    '.vl-range label{font-weight:700;color:var(--muted,#7a7390)}',
    '.vl-range input[type=number]{width:70px;padding:7px 8px;border-radius:10px;border:1px solid var(--border,#ddd);background:transparent;color:inherit;font:inherit}',
    '.vl-chips{display:flex;gap:6px;flex-wrap:wrap}',
    '.vl-chips button{border:1px solid var(--border,#ddd);background:transparent;color:inherit;border-radius:99px;padding:6px 11px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
    '.vl-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}',
    '.vl-stat{background:var(--bg-2,#f6f1fb);border-radius:12px;padding:8px 10px;min-width:0}',
    '.vl-stat b{display:block;font-size:16px;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.vl-set{margin-top:10px;border:1px dashed var(--border,#ddd);border-radius:14px;padding:12px;display:none;gap:12px;flex-direction:column;font-size:13px}',
    '.vl-set.open{display:flex}',
    '.vl-set label{font-weight:700;color:var(--muted,#7a7390);display:block;margin-bottom:4px}',
    '.vl-set select,.vl-set input[type=number]{width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--border,#ddd);background:var(--card,#fff);color:inherit;font:inherit}',
    '.vl-seg{display:flex;gap:6px}',
    '.vl-seg button{flex:1;border:1px solid var(--border,#ddd);background:transparent;color:inherit;border-radius:10px;padding:7px;font:inherit;font-weight:700;cursor:pointer}',
    '.vl-seg button.on{background:var(--primary-deep,#e783ad);border-color:transparent;color:#fff}',
    '.vl-note-small{font-size:11.5px;color:var(--muted,#7a7390)}',
    '.vl.is-compact .vl-plotwrap,.vl.is-compact .vl-range,.vl.is-compact .vl-stats,.vl.is-compact .vl-tools,.vl.is-compact .vl-set{display:none}',
    '@media (max-width:640px){.vl-head{flex-wrap:nowrap;gap:6px}.vl-title{min-width:0;font-size:13.5px}.vl-title span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.vl-btn{padding:8px 10px;font-size:13px}.vl-read{grid-template-columns:1fr 1fr}.vl-read .vl-tile:first-child{grid-column:1/-1}.vl-hz{font-size:40px}.vl-stats{grid-template-columns:repeat(2,1fr)}.vl-plotwrap{height:230px}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('vl-css')) return;
    var s = document.createElement('style'); s.id = 'vl-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ------------------------------ componente ------------------------------ */
  function mount(root, opts) {
    opts = opts || {};
    injectCss();

    var PREF_KEY = 'vozlive_prefs_v1';
    var prefs = { win: 10, sens: 3, mic: '', dbOffset: 90 };
    try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}')); } catch (e) {}
    function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }
    var SENS = [0.02, 0.012, 0.008, 0.005, 0.003];

    /* ---------- DOM ---------- */
    root.innerHTML = '';
    var box = el('section', 'vl'); box.setAttribute('aria-label', tr('title'));
    root.appendChild(box);

    var head = el('div', 'vl-head');
    var title = el('div', 'vl-title'); var dot = el('span', 'vl-dot'); var titleTxt = el('span', '', '');
    title.appendChild(dot); title.appendChild(titleTxt);
    var btnMain = el('button', 'vl-btn primary'); btnMain.type = 'button';
    var btnSet = el('button', 'vl-btn icon', '⚙'); btnSet.type = 'button';
    var btnCompact = el('button', 'vl-btn icon', '▾'); btnCompact.type = 'button';
    head.appendChild(title); head.appendChild(btnMain); head.appendChild(btnSet); head.appendChild(btnCompact);
    var status = el('div', 'vl-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');

    var read = el('div', 'vl-read');
    var tPitch = el('div', 'vl-tile'); var lPitch = el('div', 'vl-lab');
    var hz = el('div', 'vl-hz', '—<small>Hz</small>'); var chip = el('span', 'vl-chip', '');
    tPitch.appendChild(lPitch); tPitch.appendChild(hz); tPitch.appendChild(chip);
    var tNote = el('div', 'vl-tile'); var lNote = el('div', 'vl-lab');
    var noteEl = el('div', 'vl-note', '—'); var centsEl = el('div', 'vl-cents', '');
    tNote.appendChild(lNote); tNote.appendChild(noteEl); tNote.appendChild(centsEl);
    var tVol = el('div', 'vl-tile'); var lVol = el('div', 'vl-lab');
    var dbEl = el('div', 'vl-db', '— dB'); var bar = el('div', 'vl-bar', '<i></i>');
    tVol.appendChild(lVol); tVol.appendChild(dbEl); tVol.appendChild(bar);
    read.appendChild(tPitch); read.appendChild(tNote); read.appendChild(tVol);
    var barFill = bar.firstChild;

    var gauge = el('div', 'vl-gauge', '<div class="band"></div><span class="lo"></span><span class="hi"></span><div class="mark"></div>');
    var gBand = gauge.querySelector('.band'), gMark = gauge.querySelector('.mark'),
        gLo = gauge.querySelector('.lo'), gHi = gauge.querySelector('.hi');

    var plotWrap = el('div', 'vl-plotwrap'); var canvas = el('canvas'); canvas.setAttribute('role', 'img');
    plotWrap.appendChild(canvas);

    var tools = el('div', 'vl-tools');
    var btnFreeze = el('button', 'vl-btn', ''); btnFreeze.type = 'button'; btnFreeze.setAttribute('aria-pressed', 'false');
    var btnReset = el('button', 'vl-btn', ''); btnReset.type = 'button';
    tools.appendChild(btnFreeze); tools.appendChild(btnReset);

    var range = el('div', 'vl-range');
    var lRange = el('label', '');
    var inMin = el('input'); inMin.type = 'number'; inMin.min = 40; inMin.max = 900; inMin.inputMode = 'numeric';
    var inMax = el('input'); inMax.type = 'number'; inMax.min = 40; inMax.max = 900; inMax.inputMode = 'numeric';
    var chips = el('div', 'vl-chips');
    var PRESETS = [['gSuave', 100, 140], ['gNeutro', 150, 180], ['gAgudo', 180, 220]];
    var presetBtns = PRESETS.map(function (p) {
      var b = el('button', ''); b.type = 'button'; b.dataset.min = p[1]; b.dataset.max = p[2];
      b.addEventListener('click', function () { setTargetUI(p[1], p[2], true); }); chips.appendChild(b); return b;
    });
    range.appendChild(lRange); range.appendChild(inMin); range.appendChild(el('span', '', '–')); range.appendChild(inMax); range.appendChild(chips);

    var stats = el('div', 'vl-stats');
    function mkStat() { var s = el('div', 'vl-stat'); var l = el('div', 'vl-lab'); var v = el('b', '', '—'); s.appendChild(l); s.appendChild(v); stats.appendChild(s); return { l: l, v: v }; }
    var sIn = mkStat(), sAvg = mkStat(), sSpan = mkStat(), sVoice = mkStat();

    var set = el('div', 'vl-set');
    var wMic = el('div', ''); var lMic = el('label', ''); var selMic = el('select'); wMic.appendChild(lMic); wMic.appendChild(selMic);
    var wWin = el('div', ''); var lWin = el('label', ''); var seg = el('div', 'vl-seg');
    [10, 20, 30].forEach(function (w) {
      var b = el('button', '', w + ' s'); b.type = 'button'; b.dataset.w = w;
      b.addEventListener('click', function () { prefs.win = w; savePrefs(); syncSeg(); }); seg.appendChild(b);
    });
    wWin.appendChild(lWin); wWin.appendChild(seg);
    var wSens = el('div', ''); var lSens = el('label', ''); var sens = el('input'); sens.type = 'range'; sens.min = 1; sens.max = 5; sens.step = 1;
    sens.style.width = '100%';
    wSens.appendChild(lSens); wSens.appendChild(sens);
    var wCal = el('div', ''); var lCal = el('label', ''); var calRow = el('div', ''); calRow.style.cssText = 'display:flex;gap:8px';
    var inCal = el('input'); inCal.type = 'number'; inCal.placeholder = '70'; var btnCal = el('button', 'vl-btn', ''); btnCal.type = 'button';
    calRow.appendChild(inCal); calRow.appendChild(btnCal); var calNote = el('div', 'vl-note-small', '');
    wCal.appendChild(lCal); wCal.appendChild(calRow); wCal.appendChild(calNote);
    set.appendChild(wMic); set.appendChild(wWin); set.appendChild(wSens); set.appendChild(wCal);

    box.appendChild(head); box.appendChild(status); box.appendChild(read); box.appendChild(gauge);
    box.appendChild(plotWrap); box.appendChild(range); box.appendChild(stats); box.appendChild(tools); box.appendChild(set);

    /* ---------- textos (se refrescan al cambiar idioma) ---------- */
    var live = false, frozen = false, compact = false;
    function texts() {
      titleTxt.textContent = tr('title');
      btnMain.textContent = (live ? '■ ' + tr('stop') : '● ' + tr('start'));
      btnMain.className = 'vl-btn ' + (live ? 'live' : 'primary');
      btnSet.title = btnSet.ariaLabel = tr('settings'); btnCompact.title = tr('compact');
      lPitch.textContent = tr('pitch'); lNote.textContent = tr('note'); lVol.textContent = tr('volume');
      lVol.title = tr('approxDb');
      lRange.textContent = tr('myRange') + ':';
      presetBtns.forEach(function (b, i) { b.textContent = tr(PRESETS[i][0]); });
      sIn.l.textContent = tr('stInRange'); sAvg.l.textContent = tr('stAvg'); sSpan.l.textContent = tr('stSpan'); sVoice.l.textContent = tr('stVoice');
      btnFreeze.textContent = (frozen ? '▶ ' + tr('unfreeze') : '❚❚ ' + tr('freeze')); btnReset.textContent = '↺ ' + tr('reset');
      lMic.textContent = tr('mic'); lWin.textContent = tr('window');
      lSens.textContent = tr('sens') + ' (' + tr('sensLow') + ' ← → ' + tr('sensHigh') + ')';
      lCal.textContent = tr('calib'); btnCal.textContent = '✓'; btnCal.title = tr('calib'); inCal.placeholder = tr('calibRef') + ' (70)';
      calNote.textContent = tr('approxDb');
      canvas.setAttribute('aria-label', tr('aria'));
      if (!live) setStatus(tr('idle'));
    }
    function setStatus(msg, err) { status.textContent = msg; status.classList.toggle('err', !!err); }
    function syncSeg() { Array.prototype.forEach.call(seg.children, function (b) { b.classList.toggle('on', +b.dataset.w === prefs.win); }); }
    sens.value = prefs.sens; syncSeg();

    /* ---------- objetivo (rango de práctica) ---------- */
    function target() {
      var t = opts.getTarget ? opts.getTarget() : null;
      if (t && isFinite(t.min) && isFinite(t.max) && t.max > t.min) return { min: +t.min, max: +t.max };
      return null;
    }
    function syncTargetInputs() {
      var t = target();
      if (document.activeElement !== inMin) inMin.value = t ? Math.round(t.min) : '';
      if (document.activeElement !== inMax) inMax.value = t ? Math.round(t.max) : '';
    }
    function setTargetUI(min, max, fromUser) {
      if (opts.setTarget && isFinite(min) && isFinite(max) && max > min) opts.setTarget(+min, +max);
      syncTargetInputs();
    }
    function onTargetInput() {
      var a = parseFloat(inMin.value), b = parseFloat(inMax.value);
      if (isFinite(a) && isFinite(b) && b > a) setTargetUI(a, b, true);
    }
    inMin.addEventListener('input', onTargetInput); inMax.addEventListener('input', onTargetInput);

    /* ---------- estado del motor ---------- */
    var ctx = null, analyser = null, source = null, stream = null, buf = null, raf = 0;
    var t0 = 0, lastDet = 0, lastUi = 0, lastTickT = 0;
    var samples = [];            // {t, f(raw|null), s(suavizado|null), db}
    var hist = [], pend = 0, smHist = [], emaF = null;
    var lvl = 0, curDb = null, lastVoicedT = -9, lastLoudT = 0;
    var st = null; function resetStats() { st = { n: 0, inN: 0, sum: 0, min: Infinity, max: -Infinity, voiced: 0 }; if (global) updateStats(); }
    var last = { f: null, s: null, t: 0 };
    var frozenAt = 0, hoverX = null;
    var yLo = Math.log(70), yHi = Math.log(400);
    var minF = 60, maxF = 600;

    function reasonText(e) {
      var n = e && e.name;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return tr('errInsecure');
      if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') return tr('errDenied');
      if (n === 'NotFoundError' || n === 'DevicesNotFoundError') return tr('errNotFound');
      if (n === 'NotReadableError' || n === 'TrackStartError') return tr('errBusy');
      return tr('errGeneric');
    }

    function populateMics() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      navigator.mediaDevices.enumerateDevices().then(function (ds) {
        var mics = ds.filter(function (d) { return d.kind === 'audioinput'; });
        selMic.innerHTML = '';
        mics.forEach(function (d, i) {
          var o = el('option'); o.value = d.deviceId; o.textContent = d.label || (tr('mic') + ' ' + (i + 1)); selMic.appendChild(o);
        });
        if (mics.some(function (d) { return d.deviceId === prefs.mic; })) selMic.value = prefs.mic;
        wMic.style.display = mics.length > 1 ? '' : 'none';
      }).catch(function () {});
    }
    selMic.addEventListener('change', function () {
      prefs.mic = selMic.value; savePrefs();
      if (live) { stop(true); start(); }
    });
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', populateMics);
    }

    function start() {
      if (live) return Promise.resolve();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus(tr('errInsecure'), true); return Promise.resolve(); }
      setStatus('…');
      var audio = { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      if (prefs.mic) audio.deviceId = { ideal: prefs.mic };
      return navigator.mediaDevices.getUserMedia({ audio: audio, video: false }).then(function (s) {
        stream = s;
        var AC = global.AudioContext || global.webkitAudioContext;
        ctx = new AC({ latencyHint: 'interactive' });
        var ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
        return ready.then(function () {
          source = ctx.createMediaStreamSource(s);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0;
          source.connect(analyser);
          buf = new Float32Array(analyser.fftSize);
          var tr0 = s.getAudioTracks()[0];
          if (tr0) tr0.onended = function () { stop(true); setStatus(tr('errEnded'), true); };
          samples = []; hist = []; smHist = []; emaF = null; pend = 0; lvl = 0; curDb = null; lastVoicedT = -9;
          t0 = performance.now(); lastTickT = 0; frozen = false; frozenAt = 0; resetStats();
          live = true; box.classList.add('is-live'); texts(); setStatus(tr('listening'));
          populateMics();
          if (opts.onLog) opts.onLog('Micrófono: activo');
          if (opts.onStart) opts.onStart();
          raf = requestAnimationFrame(tick);
        });
      }).catch(function (e) {
        stop(true); setStatus(reasonText(e), true);
      });
    }

    function stop(silent) {
      cancelAnimationFrame(raf); raf = 0;
      var was = live; live = false; box.classList.remove('is-live');
      try { if (stream) stream.getTracks().forEach(function (t) { t.onended = null; t.stop(); }); } catch (e) {}
      try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (e) {}
      stream = null; ctx = null; analyser = null; source = null;
      global._lastSpl = null; curDb = null;
      texts(); if (!silent) setStatus(tr('idle'));
      hz.innerHTML = '—<small>Hz</small>'; noteEl.textContent = '—'; centsEl.textContent = ''; dbEl.textContent = '— dB';
      barFill.style.width = '0%'; gMark.classList.remove('on'); setChip('', '');
      draw(performance.now());
      if (was) { if (opts.onLog) opts.onLog('Micrófono: detenido'); if (opts.onStop) opts.onStop(); }
    }

    /* ---------- bucle principal ---------- */
    function tick(now) {
      if (!live) return;
      raf = requestAnimationFrame(tick);
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
      if (now - lastDet >= 18) { lastDet = now; detect(now); }
      draw(now);
      if (now - lastUi >= 90) { lastUi = now; updateUi(now); }
    }

    function detect(now) {
      analyser.getFloatTimeDomainData(buf);
      var sum = 0, i;
      for (i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      var rms = Math.sqrt(sum / buf.length);
      var dbfs = 20 * Math.log10(Math.max(rms, 1e-8));
      curDb = dbfs + prefs.dbOffset;
      lvl = rms > lvl ? lvl + (rms - lvl) * 0.6 : lvl + (rms - lvl) * 0.12;
      global._lastSpl = rms > 1e-6 ? Math.round(curDb * 10) / 10 : null;
      if (rms > 0.0006) lastLoudT = now;

      var t = (now - t0) / 1000, dt = lastTickT ? t - lastTickT : 0.02; lastTickT = t;
      var f = null, clarity = 0, thr = SENS[prefs.sens - 1] || 0.008;
      if (rms > thr) {
        var r = yin(buf, ctx.sampleRate, minF, maxF);
        if (r && r.clarity >= 0.7) {
          var c = r.f; clarity = r.clarity;
          if (hist.length >= 3) {           // anti-saltos de octava y valores aislados
            var med = median(hist), ratio = c / med;
            if (Math.abs(ratio - 2) < 0.1 && clarity < 0.93) c = c / 2;
            else if (Math.abs(ratio - 0.5) < 0.05 && clarity < 0.93) c = c * 2;
            else if (Math.abs(Math.log2(ratio)) > 0.4) {
              pend++;
              if (pend < 3) c = null; else { hist = []; pend = 0; }
            } else pend = 0;
          }
          if (c) { f = c; hist.push(f); if (hist.length > 7) hist.shift(); }
        }
      }
      var s = null;
      if (f) {
        smHist.push(f); if (smHist.length > 5) smHist.shift();
        var m = median(smHist);
        emaF = emaF == null || (t - lastVoicedT) > 0.25 ? m : emaF + (m - emaF) * 0.5;
        s = emaF; lastVoicedT = t;
        last = { f: f, s: s, t: t, clarity: clarity };
        st.n++; st.sum += f; st.min = Math.min(st.min, f); st.max = Math.max(st.max, f); st.voiced += dt;
        var tg = target(); if (tg && f >= tg.min && f <= tg.max) st.inN++;
      } else if (t - lastVoicedT > 0.25) { smHist = []; emaF = null; }
      samples.push({ t: t, f: f, s: s, db: curDb });
      var cut = t - 35; while (samples.length && samples[0].t < cut) samples.shift();
      if (opts.onFrame) { try { opts.onFrame({ f0: f, smooth: s, db: curDb, clarity: clarity, t: t }); } catch (e) {} }
    }

    /* ---------- lecturas numéricas ---------- */
    function setChip(cls, txt) { chip.className = 'vl-chip' + (cls ? ' ' + cls : ''); chip.textContent = txt; chip.style.display = txt ? '' : 'none'; }
    function mapLog(f) { return (Math.log(clamp(f, 40, 1000)) - yLo) / (yHi - yLo); }
    var lastAnnounce = 0, lastMsg = '';
    function updateUi(now) {
      var t = (now - t0) / 1000, tg = target();
      var fresh = last.s != null && (t - last.t) < 0.35;
      var dbShow = curDb != null && global._lastSpl != null;
      dbEl.textContent = dbShow ? '≈ ' + Math.round(curDb) + ' dB' : '— dB';
      barFill.style.width = clamp((lvl * 6) * 100, 0, 100) + '%';
      if (fresh) {
        var ni = noteInfo(last.s);
        hz.innerHTML = Math.round(last.s) + '<small>Hz</small>';
        noteEl.textContent = ni.name; centsEl.textContent = (ni.cents >= 0 ? '+' : '') + ni.cents + ' ¢';
        if (tg) {
          if (last.s < tg.min) setChip('dn', '↑ ' + tr('goUp'));
          else if (last.s > tg.max) setChip('up', '↓ ' + tr('goDown'));
          else setChip('in', '✓ ' + tr('inRange'));
        } else setChip('', '');
        gMark.classList.add('on');
        gMark.style.left = clamp(mapLog(last.s) * 100, 2, 98) + '%';
        gMark.style.background = !tg ? 'var(--primary-deep,#e783ad)' : (last.s < tg.min ? 'var(--vl-dn)' : last.s > tg.max ? 'var(--vl-up)' : 'var(--vl-in)');
      } else {
        if ((t - last.t) > 0.9) {
          hz.innerHTML = '—<small>Hz</small>'; noteEl.textContent = '—'; centsEl.textContent = ''; setChip('', '');
          gMark.classList.remove('on');
        }
      }
      if (tg) {
        gBand.style.display = ''; gBand.style.left = clamp(mapLog(tg.min) * 100, 0, 100) + '%';
        gBand.style.width = clamp((mapLog(tg.max) - mapLog(tg.min)) * 100, 1, 100) + '%';
        gLo.textContent = Math.round(Math.exp(yLo)) + ' Hz'; gHi.textContent = Math.round(Math.exp(yHi)) + ' Hz';
      } else { gBand.style.display = 'none'; gLo.textContent = ''; gHi.textContent = ''; }
      syncTargetInputs();
      // mensaje de estado (aviso de "sin señal")
      var msg;
      if (now - lastLoudT > 3000 && now - t0 > 3000) msg = ['err', tr('noSignal')];
      else if (fresh) msg = ['', tr('listening')];
      else msg = ['', (now - lastLoudT < 600) ? tr('noVoice') : tr('listening')];
      if (msg[1] !== lastMsg) { lastMsg = msg[1]; setStatus(msg[1], msg[0] === 'err'); }
      updateStats();
      if (now - lastAnnounce > 1500) { lastAnnounce = now; canvas.setAttribute('aria-label', tr('aria') + (fresh ? ': ' + Math.round(last.s) + ' Hz' : '')); }
    }
    function updateStats() {
      if (!st) return;
      var tg = target();
      sIn.v.textContent = (tg && st.n) ? Math.round(st.inN / st.n * 100) + ' %' : '—';
      sAvg.v.textContent = st.n ? Math.round(st.sum / st.n) + ' Hz' : '—';
      sSpan.v.textContent = st.n ? Math.round(st.min) + '–' + Math.round(st.max) : '—';
      sVoice.v.textContent = fmtTime(st.voiced);
    }
    resetStats();

    /* ---------- gráfico ---------- */
    var dpr = 1, cw = 0, ch = 0, ctx2 = canvas.getContext('2d');
    function resize() {
      dpr = Math.min(global.devicePixelRatio || 1, 3);
      cw = plotWrap.clientWidth; ch = plotWrap.clientHeight;
      if (!cw || !ch) return;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    }
    if (global.ResizeObserver) new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(plotWrap);
    else global.addEventListener('resize', function () { resize(); draw(performance.now()); });

    function colorFor(f, tg) {
      if (!tg) return cssVar('--primary-deep', '#e783ad');
      return f < tg.min ? '#4a9fd8' : f > tg.max ? '#f08a4b' : '#3fae8a';
    }
    function draw(now) {
      if (!cw || !ch) { resize(); if (!cw) return; }
      var g = ctx2; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
      var tg = target(), win = prefs.win;
      var tNow = frozen ? frozenAt : (now - t0) / 1000;
      if (!live && !samples.length) tNow = win;

      // rango vertical adaptativo (suavizado) alrededor del objetivo y de lo observado
      var lo = 70, hi = 400;
      if (tg) { lo = Math.min(lo, tg.min * 0.75); hi = Math.max(hi, tg.max * 1.35); }
      for (var k = samples.length - 1; k >= 0 && samples[k].t > tNow - win; k--) {
        var v = samples[k].s; if (v) { lo = Math.min(lo, v * 0.88); hi = Math.max(hi, v * 1.12); }
      }
      lo = clamp(lo, 45, 300); hi = clamp(hi, 300, 1000);
      yLo += (Math.log(lo) - yLo) * 0.08; yHi += (Math.log(hi) - yHi) * 0.08;

      var padL = 40, padR = 46, padT = 8, padB = 16, volH = 34, gap = 8;
      var px = padL, pw = cw - padL - padR, py = padT, ph = ch - padT - padB - volH - gap;
      var vy = py + ph + gap;
      function yOf(f) { return py + ph - ((Math.log(clamp(f, 40, 1000)) - yLo) / (yHi - yLo)) * ph; }
      function xOf(t) { return px + pw - ((tNow - t) / win) * pw; }

      var cTxt = cssVar('--muted', '#7a7390'), cBg = cssVar('--bg-2', '#f6f1fb');

      // cuadrícula de Hz (izquierda) y notas (derecha)
      g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace'; g.textBaseline = 'middle';
      var ticks = [60, 80, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 800], lastY = -99;
      g.lineWidth = 1;
      ticks.forEach(function (f) {
        if (f < Math.exp(yLo) * 1.02 || f > Math.exp(yHi) * 0.98) return;
        var y = yOf(f); if (Math.abs(y - lastY) < 15) return; lastY = y;
        g.strokeStyle = 'rgba(120,110,140,.16)'; g.beginPath(); g.moveTo(px, y); g.lineTo(px + pw, y); g.stroke();
        g.fillStyle = cTxt; g.textAlign = 'right'; g.fillText(f + '', px - 6, y);
      });
      g.textAlign = 'left'; lastY = -99;
      for (var m = 36; m <= 96; m++) {
        var nm = ((m % 12) + 12) % 12; if (nm !== 0 && nm !== 7) continue;
        var nf = midiToHz(m); if (nf < Math.exp(yLo) * 1.02 || nf > Math.exp(yHi) * 0.98) continue;
        var ny = yOf(nf); if (Math.abs(ny - lastY) < 15) continue; lastY = ny;
        g.fillStyle = cTxt; g.fillText(NOTE_NAMES[nm] + (Math.floor(m / 12) - 1), px + pw + 6, ny);
      }

      // banda objetivo
      if (tg) {
        var y1 = yOf(tg.max), y2 = yOf(tg.min);
        var gr = g.createLinearGradient(0, y1, 0, y2);
        gr.addColorStop(0, 'rgba(63,174,138,.20)'); gr.addColorStop(.5, 'rgba(63,174,138,.12)'); gr.addColorStop(1, 'rgba(63,174,138,.20)');
        g.fillStyle = gr; g.fillRect(px, y1, pw, y2 - y1);
        g.strokeStyle = 'rgba(63,174,138,.75)'; g.setLineDash([6, 4]); g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(px, y1); g.lineTo(px + pw, y1); g.moveTo(px, y2); g.lineTo(px + pw, y2); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(42,138,107,.95)'; g.textAlign = 'left';
        g.fillText(Math.round(tg.max), px + 4, y1 + 9); g.fillText(Math.round(tg.min), px + 4, y2 - 9);
      }

      // trazo de tono (coloreado según esté dentro / arriba / abajo del rango)
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 3.2;
      var prev = null;
      for (var i = 0; i < samples.length; i++) {
        var p = samples[i];
        if (p.t < tNow - win - 0.2 || p.t > tNow) { prev = null; continue; }
        if (p.s == null) { prev = null; continue; }
        if (prev && (p.t - prev.t) < 0.14) {
          var col = colorFor(p.s, tg);
          g.globalAlpha = clamp((xOf(p.t) - px) / (pw * 0.18), 0.12, 1);
          g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 6;
          g.beginPath(); g.moveTo(xOf(prev.t), yOf(prev.s)); g.lineTo(xOf(p.t), yOf(p.s)); g.stroke();
        }
        prev = p;
      }
      g.shadowBlur = 0; g.globalAlpha = 1;

      // punto actual
      if (live && !frozen && last.s != null && (tNow - last.t) < 0.3) {
        var cx = xOf(last.t), cy = yOf(last.s), cc = colorFor(last.s, tg);
        var pulse = 9 + 3 * Math.sin(now / 160);
        g.fillStyle = cc; g.globalAlpha = .22; g.beginPath(); g.arc(cx, cy, pulse + 4, 0, 7); g.fill(); g.globalAlpha = 1;
        g.beginPath(); g.arc(cx, cy, 6.5, 0, 7); g.fillStyle = cc; g.fill();
        g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke();
      }

      // carril de volumen
      g.fillStyle = 'rgba(120,110,140,.10)'; g.fillRect(px, vy, pw, volH);
      var any = false; g.beginPath(); var firstX = 0, lastX = 0;
      for (var j = 0; j < samples.length; j++) {
        var q = samples[j]; if (q.t < tNow - win || q.t > tNow || q.db == null) continue;
        var h = clamp((q.db - 30) / 60, 0, 1) * (volH - 4), xq = xOf(q.t);
        if (!any) { g.moveTo(xq, vy + volH); g.lineTo(xq, vy + volH - h); firstX = xq; any = true; } else g.lineTo(xq, vy + volH - h);
        lastX = xq;
      }
      if (any) {
        g.lineTo(lastX, vy + volH); g.lineTo(firstX, vy + volH); g.closePath();
        g.fillStyle = 'rgba(155,123,217,.35)'; g.fill();
      }
      g.fillStyle = cTxt; g.textAlign = 'left'; g.fillText(tr('volume'), px + 4, vy + 9);

      // eje de tiempo
      g.textAlign = 'center'; g.fillStyle = cTxt; g.textBaseline = 'alphabetic';
      var step = win <= 10 ? 2 : 5;
      for (var s = 0; s <= win; s += step) {
        var xs = px + pw - (s / win) * pw; g.fillText(s === 0 ? '0' : '−' + s + 's', xs, ch - 3);
      }

      // cursor / tooltip
      if (hoverX != null && hoverX >= px && hoverX <= px + pw) {
        var th = tNow - ((px + pw - hoverX) / pw) * win, best = null, bd = 0.2;
        for (var z = 0; z < samples.length; z++) {
          var dd = Math.abs(samples[z].t - th);
          if (samples[z].s != null && dd < bd) { bd = dd; best = samples[z]; }
        }
        g.strokeStyle = 'rgba(120,110,140,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(hoverX, py); g.lineTo(hoverX, py + ph); g.stroke();
        if (best) {
          var ni = noteInfo(best.s), label = Math.round(best.s) + ' Hz · ' + ni.name, ago = (tNow - best.t).toFixed(1);
          g.font = '600 12px Inter, system-ui, sans-serif'; var tw = g.measureText(label).width + 16;
          var bx = clamp(hoverX + 10, px, px + pw - tw), by = clamp(yOf(best.s) - 34, py, py + ph - 26);
          g.fillStyle = 'rgba(40,30,60,.88)'; g.beginPath();
          if (g.roundRect) g.roundRect(bx, by, tw, 26, 8); else g.rect(bx, by, tw, 26); g.fill();
          g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(label, bx + 8, by + 13);
          g.beginPath(); g.arc(xOf(best.t), yOf(best.s), 4.5, 0, 7); g.fillStyle = '#fff'; g.fill();
        }
      }
      g.textBaseline = 'middle';
    }
    plotWrap.addEventListener('pointermove', function (e) { hoverX = e.clientX - plotWrap.getBoundingClientRect().left; if (!live || frozen) draw(performance.now()); });
    plotWrap.addEventListener('pointerleave', function () { hoverX = null; if (!live || frozen) draw(performance.now()); });

    /* ---------- botones ---------- */
    btnMain.addEventListener('click', function () { if (live) stop(); else start(); });
    btnSet.addEventListener('click', function () { set.classList.toggle('open'); if (set.classList.contains('open')) populateMics(); });
    btnCompact.addEventListener('click', function () {
      compact = !compact; box.classList.toggle('is-compact', compact);
      btnCompact.textContent = compact ? '▴' : '▾'; btnCompact.title = compact ? tr('expand') : tr('compact');
      setTimeout(function () { resize(); draw(performance.now()); }, 30);
    });
    btnFreeze.addEventListener('click', function () {
      frozen = !frozen; if (frozen) frozenAt = (performance.now() - t0) / 1000;
      btnFreeze.setAttribute('aria-pressed', frozen ? 'true' : 'false'); texts(); draw(performance.now());
    });
    btnReset.addEventListener('click', function () { samples = []; last = { f: null, s: null, t: 0 }; resetStats(); draw(performance.now()); });
    sens.addEventListener('input', function () { prefs.sens = +sens.value; savePrefs(); });

    function calibrate(ref) {
      return new Promise(function (resolve) {
        if (!live) return resolve(false);
        var acc = [], n = 0, id = setInterval(function () {
          if (curDb != null && global._lastSpl != null) acc.push(curDb - prefs.dbOffset);
          if (++n >= 10) {
            clearInterval(id);
            if (!acc.length) return resolve(false);
            prefs.dbOffset = ref - median(acc); savePrefs(); resolve(true);
          }
        }, 120);
      });
    }
    btnCal.addEventListener('click', function () {
      var v = parseFloat(inCal.value);
      if (!isFinite(v)) { inCal.focus(); return; }
      calibrate(v).then(function (ok) {
        calNote.textContent = ok ? tr('calibDone') + ' (' + v + ' dB)' : tr('calibFail');
        if (ok && opts.onLog) opts.onLog('Calibración aplicada: ' + v + ' dB');
      });
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && live && ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
    });
    global.addEventListener('cv-lang-changed', function () { texts(); });

    texts(); populateMics(); syncTargetInputs(); setChip('', ''); resize(); draw(performance.now());

    /* ---------- API pública ---------- */
    return {
      start: start, stop: function () { stop(); },
      get running() { return live; },
      get stream() { return stream; },
      get analyser() { return analyser; },
      get sampleRate() { return ctx ? ctx.sampleRate : 44100; },
      currentF0: function () {                     // F0 vigente (Hz) o null; para mediciones de frases
        if (!live) return null;
        var t = (performance.now() - t0) / 1000;
        return (last.f != null && (t - last.t) < 0.3) ? Math.round(last.f * 10) / 10 : null;
      },
      lastDb: function () { return global._lastSpl; },
      stats: function () { return st ? { voicedSeconds: st.voiced, meanF0: st.n ? st.sum / st.n : null, minF0: st.n ? st.min : null, maxF0: st.n ? st.max : null, pctInRange: st.n ? st.inN / st.n * 100 : null } : null; },
      resetStats: function () { resetStats(); },
      refreshTarget: function () { syncTargetInputs(); draw(performance.now()); },
      calibrate: calibrate
    };
  }

  global.VozLive = { mount: mount, yin: yin, noteInfo: noteInfo };
})(window);
