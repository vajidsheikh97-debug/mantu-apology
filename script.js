/* ===================================================
   MANTU APOLOGY WEBSITE — script.js
   State machine, questions, modals, sound, confetti
   =================================================== */

'use strict';

// Firebase service (saves answers to Firestore + localStorage)
import { saveSessionData } from './firebase-service.js';

/* ────────────────────────────────────────────────
   ▌ SITE CONFIG — edit these to customize
──────────────────────────────────────────────── */
const CONFIG = {
  instagramHandle: 'vajid.sheikh.1',
  instagramUrl:    'https://www.instagram.com/vajid.sheikh.1',
};

/* ────────────────────────────────────────────────
   ▌ SESSION ID — unique per visitor, regenerated on replay
──────────────────────────────────────────────── */
function generateSessionId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
let SESSION_ID = generateSessionId();

/* ────────────────────────────────────────────────
   ▌ STATE
──────────────────────────────────────────────── */
let state = {
  soundEnabled:    true,
  currentQuestion: 0,
  answers:         [],
  goodbyeStep:     0,
  modalStage:      null, // 'answer' | 'cat' | null
  startedAt:       new Date().toISOString(),
};

/* ────────────────────────────────────────────────
   ▌ QUESTION DATA REGISTRY
──────────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 'q1',
    text: 'Agar Wajid ek animal hota to?',
    options: [
      { emoji: '🐒', text: 'Bandar — Dimaag holiday pe tha' },
      { emoji: '🦥', text: 'Sloth — Reaction time: 3–5 business days' },
      { emoji: '🐧', text: 'Penguin — Khud ko bhi nahi pata kya kar raha hai' },
      { emoji: '🐼', text: 'Panda — Bas cute banne ki koshish 😂' },
    ],
    reactions: [
      { emoji: '🐒', title: 'Species identified.', text: 'Mantu ne Wajid ki species successfully identify kar li. 😂' },
      { emoji: '🦥', title: 'Slow Loading…', text: 'Wajid ka reaction time currently 3–5 business days hai. Please wait. 😴' },
      { emoji: '🐧', title: 'Navigational Error.', text: 'GPS bhi confused hai. Penguin mode activated. 😭' },
      { emoji: '🐼', title: 'Cuteness Confirmed.', text: 'Wajid ne Panda cover adopt kiya. Crime still under review. 😂' },
    ],
  },
  {
    id: 'q2',
    text: 'Wajid ko apology ke liye kya punishment milni chahiye?',
    options: [
      { emoji: '🍫', text: 'Chocolate khilao' },
      { emoji: '☕', text: 'Chai pilao' },
      { emoji: '🧹', text: '1 week tak chup rehne ki punishment' },
      { emoji: '😂', text: 'Bas maaf karke case close karo' },
    ],
    reactions: [
      { emoji: '🍫', title: 'Sentenced!', text: 'Court ka order: ek chocolate bar delivery confirmed. Wajid compliant hai. 🎉' },
      { emoji: '☕', title: 'Chai Order Filed.', text: 'Ek cup chai — extra sweet — Mantu ko ASAP serve karna hai. 😂' },
      { emoji: '🧹', title: 'Silence Imposed.', text: 'Wajid ko 1 week ka "mute" mode sentence diya gaya hai. 😐' },
      { emoji: '😂', title: 'Case Dismissed!', text: 'Court ne maafi accept ki. Mantu ne generously case close kiya. 🥹' },
    ],
  },
  {
    id: 'q3',
    text: 'Wajid ki apology believable hai?',
    options: [
      { emoji: '😇', text: 'Haan' },
      { emoji: '🤔', text: '50–90' },
      { emoji: '😂', text: 'Thodi acting lag rahi hai' },
      { emoji: '🔍', text: 'Further investigation required' },
    ],
    reactions: [
      { emoji: '😇', title: 'Certified Genuine!', text: 'Wajid ki apology ko Mantu ne genuine certified kiya. Record update ho gaya. 🥹' },
      { emoji: '🤔', title: 'Partial Credit.', text: '50–90% believable. Baaki percentage next season mein. 😂' },
      { emoji: '🎭', title: 'Oscar Contender.', text: 'Performance kaafi theatrical thi. Wajid ko Best Apology Actor award consideration mein. 😂' },
      { emoji: '🔍', title: 'FBI Mode: ON.', text: 'Investigation jari hai. Do not leave the country, Wajid. 😭' },
    ],
  },
  {
    id: 'q4',
    text: 'Wajid ki sabse achhi baat kya hai?',
    options: [
      { emoji: '💀', text: 'Samajh late aati hai, lekin aati toh hai' },
      { emoji: '🧠', text: 'Bada hoshiyar hai… bas thoda late' },
      { emoji: '🫠', text: 'Galti karke bhi hero feel karta hai' },
      { emoji: '🤡', text: 'Dimaag se paidal hai shayad 😂' },
    ],
    reactions: [
      { emoji: '💀', title: 'Delayed Wisdom Certified.', text: 'Wajid ki samajh slow hai but reliable hai. Like a bullock cart with GPS. 😂' },
      { emoji: '🧠', title: 'Late Genius Confirmed.', text: 'Wajid ek delayed edition genius hai. Results aate hain, bas thodi der se. 😂' },
      { emoji: '🦸', title: 'Hero Complex Noted.', text: 'Survey says: 100% hero feel. Reality: disputed. But confidence? Unmatched. 😂' },
      { emoji: '🤡', title: 'Self-Aware Mode: ON.', text: 'Wajid agrees. Wajid has always agreed. This is peak self-awareness. 😂' },
    ],
  },
  {
    id: 'q5',
    text: 'Mantu, aap ham se kya expect kia karti thi?',
    options: [
      { emoji: '👩‍🏫', text: 'Beta baitho samjhati hu' },
      { emoji: '🤔', text: 'kuch achha but pata nahi' },
      { emoji: '😭', text: 'Tumse ye expectation nahi thi' },
      { emoji: '🤦‍♀️', text: 'Aap jaao naa yar kyu faltu ki magaj mari' },
    ],
    reactions: [
      { emoji: '👩‍🏫', title: 'Tuition Class Required!', text: 'Mantu ne baitha kar samjhana decide kiya. Notebook aur pen ready hai. 😂' },
      { emoji: '✨', title: 'Expectation Mystery.', text: 'Kuch achha expect kiya tha... but result thoda unexpected nikla. 😅' },
      { emoji: '💔', title: 'Emotional Damage.', text: '"Tumse ye expectation nahi thi" — Dil pe seedha war! 😭💀' },
      { emoji: '🚪', title: 'Magaj Mari Cancelled.', text: 'No faltu discussion allowed. Direct exit lane reserved. 😭😂' },
    ],
  },
  {
    id: 'q6',
    text: 'Mantu, Agar tum mujhe "Hi" bolo to mee kya karuga, kya lagta hai 😂',
    options: [
      { emoji: '😎', text: 'Normal reply' },
      { emoji: '😂', text: 'Screenshot lekar museum mein rakhega' },
      { emoji: '🥹', text: '17 baar padhega' },
      { emoji: '🧘', text: '"Calm down, it\'s just Hi."' },
    ],
    reactions: [
      { emoji: '😎', title: 'Chill Confirmed.', text: 'Normal reply. Like a normal person. Gold star for emotional stability. 😂' },
      { emoji: '🖼️', title: 'Museum Reserved.', text: 'The "Hi" is now preserved in the National Museum of Rare Texts. Tickets available. 😂' },
      { emoji: '🥹', title: 'Read Count: 17', text: 'Wajid ne 17 baar padha. Phir 3 baar aur padha. Total: 20. Normal hai. 😭' },
      { emoji: '🧘', title: 'Zen Mode Achieved.', text: 'Wajid ne deep breaths li. "Just Hi." he told himself. 500 times. 😂' },
    ],
  },
  {
    id: 'q7',
    text: 'Wajid ko ek chance mile?',
    hasTrialOption: true,
    options: [
      { emoji: '😇', text: 'Ha (Bada dil karke)' },
      { emoji: '😂', text: 'Ha (Majboori mein)' },
      { emoji: '⏳', text: 'Friendship trial version' },
      { emoji: '🤡', text: 'Upar vaale 3no option galat hai na be.' },
    ],
    reactions: [
      { emoji: '🎉', title: 'Chance Granted!', text: 'Mantu ne officially ek chance de diya! Wajid ab accha bacha banega. 🥹✨' },
      { emoji: '😂', title: 'Majboori Ka Chance.', text: 'Option hi nahi chhora system ne. Maafi accepted! 😂' },
      { emoji: '⏳', title: 'Trial Version Activated!', text: 'Friendship trial mode started! Terms & conditions apply. 😂' },
      { emoji: '💀', title: 'Pakdi Gayi Trick!', text: 'System rigging detect ho gayi! "Option galat hai na be" — sharp observation! 😭😂' },
    ],
  },
  {
    id: 'q8',
    text: 'Mantu ko ye website kaisi lagi?',
    options: [
      { emoji: '😂', text: '"Bakchodi achhi thi"' },
      { emoji: '🥹', text: '"Actually cute"' },
      { emoji: '😐', text: '"Theek-thaak"' },
      { emoji: '🚮', text: '"Time waste kiya mera" 😭' },
    ],
    reactions: [
      { emoji: '🎊', title: 'Best Review!', text: 'Certified Bakchodi Grade A. Wajid ne immediately framing karvaya. 😂' },
      { emoji: '🥹', title: 'Mission Accomplished!', text: '"Actually cute" — Wajid ko ye sunne ke liye hi ye website banayi thi. 🥹' },
      { emoji: '😐', title: 'Theek-thaak Received.', text: 'Not great, not terrible. Wajid accepts this humble verdict. 😐' },
      { emoji: '😭', title: 'Time Waste Confirmed.', text: 'Wajid deeply regrets the 3 minutes of your life. Bill aa raha hai. 😭' },
    ],
  },
  {
    id: 'q9',
    text: 'Ab Aap ka mood kaisa hai?',
    options: [
      { emoji: '😊', text: 'Achha tha, ab Aur achha ho gaya hai' },
      { emoji: '😒', text: 'Achha tha, ab kharab hai' },
      { emoji: '🥰', text: 'Kharab tha lekin ab achha hai' },
      { emoji: '💀', text: 'Kharab tha, ab aur kharab ho gaya' },
    ],
    reactions: [
      { emoji: '🥳', title: 'Mantoo Mood!', text: 'Mantoo ka mood mantoo jaane bhai 😂' },
      { emoji: '😭', title: 'Backfire Ho Gaya!', text: 'Arrey yaar... achha mood kharab kar diya? Wajid maafi maangta hai 😭' },
      { emoji: '🥹', title: 'Apology Success!', text: 'Kharab mood se achha mood — Mission successful! Dil khush ho gaya 🥹❤️' },
      { emoji: '💀', title: 'RIP Wajid.', text: 'Kharab se AUR kharab?! Bhai Wajid underground hone jaa raha hai ab 💀😭' },
    ],
  },
];

/* ────────────────────────────────────────────────
   ▌ CAT INTERMISSIONS — unique cat moments
──────────────────────────────────────────────── */
const CAT_INTERMISSIONS = [
  { cat: '', title: '', text: '' },
  { cat: '🐈🕺', title: 'Next Question Loading…', text: 'agla sawal dekho' },
  { cat: '', title: '', text: '' },
  { cat: '🐈‍⬛🎤', title: 'Cat Performance!', text: 'Mantu ka mood Mantoo janti hai tereko kya' },
  { cat: '😺🥁', title: '', text: '' },
  { cat: '🐱🎸', title: 'Rock Cat!', text: 'Me gaana gaakr manaau to Manogi? 🎸😭' },
  { cat: '😸🎭', title: 'Theatre Moment.', text: 'Merko maafi mil gayi?" — suspense. 😂' },
  { cat: '', title: '', text: '' },
  { cat: '😻💫', title: 'Starcat!', text: 'okok Last question hai, Aisich hai apnaa 😂' },
];

