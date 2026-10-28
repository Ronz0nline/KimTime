import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import confetti from 'canvas-confetti';

gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   State Management & Double-Entry Ledger Store
   ========================================================================== */
const savedUser = localStorage.getItem('kintime_active_user');
const initialUser = savedUser ? JSON.parse(savedUser) : {
  id: 'usr-ananya',
  name: 'Ananya Deshmukh',
  role: 'caregiver',
  roleLabel: 'Primary Family Caregiver',
  cluster: 'Indiranagar Care Circle, Bengaluru',
  phone: '+91 98450 21982',
  initials: 'AD'
};

const state = {
  currentUser: initialUser,
  activeBalance: 4.50,
  overdraftGrace: 3.00,
  filter: 'all',
  selectedTaskForClaim: null,
  sosAbortTimer: null,
  sosSecondsRemaining: 5,
  tasks: [
    {
      id: 'task-101',
      title: 'Evening Courtyard Tulsi Respite & Premchand Story Reading for Dadi',
      tier: 'tier-2',
      tierLabel: 'Tier 2: Respite',
      hours: 2.50,
      requester: 'Mrs. Shanti Sharma (79) • Daughter-in-Law Ananya',
      requesterId: 'usr-ananya',
      isMyPost: true,
      cluster: 'Indiranagar Care Circle, Bengaluru',
      desc: 'Spend a soothing evening on the courtyard verandah. Read classic Munshi Premchand short stories, water the potted Tulsi, share warm ginger tea. Zero clinical tasks.',
      details: ['Verandah seating with wheelchair ramp', 'Ginger-tulsi chai & biscuits provided', 'Quiet evening atmosphere'],
      status: 'open',
      escrowLocked: true
    },
    {
      id: 'task-102',
      title: 'Jan Aushadhi Kendra Blood Pressure Medicine & Test Strips Pickup',
      tier: 'tier-1',
      tierLabel: 'Tier 1: Errands',
      hours: 1.00,
      requester: 'Rajesh K. Verma • Son & Primary Caregiver',
      cluster: 'Vasant Kunj Sector C, New Delhi',
      desc: 'Collect subsidized monthly prescription pack from Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Kendra on Aruna Asaf Ali Marg and hand over at doorway.',
      details: ['Pre-paid order #PMBJP-9482', '5-minute contactless delivery', 'Aadhaar / OTP verified handoff'],
      status: 'open',
      escrowLocked: true
    },
    {
      id: 'task-103',
      title: 'Morning Cubbon Park Stroll & Carnatic Music Companion for Col. Nair',
      tier: 'tier-2',
      tierLabel: 'Tier 2: Respite',
      hours: 2.00,
      requester: 'Meera Nair • Daughter & Caregiver',
      cluster: 'Lavelle Road & Richmond Town, Bengaluru',
      desc: 'Accompany 81-year-old retired army officer on paved flat walkways in Cubbon Park or sit enjoying classical Carnatic ragas while caregiver attends clinic visit.',
      details: ['Paved walking trail with park benches', 'Caregiver reachable on phone', 'Senior citizen ID verified'],
      status: 'open',
      escrowLocked: true
    },
    {
      id: 'task-104',
      title: 'Auto/Cab Escort for Dialysis Session at Manipal Hospital',
      tier: 'tier-1',
      tierLabel: 'Tier 1: Errands',
      hours: 3.00,
      requester: 'Vikram Malhotra • Son & Caregiver',
      cluster: 'Old Airport Road Net, Bengaluru',
      desc: 'Accompany senior patient in pre-booked wheelchair auto/cab to Manipal Hospital dialysis wing, assist through OPD desk, and accompany back home.',
      details: ['Cab fare and hospital pass pre-arranged', 'Wheelchair elevator assistance', 'Strict non-medical accompaniment'],
      status: 'open',
      escrowLocked: true
    },
    {
      id: 'task-105',
      title: 'Afternoon Reminiscence & Traditional Filter Coffee Companionship',
      tier: 'tier-2',
      tierLabel: 'Tier 2: Respite',
      hours: 1.50,
      requester: 'Dr. Kavita Iyer • Family Caregiver',
      cluster: 'Adyar & Besant Nagar Net, Chennai',
      desc: 'Spend 90 minutes looking through old photo albums from Madurai and having South Indian filter kaapi. Primary caregiver needs quiet time for telehealth consultation.',
      details: ['Air-conditioned living room', 'Traditional brass filter kaapi provided', 'Escrow pre-funded in ledger'],
      status: 'open',
      escrowLocked: true
    },
    {
      id: 'task-106',
      title: 'Rythu Bazar / Organic Millets & Fresh Sabzi Mandi Delivery',
      tier: 'tier-1',
      tierLabel: 'Tier 1: Errands',
      hours: 1.50,
      requester: 'Hyderabad Senior Care Collective',
      cluster: 'Jubilee Hills & Banjara Hills, Hyderabad',
      desc: 'Pick up pre-packed organic ragi/millets and fresh sabzi box from local farmers market and deliver to two homebound elderly couples.',
      details: ['Box weight under 7 kg', 'Apartment security gate pass ready', 'Verified neighbor route'],
      status: 'open',
      escrowLocked: true
    }
  ],
  ledgerTransactions: [
    {
      date: '2026-10-26 17:30',
      hash: 'sha256:7b91e...c421',
      desc: 'Evening Verandah Respite for Dadi (Mrs. Shanti Sharma)',
      sub: 'Executed with Volunteer Priya Sundaram • DigiLocker Verified',
      tier: 'Tier 2 Respite',
      debit: null,
      credit: 2.00,
      balance: 4.50,
      status: 'settled',
      statusLabel: 'Settled'
    },
    {
      date: '2026-10-23 10:15',
      hash: 'sha256:3a18f...d902',
      desc: 'Dialysis Auto Escrow Release at Manipal Hospital',
      sub: 'Helper Rohan Gupta debited from Ananya D.',
      tier: 'Tier 1 Errand',
      debit: 1.50,
      credit: null,
      balance: 2.50,
      status: 'settled',
      statusLabel: 'Settled'
    },
    {
      date: '2026-10-19 09:00',
      hash: 'sha256:9c44e...a117',
      desc: 'Initial Caregiver Onboarding Stake (Bengaluru Mutual Aid)',
      sub: 'Karnataka Care Trust Protocol Grant',
      tier: 'System Grant',
      debit: null,
      credit: 4.00,
      balance: 4.00,
      status: 'settled',
      statusLabel: 'Settled'
    }
  ]
};

