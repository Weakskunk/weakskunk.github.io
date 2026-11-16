(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer   = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Custom cursor: dot + comet trail + detection frame ---------- */
  if (finePointer && !reduceMotion){
    document.body.classList.add('has-custom-cursor');
    const dot    = document.getElementById('cursor-dot');
    const frame  = document.getElementById('cursor-frame');
    const trail1 = document.getElementById('cursor-trail-1');
    const trail2 = document.getElementById('cursor-trail-2');

    let mouseX = 0, mouseY = 0;
    let frameX = 0, frameY = 0;
    let t1X = 0, t1Y = 0, t2X = 0, t2Y = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.left = mouseX + 'px';
      dot.style.top  = mouseY + 'px';
    });

    function animateCursor(){
      frameX += (mouseX - frameX) * 0.22;
      frameY += (mouseY - frameY) * 0.22;
      frame.style.left = frameX + 'px';
      frame.style.top  = frameY + 'px';

      t1X += (frameX - t1X) * 0.28;
      t1Y += (frameY - t1Y) * 0.28;
      trail1.style.left = t1X + 'px';
      trail1.style.top  = t1Y + 'px';

      t2X += (t1X - t2X) * 0.28;
      t2Y += (t1Y - t2Y) * 0.28;
      trail2.style.left = t2X + 'px';
      trail2.style.top  = t2Y + 'px';

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.querySelectorAll('a, button, .project-card, .bb-stage').forEach(el => {
      el.addEventListener('mouseenter', () => frame.classList.add('locked'));
      el.addEventListener('mouseleave', () => frame.classList.remove('locked'));
    });
  } else {
    ['cursor-dot','cursor-frame','cursor-trail-1','cursor-trail-2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  /* ---------- Constellation background (with gentle twinkle) ---------- */
  const canvas = document.getElementById('constellation');
  const ctx = canvas.getContext('2d');
  let points = [];

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function initPoints(){
    const count = Math.min(60, Math.floor(window.innerWidth / 24));
    points = Array.from({length: count}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2
    }));
  }
  resize(); initPoints();
  window.addEventListener('resize', () => { resize(); initPoints(); });

  function drawFrame(t){
    const time = t || 0;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for (const p of points){
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
    for (let i=0; i<points.length; i++){
      for (let j=i+1; j<points.length; j++){
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 140){
          ctx.strokeStyle = `rgba(201,154,60,${0.18 * (1 - dist/140)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
      const twinkle = 0.5 + 0.4 * Math.sin(time / 900 + points[i].phase);
      const dotColor = i % 2 === 0 ? '228,181,74' : '111,78,55';
      ctx.fillStyle = `rgba(${dotColor},${(0.3 + 0.4 * twinkle).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, 1.2 + twinkle, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function loop(ts){
    if (!document.hidden) drawFrame(ts);
    requestAnimationFrame(loop);
  }
  if (!reduceMotion){ requestAnimationFrame(loop); } else { drawFrame(0); }

  /* ---------- Nav: background on scroll + active page ---------- */
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  });

  const navLinks = document.querySelectorAll('.nav-links a');
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#')){
      const hrefPage = href.split('/').pop();
      a.classList.toggle('active', hrefPage === currentPage);
    }
  });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinksList = document.getElementById('navLinks');
  if (navToggle && navLinksList){
    navToggle.addEventListener('click', () => navLinksList.classList.toggle('open'));
    navLinksList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinksList.classList.remove('open')));
  }

  /* ---------- Entrance animation ---------- */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => document.body.classList.add('loaded'));
  });

  /* ---------- Black box ---------- */
  const blackbox = document.getElementById('blackbox');
  if (blackbox){
    function toggleBox(){
      const isOpen = blackbox.classList.toggle('open');
      blackbox.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    blackbox.addEventListener('click', toggleBox);
    blackbox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggleBox();
      }
    });
  }

  /* ---------- BibTeX copy buttons (publications page) ---------- */
  document.querySelectorAll('.bibtex-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeEl = document.getElementById(btn.dataset.copyTarget);
      if (!codeEl) return;
      const text = codeEl.textContent.trim();
      const markCopied = () => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(markCopied).catch(() => {});
      }
    });
  });

  /* ---------- PhD progress bar (resume page only) ---------- */
  const progressFill = document.getElementById('phdProgressFill');
  const progressPct  = document.getElementById('phdProgressPct');
  if (progressFill && progressPct){
    const start = new Date('2026-09-01T00:00:00');
    const end   = new Date('2030-09-01T00:00:00');
    const now   = new Date();
    let pct = ((now - start) / (end - start)) * 100;
    pct = Math.max(0, Math.min(100, pct));
    progressFill.style.width = pct.toFixed(1) + '%';
    progressPct.textContent = Math.round(pct) + '% through the PhD';
  }
})();

/* =====================================================================
   Talk photos: small thumbnails under a talk + lightbox (arrows, dots,
   keyboard, swipe). Markup, per talk:
     <div class="talk-photos">
       <a class="talk-photo" href="photos/x.jpg" data-caption="…"><img src="photos/x.jpg" alt="…"></a>
       …
     </div>
   ===================================================================== */