/* ────────────────────────────────────────────────
   ▌ GOODBYE STEPS
──────────────────────────────────────────────── */
const GOODBYE_STEPS = [
  { emoji: '🥺', text: 'Chala jaaun?', sub: '' },
  { emoji: '😳', text: 'Sach me jaau??', sub: 'Ek baar aur soch lo madam…' },
  { emoji: '😐', text: 'Dekh lo madam…', sub: 'Baad mein mat kehna bataya nahi tha. 😂' },
  { emoji: '😭', text: 'Pakka jaau??', sub: 'Matlab bilkul jaau? 100% final?', video: 'assets/videos/please.mp4' },
  { emoji: '😐', text: 'Final final final?', sub: 'Bas ek last confirmation.\nIske baad system khud Wajid ko bahar nikaal dega. 😂' },
];

/* ────────────────────────────────────────────────
   ▌ WEB AUDIO SOUND ENGINE
──────────────────────────────────────────────── */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(opts) {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.startFreq, ctx.currentTime);
    if (opts.endFreq) osc.frequency.exponentialRampToValueAtTime(opts.endFreq, ctx.currentTime + opts.duration);
    gain.gain.setValueAtTime(opts.volume || 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + opts.duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + opts.duration);
  } catch (_) { /* audio disabled or unsupported */ }
}