/* ==========================================================================
   DOM Elements
   ========================================================================== */
const DOM = {
  navBalanceVal: document.getElementById('nav-balance-val'),
  passbookBalanceDisplay: document.getElementById('passbook-balance-display'),
  scrollProgress: document.getElementById('scroll-progress'),
  auras: [document.getElementById('aura-1'), document.getElementById('aura-2'), document.getElementById('aura-3')],
  tasksContainer: document.getElementById('tasks-container'),
  segmentedControl: document.getElementById('task-filter-segmented'),
  segmentedPill: document.getElementById('segmented-pill'),
  segButtons: document.querySelectorAll('.seg-btn'),
  ledgerRows: document.getElementById('ledger-rows'),
  btnHeroSimulate: document.getElementById('btn-hero-simulate'),
  btnOpenSos: document.getElementById('btn-open-sos'),
  // SOS Console
  sosTrack: document.getElementById('sos-track'),
  sosThumb: document.getElementById('sos-thumb'),
  sosFill: document.getElementById('sos-fill'),
  trackLabel: document.getElementById('track-label'),
  sliderBox: document.getElementById('slider-box'),
  sosAbortState: document.getElementById('sos-abort-state'),
  abortSecNum: document.getElementById('abort-sec-num'),
  abortSvgProgress: document.getElementById('abort-svg-progress'),
  btnCancelSos: document.getElementById('btn-cancel-sos'),
  sosConfirmedState: document.getElementById('sos-confirmed-state'),
  btnResetSos: document.getElementById('btn-reset-sos'),
  // Modals
  waiverModal: document.getElementById('waiver-modal'),
  btnCloseWaiver: document.getElementById('btn-close-waiver'),
  btnCancelWaiver: document.getElementById('btn-cancel-waiver'),
  btnConfirmClaim: document.getElementById('btn-confirm-claim'),
  waiverCheckbox: document.getElementById('waiver-agree-checkbox'),
  modalTaskSummary: document.getElementById('modal-task-summary'),
  requestModal: document.getElementById('request-modal'),
  btnOpenRequestModal: document.getElementById('btn-open-request-modal'),
  btnCloseRequest: document.getElementById('btn-close-request'),
  btnCancelRequest: document.getElementById('btn-cancel-request'),
  newRequestForm: document.getElementById('new-request-form'),
  reqEscrowHrs: document.getElementById('req-escrow-hrs'),
  reqHoursInput: document.getElementById('req-hours'),
  btnBackToTop: document.getElementById('btn-back-to-top'),
  // User & Nav Elements
  navUserName: document.getElementById('nav-user-name'),
  navUserAvatar: document.getElementById('nav-user-avatar')
};

const API_BASE = 'http://localhost:3001/api';

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initScrollSmootherAndTelemetry();
  initAmbientAuraParallax();
  initSpotlightProximity();
  initElasticSegmentedControl();
  updateUserInterface();
  renderTasks();
  renderLedger();
  initSosSlider();
  initModals();
  initHeaderScroll();
  initDatabaseInspector();
  await syncWithBackend();
});

/* ==========================================================================
   1. Kinetic Foundation: Scroll Progress & Telemetry Odometer Counters
   ========================================================================== */
function initScrollSmootherAndTelemetry() {
  // Update scroll reading progress line
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
    if (DOM.scrollProgress) {
      DOM.scrollProgress.style.transform = `scaleX(${progress})`;
    }
  }, { passive: true });

  // GSAP Odometer Animation for Telemetry Stats
  const statHours = document.getElementById('stat-hours');
  const statRate = document.getElementById('stat-rate');
  const statBuffer = document.getElementById('stat-buffer');

  if (statHours && statRate && statBuffer) {
    ScrollTrigger.create({
      trigger: '.telemetry-bar',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        // Hours odometer
        gsap.to({ val: 0 }, {
          val: 14820,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: function () {
            statHours.innerText = Math.round(this.targets()[0].val).toLocaleString();
          }
        });
        // Rate odometer
        gsap.to({ val: 0 }, {
          val: 99.4,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: function () {
            statRate.innerText = this.targets()[0].val.toFixed(1);
          }
        });
        // Buffer odometer
        gsap.to({ val: 0 }, {
          val: 3.0,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: function () {
            statBuffer.innerText = this.targets()[0].val.toFixed(1);
          }
        });
      }
    });
  }

  // Back to top smooth scroll
  if (DOM.btnBackToTop) {
    DOM.btnBackToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   2. Ambient Liquid Rust Auras: Smooth Cursor & Scroll Parallax
   ========================================================================== */
function initAmbientAuraParallax() {
  if (!DOM.auras || !DOM.auras[0]) return;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener('pointermove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 60;
    targetY = (e.clientY / window.innerHeight - 0.5) * 60;
  }, { passive: true });

  function renderAuras() {
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    if (DOM.auras[0]) DOM.auras[0].style.transform = `translate3d(${currentX * 1.2}px, ${currentY * 1.2}px, 0)`;
    if (DOM.auras[1]) DOM.auras[1].style.transform = `translate3d(${-currentX * 0.8}px, ${-currentY * 0.8}px, 0)`;
    if (DOM.auras[2]) DOM.auras[2].style.transform = `translate3d(${currentX * 0.5}px, ${currentY * 0.5}px, 0)`;

    requestAnimationFrame(renderAuras);
  }
  renderAuras();
}

