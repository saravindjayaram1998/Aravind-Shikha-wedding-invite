// Wedding Invite — Mobile-Optimized v15

// Ensure BG video plays at reduced speed
(function bgVideo(){
  const v = document.getElementById('bgVideo');
  if(!v) return;
  try{ v.playbackRate = 0.8; }catch{}
  v.play().catch(()=>{});
})();

// Menu toggler
(function menu(){
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if(!btn || !menu) return;

  function setOpen(open){
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains('is-open'));
  });

  document.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
})();

// Event tabs (5 Feb / 6 Feb)
(function eventTabs(){
  const t1 = document.getElementById('tabDay1');
  const t2 = document.getElementById('tabDay2');
  const p1 = document.getElementById('panelDay1');
  const p2 = document.getElementById('panelDay2');
  if(!t1 || !t2 || !p1 || !p2) return;

  function activate(day){
    const is1 = day === 1;
    t1.classList.toggle('is-active', is1);
    t2.classList.toggle('is-active', !is1);
    t1.setAttribute('aria-selected', String(is1));
    t2.setAttribute('aria-selected', String(!is1));
    p1.classList.toggle('is-active', is1);
    p2.classList.toggle('is-active', !is1);
  }

  t1.addEventListener('click', ()=>activate(1));
  t2.addEventListener('click', ()=>activate(2));
})();

// Countdown — target 5 Feb 2026 00:00 IST
(function countdown(){
  const target = new Date("2026-02-05T00:00:00+05:30");

  const daysEls = Array.from(document.querySelectorAll('[data-cd="days"]'));
  const hoursEls = Array.from(document.querySelectorAll('[data-cd="hours"]'));
  const minsEls = Array.from(document.querySelectorAll('[data-cd="minutes"]'));
  const secsEls = Array.from(document.querySelectorAll('[data-cd="seconds"]'));
  if(!daysEls.length) return;

  function pad(n){ return String(n).padStart(2,'0'); }
  function setAll(els, v){ els.forEach(el => el.textContent = v); }

  function tick(){
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if(diff <= 0){
      setAll(daysEls, '0');
      setAll(hoursEls, '00');
      setAll(minsEls, '00');
      setAll(secsEls, '00');
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setAll(daysEls, String(days));
    setAll(hoursEls, pad(hours));
    setAll(minsEls, pad(minutes));
    setAll(secsEls, pad(seconds));
  }

  tick();
  setInterval(tick, 1000);
})();

// Background music
(function music(){
  const DEFAULT_VOLUME = 0.10;
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicToggle');
  const slider = document.getElementById('volumeSlider');
  if(!audio || !btn || !slider) return;

  function setUI(isOn){
    btn.classList.toggle('is-on', isOn);
    btn.textContent = isOn ? 'Music: On' : 'Music: Off';
  }

  function setVolumeFromSlider(){
    const v = Math.max(0, Math.min(100, parseInt(slider.value, 10))) / 100;
    audio.volume = v;
  }
  if(!slider.value){ slider.value = String(Math.round(DEFAULT_VOLUME*100)); }
  setVolumeFromSlider();

  slider.addEventListener('input', setVolumeFromSlider);

  async function tryPlay(){
    try{
      await audio.play();
      setUI(true);
      return true;
    }catch{
      setUI(false);
      return false;
    }
  }

  tryPlay();

  function unlock(){ tryPlay(); }
  window.addEventListener('click', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });

  btn.addEventListener('click', async () => {
    if(audio.paused){ await tryPlay(); }
    else { audio.pause(); setUI(false); }
  });
})();

// Image loader: tries multiple extensions for a basename
(function imageFallbacks(){
  function trySources(img, sources){
    let i = 0;
    function next(){
      if(i >= sources.length){
        const item = img.closest && img.closest('.carousel__item');
        if(item){ item.remove(); }
        img.style.display = 'none';
        return;
      }
      img.src = sources[i++];
    }
    img.addEventListener('error', () => next(), { once:false });
    next();
  }

  document.querySelectorAll('img[data-basename]').forEach(img => {
    const base = img.getAttribute('data-basename');
    if(!base) return;
    const encoded = encodeURIComponent(base);
    const sources = [
      `assets/${encoded}.jpg`,
      `assets/${encoded}.png`,
      `assets/${encoded}.jpeg`,
      `assets/${encoded}.webp`,
    ];
    trySources(img, sources);
  });
})();