function playBoing() {
  playTone({ type: 'sine',   startFreq: 300, endFreq: 80,   duration: 0.4, volume: 0.45 });
  setTimeout(() => playTone({ type: 'sine', startFreq: 200, endFreq: 50, duration: 0.3, volume: 0.25 }), 80);
}

function playPop() {
  playTone({ type: 'sine', startFreq: 800, endFreq: 300, duration: 0.15, volume: 0.35 });
}

function playSuccess() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => playTone({ type: 'triangle', startFreq: freq, duration: 0.25, volume: 0.3 }), i * 100);
  });
}

function playMeow() {
  playTone({ type: 'sine', startFreq: 600, endFreq: 900, duration: 0.15, volume: 0.3 });
  setTimeout(() => playTone({ type: 'sine', startFreq: 900, endFreq: 400, duration: 0.25, volume: 0.25 }), 150);
}

function playClick() {
  playTone({ type: 'square', startFreq: 440, endFreq: 440, duration: 0.06, volume: 0.2 });
}

/* ────────────────────────────────────────────────
   ◌ AUDIO MANAGER — track current bg audio
────────────────────────────────────────────────── */
let _currentBgAudio = null;

function playAudioFile(src) {
  if (!state.soundEnabled) return;
  try {
    // Stop any playing background audio first
    if (_currentBgAudio) {
      _currentBgAudio.pause();
      _currentBgAudio.currentTime = 0;
      _currentBgAudio = null;
    }
    const audio = new Audio(src);
    audio.volume = 1.0;
    audio.play().catch(e => console.log('Audio playback info:', e));
    _currentBgAudio = audio;
  } catch (err) {
    console.log('Audio file error:', err);
  }
}