/* ==========================================================================
   3. React Bits: Spotlight Proximity Border Card Pattern
   ========================================================================== */
function initSpotlightProximity() {
  document.addEventListener('pointermove', (e) => {
    const cards = document.querySelectorAll('[data-spotlight]');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* ==========================================================================
   4. Elastic Animated Segmented Control (Tier 1 vs Tier 2 Filter)
   ========================================================================== */
function initElasticSegmentedControl() {
  if (!DOM.segmentedControl || !DOM.segmentedPill) return;

  const updatePill = (btn) => {
    if (!btn || !DOM.segmentedPill) return;
    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();
    const left = rect.left - parentRect.left;
    const width = rect.width;
    DOM.segmentedPill.style.left = `${left}px`;
    DOM.segmentedPill.style.width = `${width}px`;
  };

  DOM.segButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.segButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePill(btn);
      state.filter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Set initial pill position after layout
  setTimeout(() => {
    const activeBtn = document.querySelector('.seg-btn.active');
    updatePill(activeBtn);
  }, 100);

  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.seg-btn.active');
    updatePill(activeBtn);
  });
}

/* ==========================================================================
   5. Two-Tier Task Separation Board & My Posts Management
   ========================================================================== */
function isCurrentUserPost(task) {
  if (task.isMyPost) return true;
  if (task.requesterId && state.currentUser && task.requesterId === state.currentUser.id) return true;
  if (task.requester && state.currentUser && state.currentUser.name) {
    const userFirstName = state.currentUser.name.trim().toLowerCase().split(' ')[0];
    if (task.requester.toLowerCase().includes(userFirstName)) return true;
  }
  return false;
}

function renderTasks() {
  if (!DOM.tasksContainer) return;

  const filtered = state.tasks.filter(t => {
    if (state.filter === 'all') return true;
    if (state.filter === 'my-posts') return isCurrentUserPost(t);
    return t.tier === state.filter;
  });

  DOM.tasksContainer.innerHTML = '';

  if (filtered.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'tasks-empty-state';
    if (state.filter === 'my-posts') {
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <h4 class="empty-state-title">No Active Posts by You Yet</h4>
        <p class="empty-state-sub">You currently haven't published any requests for neighborly errands or courtyard respite.</p>
        <button class="btn btn-primary btn-sm" id="btn-empty-create-post" style="margin-top:14px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Create Your First Care Request</span>
        </button>
      `;
    } else {
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h4 class="empty-state-title">No Requests in this Category</h4>
        <p class="empty-state-sub">Explore other categories or publish a new request for your neighborhood circle.</p>
      `;
    }
    DOM.tasksContainer.appendChild(emptyDiv);

    const btnEmpty = document.getElementById('btn-empty-create-post');
    if (btnEmpty && DOM.requestModal) {
      btnEmpty.addEventListener('click', () => {
        DOM.requestModal.classList.add('open');
        DOM.requestModal.setAttribute('aria-hidden', 'false');
      });
    }
    return;
  }

  filtered.forEach(task => {
    const card = document.createElement('article');
    card.className = 'task-item-card liquid-glass-card liquid-glass-specular spotlight-card';
    card.setAttribute('data-spotlight', '');
    card.setAttribute('id', task.id);

    const isTier1 = task.tier === 'tier-1';
    const tierPillClass = isTier1 ? 'tier-1-pill' : 'tier-2-pill';
    const isMine = isCurrentUserPost(task);

    card.innerHTML = `
      <div class="task-top-meta">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="tier-pill ${tierPillClass}">${task.tierLabel}</span>
          ${isMine ? '<span class="badge-my-post"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> My Post</span>' : ''}
        </div>
        <div class="task-hours-badge tabular-nums">
          <span>+${task.hours.toFixed(2)}</span>
          <small>HRS</small>
        </div>
      </div>
      <h3 class="task-title">${task.title}</h3>
      <p class="task-desc">${task.desc}</p>
      <ul class="task-details-list">
        <li>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span><strong>Requester:</strong> ${task.requester}</span>
        </li>
        <li>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span><strong>Cluster:</strong> ${task.cluster}</span>
        </li>
      </ul>
      <div class="task-actions-group">
        ${isMine ? `
          <button class="task-action-btn task-delete-btn" data-delete-id="${task.id}" title="Delete this post and release escrow back to your passbook">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            <span>Delete My Post</span>
          </button>
        ` : `
          <button class="task-action-btn" data-claim-id="${task.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Volunteer to Help</span>
          </button>
        `}
      </div>
    `;

    DOM.tasksContainer.appendChild(card);
  });

  // Re-bind click event for claiming
  DOM.tasksContainer.querySelectorAll('[data-claim-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskId = btn.dataset.claimId;
      openClaimWaiver(taskId);
    });
  });

  // Re-bind click event for deleting own posts
  DOM.tasksContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.deleteId;
      handleDeletePost(taskId);
    });
  });

  // Stagger entry animation
  gsap.fromTo(DOM.tasksContainer.children, 
    { opacity: 0, y: 16 }, 
    { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
  );
}

