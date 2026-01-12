// Wedding Invite — v13

// Ensure BG video plays at 1x and is visible (fallback handled via CSS)
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

// Background music (soft volume + autoplay attempt + volume slider)
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

// Image loader: tries multiple extensions for a basename (e.g., "Photo 1")
(function imageFallbacks(){
  function trySources(img, sources){
    let i = 0;
    function next(){
      if(i >= sources.length){
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

// Couple carousel (clockwise auto-rotate every 5s; pauses 5s after user interaction)
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

  function layout(){
    items.forEach((el, i) => {
      const d = signedDiff(i, idx);
      const abs = Math.abs(d);

      if(abs > 2){
        el.classList.add('is-hidden');
        el.style.transform = `translate(-50%, -50%) translateX(${d*220}px) translateY(${abs*18}px) scale(0.35)`;
        return;
      }
      el.classList.remove('is-hidden');

      const x = d * 260;
      const y = abs * 18;
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

  layout();
  timer = setInterval(stepClockwise, 5000);
})();

// Wishes word-cloud (server-stored with Supabase optional)
(function wishes(){
  const SUPABASE_URL = "";      // <-- paste here
  const SUPABASE_ANON_KEY = ""; // <-- paste here

  const cloud = document.getElementById('wishCloud');
  const form = document.getElementById('wishForm');
  const msg = document.getElementById('wishMessage');
  if(!cloud || !form || !msg) return;

  const demo = [
    "Wishing you both a lifetime of love and happiness.",
    "Congratulations! May your home be filled with joy.",
    "Best wishes for a beautiful journey together.",
    "May your bond grow stronger every day.",
    "Blessings and love to the wonderful couple."
  ];

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function renderWishes(items){
    const list = (items || []).slice(0, 26);
    cloud.innerHTML = "";
    cloud.style.minHeight = cloud.style.minHeight || "260px";

    // Create clouds first so we can measure
    list.forEach((text) => {
      const el = document.createElement('div');
      el.className = 'cloud-wish';
      el.style.setProperty('--fs', `${Math.round(rand(12, 18))}px`);
      el.style.setProperty('--rot', `${Math.round(rand(-10, 10))}deg`);

      const inner = document.createElement('div');
      inner.className = 'cloud-wish__text';
      inner.textContent = String(text).trim();
      el.appendChild(inner);

      cloud.appendChild(el);
    });

    const els = Array.from(cloud.querySelectorAll('.cloud-wish'));
    const W = Math.max(1, cloud.clientWidth);
    const H = Math.max(260, cloud.clientHeight);

    const placed = [];
    const pad = 10;
    const cx = W / 2;
    const cy = H / 2;

    function collides(x, y, w, h){
      return placed.some(b => !(x + w + pad < b.x || x - pad > b.x + b.w || y + h + pad < b.y || y - pad > b.y + b.h));
    }

    els.forEach((el, i) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      let ok = false;

      // Spiral search around center
      for(let t = 0; t < 1500; t++){
        const angle = 0.55 * t;
        const radius = 2 + t * 0.42;
        const x = cx + Math.cos(angle) * radius - w / 2;
        const y = cy + Math.sin(angle) * radius - h / 2;

        if(x < 6 || y < 6 || x + w > W - 6 || y + h > H - 6) continue;
        if(!collides(x, y, w, h)){
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
          placed.push({x, y, w, h});
          ok = true;
          break;
        }
      }

      // Random fallback
      if(!ok){
        for(let tries = 0; tries < 250; tries++){
          const x = 6 + Math.random() * (W - w - 12);
          const y = 6 + Math.random() * (H - h - 12);
          if(!collides(x, y, w, h)){
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            placed.push({x, y, w, h});
            ok = true;
            break;
          }
        }
      }

      // Final fallback: stack
      if(!ok){
        const x = 6 + (i % 2) * (W * 0.48);
        const y = 6 + Math.floor(i / 2) * (h + 12);
        el.style.left = `${Math.max(6, Math.min(W - w - 6, x))}px`;
        el.style.top = `${Math.max(6, Math.min(H - h - 6, y))}px`;
        placed.push({x, y, w, h});
      }
    });
  }

  async function loadFromSupabase(){
    try{
      if(!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase){
        lastWishes = demo.slice();
      renderWishes(lastWishes);
        return null;
      }
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data, error } = await client
        .from('wishes')
        .select('message, created_at')
        .order('created_at', { ascending: false })
        .limit(40);

      if(error) throw error;

      lastWishes = (data || []).map(x => x.message);
      renderWishes(lastWishes);
      return client;
    }catch(e){
      lastWishes = demo.slice();
      renderWishes(lastWishes);
      return null;
    }
  }

  let clientPromise = loadFromSupabase();
  let lastWishes = demo.slice();

  // Relayout on resize (keeps the cloud packed on mobile rotation)
  let resizeT = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => renderWishes(lastWishes), 160);
  });


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (msg.value || "").trim();
    if(!text) return;

    const client = await clientPromise;
    if(!client){
      demo.unshift(text);
      lastWishes = demo.slice();
      renderWishes(lastWishes);
      msg.value = "";
      return;
    }

    try{
      const { error } = await client.from('wishes').insert([{ message: text }]);
      if(error) throw error;
      msg.value = "";
      lastWishes = [text, ...lastWishes];
      renderWishes(lastWishes);
      clientPromise = loadFromSupabase();
    }catch{
      demo.unshift(text);
      lastWishes = demo.slice();
      renderWishes(lastWishes);
      msg.value = "";
    }
  });
})();