function stopAllAudio() {
  if (_currentBgAudio) {
    _currentBgAudio.pause();
    _currentBgAudio.currentTime = 0;
    _currentBgAudio = null;
  }
}

/* ────────────────────────────────────────────────
   ▌ PARTICLES
──────────────────────────────────────────────── */
function spawnParticles() {
  const container = document.getElementById('particles');
  const symbols = ['💕', '🌸', '✨', '🐾', '⭐', '💫', '🎀', '🌷', '💝', '🍀'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (8 + Math.random() * 14) + 's';
    el.style.animationDelay = (Math.random() * 12) + 's';
    el.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
    container.appendChild(el);
  }
}

/* ────────────────────────────────────────────────
   ▌ SCREEN NAVIGATION
──────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Track every page visit in Firebase
  saveSessionData(SESSION_ID, {
    sessionId: SESSION_ID,
    startedAt: state.startedAt,
    [`page_visit_${id}`]: new Date().toISOString(),
    last_page_visited: id,
    status: state.answers.length >= 10 ? 'completed' : (id === 'screen-landing' ? 'opened' : 'in-progress')
  }).catch(() => {});

  // Re-trigger the big SORRY animation every time the apology screen is visited
  if (id === 'screen-apology') {
    const word = document.getElementById('bigSorryWord');
    if (word) {
      word.style.animation = 'none';
      word.style.fontSize  = '0.5rem';
      word.style.opacity   = '0';
      // Force reflow so the browser acknowledges the reset
      void word.offsetWidth;
      word.style.animation = '';
    }
  }
}

/* ────────────────────────────────────────────────
   ▌ QUESTION SYSTEM
──────────────────────────────────────────────── */
function renderQuestion(index) {
  const q = QUESTIONS[index];
  if (!q) { showMoodFresh(); return; }

  const number    = document.getElementById('questionNumber');
  const text      = document.getElementById('questionText');
  const options   = document.getElementById('answerOptions');
  const pText     = document.getElementById('progressText');
  const pFill     = document.getElementById('progressFill');

  number.textContent  = `Q${index + 1}`;
  text.textContent    = q.text;
  pText.textContent   = `Question ${index + 1} / ${QUESTIONS.length}`;
  pFill.style.width   = `${((index + 1) / QUESTIONS.length) * 100}%`;

  options.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('aria-label', `Option ${i + 1}: ${opt.text}`);
    const emojiSpan = opt.emoji ? `<span class="emoji">${opt.emoji}</span>` : '';
    btn.innerHTML = `${emojiSpan}${opt.text}`;
    btn.addEventListener('click', () => selectAnswer(index, i, btn));
    options.appendChild(btn);
  });
}

function selectAnswer(qIndex, optIndex, btnEl) {
  // Disable all options
  document.querySelectorAll('.option-btn').forEach(b => {
    b.disabled = true;
    b.classList.remove('selected');
  });
  btnEl.classList.add('selected');
  playClick();

  // Record answer
  state.answers[qIndex] = optIndex;

  const q = QUESTIONS[qIndex];
  let answerText = `${q.options[optIndex].emoji || ''} ${q.options[optIndex].text}`.trim();
  let trialDuration = null;

  // If question is Q7 and option selected is "Friendship trial version" (optIndex === 2)
  if (q.hasTrialOption && optIndex === 2) {
    const userInput = prompt("Friendship trial version kitne din ka madam? 😂 (e.g. 7 din, 30 din, 6 mahine, lifetime):");
    if (userInput && userInput.trim()) {
      trialDuration = userInput.trim();
      answerText += ` (Kitne din: ${trialDuration})`;
      if (q.reactions[optIndex]) {
        q.reactions[optIndex].text = `Mantu ne ${trialDuration} ka friendship trial version activate kiya! Full enjoy karein! 😂`;
      }
    }
  }

  // Auto-save progress in real-time
  const savePayload = {
    sessionId: SESSION_ID,
    startedAt: state.startedAt,
    status: 'in-progress',
    [`q${qIndex + 1}_question`]: q.text,
    [`q${qIndex + 1}_answer`]: answerText
  };
  if (trialDuration) {
    savePayload.q7_trial_duration = trialDuration;
  }
  saveSessionData(SESSION_ID, savePayload).catch(() => {});

  // Show answer popup after short delay
  setTimeout(() => openAnswerModal(qIndex, optIndex), 300);
}

/* ────────────────────────────────────────────────
   ▌ MODALS — Stage 1: Answer
──────────────────────────────────────────────── */
function openAnswerModal(qIndex, optIndex) {
  const reaction = QUESTIONS[qIndex].reactions[optIndex];
  document.getElementById('answerModalEmoji').textContent = reaction.emoji;
  document.getElementById('answerModalTitle').textContent = reaction.title;
  document.getElementById('answerModalText').textContent  = reaction.text;

  document.getElementById('answerModal').classList.remove('hidden');
  playPop();
  state.modalStage = 'answer';
}