/* ==========================================================================
   5b. Delete Post & Escrow Release Workflow
   ========================================================================== */
async function handleDeletePost(taskId) {
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;
  const task = state.tasks[taskIndex];

  const confirmed = window.confirm(
    `Are you sure you want to delete your care request?\n\n"${task.title}"\n\nThe locked escrow of ${task.hours.toFixed(2)} hours will be immediately released and credited back to your Care Passbook balance.`
  );
  if (!confirmed) return;

  const refundHours = task.hours;
  const newBalance = Number((state.activeBalance + refundHours).toFixed(2));

  // Try calling backend API
  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.balance === 'number') {
        state.activeBalance = data.balance;
      } else {
        state.activeBalance = newBalance;
      }
    } else {
      state.activeBalance = newBalance;
    }
  } catch (err) {
    console.warn('Backend DELETE API unavailable, proceeding in client state:', err.message);
    state.activeBalance = newBalance;
  }

  // Remove from state tasks
  state.tasks.splice(taskIndex, 1);

  // Record refund in ledger
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  state.ledgerTransactions.unshift({
    date: timeStr,
    hash: `sha256:refund_${Math.random().toString(36).substring(2, 6)}`,
    desc: `Escrow Refund / Post Deleted: ${task.title}`,
    sub: `Post cancelled by author • ${refundHours.toFixed(2)}h released back to passbook`,
    tier: task.tierLabel || 'Escrow Refund',
    debit: null,
    credit: refundHours,
    balance: state.activeBalance,
    status: 'settled',
    statusLabel: 'Settled'
  });

  updateBalanceDisplay(state.activeBalance);
  renderLedger();
  renderTasks();
  updateUserInterface();

  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#166534', '#C85A32', '#FAF7F2']
  });
}

/* ==========================================================================
   6. Double-Entry Care Passbook & Ledger Simulation
   ========================================================================== */
