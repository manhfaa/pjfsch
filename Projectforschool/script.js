(function () {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        e.preventDefault();
        const el = document.querySelector(id);
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  // Mobile nav toggle
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('active');
      nav.classList.toggle('open');
    });
  }

  // Reveal on scroll
  const io = 'IntersectionObserver' in window && !prefersReduce
    ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' })
    : null;
  document.querySelectorAll('.reveal, .card, .hero-content, .hero-img, .welcome')
    .forEach(el => io ? io.observe(el) : el.classList.add('is-visible'));

  // Ripple effect
  const ensureRippleCSS = () => {
    if (document.getElementById('ripple-style')) return;
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = `
      .btn-watch{position:relative;overflow:hidden}
      .ripple{position:absolute;border-radius:9999px;background:rgba(25,118,255,.25);transform:scale(0);animation:ripple .6s ease-out forwards}
      @keyframes ripple{to{transform:scale(2.4);opacity:0}}
    `;
    document.head.appendChild(s);
  };
  ensureRippleCSS();
  document.querySelectorAll('.btn, .btn-primary, .btn-secondary, button').forEach(btn => {
    btn.classList.add('btn-watch');
    btn.addEventListener('mousedown', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Modal UI
  const authModal = document.getElementById('authModal');
  const backdrop = document.getElementById('authBackdrop');
  const openLogin = document.getElementById('openLogin');
  const openSignup = document.getElementById('openSignup');
  const closeModal = document.getElementById('closeModal');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const openModal = (mode='login') => {
    authModal.classList.add('show');
    authModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    if (mode === 'login') {
      loginForm.classList.remove('hidden'); signupForm.classList.add('hidden');
      loginTab.classList.add('active'); signupTab.classList.remove('active');
    } else {
      signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
      signupTab.classList.add('active'); loginTab.classList.remove('active');
    }
  };
  const closeAuth = () => {
    authModal.classList.remove('show');
    authModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  openLogin?.addEventListener('click', () => openModal('login'));
  openSignup?.addEventListener('click', () => openModal('signup'));
  closeModal?.addEventListener('click', closeAuth);
  backdrop?.addEventListener('click', closeAuth);
  loginTab?.addEventListener('click', () => openModal('login'));
  signupTab?.addEventListener('click', () => openModal('signup'));
})();