function closeAnswerModal() {
  document.getElementById('answerModal').classList.add('hidden');
  playBoing();

  // Skip cat intermission for Q1, Q3, Q5, and Q8
  if (state.currentQuestion === 0 || state.currentQuestion === 2 || state.currentQuestion === 4 || state.currentQuestion === 7) {
    state.currentQuestion++;
    setTimeout(() => {
      renderQuestion(state.currentQuestion);
    }, 300);
    state.modalStage = null;
    return;
  }

  // Stage 2: Cat intermission
  setTimeout(() => openCatModal(state.currentQuestion), 200);
}

/* ────────────────────────────────────────────────
   ▌ MODALS — Stage 2: Cat
──────────────────────────────────────────────── */
function openCatModal(qIndex) {
  const cat = CAT_INTERMISSIONS[qIndex] || CAT_INTERMISSIONS[0];
  document.getElementById('catDisplay').textContent   = cat.cat;
  const catTitleEl = document.getElementById('catModalTitle');
  catTitleEl.textContent = cat.title || '';
  catTitleEl.style.display = cat.title ? 'block' : 'none';
  const catTextEl = document.getElementById('catModalText');
  catTextEl.textContent = cat.text || '';
  catTextEl.style.display = cat.text ? 'block' : 'none';

  document.getElementById('catModal').classList.remove('hidden');
  playMeow();
  state.modalStage = 'cat';
}

function closeCatModal() {
  document.getElementById('catModal').classList.add('hidden');
  playBoing();

  state.currentQuestion++;

  if (state.currentQuestion >= QUESTIONS.length) {
    setTimeout(() => showMoodFresh(), 300);
  } else {
    setTimeout(() => {
      renderQuestion(state.currentQuestion);
    }, 300);
  }
  state.modalStage = null;
}

/* ────────────────────────────────────────────────
   ▌ MOOD FRESH
──────────────────────────────────────────────── */
function showMoodFresh() {
  // First go to games screen, then moodfresh after
  showScreen('screen-games');
  playSuccess();
  // Save completed session to Firebase
  saveCompletedSession();
}

async function saveCompletedSession() {
  const payload = {
    sessionId:   SESSION_ID,
    startedAt:   state.startedAt,
    completedAt: new Date().toISOString(),
    status:      'completed',
  };
  // Build one key per question: q1, q2, ... with question text + chosen answer
  QUESTIONS.forEach((q, i) => {
    const ansIdx = state.answers[i];
    payload[`q${i + 1}_question`] = q.text;
    payload[`q${i + 1}_answer`]   = ansIdx !== undefined
      ? `${q.options[ansIdx].emoji} ${q.options[ansIdx].text}`
      : 'Not answered';
  });
  try {
    await saveSessionData(SESSION_ID, payload);
    console.log('✅ Session saved!', SESSION_ID);
  } catch (e) {
    console.error('Save error:', e);
  }
}

/* ────────────────────────────────────────────────
   ▌ GOODBYE SEQUENCE
──────────────────────────────────────────────── */
function renderGoodbyeStep(step) {
  const card = document.getElementById('goodbyeCard');
  card.innerHTML = '';

  if (step >= GOODBYE_STEPS.length) {
    // Final goodbye
    card.innerHTML = `
      <span class="goodbye-emoji">😭</span>
      <p class="goodbye-final">Oooooooooook. 😭</p>
      <p class="goodbye-sub">Samajh gaya.</p>
      <p class="goodbye-final" style="font-size:clamp(1rem,4vw,1.4rem)">BYE BYE YEDIIIIIIIIIIIIIIII 😂👋</p>
    `;
    saveSessionData(SESSION_ID, {
      goodbye_final_verdict: 'Jane diya 😭 (Completed all YES - Bye Bye Yedi)'
    }).catch(() => {});
    playSuccess();
    setTimeout(() => showScreen('screen-finale'), 2400);
    startConfetti('confettiCanvas');
    return;
  }

  const s = GOODBYE_STEPS[step];
  const videoHtml = s.video ? `
    <div class="goodbye-video-wrapper">
      <video id="goodbyeVideoEl" class="goodbye-video" src="${s.video}" autoplay loop controls playsinline></video>
    </div>
  ` : '';

  card.innerHTML = `
    <span class="goodbye-emoji">${s.emoji}</span>
    <p class="goodbye-text">${s.text}</p>
    ${s.sub ? `<p class="goodbye-sub">${s.sub.replace(/\n/g, '<br/>')}</p>` : ''}
    ${videoHtml}
    <div class="goodbye-buttons">
      <button class="btn btn-yes" id="goodbyeYes">YES 😐</button>
      <button class="btn btn-no"  id="goodbyeNo">NO 👀</button>
    </div>
  `;

  if (s.video) {
    const vid = document.getElementById('goodbyeVideoEl');
    if (vid) {
      vid.muted = false;
      vid.volume = 1.0;
      vid.play().catch(e => {
        console.log('Autoplay audio fallback:', e);
      });
    }
  }

  document.getElementById('goodbyeYes').addEventListener('click', () => {
    playClick();
    // Save goodbye step answer (YES)
    saveSessionData(SESSION_ID, {
      [`goodbye_step_${step + 1}_question`]: s.text,
      [`goodbye_step_${step + 1}_answer`]: 'YES 😐 (Jane diya)',
      goodbye_final_verdict: (step + 1 >= GOODBYE_STEPS.length) ? 'Jane diya 😭 (All YES)' : `Reached Step ${step + 1} (${s.text})`
    }).catch(() => {});

    state.goodbyeStep++;
    renderGoodbyeStep(state.goodbyeStep);
  });

  document.getElementById('goodbyeNo').addEventListener('click', () => {
    playPop();
    // Save goodbye step answer (NO - Roka)
    saveSessionData(SESSION_ID, {
      [`goodbye_step_${step + 1}_question`]: s.text,
      [`goodbye_step_${step + 1}_answer`]: 'NO 👀 (Roka / Manaya)',
      goodbye_final_verdict: `Roka at Step ${step + 1} ("${s.text}")`
    }).catch(() => {});

    document.getElementById('noBranchModal').classList.remove('hidden');
  });
}