function renderLedger() {
  if (!DOM.ledgerRows) return;

  DOM.ledgerRows.innerHTML = '';

  state.ledgerTransactions.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="ledger-date-cell">
        <span>${tx.date}</span>
      </td>
      <td class="ledger-desc-cell">
        <strong>${tx.desc}</strong>
        <span>${tx.sub}</span>
      </td>
      <td>
        <span class="ledger-tier-tag">${tx.tier}</span>
      </td>
      <td class="tabular-nums ${tx.debit ? 'ledger-debit' : ''}">
        ${tx.debit ? `-${tx.debit.toFixed(2)}h` : '—'}
      </td>
      <td class="tabular-nums ${tx.credit ? 'ledger-credit' : ''}">
        ${tx.credit ? `+${tx.credit.toFixed(2)}h` : '—'}
      </td>
      <td class="ledger-balance tabular-nums">
        ${tx.balance.toFixed(2)}h
      </td>
      <td>
        <span class="stamp-badge ${tx.status === 'settled' ? 'stamp-settled' : 'stamp-escrow'}">
          ${tx.status === 'settled' ? '✓ Settled' : '⟳ Escrow'}
        </span>
      </td>
    `;
    DOM.ledgerRows.appendChild(tr);
  });

  // Update Passbook Balance Displays
  updateBalanceDisplay(state.activeBalance);
}

function updateBalanceDisplay(newBalance) {
  state.activeBalance = newBalance;
  if (DOM.navBalanceVal) DOM.navBalanceVal.innerText = newBalance.toFixed(2);
  if (DOM.passbookBalanceDisplay) DOM.passbookBalanceDisplay.innerText = newBalance.toFixed(2);
}

// Hero Simulation: Respite Settlement Odometer & Confetti
if (DOM.btnHeroSimulate) {
  DOM.btnHeroSimulate.addEventListener('click', () => {
    simulateSettlement();
  });
}

function simulateSettlement() {
  const depositHours = 2.00;
  const previousBalance = state.activeBalance;
  const targetBalance = previousBalance + depositHours;

  // Add ledger entry
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const mockHash = `sha256:${Math.random().toString(36).substring(2, 7)}...${Math.random().toString(36).substring(2, 6)}`;

  state.ledgerTransactions.unshift({
    date: timeStr,
    hash: mockHash,
    desc: 'Simulated Respite Execution Settlement',
    sub: 'Peer dual-confirmation & geo-fence verified',
    tier: 'Tier 2 Respite',
    debit: null,
    credit: depositHours,
    balance: targetBalance,
    status: 'settled',
    statusLabel: 'Settled'
  });

  // Tween balance display (odometer effect)
  gsap.to({ val: previousBalance }, {
    val: targetBalance,
    duration: 1.4,
    ease: 'power2.out',
    snap: 0.25,
    onUpdate: function () {
      const current = this.targets()[0].val;
      updateBalanceDisplay(current);
    },
    onComplete: () => {
      updateBalanceDisplay(targetBalance);
      renderLedger();
      
      // Joyous celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#C85A32', '#96391A', '#166534', '#FAF7F2']
      });
    }
  });

  // Smooth scroll to ledger
  const passbookSec = document.getElementById('passbook-section');
  if (passbookSec) {
    passbookSec.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ==========================================================================
   7. Anti-Accident Engineering: High-Friction SOS Slider & Abort Countdown
   ========================================================================== */
function initSosSlider() {
  if (!DOM.sosTrack || !DOM.sosThumb || !DOM.sosFill) return;

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let maxDistance = 0;

  const updateMaxDistance = () => {
    const trackWidth = DOM.sosTrack.clientWidth;
    const thumbWidth = DOM.sosThumb.clientWidth;
    maxDistance = trackWidth - thumbWidth - 8; // padding offset
  };
  updateMaxDistance();
  window.addEventListener('resize', updateMaxDistance);

  // Pointer / Touch Handlers
  DOM.sosThumb.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX - currentTranslate;
    DOM.sosThumb.setPointerCapture(e.pointerId);
  });

  DOM.sosThumb.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - startX;
    currentTranslate = Math.max(0, Math.min(x, maxDistance));
    
    // Apply translation
    DOM.sosThumb.style.transform = `translateX(${currentTranslate}px)`;
    const percent = maxDistance > 0 ? (currentTranslate / maxDistance) * 100 : 0;
    DOM.sosFill.style.width = `${percent}%`;

    // 92% Drag Threshold Trigger
    if (percent >= 92) {
      isDragging = false;
      triggerSosCountdown();
    }
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    // Spring back if not reaching 92%
    gsap.to(DOM.sosThumb, {
      x: 0,
      duration: 0.35,
      ease: 'back.out(1.5)',
      onUpdate: () => {
        currentTranslate = gsap.getProperty(DOM.sosThumb, 'x');
        const percent = (currentTranslate / maxDistance) * 100;
        DOM.sosFill.style.width = `${percent}%`;
      }
    });
  };

  DOM.sosThumb.addEventListener('pointerup', endDrag);
  DOM.sosThumb.addEventListener('pointercancel', endDrag);

  // Trigger Countdown State
  function triggerSosCountdown() {
    DOM.sliderBox.style.display = 'none';
    DOM.sosAbortState.style.display = 'flex';
    DOM.sosConfirmedState.style.display = 'none';

    state.sosSecondsRemaining = 5;
    if (DOM.abortSecNum) DOM.abortSecNum.innerText = state.sosSecondsRemaining;

    // Reset circle progress
    const totalDash = 440;
    if (DOM.abortSvgProgress) {
      DOM.abortSvgProgress.style.strokeDashoffset = '0';
    }

    clearInterval(state.sosAbortTimer);

    // 5-Second Interval Countdown
    state.sosAbortTimer = setInterval(() => {
      state.sosSecondsRemaining -= 1;
      if (DOM.abortSecNum) DOM.abortSecNum.innerText = state.sosSecondsRemaining;

      // Animate SVG stroke offset
      const progressPercent = (5 - state.sosSecondsRemaining) / 5;
      if (DOM.abortSvgProgress) {
        DOM.abortSvgProgress.style.strokeDashoffset = String(totalDash * progressPercent);
      }

      if (state.sosSecondsRemaining <= 0) {
        clearInterval(state.sosAbortTimer);
        confirmSosDispatch();
      }
    }, 1000);
  }

  // Cancel / Abort Handler
  if (DOM.btnCancelSos) {
    DOM.btnCancelSos.addEventListener('click', () => {
      clearInterval(state.sosAbortTimer);
      // Reset Slider
      DOM.sliderBox.style.display = 'block';
      DOM.sosAbortState.style.display = 'none';
      DOM.sosConfirmedState.style.display = 'none';
      DOM.sosThumb.style.transform = 'translateX(0px)';
      DOM.sosFill.style.width = '0%';
      currentTranslate = 0;
    });
  }

  // Confirm Dispatch
  function confirmSosDispatch() {
    DOM.sosAbortState.style.display = 'none';
    DOM.sosConfirmedState.style.display = 'block';

    // Celebration burst for rapid emergency coordination
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#dc2626', '#C85A32', '#166534']
    });

    // Debit ledger overdraft
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    state.ledgerTransactions.unshift({
      date: timeStr,
      hash: `sha256:sos_${Math.random().toString(36).substring(2, 6)}`,
      desc: 'Emergency Respite Dispatch (3.0h Community Overdraft Reserve)',
      sub: 'Broadcasted to 3 neighboring caregivers',
      tier: 'Tier 2 SOS Emergency',
      debit: 0.00,
      credit: null,
      balance: state.activeBalance,
      status: 'escrow',
      statusLabel: 'Overdraft Active'
    });
    renderLedger();
  }

  // Reset SOS Demo
  if (DOM.btnResetSos) {
    DOM.btnResetSos.addEventListener('click', () => {
      DOM.sliderBox.style.display = 'block';
      DOM.sosAbortState.style.display = 'none';
      DOM.sosConfirmedState.style.display = 'none';
      DOM.sosThumb.style.transform = 'translateX(0px)';
      DOM.sosFill.style.width = '0%';
      currentTranslate = 0;
    });
  }

  // Open SOS from Header Button
  if (DOM.btnOpenSos) {
    DOM.btnOpenSos.addEventListener('click', () => {
      const sosSec = document.getElementById('sos-section');
      if (sosSec) {
        sosSec.scrollIntoView({ behavior: 'smooth' });
        // Subtle focus animation on console
        gsap.fromTo(DOM.sosTrack, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: 'power2.out' });
      }
    });
  }
}

/* ==========================================================================
   8. Modals: Good Samaritan Mutual Waiver & Post Request
   ========================================================================== */
function initModals() {
  // Good Samaritan Waiver Modal
  const openWaiver = (task) => {
    state.selectedTaskForClaim = task;
    if (DOM.modalTaskSummary) {
      DOM.modalTaskSummary.innerHTML = `
        <strong>Claiming Task:</strong> ${task.title}<br />
        <span style="color:var(--color-rust-700); font-weight:600;">+${task.hours.toFixed(2)} hours will be credited to your passbook upon dual completion.</span>
      `;
    }
    if (DOM.waiverCheckbox) DOM.waiverCheckbox.checked = false;
    if (DOM.btnConfirmClaim) DOM.btnConfirmClaim.disabled = true;
    DOM.waiverModal.classList.add('open');
    DOM.waiverModal.setAttribute('aria-hidden', 'false');
  };

  window.openClaimWaiver = (taskId) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) openWaiver(task);
  };

  const closeWaiver = () => {
    DOM.waiverModal.classList.remove('open');
    DOM.waiverModal.setAttribute('aria-hidden', 'true');
    state.selectedTaskForClaim = null;
  };

  if (DOM.btnCloseWaiver) DOM.btnCloseWaiver.addEventListener('click', closeWaiver);
  if (DOM.btnCancelWaiver) DOM.btnCancelWaiver.addEventListener('click', closeWaiver);

  if (DOM.waiverCheckbox) {
    DOM.waiverCheckbox.addEventListener('change', (e) => {
      DOM.btnConfirmClaim.disabled = !e.target.checked;
    });
  }

  if (DOM.btnConfirmClaim) {
    DOM.btnConfirmClaim.addEventListener('click', () => {
      if (!state.selectedTaskForClaim) return;
      
      const claimedTask = state.selectedTaskForClaim;
      claimedTask.status = 'claimed';

      // Update button on card to show claimed
      const taskCardBtn = document.querySelector(`[data-claim-id="${claimedTask.id}"]`);
      if (taskCardBtn) {
        taskCardBtn.innerHTML = `<span>✓ Waiver Signed &amp; Escrow Locked</span>`;
        taskCardBtn.style.background = 'var(--color-emerald-50)';
        taskCardBtn.style.color = 'var(--color-emerald-700)';
        taskCardBtn.style.borderColor = 'rgba(22, 101, 52, 0.3)';
        taskCardBtn.disabled = true;
      }

      // Add Escrow pending transaction in ledger
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      state.ledgerTransactions.unshift({
        date: timeStr,
        hash: `sha256:claim_${Math.random().toString(36).substring(2, 6)}`,
        desc: `Good Samaritan Escrow Lock: ${claimedTask.title}`,
        sub: `Claimed by you &bull; Mutual waiver signed`,
        tier: claimedTask.tierLabel,
        debit: null,
        credit: null,
        balance: state.activeBalance,
        status: 'escrow',
        statusLabel: 'Escrow Lock'
      });
      renderLedger();

      closeWaiver();

      // Confetti feedback
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 }
      });
    });
  }

  // Create Request Modal
  const openRequestModal = () => {
    DOM.requestModal.classList.add('open');
    DOM.requestModal.setAttribute('aria-hidden', 'false');
  };

  const closeRequestModal = () => {
    DOM.requestModal.classList.remove('open');
    DOM.requestModal.setAttribute('aria-hidden', 'true');
  };

  if (DOM.btnOpenRequestModal) DOM.btnOpenRequestModal.addEventListener('click', openRequestModal);
  if (DOM.btnCloseRequest) DOM.btnCloseRequest.addEventListener('click', closeRequestModal);
  if (DOM.btnCancelRequest) DOM.btnCancelRequest.addEventListener('click', closeRequestModal);

  // Update escrow hours text on input
  if (DOM.reqHoursInput && DOM.reqEscrowHrs) {
    DOM.reqHoursInput.addEventListener('input', (e) => {
      DOM.reqEscrowHrs.innerText = `${parseFloat(e.target.value || 0).toFixed(2)} hrs`;
    });
  }

  // Form Submission
  if (DOM.newRequestForm) {
    DOM.newRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const tier = document.getElementById('req-tier').value;
      const title = document.getElementById('req-title').value;
      const hours = parseFloat(document.getElementById('req-hours').value);
      const location = document.getElementById('req-location').value;
      const desc = document.getElementById('req-desc').value;

      const currentUserName = state.currentUser ? state.currentUser.name : 'Ananya Deshmukh';
      const currentUserId = state.currentUser ? state.currentUser.id : 'usr-ananya';
      const currentUserRole = state.currentUser ? (state.currentUser.roleLabel || 'Family Caregiver') : 'Family Caregiver';

      const newTask = {
        id: `task-${Date.now()}`,
        title,
        tier,
        tierLabel: tier === 'tier-1' ? 'Tier 1: Errands' : 'Tier 2: Respite',
        hours,
        requester: `${currentUserName} (${currentUserRole})`,
        requesterId: currentUserId,
        isMyPost: true,
        cluster: location,
        desc,
        details: ['Escrow lock active', 'Non-clinical terms certified', 'Good Samaritan eligible'],
        status: 'open',
        escrowLocked: true
      };

      // Try syncing new task to backend API
      fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tier,
          hours,
          cluster: location,
          description: desc,
          requesterId: currentUserId,
          requesterName: currentUserName
        })
      }).catch(e => console.log('Backend sync offline:', e.message));

      // Prepend task
      state.tasks.unshift(newTask);
      renderTasks();

      // Lock Escrow in ledger
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      state.ledgerTransactions.unshift({
        date: timeStr,
        hash: `sha256:escrow_${Math.random().toString(36).substring(2, 6)}`,
        desc: `Escrow Lock: ${title}`,
        sub: `Held in community custody until respite verified`,
        tier: newTask.tierLabel,
        debit: hours,
        credit: null,
        balance: state.activeBalance - hours,
        status: 'escrow',
        statusLabel: 'In Escrow'
      });
      updateBalanceDisplay(state.activeBalance - hours);
      renderLedger();
      updateUserInterface();

      closeRequestModal();
      DOM.newRequestForm.reset();

      // Scroll to task board
      const taskBoard = document.getElementById('task-board');
      if (taskBoard) taskBoard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Close modals on Escape key or backdrop click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWaiver();
      closeRequestModal();
    }
  });

  [DOM.waiverModal, DOM.requestModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeWaiver();
          closeRequestModal();
        }
      });
    }
  });
}

/* ==========================================================================
   9. Header Shrink on Scroll
   ========================================================================== */
function initHeaderScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.padding = '8px 16px';
      navbar.style.background = 'rgba(255, 255, 255, 0.88)';
      navbar.style.boxShadow = '0 12px 32px -4px rgba(150, 57, 26, 0.12)';
    } else {
      navbar.style.padding = '10px 18px';
      navbar.style.background = 'rgba(255, 255, 255, 0.78)';
      navbar.style.boxShadow = 'var(--shadow-card)';
    }
  }, { passive: true });
}

/* ==========================================================================
   10. SQLite Database Synchronization & Inspector
   ========================================================================== */
async function syncWithBackend() {
  try {
    const statusRes = await fetch(`${API_BASE}/status`);
    if (!statusRes.ok) return;

    // Fetch tasks from SQLite
    const tasksRes = await fetch(`${API_BASE}/tasks`);
    if (tasksRes.ok) {
      const dbTasks = await tasksRes.json();
      if (dbTasks && dbTasks.length > 0) {
        state.tasks = dbTasks.map(t => {
          const isMine = Boolean(
            (t.requester_id && state.currentUser && t.requester_id === state.currentUser.id) ||
            (t.requester_name && state.currentUser && state.currentUser.name && t.requester_name.toLowerCase().includes(state.currentUser.name.toLowerCase().split(' ')[0]))
          );
          return {
            id: t.id,
            title: t.title,
            tier: t.tier,
            tierLabel: t.tier_label,
            hours: t.hours,
            requester: t.requester_name,
            requesterId: t.requester_id,
            isMyPost: isMine,
            cluster: t.cluster,
            desc: t.description,
            details: t.details || [],
            status: t.status,
            escrowLocked: true
          };
        });
        renderTasks();
      }
    }

    // Fetch ledger from SQLite
    const ledgerRes = await fetch(`${API_BASE}/ledger`);
    if (ledgerRes.ok) {
      const dbLedger = await ledgerRes.json();
      state.activeBalance = dbLedger.balance;
      state.overdraftGrace = dbLedger.overdraftGrace;
      updateBalanceDisplay(dbLedger.balance);

      if (dbLedger.transactions && dbLedger.transactions.length > 0) {
        state.ledgerTransactions = dbLedger.transactions.map(t => ({
          date: t.created_at,
          hash: t.cryptographic_hash,
          desc: t.description,
          sub: t.counterparty ? `Counterparty: ${t.counterparty}` : 'Escrow Settlement',
          tier: t.tier,
          debit: t.entry_type === 'DEBIT' ? t.amount : null,
          credit: t.entry_type === 'CREDIT' ? t.amount : null,
          balance: state.activeBalance,
          status: t.status,
          statusLabel: t.status === 'settled' ? 'Settled' : 'In Escrow'
        }));
        renderLedger();
      }
    }
  } catch (err) {
    console.log('Running in local offline simulation mode (API server not detected):', err.message);
  }
}

function initDatabaseInspector() {
  const dbModal = document.getElementById('db-modal');
  const btnOpenDb = document.getElementById('btn-open-db');
  const btnCloseDb = document.getElementById('btn-close-db');
  const btnRefreshDb = document.getElementById('btn-refresh-db');
  const viewport = document.getElementById('db-table-viewport');
  const tabs = document.querySelectorAll('.db-tab');

  let activeTab = 'ledger';
  let cachedDbData = null;

  const openDbModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (dbModal) {
      dbModal.classList.add('open');
      dbModal.setAttribute('aria-hidden', 'false');
      await loadDbData();
    }
  };

  const closeDbModal = () => {
    if (dbModal) {
      dbModal.classList.remove('open');
      dbModal.setAttribute('aria-hidden', 'true');
    }
  };

  if (btnOpenDb) btnOpenDb.addEventListener('click', openDbModal);
  if (btnCloseDb) btnCloseDb.addEventListener('click', closeDbModal);
  if (btnRefreshDb) btnRefreshDb.addEventListener('click', () => loadDbData(true));
  if (dbModal) {
    dbModal.addEventListener('click', (e) => {
      if (e.target === dbModal) closeDbModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDbModal();
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.dbTab;
      renderActiveTab();
    });
  });

  async function loadDbData(force = false) {
    if (viewport) viewport.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--color-slate-500); font-family: var(--font-mono);">Querying SQLite 3 engine (database/kintime.db)...</div>';
    try {
      const res = await fetch(`${API_BASE}/database/dump`);
      if (res.ok) {
        cachedDbData = await res.json();
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (e) {
      // Offline fallback sample data
      cachedDbData = {
        dbFile: 'database/kintime.db',
        tables: {
          ledger_entries: state.ledgerTransactions,
          vw_user_balances: [{ user_id: 'usr-sarah', user_name: 'Sarah Jenkins', settled_balance: state.activeBalance, overdraft_grace_buffer: 3.0 }],
          tasks: state.tasks
        }
      };
    }
    renderActiveTab();
  }

  function renderActiveTab() {
    if (!viewport || !cachedDbData) return;

    if (activeTab === 'schema') {
      viewport.innerHTML = `
        <pre class="db-schema-pre"><code>-- SQLite 3 DDL Specification (database/schema.sql)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('caregiver', 'volunteer', 'recipient')),
  role_label TEXT,
  cluster TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  aadhaar_number TEXT,
  kyc_status TEXT DEFAULT 'verified_aadhaar',
  pledge_agreed INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tier TEXT CHECK(tier IN ('tier-1', 'tier-2')),
  hours REAL NOT NULL,
  status TEXT CHECK(status IN ('open', 'claimed', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entry_type TEXT CHECK(entry_type IN ('DEBIT', 'CREDIT')),
  amount REAL NOT NULL,
  status TEXT CHECK(status IN ('settled', 'escrow')),
  cryptographic_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW vw_user_balances AS
SELECT 
  user_id,
  COALESCE(SUM(CASE 
    WHEN entry_type = 'CREDIT' AND status = 'settled' THEN amount
    WHEN entry_type = 'DEBIT' AND status = 'settled' THEN -amount
    ELSE 0.0 END), 0.0) AS settled_balance,
  3.0 AS overdraft_grace_buffer
FROM ledger_entries GROUP BY user_id;</code></pre>
      `;
      return;
    }

    let rows = [];
    if (activeTab === 'ledger') rows = cachedDbData.tables.ledger_entries || [];
    else if (activeTab === 'balances') rows = cachedDbData.tables.vw_user_balances || [];
    else if (activeTab === 'tasks') rows = cachedDbData.tables.tasks || [];
    else if (activeTab === 'users') rows = cachedDbData.tables.users || [];

    if (!rows || rows.length === 0) {
      viewport.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--color-slate-500);">No rows found in this table.</div>';
      return;
    }

    const columns = Object.keys(rows[0]);
    let html = '<table class="db-raw-table"><thead><tr>';
    columns.forEach(col => {
      html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        let val = row[col];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        html += `<td>${val !== null && val !== undefined ? String(val) : 'NULL'}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    viewport.innerHTML = html;
  }
}

