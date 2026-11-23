
/* borrowed-tomorrow | fullbleed + synchronized scroll | v17 adapted */
(() => {
  const script = document.currentScript;
  const target = document.getElementById('borrowed-tomorrow');
  if (!script || !target || target.dataset.loaded) return;
  target.dataset.loaded = '1';

  const src = new URL('index.html', script.src);
  const origin = src.origin;
  const frame = document.createElement('iframe');
  frame.src = src.href;
  frame.title = '빌린 내일 | 청년 부채 비주얼뉴스';
  frame.loading = 'eager';
  frame.setAttribute('allow', 'fullscreen');
  frame.setAttribute('scrolling', 'no');
  frame.style.cssText = [
    'display:block', 'position:fixed', 'top:0', 'left:0',
    'width:100vw', 'height:100vh', 'border:0', 'margin:0', 'padding:0',
    'background:#080808', 'z-index:50',
    'visibility:hidden', 'pointer-events:none'
  ].join(';') + ';';
  document.body.appendChild(frame);

  target.style.cssText = [
    'display:block!important', 'position:relative!important',
    'box-sizing:border-box!important', 'width:100vw!important',
    'max-width:none!important', 'min-width:0!important',
    'height:100vh!important', 'min-height:100vh!important',
    'margin:0!important', 'padding:0!important',
    'float:none!important', 'clear:both!important',
    'overflow:visible!important'
  ].join(';') + ';';

  let contentHeight = 0;
  let queued = false;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;
  const vw = () => document.documentElement.clientWidth || window.innerWidth;

  function unlockParents() {
    let p = target.parentElement;
    let count = 0;
    while (p && p !== document.body && count++ < 15) {
      const s = getComputedStyle(p);
      if (['hidden','clip'].includes(s.overflowX) ||
          ['hidden','clip'].includes(s.overflow)) {
        p.style.setProperty('overflow-x', 'visible', 'important');
        if (['hidden','clip'].includes(s.overflowY))
          p.style.setProperty('overflow-y', 'visible', 'important');
      }
      p = p.parentElement;
    }
  }

  function align() {
    unlockParents();
    target.style.setProperty('left', '0px', 'important');
    target.style.setProperty('width', vw() + 'px', 'important');
    const x = target.getBoundingClientRect().left;
    if (Math.abs(x) > .5) target.style.setProperty('left', -x + 'px', 'important');
    frame.style.width = vw() + 'px';
    frame.style.height = vh() + 'px';
    if (contentHeight) target.style.setProperty('height', Math.max(contentHeight, vh()) + 'px', 'important');
    sync();
  }

  function sync() {
    const rect = target.getBoundingClientRect();
    const height = vh();
    const visible = rect.bottom > 0 && rect.top < height;
    frame.style.visibility = visible ? 'visible' : 'hidden';
    frame.style.pointerEvents = visible ? 'auto' : 'none';
    if (!visible) return;
    const offset = rect.top > 0
      ? Math.min(height, rect.top)
      : rect.bottom < height
        ? Math.max(-height, rect.bottom - height)
        : 0;
    frame.style.top = offset + 'px';
    frame.style.clipPath = 'none';
    const max = Math.max(0, contentHeight - height);
    const y = Math.max(0, Math.min(max, -rect.top));
    frame.contentWindow?.postMessage({
      type: 'borrowed-tomorrow-set-scroll', y, viewportHeight: height
    }, origin);
  }

  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  }

  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.origin !== origin) return;
    const data = event.data || {};
    if (data.type === 'borrowed-tomorrow-height') {
      const height = Number(data.height);
      if (!Number.isFinite(height) || height < 1) return;
      contentHeight = Math.min(height, 200000);
      target.style.setProperty('height', Math.max(contentHeight, vh()) + 'px', 'important');
      queueSync();
    } else if (data.type === 'borrowed-tomorrow-wheel') {
      const delta = Number(data.deltaY);
      if (Number.isFinite(delta))
        window.scrollBy(0, Math.max(-1500, Math.min(1500, delta)));
    }
  });

  frame.addEventListener('load', () => {
    frame.contentWindow?.postMessage({type: 'borrowed-tomorrow-request-height'}, origin);
    align();
  });
  window.addEventListener('scroll', queueSync, {passive:true});
  window.addEventListener('resize', align, {passive:true});
  window.addEventListener('orientationchange', align, {passive:true});
  align();
  requestAnimationFrame(align);
  setTimeout(align, 300);
  setTimeout(align, 1000);
})();