(function(){
  const MAX_THUMBS = 3;           // thumbnails shown per talk (the rest go behind "+N")
  const MAX_DOTS   = 12;          // above this, show "3 / 15" instead of dots
  const groups = document.querySelectorAll('.talk-photos');
  if (!groups.length) return;

  const photosOf = (group) => Array.from(group.querySelectorAll('a.talk-photo'));

  /* show the first MAX_THUMBS, badge the last visible one with "+N" */
  function layout(group){
    const photos = photosOf(group);
    group.hidden = photos.length === 0;
    photos.forEach((a, i) => {
      a.classList.toggle('is-extra', i >= MAX_THUMBS);
      a.removeAttribute('data-more');
    });
    const extra = photos.length - MAX_THUMBS;
    if (extra > 0) photos[MAX_THUMBS - 1].setAttribute('data-more', '+' + extra);
  }

  /* a photo that does not exist (yet) is simply left out */
  groups.forEach(group => {
    photosOf(group).forEach(a => {
      const img = a.querySelector('img');
      if (!img) return;
      const drop = () => {
        console.warn('[talk-photos] photo not found, skipped:', a.getAttribute('href'));
        a.remove(); layout(group);
      };
      img.addEventListener('error', drop, { once: true });
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) drop();
    });
    layout(group);
  });

  /* ---------- lightbox ---------- */
  const ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const ICON_PREV  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const ICON_NEXT  = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  let box, imgEl, capEl, dotsEl, closeBtn;
  let items = [], index = 0, lastFocus = null, token = 0;

  function build(){
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML =
      '<button type="button" class="lb-close" aria-label="Close">' + ICON_CLOSE + '</button>' +
      '<button type="button" class="lb-nav lb-prev" aria-label="Previous photo">' + ICON_PREV + '</button>' +
      '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
      '<button type="button" class="lb-nav lb-next" aria-label="Next photo">' + ICON_NEXT + '</button>' +
      '<div class="lb-dots"></div>';
    document.body.appendChild(box);

    imgEl    = box.querySelector('.lb-img');
    capEl    = box.querySelector('.lb-caption');
    dotsEl   = box.querySelector('.lb-dots');
    closeBtn = box.querySelector('.lb-close');

    closeBtn.addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    dotsEl.addEventListener('click', (e) => {
      const dot = e.target.closest('.lb-dot');
      if (dot) show(Number(dot.dataset.i));
    });

    /* click on the dark background closes the viewer */
    box.addEventListener('click', (e) => {
      if (!e.target.closest('.lb-img, .lb-caption, .lb-nav, .lb-close, .lb-dots')) close();
    });

    /* swipe left / right on touch screens */
    let sx = 0, sy = 0;
    box.addEventListener('touchstart', (e) => {
      sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* keep the custom cursor "locked" on the viewer's buttons */
    const frame = document.getElementById('cursor-frame');
    if (frame){
      box.addEventListener('mouseover', (e) => frame.classList.toggle('locked', !!e.target.closest('button')));
      box.addEventListener('mouseleave', () => frame.classList.remove('locked'));
    }

    document.addEventListener('keydown', onKey);
  }

  function onKey(e){
    if (!box || !box.classList.contains('open')) return;
    if (e.key === 'Escape'){ e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight'){ e.preventDefault(); show(index + 1); }
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); show(index - 1); }
    else if (e.key === 'Tab'){
      /* keep keyboard focus inside the viewer */
      const focusable = Array.from(box.querySelectorAll('button')).filter(b => b.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function renderDots(){
    box.classList.toggle('single', items.length < 2);
    if (items.length > MAX_DOTS){
      dotsEl.dataset.built = '';
      dotsEl.textContent = (index + 1) + ' / ' + items.length;
      return;
    }
    /* build the dots only when their number changes, otherwise just move the
       highlight: re-creating a dot during its own click would detach it */
    if (dotsEl.dataset.built !== String(items.length)){
      dotsEl.innerHTML = items.map((_, i) =>
        '<button type="button" class="lb-dot" data-i="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + items.length + '"></button>'
      ).join('');
      dotsEl.dataset.built = String(items.length);
    }
    dotsEl.querySelectorAll('.lb-dot').forEach((d, i) => {
      if (i === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  }

  function show(i){
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const it = items[index];
    const t = ++token;
    const started = performance.now();
    imgEl.classList.add('is-changing');
    renderDots();

    const pre = new Image();
    const done = () => {
      /* let the fade-out finish before swapping the picture */
      const wait = Math.max(0, 140 - (performance.now() - started));
      setTimeout(() => {
        if (t !== token) return;
        if (!pre.naturalWidth){        // file missing: leave it out and move on
          items.splice(index, 1);
          if (!items.length){ close(); return; }
          show(index);
          return;
        }
        imgEl.src = it.src;
        imgEl.alt = it.alt;
        capEl.textContent = it.caption;
        imgEl.classList.remove('is-changing');
        /* warm up the neighbours so next / previous feel instant */
        [index + 1, index - 1].forEach(n => { new Image().src = items[(n + items.length) % items.length].src; });
      }, wait);
    };
    pre.onload = done;
    pre.onerror = done;
    pre.src = it.src;
  }

  function open(group, anchor){
    if (!box) build();
    const anchors = photosOf(group);
    items = anchors.map(a => {
      const im = a.querySelector('img');
      const alt = (im && im.getAttribute('alt')) || '';
      return { src: a.getAttribute('href'), alt: alt, caption: a.dataset.caption || alt };
    });
    lastFocus = document.activeElement;
    document.body.classList.add('lb-lock');
    box.classList.add('open');
    show(anchors.indexOf(anchor));
    closeBtn.focus({ preventScroll: true });
  }

  function close(){
    if (!box) return;
    token++;
    box.classList.remove('open');
    document.body.classList.remove('lb-lock');
    const frame = document.getElementById('cursor-frame');
    if (frame) frame.classList.remove('locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  groups.forEach(group => {
    group.addEventListener('click', (e) => {
      const a = e.target.closest('a.talk-photo');
      if (!a || !group.contains(a)) return;
      e.preventDefault();
      open(group, a);
    });
  });
})();