/* ==========================================================================
   11. Account Creation, DigiLocker Verification & Auth Workflow
   ========================================================================== */
const DEMO_PROFILES = {
  ananya: {
    id: 'usr-ananya',
    name: 'Ananya Deshmukh',
    role: 'caregiver',
    roleLabel: 'Primary Family Caregiver',
    cluster: 'Indiranagar Care Circle, Bengaluru',
    phone: '+91 98450 21982',
    initials: 'AD',
    balance: 4.50
  },
  priya: {
    id: 'usr-priya',
    name: 'Priya Sundaram',
    role: 'volunteer',
    roleLabel: 'Verified Volunteer Companion',
    cluster: 'Malleshwaram Heritage Circle, Bengaluru',
    phone: '+91 98450 91823',
    initials: 'PS',
    balance: 5.00
  },
  harish: {
    id: 'usr-harish',
    name: 'Prof. Harish Kulkarni',
    role: 'volunteer',
    roleLabel: 'Retired Professor • Community Angel',
    cluster: 'Jayanagar 4th Block Circle, Bengaluru',
    phone: '+91 98450 44210',
    initials: 'HK',
    balance: 44.00
  }
};

function updateUserInterface() {
  const user = state.currentUser;
  if (!user) return;

  // Navbar user elements
  if (DOM.navUserName) {
    DOM.navUserName.textContent = user.name;
  }
  if (DOM.navUserAvatar) {
    DOM.navUserAvatar.textContent = user.initials || user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  // Profile modal summary elements
  const avatarLarge = document.getElementById('profile-avatar-large');
  const nameDisplay = document.getElementById('profile-name-display');
  const roleDisplay = document.getElementById('profile-role-display');
  const clusterDisplay = document.getElementById('profile-cluster-display');
  const balanceDisplay = document.getElementById('profile-balance-display');
  const tabProfile = document.getElementById('tab-profile');

  if (avatarLarge) {
    avatarLarge.textContent = user.initials || user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
  if (nameDisplay) {
    nameDisplay.textContent = user.name;
  }
  if (roleDisplay) {
    roleDisplay.textContent = user.roleLabel || (user.role === 'caregiver' ? 'Primary Family Caregiver' : 'Volunteer Companion');
  }
  if (clusterDisplay) {
    clusterDisplay.textContent = user.cluster || 'Neighborhood Care Circle';
  }
  if (balanceDisplay) {
    balanceDisplay.textContent = `${state.activeBalance.toFixed(2)}h`;
  }
  if (tabProfile) {
    tabProfile.style.display = 'inline-flex';
  }
}
