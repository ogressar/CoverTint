/* CoverTint 1.0 — ogressar. */
(() => {
  'use strict';
  window.__coverTint?.destroy();
  const style = document.createElement('style');
  style.id = 'cover-tint-style';
  (document.head || document.documentElement).append(style);
  const explicitStyle = document.createElement('style');
  explicitStyle.id = 'cover-tint-explicit-style';
  explicitStyle.textContent = "body svg:has(use[href*=\"#explicit_\"],use[*|href*=\"#explicit_\"],use[href$=\"#exclamation_xxxs\"],use[*|href$=\"#exclamation_xxxs\"]),\nbody :is([class*=\"Fullscreen\"],[class*=\"FullScreen\"],[class*=\"Player\"],[class*=\"Meta\"]):is(svg):has(use[href*=\"#exclamation_\"],use[*|href*=\"#exclamation_\"]),\nbody :is([class*=\"Fullscreen\"],[class*=\"FullScreen\"],[class*=\"Player\"],[class*=\"Meta\"]) svg:has(use[href*=\"#exclamation_\"],use[*|href*=\"#exclamation_\"]) { background-color:var(--ct-accent,currentColor)!important; -webkit-mask:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2018%2018%22%3E%3Cpath%20fill%3D%22black%22%20fill-rule%3D%22evenodd%22%20d%3D%22M4%202H14Q16%202%2016%204V14Q16%2016%2014%2016H4Q2%2016%202%2014V4Q2%202%204%202ZM6%205V13H12V11.5H7.7V9.7H11.4V8.2H7.7V6.5H12V5Z%22%2F%3E%3C%2Fsvg%3E\") center/contain no-repeat!important; mask:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2018%2018%22%3E%3Cpath%20fill%3D%22black%22%20fill-rule%3D%22evenodd%22%20d%3D%22M4%202H14Q16%202%2016%204V14Q16%2016%2014%2016H4Q2%2016%202%2014V4Q2%202%204%202ZM6%205V13H12V11.5H7.7V9.7H11.4V8.2H7.7V6.5H12V5Z%22%2F%3E%3C%2Fsvg%3E\") center/contain no-repeat!important; }\nbody svg:has(use[href*=\"#explicit_\"],use[*|href*=\"#explicit_\"],use[href$=\"#exclamation_xxxs\"],use[*|href$=\"#exclamation_xxxs\"]) > *,\nbody :is([class*=\"Fullscreen\"],[class*=\"FullScreen\"],[class*=\"Player\"],[class*=\"Meta\"]):is(svg):has(use[href*=\"#exclamation_\"],use[*|href*=\"#exclamation_\"]) > *,\nbody :is([class*=\"Fullscreen\"],[class*=\"FullScreen\"],[class*=\"Player\"],[class*=\"Meta\"]) svg:has(use[href*=\"#exclamation_\"],use[*|href*=\"#exclamation_\"]) > * { opacity:0!important; }";
  (document.head || document.documentElement).append(explicitStyle);
  let dead = false, current = '';
  let timer;
  const defaults = { adaptive: true, explicitE: true, tintedText: true, darker: false, smooth: true };
  let options = { ...defaults }, settingsStore, unsubscribe;
  function applySettings(raw = {}) {
    const next = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const entry = raw?.[key];
      const value = entry && typeof entry === 'object' ? (entry.value ?? entry.default) : entry;
      next[key] = typeof value === 'boolean' ? value : fallback;
    }
    if (JSON.stringify(next) !== JSON.stringify(options)) {
      options = next;
      current = '';
    }
    if (explicitStyle.sheet) explicitStyle.sheet.disabled = !options.explicitE;
    if (!options.adaptive) {
      style.textContent = '';
      document.querySelectorAll('[data-ct-button-ink]').forEach(el => el.removeAttribute('data-ct-button-ink'));
    }
  }
  function syncSettings() {
    try {
      if (!settingsStore && window.pulsesyncApi?.getSettings) {
        const store = window.pulsesyncApi.getSettings('CoverTint');
        if (store?.getCurrent) {
          applySettings(store.getCurrent());
          settingsStore = store;
          unsubscribe = store.onChange?.(raw => { if (!dead) { applySettings(raw); tick(); } });
        }
      }
      if (settingsStore) applySettings(settingsStore.getCurrent());
    } catch { /* Retain the last valid settings until the API is available. */ }
  }
  const mix = (rgb, target, amount) => rgb.map(v => Math.round(v * (1 - amount) + target * amount));
  const rgb = a => `rgb(${a.join(',')})`;
  function paletteColor(color, lightness, saturationScale = 1) {
    const [r,g,b] = color.map(v => v / 255);
    const hi = Math.max(r,g,b), lo = Math.min(r,g,b), delta = hi-lo;
    const l = (hi+lo)/2;
    let h = 0, sat = 0;
    if (delta > .025) {
      sat = delta / (1-Math.abs(2*l-1));
      h = hi===r ? ((g-b)/delta)%6 : hi===g ? (b-r)/delta+2 : (r-g)/delta+4;
      h = (h*60+360)%360;
      sat = Math.min(.72, sat*.92);
    }
    sat = Math.min(.92, sat * saturationScale);
    const c = (1-Math.abs(2*lightness-1))*sat;
    const x = c*(1-Math.abs((h/60)%2-1)), m = lightness-c/2;
    const v = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
    return rgb(v.map(n => Math.round((n+m)*255)));
  }
  function readable(c,background) {
    const lum=a=>a.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    for(let i=0;i<20 && (lum(c)+.05)/(lum(background)+.05)<4.5;i++) c=mix(c,255,.12);
    return rgb(c);
  }
  function paint(color, native={}) {
    // Keep bright metadata colors suitable for the user's dark theme.
    const peak=Math.max(...color);
    const ceiling = options.darker ? 55 : 85;
    if(peak>ceiling) color=color.map(v=>Math.round(v*ceiling/peak));
    const bg = rgb(mix(color,0,.20));
    const panel = rgb(color);
    const player = panel;
    const accent = options.tintedText ? readable(native.accent || native.miniPlayer || mix(color,255,.65),color) : "rgb(225,225,225)";
    const buttonBase=native.accent || native.miniPlayer || mix(color,255,.55);
    const buttonPeak=Math.max(...buttonBase);
    const buttonFill=rgb(buttonBase.map(v=>Math.round(v*Math.min(1,175/Math.max(1,buttonPeak)))));
    const text = options.tintedText ? readable(native.waveText || mix(color,255,.80),color) : "rgb(235,235,235)";
    const secondary = options.tintedText ? readable(native.miniPlayer || mix(color,255,.65),color) : "rgb(200,200,200)";
    const muted = options.tintedText ? paletteColor(color,.60,.50) : "rgb(153,153,153)";
    const surface = rgb(mix(color,255,.09));
    const hover = rgb(mix(color,255,.16));
    const outline = rgb(mix(color,255,.24));
    const tokens = {};
    const put = (name,value) => { tokens['--ym-'+name] = value; };
    for (const [key,value] of Object.entries({
      'primary-enabled-basic':bg, 'primary-enabled-content':panel,
      'secondary-enabled-blur':player, 'secondary-enabled-content':player,
      'secondary-enabled-basic':player,
      'primary-enabled-popup':player, 'secondary-enabled-popup':player,
      'primary-enabled-popover':player, 'secondary-enabled-popover':player,
      'primary-enabled-modal':player, 'secondary-enabled-modal':player,
      'primary-enabled-tooltip':player, 'secondary-enabled-tooltip':player
    })) put('background-color-'+key,value);
    for (const family of ['primary','secondary','accent']) {
      for (const state of ['enabled','hovered','pressed','selected']) {
        put(`controls-color-${family}-text-${state}`, family==='secondary'?secondary:text);
        put(`controls-color-${family}-text-${state}_variant`,text);
        put(`controls-color-${family}-on_outline-${state}`,text);
      }
      put(`controls-color-${family}-text-disabled`,muted);
      put(`controls-color-${family}-on_outline-disabled`,muted);
      put(`controls-color-${family}-outline-enabled_stroke`,muted);
      put(`controls-color-${family}-outline-selected_stroke`,accent);
    }
    for (const family of ['primary','accent']) {
      for(const state of ['enabled','hovered','pressed']) {
        put(`controls-color-${family}-default-${state}`,buttonFill);
        put(`controls-color-${family}-on_default-${state}`,bg);
      }
    }
    for(const state of ['enabled','hovered','pressed']) {
      put(`controls-color-secondary-default-${state}`,state==='enabled'?surface:hover);
      put(`controls-color-secondary-on_default-${state}`,text);
      put(`controls-color-secondary-card-${state}`,state==='enabled'?surface:hover);
    }
    put('controls-color-secondary-outline-enabled_stroke',outline);
    put('controls-color-secondary-outline-hovered_stroke',accent);
    put('controls-color-secondary-outline-selected',surface);
    put('controls-color-secondary-on_default-enabled_variant',secondary);
    put('controls-color-secondary-on_default-disabled',muted);
    put('controls-color-secondary-text-selected',accent);
    put('text-color-primary',text);
    put('text-color-secondary',secondary);
    put('logo-color-primary-variant',accent);
    put('logo-text-color',text);
    style.textContent = `
    html:root,html.ym-dark-theme,html.ym-light-theme,body,
    body .ym-dark-theme,body .ym-light-theme {
      --ct-bg:${bg}; --ct-panel:${panel}; --ct-player:${player};
      --ct-text:${text}; --ct-secondary:${secondary}; --ct-accent:${accent};
      ${Object.entries(tokens).map(([k,v])=>k+':'+v+'!important;').join('\n')}
      color:${text};
    }
    /* Let native components retain their backgrounds, radii and gradients.
       Only their shared palette changes: no rectangular page overlays. */
    html,body { background-color:${bg}!important; }
    /* Override fixed player backgrounds while retaining native geometry and progress. */
    body :is([class^="PlayerBarDesktopWithBackgroundProgressBar_root__"],[class*=" PlayerBarDesktopWithBackgroundProgressBar_root__"]),
    body :is([class^="PlayerBarDesktop_root__"],[class*=" PlayerBarDesktop_root__"]),
    body :is([class^="PlayerBarMobile_root__"],[class*=" PlayerBarMobile_root__"]),
    body :is([class^="PlayerBar_root__"],[class*=" PlayerBar_root__"]),
    body :is([class^="PlayerBarDesktopWithBackgroundProgressBar_root__"],[class*=" PlayerBarDesktopWithBackgroundProgressBar_root__"])[class*="important"] {
      background-color:${player}!important;
      background-image:none!important;
    }
    body :is([class^="PlayerBarDesktopWithBackgroundProgressBar_player__"],[class*=" PlayerBarDesktopWithBackgroundProgressBar_player__"]) {
      background-color:transparent!important;
      background-image:none!important;
    }
    body :is([class^="PlayerBarDesktopWithBackgroundProgressBar_root__"],[class*=" PlayerBarDesktopWithBackgroundProgressBar_root__"]) [class*="progress" i] {
      --ym-controls-color-secondary-default-enabled:color-mix(in srgb,${accent} 12%,transparent)!important;
    }
    /* Cover native typography and portal-mounted text, including hashed classes. */
    body :is(div,span,p,a,label,small,strong,b,h1,h2,h3,h4,h5,h6,li,button,input,textarea,select):not([class*="lyrics" i]):not([class*="lyrics" i] *):not([class*="FullscreenPlayer"] *):not([class*="FullscreenPlayer"]) {
      color:${text}!important;
    }
    body :is([class*="artist" i],[class*="subtitle" i],[class*="description" i],
      [class*="caption" i],[class*="duration" i],[class*="Meta_album"]):not([class*="lyrics" i] *):not([class*="FullscreenPlayer"] *) {
      color:${secondary}!important;
    }
    body :is(input,textarea)::placeholder { color:${secondary}!important; opacity:.8; }
    /* Icons get an explicit tint; paths still retain their original geometry. */
    body svg { color:${accent}!important; }
    body svg :is(use,path,circle,rect,polygon,polyline,line,g) { color:inherit!important; }
    body svg:not([fill="none"]) { fill:currentColor!important; }
    body svg [fill]:not([fill="none"]):not([fill^="url("]) { fill:currentColor!important; }
    body svg [stroke]:not([stroke="none"]):not([stroke^="url("]) { stroke:currentColor!important; }
    /* Portal menus must have their own surface: never color the backdrop. */
    body :is([role="menu"],[role="listbox"],[role="tooltip"],
      [data-radix-popper-content-wrapper]>*,[class*="Popover_root"],
      [class*="Popover_content"],[class*="Tooltip_content"],[class*="Tooltip_root"],
      [class*="Modal_content"],[class*="Dialog_content"],
      [class*="ContextMenu_root"],[class*="ContextMenu_content"],
      [class*="QualitySettings_root"],[class*="AudioSettings_root"],
      [class*="SoundSettings_root"],[class*="SoundQuality_root"],
      [class*="PlayerSettings_root"],[class*="SettingsPopup_root"],
      .PulseSync_castPopover):not([class*="lyrics" i]):not([class*="FullscreenPlayer"]):not(:has([class*="lyrics" i])):not(:has([class*="FullscreenPlayer"])) {
      background:${player}!important;
      border-color:color-mix(in srgb,${accent} 22%,transparent)!important;
    }
    body :is([role="menuitem"],[role="option"]):hover {
      background-color:${hover}!important;
    }
    /* Bright play buttons require dark labels and icons for contrast. */
    body :is(button,a,[role="button"]):is([class*="PlayButton_root"],[class*="playButton"],[class*="withYellowPlayButton"],
      [class*="sonataPlayButton"]) {
      background-color:${buttonFill}!important; color:${bg}!important;
    }
    body :is(button,a,[role="button"]):is([class*="PlayButton_root"],[class*="playButton"],[class*="withYellowPlayButton"],
      [class*="sonataPlayButton"]) :is(span,div,svg,svg *) { color:${bg}!important; }
    body :is([aria-pressed="true"],[aria-selected="true"]) { color:${accent}!important; }
    body :is(button:disabled,[aria-disabled="true"]),
    body :is(button:disabled,[aria-disabled="true"]) :is(span,svg,svg *) {
      color:${muted}!important;
    }
    /* Actual button surface determines ink, including hashed button classes. */
    body [data-ct-button-ink="dark"],body [data-ct-button-ink="dark"] * {
      color:#141414!important; -webkit-text-fill-color:#141414!important;
    }
    body [data-ct-button-ink="light"],body [data-ct-button-ink="light"] * {
      color:#f5f5f5!important; -webkit-text-fill-color:#f5f5f5!important;
    }
    @media(prefers-reduced-motion:no-preference) {
      body,[class*="Content_main"],[class*="Navbar_root"],
      :is([class^="PlayerBarDesktop_root__"],[class*=" PlayerBarDesktop_root__"]),:is([class^="PlayerBarDesktopWithBackgroundProgressBar_player__"],[class*=" PlayerBarDesktopWithBackgroundProgressBar_player__"]) {
        transition:${options.smooth ? 'background-color .7s ease,color .7s ease' : 'none'};
      }
    }
    `;
  }
  const sourceSelector = '[class*="FullscreenPlayerMobile_root"],[class*="FullscreenPlayerDesktop_root"]';
  function readPlayerColor() {
    // Temporarily suspend only our palette while reading native computed styles.
    // Restored synchronously before the browser paints, preventing feedback.
    const sheet=style.sheet;
    const wasDisabled=sheet?.disabled;
    try {
      if(sheet) sheet.disabled=true;
      for(const el of document.querySelectorAll(sourceSelector)) {
        const cs=getComputedStyle(el), rect=el.getBoundingClientRect();
        if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0||rect.width<1||rect.height<1) continue;
        const match=cs.backgroundColor.match(/^rgba?\(([^)]+)\)$/);
        if(!match) continue;
        const parts=match[1].split(/[\s, /]+/).filter(Boolean).map(Number);
        if(parts.length<3 || parts.some(v=>!Number.isFinite(v)) || (parts.length>3&&parts[3]<.98)) continue;
        return parts.slice(0,3).map(v=>Math.max(0,Math.min(255,Math.round(v))));
      }
    } finally { if(sheet) sheet.disabled=wasDisabled; }
    return null;
  }
  function parseHex(value) {
    if(typeof value!=='string'||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return null;
    let hex=value.slice(1); if(hex.length===3) hex=hex.split('').map(c=>c+c).join('');
    return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
  }
  function updateButtonContrast() {
    for(const el of document.querySelectorAll('button,[role="button"],a[data-ct-button-ink]')) {
      if(el.disabled || el.getAttribute('aria-disabled')==='true') {el.removeAttribute('data-ct-button-ink');continue;}
      const label=(el.textContent || '').trim();
      const aria=(el.getAttribute('aria-label') || '').trim();
      const playback=/^(слушать|воспроизвести|пауза|продолжить|play|pause|resume)$/i;
      const isPlayback=playback.test(label) || (!label && playback.test(aria));
      if(!isPlayback) {el.removeAttribute('data-ct-button-ink');continue;}
      const cs=getComputedStyle(el);
      const m=cs.backgroundColor.match(/^rgba?\(([^)]+)\)$/);
      const v=m?.[1].split(/[\s, /]+/).filter(Boolean).map(Number);
      if(!v || v.length<3 || (v.length>3&&v[3]<.98) || cs.backgroundImage!=='none') {
        el.removeAttribute('data-ct-button-ink');continue;
      }
      const lum=v.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
        .reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
      const darkRatio=(lum+.05)/(.006995+.05);
      const lightRatio=(.913099+.05)/(lum+.05);
      const ink=darkRatio>=lightRatio?'dark':'light';
      if(el.getAttribute('data-ct-button-ink')!==ink) el.setAttribute('data-ct-button-ink',ink);
    }
  }
  function tick() {
    if(dead) return;
    syncSettings();
    if (!options.adaptive) return;
    try {
      let track;
      try { track=window.pulsesyncApi?.getCurrentTrack?.(); } catch { /* native fallback */ }
      const raw=track?.derivedColors || {};
      const native={};
      for(const name of ['average','miniPlayer','accent','waveText']) native[name]=parseHex(raw[name]);
      const color=native.average || readPlayerColor();
      if(!color) return;
      // Include all fields: metadata can arrive after the track ID changes.
      const key=JSON.stringify([color,native]);
      if(key!==current) { paint(color,native); current=key; }
    } catch(error) { console.debug('[CoverTint] Track palette unavailable',error); }
    finally { if(!dead) { try { updateButtonContrast(); } catch {} } }
  }
  function destroy() {
    dead=true;
    document.querySelectorAll('[data-ct-button-ink]').forEach(el=>el.removeAttribute('data-ct-button-ink'));
    clearInterval(timer);
    try { if (typeof unsubscribe === 'function') unsubscribe(); } catch {}
    style.remove(); explicitStyle.remove();
    window.removeEventListener('pagehide',destroy);
    if(window.__coverTint?.destroy===destroy) delete window.__coverTint;
  }
  window.__coverTint={destroy};
  window.addEventListener('pagehide',destroy,{once:true});
  timer=setInterval(tick,700);
  tick();
})();
