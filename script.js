/* Cute Love Letter: envelope, letter reveal, music, small extras */
(function () {
  'use strict';

  // ---------- Element references ----------
  const envelope       = document.getElementById('envelope');
  const envelopeScreen = document.getElementById('envelopeScreen');
  const envelopeHint   = document.getElementById('envelopeHint');
  const letterScreen   = document.getElementById('letterScreen');
  const closeBtn       = document.getElementById('closeLetter');
  const audio          = document.getElementById('bgMusic');
  const musicBtn       = document.getElementById('musicToggle');
  const floaters       = document.getElementById('floaters');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TARGET_VOLUME = 0.3;   // comfortable 30%
  const OPEN_DELAY    = reducedMotion ? 50 : 1500; // wait for the letter to slide out
  let isOpen = false;
  let busy = false;            // prevents double-clicks during animations
  let fadeTimer = null;
  let musicMissing = false;

  /* =========================================================
     MUSIC
     ========================================================= */
  audio.volume = 0;

  // If the file is missing or can't load, mark it and carry on quietly.
  audio.addEventListener('error', () => {
    musicMissing = true;
    musicBtn.classList.add('is-missing');
    musicBtn.title = 'Music file not found (assets/bg-music.mp3)';
    setMusicUI(false);
  });

  function setMusicUI(playing) {
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.classList.toggle('is-muted', !playing);
    musicBtn.setAttribute('aria-pressed', String(playing));
    musicBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  // Smoothly change the volume (fade in/out)
  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const steps = 20;
    const start = audio.volume;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, ms / steps);
  }

  // Start (or resume) playback. Never resets currentTime, so it never restarts.
  function playMusic() {
    if (musicMissing) return;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { setMusicUI(true); fadeTo(TARGET_VOLUME, 2000); })
       .catch(() => setMusicUI(false)); // browser blocked playback: user can press the button
    }
  }

  function pauseMusic() {
    fadeTo(0, 400, () => audio.pause());
    setMusicUI(false);
  }

  musicBtn.addEventListener('click', () => {
    if (audio.paused) playMusic(); else pauseMusic();
  });

  /* =========================================================
     ENVELOPE -> LETTER
     ========================================================= */
  function openLetter() {
    if (busy || isOpen) return;
    busy = true;
    envelope.classList.add('is-open');           // flap opens, letter slides out
    musicBtn.hidden = false;
    // Start music only now (inside the click, so browsers allow it),
    // and only if the visitor hasn't paused it themselves before.
    if (!audio.dataset.userPaused) playMusic();

    setTimeout(() => {
      envelopeScreen.classList.add('is-leaving');
      setTimeout(() => {
        envelopeScreen.hidden = true;
        letterScreen.hidden = false;
        window.scrollTo(0, 0);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          letterScreen.classList.add('is-visible'); // gentle fade-in
        }));
        isOpen = true;
        busy = false;
        closeBtn.focus({ preventScroll: true });
      }, reducedMotion ? 0 : 600);
    }, OPEN_DELAY);
  }

  function closeLetter() {
    if (busy || !isOpen) return;
    busy = true;
    letterScreen.classList.remove('is-visible');
    setTimeout(() => {
      letterScreen.hidden = true;
      envelopeScreen.hidden = false;
      envelope.classList.remove('is-open');
      envelopeHint.textContent = 'Tap the envelope to open it again 🐾';
      window.scrollTo(0, 0);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        envelopeScreen.classList.remove('is-leaving');
      }));
      isOpen = false;
      busy = false;
      envelope.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 700);
  }

  // The envelope is a <button>, so Enter/Space work automatically for keyboard users.
  envelope.addEventListener('click', openLetter);
  closeBtn.addEventListener('click', closeLetter);

  // Remember if the visitor paused on purpose, so reopening doesn't force music back on.
  musicBtn.addEventListener('click', () => {
    if (audio.paused) delete audio.dataset.userPaused;
    else audio.dataset.userPaused = '1';
  });
  // (the click handler above runs after the toggle handler, so the check is reversed on purpose)
  musicBtn.addEventListener('click', () => {
    if (audio.paused && !musicMissing) audio.dataset.userPaused = '1';
    else delete audio.dataset.userPaused;
  });

  /* =========================================================
     DECORATIONS: floating hearts and sparkles
     ========================================================= */
  if (!reducedMotion) {
    const symbols = ['♥', '♡', '✦', '✧', '🐾'];
    const count = window.innerWidth < 600 ? 10 : 16;   // keep it light on phones
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'floater';
      el.textContent = symbols[i % symbols.length];
      el.style.left = Math.random() * 100 + '%';
      el.style.fontSize = (10 + Math.random() * 14) + 'px';
      el.style.animationDuration = (12 + Math.random() * 12) + 's';
      el.style.animationDelay = (-Math.random() * 20) + 's';
      floaters.appendChild(el);
    }
  }

  /* =========================================================
     PAW CURSOR TRAIL (desktop with a mouse only)
     The normal cursor stays visible and usable.
     ========================================================= */
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasFinePointer && !reducedMotion) {
    let lastTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastTime < 140) return;             // throttle
      lastTime = now;
      const paw = document.createElement('span');
      paw.className = 'paw-trail';
      paw.textContent = '🐾';
      paw.style.left = e.clientX + 'px';
      paw.style.top = e.clientY + 'px';
      document.body.appendChild(paw);
      setTimeout(() => paw.remove(), 1000);
    });
  }
})();