/* ============================================================
   Shared RSVP logic — The Cradle Schools 20th Anniversary
   Runs on both index.html (splash) and rsvp.html (form page).
   ============================================================ */

/* ---------- Splash page interactions ---------- */
const btnDecline = document.getElementById('btnDecline');
const declineOverlay = document.getElementById('declineOverlay');
const btnCloseDecline = document.getElementById('btnCloseDecline');
const btnBackToSplash = document.getElementById('btnBackToSplash');

if (btnDecline && declineOverlay) {
  btnDecline.addEventListener('click', () => {
    declineOverlay.classList.remove('hidden');
    declineOverlay.classList.add('open');
  });
}
if (btnCloseDecline && declineOverlay) {
  btnCloseDecline.addEventListener('click', () => {
    declineOverlay.classList.remove('open');
    declineOverlay.classList.add('hidden');
  });
}
if (btnBackToSplash && declineOverlay) {
  btnBackToSplash.addEventListener('click', () => {
    declineOverlay.classList.remove('open');
    declineOverlay.classList.add('hidden');
  });
}
if (declineOverlay) {
  declineOverlay.addEventListener('click', event => {
    if (event.target === declineOverlay) {
      declineOverlay.classList.remove('open');
      declineOverlay.classList.add('hidden');
    }
  });
}

/* ---------- Slideshow (rsvp.html) ---------- */
const slideshow = document.getElementById('slideshow');
const slidePrev = document.getElementById('slidePrev');
const slideNext = document.getElementById('slideNext');
const slideDots = document.getElementById('slideDots');

let slideIndex = 0;
let slideTimer = null;
const slideCount = slideshow ? slideshow.querySelectorAll('.slide').length : 0;

function initSlideshow() {
  if (!slideshow || slideCount === 0) return;

  // Build dots
  slideDots.innerHTML = '';
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    slideDots.appendChild(dot);
  }

  updateSlides();
  // Auto-advance every 5 seconds, reset on interaction
  slideTimer = setInterval(() => nextSlide(), 5000);
}

function updateSlides() {
  const slides = slideshow.querySelectorAll('.slide');
  const dots = slideDots.querySelectorAll('.slide-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === slideIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === slideIndex));
}

function nextSlide() {
  slideIndex = (slideIndex + 1) % slideCount;
  updateSlides();
  resetTimer();
}

function prevSlide() {
  slideIndex = (slideIndex - 1 + slideCount) % slideCount;
  updateSlides();
  resetTimer();
}

function goToSlide(index) {
  slideIndex = index;
  updateSlides();
  resetTimer();
}

function resetTimer() {
  clearInterval(slideTimer);
  slideTimer = setInterval(() => nextSlide(), 5000);
}

if (slidePrev) slidePrev.addEventListener('click', prevSlide);
if (slideNext) slideNext.addEventListener('click', nextSlide);

// Pause auto-advance while hovering the slideshow
if (slideshow) {
  slideshow.addEventListener('mouseenter', () => clearInterval(slideTimer));
  slideshow.addEventListener('mouseleave', resetTimer);
}

initSlideshow();

/* ---------- RSVP form (rsvp.html) ---------- */
const accept = document.getElementById('accept');
const decline = document.getElementById('decline');
const form = document.getElementById('rsvpForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');
const successAddToCalendarBtn = document.getElementById('successAddToCalendarBtn');

/* Builds a Google "Add to Calendar" URL.
   Event: Mon. Nov. 2, 2026 · 4:00 PM WAT (UTC+1) → 15:00–16:00 UTC */
function buildGoogleCalendarUrl() {
  const start = '20261102T150000Z';
  const end = '20261102T160000Z';
  const params = {
    action: 'TEMPLATE',
    text: 'The Cradle Schools — 20th Anniversary Dinner Night',
    dates: `${start}/${end}`,
    details: 'Join The Cradle Schools for an elegant evening of gratitude, reflection and celebration as we honour twenty remarkable years of learning, growth and community.',
    location: 'Zavora Event Centre, Plot 477A, Godwin Abby Way, GRA, Benin City',
    ctz: 'Africa/Lagos',
  };
  return 'https://www.google.com/calendar/render?' + new URLSearchParams(params).toString();
}

const calendarUrl = buildGoogleCalendarUrl();
if (successAddToCalendarBtn) successAddToCalendarBtn.href = calendarUrl;

if (form) {
  /* Client-side duplicate prevention (same session). */
  const DUP_KEY = 'cradle_rsvp_submitted';

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const myForm = event.target;
    const formData = new FormData(myForm);
    const email = (formData.get('email') || '').trim().toLowerCase();
    const contact = (formData.get('contact') || '').trim();

    if (!email && !contact) {
      alert('Please enter your email or phone number.');
      return;
    }

    // Block duplicate submission in this session
    if (sessionStorage.getItem(DUP_KEY)) {
      alert('You have already registered. Please do not submit again.');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Already Submitted';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    if (successMessage) successMessage.classList.add('hidden');

    /*
     * Netlify Forms AJAX submission.
     * Body is URL-encoded via FormData → URLSearchParams → string.
     * Netlify Forms does NOT accept JSON bodies.
     * Posts to "/" which Netlify intercepts at deploy time.
     */
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    })
      .then(() => {
        console.log("Form successfully submitted");
        sessionStorage.setItem(DUP_KEY, 'true');
        myForm.reset();
        if (successMessage) {
          successMessage.classList.remove('hidden');
          if (successAddToCalendarBtn) successAddToCalendarBtn.href = calendarUrl;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitted';
      })
      .catch(error => {
        console.error(error);
        alert('An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit RSVP';
      });
  });
}