/* ────────────────────────────────────────────────
   ▌ CONFETTI ENGINE
──────────────────────────────────────────────── */
function startConfetti(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#fbbf24', '#34d399', '#fb923c'];
  const pieces = Array.from({ length: 90 }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * canvas.height - canvas.height,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 6,
    alpha: 1,
  }));

  let animId;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      if (p.y > canvas.height) { p.y = -p.size; p.alpha -= 0.015; }
      if (p.alpha <= 0) return;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      ctx.restore();
    });
    if (alive) animId = requestAnimationFrame(draw);
    else cancelAnimationFrame(animId);
  }
  draw();
}

/* ────────────────────────────────────────────────
   ▌ LIE DETECTOR ANIMATION
──────────────────────────────────────────────── */
function runLieDetector() {
  document.getElementById('scannerButtons').classList.add('hidden');
  document.getElementById('scannerProgress').classList.remove('hidden');

  const bar   = document.getElementById('scanBar');
  const pct   = document.getElementById('scanPercentage');
  const label = document.getElementById('scanLabel');

  const steps = [
    { pct: 23,    delay: 400,  label: 'Analysing neural patterns…' },
    { pct: 67,    delay: 900,  label: 'Scanning regret cortex…' },
    { pct: 99.99, delay: 1700, label: 'Quantifying apology index…' },
  ];

  steps.forEach(s => {
    setTimeout(() => {
      bar.style.width   = s.pct + '%';
      pct.textContent   = s.pct + '%';
      label.textContent = s.label;
    }, s.delay);
  });

  setTimeout(() => {
    document.getElementById('scannerProgress').classList.add('hidden');
    document.getElementById('scannerResult').classList.remove('hidden');
    playSuccess();
  }, 2600);
}

/* ────────────────────────────────────────────────
   ▌ RESET / RESTART
──────────────────────────────────────────────── */
function resetSite() {
  // Generate FRESH session for new attempt
  SESSION_ID = generateSessionId();

  state = {
    soundEnabled:    state.soundEnabled,
    currentQuestion: 0,
    answers:         [],
    goodbyeStep:     0,
    modalStage:      null,
    startedAt:       new Date().toISOString(),
  };

  stopAllAudio();

  // Reset scanner
  document.getElementById('scannerButtons').classList.remove('hidden');
  document.getElementById('scannerProgress').classList.add('hidden');
  document.getElementById('scannerResult').classList.add('hidden');
  document.getElementById('scanBar').style.width = '0%';
  document.getElementById('scanPercentage').textContent = '0%';

  // Reset lie detector button
  const lieNoBtn = document.getElementById('lieNoBtn');
  if (lieNoBtn) lieNoBtn.textContent = '😭 NO';

  // Close modals
  document.getElementById('answerModal').classList.add('hidden');
  document.getElementById('catModal').classList.add('hidden');
  document.getElementById('noBranchModal').classList.add('hidden');

  // Reset progress bar
  document.getElementById('progressFill').style.width = `${(1 / QUESTIONS.length) * 100}%`;
  document.getElementById('progressText').textContent = `Question 1 / ${QUESTIONS.length}`;

  // Reset games
  resetGames();

  renderQuestion(0);
  renderGoodbyeStep(0);

  showScreen('screen-landing');
  playClick();
}

