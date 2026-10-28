/**
 * KinTime Universal Authentication & Entry-Point Guard
 * 
 * Enforces authentication entry-point:
 * - Unauthenticated visitors are routed to /auth.html with redirect memory
 * - Authenticated sessions populate the top navigation & passbook balance
 * - Provides interactive User Profile dropdown with instant Sign Out
 */

(function () {
  const AUTH_STORAGE_KEY = 'kintime_auth_session';
  const ACTIVE_USER_KEY = 'kintime_active_user';

  // Helper: Retrieve active session
  function getSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Determine current page
  const path = window.location.pathname;
  const isAuthPage = path.endsWith('/auth.html') || path.endsWith('/auth');
  const session = getSession();

  // 1. GATEKEEPING: If not logged in and not on auth page, redirect immediately
  if (!session && !isAuthPage) {
    const target = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace('auth.html?redirect=' + target);
    return;
  }

  // 2. If logged in and on auth page with no explicit force flag, allow quick forward
  // (We handle this inside KinTimeAuth.jsx with a 'Continue' card so user can switch account or proceed)

  // 3. UI SYNC & TOP-NAV INJECTION
  function initNavUI() {
    const currentSession = getSession();
    if (!currentSession) return;

    const user = currentSession.user || {};
    const name = user.name || 'Caregiver';
    const initials = user.initials || name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'KT';
    const balance = typeof user.balance === 'number' ? user.balance.toFixed(2) : (user.balance || '5.00');

    // Update Nav User Avatar & Name
    const nameEl = document.getElementById('nav-user-name');
    if (nameEl) nameEl.textContent = name.split(' ')[0]; // First name for header

    const avatarEl = document.getElementById('nav-user-avatar');
    if (avatarEl) avatarEl.textContent = initials;

    // Update Nav Balance Pill
    const balanceEl = document.getElementById('nav-balance-val');
    if (balanceEl) balanceEl.textContent = balance;

    // Bind Profile Dropdown Trigger
    const authBtn = document.getElementById('btn-open-auth');
    if (authBtn) {
      authBtn.removeAttribute('onclick');
      authBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfileDropdown(authBtn, user);
      });
    }
  }

  // 4. LIQUID GLASS PROFILE DROPDOWN
  function toggleProfileDropdown(triggerEl, user) {
    const existing = document.getElementById('kintime-profile-dropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.id = 'kintime-profile-dropdown';
    dropdown.className = 'kintime-profile-popover';
    
    const balance = typeof user.balance === 'number' ? user.balance.toFixed(2) : (user.balance || '5.00');
    const role = user.roleLabel || 'Primary Family Caregiver';
    const cluster = user.cluster || 'Indiranagar Care Circle, Bengaluru';
    const email = user.email || 'caregiver@kintime.org';

    dropdown.innerHTML = `
      <div class="popover-inner">
        <div class="popover-header">
          <div class="popover-avatar">${user.initials || 'KT'}</div>
          <div class="popover-user-info">
            <h4 class="popover-name">${user.name || 'Caregiver'}</h4>
            <p class="popover-email">${email}</p>
            <span class="popover-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Government ID Verified
            </span>
          </div>
        </div>

        <div class="popover-divider"></div>

        <div class="popover-details">
          <div class="popover-row">
            <span class="row-label">Care Role:</span>
            <span class="row-value">${role}</span>
          </div>
          <div class="popover-row">
            <span class="row-label">Neighborhood:</span>
            <span class="row-value truncate" title="${cluster}">${cluster}</span>
          </div>
          <div class="popover-row balance-row">
            <span class="row-label">Care Passbook:</span>
            <span class="row-value balance-value">${balance} <small>hrs</small></span>
          </div>
        </div>

        <div class="popover-actions">
          <a href="passbook.html" class="popover-link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            View Care Passbook
          </a>
          <a href="care-exchange.html" class="popover-link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
            Care Exchange Board
          </a>
          <button type="button" id="kintime-btn-signout" class="popover-signout-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    `;

    // Inject styles if not present
    if (!document.getElementById('kintime-profile-popover-styles')) {
      const style = document.createElement('style');
      style.id = 'kintime-profile-popover-styles';
      style.textContent = `
        .kintime-profile-popover {
          position: fixed;
          top: 76px;
          right: 24px;
          width: 320px;
          z-index: 9999;
          animation: popoverFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes popoverFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .popover-inner {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(28, 32, 36, 0.12), 0 1px 3px rgba(0,0,0,0.05);
          font-family: 'Poppins', 'Inter', system-ui, sans-serif;
          color: #1C2024;
        }
        .popover-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .popover-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #C85A32;
          color: white;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(200, 90, 50, 0.3);
          flex-shrink: 0;
        }
        .popover-user-info {
          overflow: hidden;
        }
        .popover-name {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: #1C2024;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popover-email {
          font-size: 11px;
          color: #4A5568;
          margin: 1px 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .popover-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          background: #DCFCE7;
          color: #15803D;
          border-radius: 100px;
        }
        .popover-divider {
          height: 1px;
          background: #E2E8F0;
          margin: 14px 0;
        }
        .popover-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
        }
        .popover-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .row-label {
          color: #4A5568;
        }
        .row-value {
          font-weight: 600;
          color: #1C2024;
        }
        .balance-row {
          background: #FDF7F4;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1px solid #F3CEBF;
          margin-top: 4px;
        }
        .balance-value {
          color: #C85A32;
          font-size: 14px;
          font-weight: 800;
        }
        .popover-actions {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .popover-link-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: #1C2024;
          text-decoration: none;
          transition: background 0.15s;
        }
        .popover-link-btn:hover {
          background: #F1F5F9;
        }
        .popover-signout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #DC2626;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.15s;
        }
        .popover-signout-btn:hover {
          background: #FEF2F2;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(dropdown);

    // Bind Sign Out Button
    const signOutBtn = dropdown.querySelector('#kintime-btn-signout');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        window.kintimeSignOut();
      });
    }

    // Dismiss on click outside
    const handleOutsideClick = (e) => {
      if (!dropdown.contains(e.target) && !triggerEl.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 10);
  }

  // 5. GLOBAL SIGN OUT FUNCTION
  window.kintimeSignOut = function () {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_KEY);
    window.location.replace('auth.html');
  };

  // 6. GLOBAL SIGN IN HELPER (Called by React or HTML flows)
  window.kintimeSignIn = function (userData, redirectUrl) {
    const sessionData = {
      token: 'jwt-kt-' + Date.now(),
      user: userData,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(userData));

    let destination = redirectUrl || 'index.html';
    if (destination.startsWith('/')) {
      destination = '.' + destination;
    }
    window.location.replace(destination);
  };

  // Run UI initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavUI);
  } else {
    initNavUI();
  }
})();