// Couple carousel with responsive layout
(function coupleCarousel(){
  const items = Array.from(document.querySelectorAll('#carouselStage .carousel__item'));
  const range = document.getElementById('carouselRange');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  if(items.length === 0 || !range) return;

  const N = items.length;
  let idx = 0;
  let timer = null;
  let resumeTimer = null;

  function signedDiff(i, center){
    let d = (i - center) % N;
    if(d < 0) d += N;
    if(d > N/2) d -= N;
    return d;
  }

  // Responsive spacing based on viewport
  function getResponsiveValues(){
    const vw = window.innerWidth;
    
    if(vw < 360){
      return { xSpacing: 100, ySpacing: 10, hiddenX: 100 };
    } else if(vw < 480){
      return { xSpacing: 140, ySpacing: 12, hiddenX: 140 };
    } else if(vw < 640){
      return { xSpacing: 180, ySpacing: 14, hiddenX: 180 };
    } else if(vw < 860){
      return { xSpacing: 220, ySpacing: 16, hiddenX: 200 };
    } else {
      return { xSpacing: 260, ySpacing: 18, hiddenX: 220 };
    }
  }

  function layout(){
    const { xSpacing, ySpacing, hiddenX } = getResponsiveValues();
    
    items.forEach((el, i) => {
      const d = signedDiff(i, idx);
      const abs = Math.abs(d);

      if(abs > 2){
        el.classList.add('is-hidden');
        el.style.transform = `translate(-50%, -50%) translateX(${d*hiddenX}px) translateY(${abs*ySpacing}px) scale(0.35)`;
        return;
      }
      el.classList.remove('is-hidden');

      const x = d * xSpacing;
      const y = abs * ySpacing;
      const scale = d === 0 ? 1.0 : (abs === 1 ? 0.70 : 0.50);
      const z = d === 0 ? 70 : (abs === 1 ? 25 : -25);
      const rotateY = d * -10;

      el.style.transform = `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      el.style.zIndex = String(100 - abs);
      el.style.opacity = d === 0 ? '1' : (abs === 1 ? '0.86' : '0.68');
      el.style.filter = d === 0 ? 'none' : 'saturate(0.9) contrast(0.95)';
    });

    range.value = String(idx + 1);
  }

  function go(nextIdx){
    idx = (nextIdx + N) % N;
    layout();
  }

  function stepClockwise(){ go(idx + 1); }

  function pauseAndResume(){
    if(timer) clearInterval(timer);
    if(resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      timer = setInterval(stepClockwise, 5000);
    }, 5000);
  }

  range.addEventListener('input', () => {
    go(parseInt(range.value, 10) - 1);
    pauseAndResume();
  });

  if(prev) prev.addEventListener('click', () => { go(idx - 1); pauseAndResume(); });
  if(next) next.addEventListener('click', () => { go(idx + 1); pauseAndResume(); });

  // Re-layout on resize
  let resizeCarouselTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeCarouselTimer);
    resizeCarouselTimer = setTimeout(layout, 100);
  });

  layout();
  timer = setInterval(stepClockwise, 5000);
})();

// Wishes - Google Sheets Integration
(function wishes(){
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEPANua7OgtA_oHnIJKrN_ma2XsCX3T91FlVZePTuxM57eqD8y3U02SSgWN2DWcGplnA/exec";

  const cloud = document.getElementById('wishCloud');
  const form = document.getElementById('wishForm');
  const msg = document.getElementById('wishMessage');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  if(!cloud || !form || !msg) return;

  const defaultWishes = [
    "Wishing you both a lifetime of love and happiness.",
    "Congratulations! May your home be filled with joy.",
    "Best wishes for a beautiful journey together.",
    "May your bond grow stronger every day.",
    "Blessings and love to the wonderful couple."
  ];

  let lastWishes = [];

  // Render wishes as a simple list (latest 10 only)
  function renderWishes(items){
    const list = (items || []).slice(0, 10); // Show only latest 10 comments
    cloud.innerHTML = "";
    
    if(list.length === 0){
      const empty = document.createElement('div');
      empty.className = 'cloud-wish cloud-wish--empty';
      empty.textContent = 'Be the first to leave a blessing!';
      cloud.appendChild(empty);
      return;
    }

    list.forEach((text) => {
      const el = document.createElement('div');
      el.className = 'cloud-wish';
      const inner = document.createElement('div');
      inner.className = 'cloud-wish__text';
      inner.textContent = String(text).trim();
      el.appendChild(inner);
      cloud.appendChild(el);
    });
  }

  // Load wishes from Google Sheets
  async function loadWishes(){
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      if(data.success && data.wishes && data.wishes.length > 0){
        lastWishes = data.wishes.map(w => w.message).filter(m => m && m.trim());
        renderWishes(lastWishes);
      } else {
        // Show default wishes if none exist yet
        lastWishes = defaultWishes.slice();
        renderWishes(lastWishes);
      }
    } catch(e) {
      console.error('Failed to load wishes:', e);
      lastWishes = defaultWishes.slice();
      renderWishes(lastWishes);
    }
  }

  // Submit a new wish to Google Sheets
  async function submitWish(message){
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
      });
      
      // With no-cors, we can't read the response, so assume success
      return true;
    } catch(e) {
      console.error('Failed to submit wish:', e);
      return false;
    }
  }

  // Initial load
  loadWishes();

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (msg.value || "").trim();
    if(!text) return;

    // IMMEDIATELY show the new wish at the top (before any network request)
    lastWishes = [text, ...lastWishes];
    renderWishes(lastWishes);
    msg.value = "";

    // Disable button while submitting to server
    if(submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    // Submit to Google Sheets in background
    await submitWish(text);

    // Re-enable button
    if(submitBtn){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send wish';
    }

    // Reload from server after a short delay to sync with other users
    setTimeout(loadWishes, 3000);
  });

  // Reload wishes periodically (every 30 seconds) to show new ones from others
  setInterval(loadWishes, 30000);
})();