/* ────────────────────────────────────────────────
   ▌ GAMING ZONE
──────────────────────────────────────────────── */
function resetGames() {
  // Heart
  const heartEmoji = document.getElementById('heartEmoji');
  if (heartEmoji) {
    heartEmoji.textContent = '💔';
    heartEmoji.className = 'heart-emoji';
  }
  const heartButtons = document.getElementById('heartButtons');
  if (heartButtons) heartButtons.classList.remove('hidden');
  const heartResult = document.getElementById('heartResult');
  if (heartResult) { heartResult.classList.add('hidden'); heartResult.textContent = ''; }

  // Friendship
  const friendshipButtons = document.getElementById('friendshipButtons');
  if (friendshipButtons) friendshipButtons.classList.remove('hidden');
  const friendResult = document.getElementById('friendResult');
  if (friendResult) { friendResult.classList.add('hidden'); friendResult.textContent = ''; }

  // Slider
  const slider = document.getElementById('friendshipSlider');
  if (slider) slider.value = 1;
  const sliderEmoji = document.getElementById('sliderEmoji');
  if (sliderEmoji) sliderEmoji.textContent = '😐';
  const sliderPctLabel = document.getElementById('sliderPctLabel');
  if (sliderPctLabel) sliderPctLabel.textContent = '1%';
  const sliderResult = document.getElementById('sliderResult');
  if (sliderResult) { sliderResult.classList.add('hidden'); sliderResult.textContent = ''; }
}

function initGames() {
  /* ─── Game 1: Heart ─── */
  const heartEmoji   = document.getElementById('heartEmoji');
  const heartButtons = document.getElementById('heartButtons');
  const heartResult  = document.getElementById('heartResult');

  document.getElementById('heartBreakBtn').addEventListener('click', () => {
    playBoing();
    heartEmoji.className = 'heart-emoji heart-breaking';
    heartEmoji.textContent = '💔';
    heartButtons.classList.add('hidden');
    setTimeout(() => {
      heartEmoji.textContent = '😭💔';
      heartResult.textContent = '😭 Ugh noooo!! Dil toot gaya... koi ni hum sambhal lenge khud ko 😭';
      heartResult.classList.remove('hidden');
    }, 700);
    saveSessionData(SESSION_ID, { game_heart: 'Tod Diya 🔨😭' }).catch(() => {});
  });

  document.getElementById('heartFixBtn').addEventListener('click', () => {
    playSuccess();
    heartEmoji.className = 'heart-emoji heart-healing';
    heartEmoji.textContent = '❤️';
    heartButtons.classList.add('hidden');
    setTimeout(() => {
      heartEmoji.textContent = '❤️';
      heartEmoji.classList.add('heart-pulsing');
      heartResult.textContent = '🥳 Yayyyyyyy!! Dil jud gaya!! Mantu ne jod diya!! Shukriyaaa 🩹❤️';
      heartResult.classList.remove('hidden');
    }, 800);
    saveSessionData(SESSION_ID, { game_heart: 'Jod Diya 🩹❤️' }).catch(() => {});
  });

  /* ─── Game 2: Friendship ─── */
  const friendResult      = document.getElementById('friendResult');
  const friendshipButtons = document.getElementById('friendshipButtons');

  document.getElementById('comeBackBtn').addEventListener('click', () => {
    playSuccess();
    const mantu = document.getElementById('mantuChar');
    mantu.style.transform = 'scale(1.3) translateX(-20px)';
    setTimeout(() => { mantu.style.transform = ''; }, 500);
    friendshipButtons.classList.add('hidden');
    friendResult.textContent = '🥳🥳🥳 "thik h thik h Aate h, bs kuch din ruko" — THANKOOOOOO MNTTUUUUUU!! Intezaar rahega madam!! 🎉💕';
    friendResult.classList.remove('hidden');
    saveSessionData(SESSION_ID, { game_friendship: 'thik h thik h Aate h, bs kuch din ruko ❤️🤝' }).catch(() => {});
  });

  document.getElementById('goAwayBtn').addEventListener('click', () => {
    playAudioFile('assets/music/cry.mp3');
    const mantu = document.getElementById('mantuChar');
    mantu.style.transform = 'scale(0.8) translateX(30px)';
    setTimeout(() => { mantu.style.transform = ''; }, 500);
    friendshipButtons.classList.add('hidden');
    friendResult.textContent = '😭 "Nahi, ham jaa rahe..." — Koi ni... Wajid kone me jaakar ro lega thoda sa 😭💔';
    friendResult.classList.remove('hidden');
    saveSessionData(SESSION_ID, { game_friendship: 'Nahi, ham jaa rahe 🚪😭' }).catch(() => {});
  });

  /* ─── Game 3: Slider ─── */
  const slider       = document.getElementById('friendshipSlider');
  const sliderEmoji  = document.getElementById('sliderEmoji');
  const sliderPctEl  = document.getElementById('sliderPctLabel');
  const sliderResult = document.getElementById('sliderResult');

  function getSliderEmoji(val) {
    if (val <= 10)  return '😑';
    if (val <= 25)  return '😐';
    if (val <= 40)  return '🙂';
    if (val <= 55)  return '😊';
    if (val <= 70)  return '😄';
    if (val <= 85)  return '😁';
    if (val <= 95)  return '🤩';
    return '🥳';
  }

  slider.addEventListener('input', () => {
    const v = parseInt(slider.value);
    sliderPctEl.textContent = v + '%';
    sliderEmoji.textContent = getSliderEmoji(v);
    sliderEmoji.style.transform = 'scale(1.15)';
    setTimeout(() => { sliderEmoji.style.transform = ''; }, 200);
  });

  document.getElementById('sliderSubmitBtn').addEventListener('click', () => {
    const v = parseInt(slider.value);
    playSuccess();
    let msg;
    if (v <= 25)  msg = `Sirf ${v}%... mujhe maaf karo Mantu 😭 I deserve it`;
    else if (v <= 50) msg = `${v}% — Thoda toh laayak hai Wajid! Progress ho rahi hai 🙂`;
    else if (v <= 75) msg = `${v}%!! Yayyy!! Mantu ne bahut generous verdict diya! 😄`;
    else if (v <= 90) msg = `${v}%!! Omg Mantu besti confirmed!! 😁🎉`;
    else              msg = `${v}%!! FULL MARKS!! Mantu ne maaf kar diya!! 🥳🎊💕`;
    sliderResult.textContent = msg;
    sliderResult.classList.remove('hidden');
    saveSessionData(SESSION_ID, { game_friendship_percent: v + '%', game_slider_verdict: msg }).catch(() => {});
  });
}

