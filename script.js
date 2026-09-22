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
          ctx.strokeStyle = `rgba(111,78,55,${0.18 * (1 - dist/140)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
      const twinkle = 0.5 + 0.4 * Math.sin(time / 900 + points[i].phase);
      ctx.fillStyle = `rgba(201,154,60,${(0.3 + 0.4 * twinkle).toFixed(3)})`;
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