/* ────────────────────────────────────────────────
   ▌ BOOT & EVENT BINDING
──────────────────────────────────────────────── */
function initApp() {
  spawnParticles();
  renderQuestion(0);
  renderGoodbyeStep(0);
  initGames();

  // Instantly record landing page arrival in Firebase
  saveSessionData(SESSION_ID, {
    sessionId: SESSION_ID,
    startedAt: state.startedAt,
    last_page_visited: 'screen-landing',
    page_visit_screen_landing: new Date().toISOString(),
    status: 'opened'
  }).catch(() => {});

  /* ─ Nav Controls ─ */
  document.getElementById('soundToggle').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    document.getElementById('soundIcon').textContent = state.soundEnabled ? '🔊' : '🔇';
    playClick();
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    if (confirm('Phir se shuru karein? 🔄')) resetSite();
  });

  /* ─ Section Buttons ─ */
  document.getElementById('landingBtn').addEventListener('click', () => {
    playClick();
    showScreen('screen-apology');
  });

  document.getElementById('apologyBtn').addEventListener('click', () => {
    playAudioFile('assets/music/chlo.mp3');
    showScreen('screen-court');
  });

  document.getElementById('courtBtn').addEventListener('click', () => {
    playClick();
    showScreen('screen-liedetector');
  });

  document.getElementById('lieYesBtn').addEventListener('click', () => {
    playClick();
    saveSessionData(SESSION_ID, {
      lie_detector_question: 'Wajid sach bol raha hai?',
      lie_detector_answer: 'YES 😇 (Sach bol raha hai)'
    }).catch(() => {});
    runLieDetector();
  });

  document.getElementById('lieNoBtn').addEventListener('click', () => {
    playBoing();
    saveSessionData(SESSION_ID, {
      lie_detector_question: 'Wajid sach bol raha hai?',
      lie_detector_answer: 'NO 😭 (...also forced YES)'
    }).catch(() => {});
    // Funny: no option actually changes the result
    document.getElementById('lieNoBtn').textContent = '😭 ...also YES';
    setTimeout(() => runLieDetector(), 600);
  });

  document.getElementById('startQuestionsBtn').addEventListener('click', () => {
    playClick();
    showScreen('screen-questions');
  });

  // Games screen (goes between questions and moodfresh)
  document.getElementById('gamesNextBtn').addEventListener('click', () => {
    playClick();
    showScreen('screen-moodfresh');
  });

  document.getElementById('moodfreshBtn').addEventListener('click', () => {
    playClick();
    stopAllAudio(); // Stop chlo.mp3 or any playing audio
    state.goodbyeStep = 0;
    renderGoodbyeStep(0);
    showScreen('screen-goodbye');
  });

  document.getElementById('replayBtn').addEventListener('click', () => {
    resetSite();
  });

  /* ─ Modal Close Buttons ─ */
  document.getElementById('answerModalClose').addEventListener('click', closeAnswerModal);
  document.getElementById('catModalClose').addEventListener('click', closeCatModal);

  document.getElementById('noBranchContinue').addEventListener('click', () => {
    document.getElementById('noBranchModal').classList.add('hidden');
    playClick();
    showScreen('screen-finale');
    setTimeout(() => startConfetti('confettiCanvas'), 200);
  });

  /* ─ Therapy card clicks (play sound) ─ */
  document.querySelectorAll('.therapy-card').forEach(card => {
    card.addEventListener('click', () => playClick());
  });

  /* ─ Close modals if clicking outside card ─ */
  document.getElementById('answerModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAnswerModal();
  });
  document.getElementById('catModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCatModal();
  });

  /* ─ Keyboard: Escape closes top-most modal ─ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('answerModal').classList.contains('hidden')) closeAnswerModal();
      else if (!document.getElementById('catModal').classList.contains('hidden')) closeCatModal();
    }
  });
}

// Immediate boot runner
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

