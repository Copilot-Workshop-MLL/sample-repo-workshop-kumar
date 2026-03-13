/* ===== Pomodoro Gamification & Progress Tracking ===== */

const PROGRESS_KEY = 'pomodoro_progress';

// XP awarded per completed session by duration (minutes)
const XP_PER_DURATION = { 15: 1, 25: 2, 35: 3, 45: 4 };
const DEFAULT_XP = 2;

// ── Level system ─────────────────────────────────────────────────────────────
// XP required to reach level N: 5 * N * (N - 1)
// Level 1 = 0 XP, Level 2 = 10 XP, Level 3 = 30 XP, Level 4 = 60 XP, …

function xpToReachLevel(level) {
    return 5 * level * (level - 1);
}

function getLevelInfo(totalXP) {
    let level = 1;
    while (xpToReachLevel(level + 1) <= totalXP) level++;
    const currentLevelStart = xpToReachLevel(level);
    const nextLevelStart    = xpToReachLevel(level + 1);
    const currentLevelXP   = totalXP - currentLevelStart;
    const xpNeeded         = nextLevelStart - currentLevelStart;
    return { level, currentLevelXP, xpNeeded, progress: currentLevelXP / xpNeeded, totalXP };
}

// ── Achievement definitions ──────────────────────────────────────────────────

const ACHIEVEMENTS = [
    {
        id: 'first_pomo',
        icon: '🍅',
        name: 'First Tomato',
        desc: 'Complete your first Pomodoro session',
        check: p => p.totalSessions >= 1
    },
    {
        id: 'daily_5',
        icon: '💪',
        name: 'Power Day',
        desc: 'Complete 5 sessions in a single day',
        check: p => Object.values(p.dailySessions).some(c => c >= 5)
    },
    {
        id: 'streak_3',
        icon: '🔥',
        name: 'On Fire',
        desc: 'Maintain a 3-day focus streak',
        check: p => getCurrentStreak(p.dailySessions) >= 3
    },
    {
        id: 'streak_7',
        icon: '⚡',
        name: 'Week Streak',
        desc: 'Maintain a 7-day focus streak',
        check: p => getCurrentStreak(p.dailySessions) >= 7
    },
    {
        id: 'week_10',
        icon: '🏆',
        name: 'Week Warrior',
        desc: 'Complete 10 sessions in one week',
        check: p => getWeekSessionCount(p.dailySessions) >= 10
    },
    {
        id: 'sessions_25',
        icon: '🎯',
        name: 'Dedicated',
        desc: 'Complete 25 total sessions',
        check: p => p.totalSessions >= 25
    },
    {
        id: 'sessions_100',
        icon: '💎',
        name: 'Century Club',
        desc: 'Complete 100 total sessions',
        check: p => p.totalSessions >= 100
    },
];

// ── Date helpers ─────────────────────────────────────────────────────────────

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getDayAbbr(date) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
}

// ── Streak ───────────────────────────────────────────────────────────────────

function getCurrentStreak(dailySessions) {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dailySessions[key] > 0) {
            streak++;
        } else if (i === 0) {
            // Today has no sessions yet — look back from yesterday
            continue;
        } else {
            break;
        }
    }
    return streak;
}

// ── Aggregation helpers ───────────────────────────────────────────────────────

function getWeekSessionCount(dailySessions) {
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        total += dailySessions[d.toISOString().slice(0, 10)] || 0;
    }
    return total;
}

function getLastNDays(dailySessions, n) {
    const today = new Date();
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        result.push({
            key,
            label: n <= 7 ? getDayAbbr(d) : String(d.getDate()),
            count: dailySessions[key] || 0,
        });
    }
    return result;
}

// ── SVG bar chart ─────────────────────────────────────────────────────────────

function buildBarChart(days) {
    const W = 340, H = 130;
    const PAD = { top: 14, right: 8, bottom: 30, left: 30 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const maxCount = Math.max(1, ...days.map(d => d.count));
    const slotW = innerW / days.length;
    const barW  = slotW * 0.55;

    let bars = '';
    let labels = '';

    days.forEach((d, i) => {
        const barH = Math.max(d.count > 0 ? 2 : 0, Math.round((d.count / maxCount) * innerH));
        const x = PAD.left + i * slotW + (slotW - barW) / 2;
        const y = PAD.top + innerH - barH;
        const isToday = d.key === todayKey();
        const fill = isToday ? '#4361ee' : 'var(--chart-bar, #94a3b8)';

        bars += `<rect x="${x.toFixed(1)}" y="${y}" width="${barW.toFixed(1)}" height="${barH}" rx="2" fill="${fill}"/>`;
        if (d.count > 0) {
            bars += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 3)}" text-anchor="middle" font-size="9" fill="currentColor">${d.count}</text>`;
        }

        // Show label every N slots to avoid crowding
        const step = days.length <= 7 ? 1 : Math.ceil(days.length / 8);
        if (i % step === 0 || i === days.length - 1) {
            labels += `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--color-text-muted)">${d.label}</text>`;
        }
    });

    // Axes
    const axes = [
        `<line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + innerH}" stroke="var(--color-border)" stroke-width="1"/>`,
        `<line x1="${PAD.left}" y1="${PAD.top + innerH}" x2="${PAD.left + innerW}" y2="${PAD.top + innerH}" stroke="var(--color-border)" stroke-width="1"/>`,
        `<text x="${PAD.left - 4}" y="${PAD.top + 5}" text-anchor="end" font-size="9" fill="var(--color-text-muted)">${maxCount}</text>`,
        `<text x="${PAD.left - 4}" y="${PAD.top + innerH}" text-anchor="end" font-size="9" fill="var(--color-text-muted)">0</text>`,
    ].join('');

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="stats-chart-svg" aria-label="Session frequency chart">${axes}${bars}${labels}</svg>`;
}

// ── Storage ──────────────────────────────────────────────────────────────────

function defaultProgress() {
    return { totalXP: 0, totalSessions: 0, dailySessions: {}, achievements: {} };
}

function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (raw) return Object.assign(defaultProgress(), JSON.parse(raw));
    } catch (_) { /* ignore */ }
    return defaultProgress();
}

function saveProgress(progress) {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (_) { /* ignore */ }
}

// ── Main class ────────────────────────────────────────────────────────────────

class GamificationTracker {
    constructor() {
        this.progress  = loadProgress();
        this.statsView = 'weekly';
        this._wireStatsToggle();
        this.renderAll();
    }

    // Called by PomodoroTimer when a session completes
    recordSession(durationMinutes) {
        const xp = XP_PER_DURATION[durationMinutes] || DEFAULT_XP;
        this.progress.totalXP += xp;
        this.progress.totalSessions++;

        const today = todayKey();
        this.progress.dailySessions[today] = (this.progress.dailySessions[today] || 0) + 1;

        // Check for newly earned achievements
        const newlyEarned = [];
        for (const ach of ACHIEVEMENTS) {
            if (!this.progress.achievements[ach.id] && ach.check(this.progress)) {
                this.progress.achievements[ach.id] = { earnedAt: Date.now() };
                newlyEarned.push(ach);
            }
        }

        saveProgress(this.progress);
        this.renderAll();
        newlyEarned.forEach(ach => this._showToast(`${ach.icon} Achievement unlocked: ${ach.name}`));

        return { xpEarned: xp, newlyEarned };
    }

    renderAll() {
        this._renderProgress();
        this._renderAchievements();
        this._renderStats();
    }

    // ── Progress panel ──────────────────────────────────────────────────────

    _renderProgress() {
        const el = document.getElementById('gamification-progress');
        if (!el) return;
        const { level, currentLevelXP, xpNeeded, progress } = getLevelInfo(this.progress.totalXP);
        const streak = getCurrentStreak(this.progress.dailySessions);
        const pct = Math.round(progress * 100);

        el.innerHTML = `
          <div class="xp-header">
            <div class="xp-level-badge" aria-label="Level ${level}">Lvl<span>${level}</span></div>
            <div class="xp-details">
              <div class="xp-label-row">
                <span class="xp-label">Level ${level}</span>
                <span class="xp-fraction">${currentLevelXP}&thinsp;/&thinsp;${xpNeeded} XP</span>
              </div>
              <div class="xp-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="XP progress">
                <div class="xp-bar-fill" style="width:${pct}%"></div>
              </div>
            </div>
          </div>
          <div class="xp-stats-row">
            <div class="xp-stat">
              <span class="xp-stat-value">${this.progress.totalSessions}</span>
              <span class="xp-stat-label">Sessions</span>
            </div>
            <div class="xp-stat">
              <span class="xp-stat-value">${this.progress.totalXP}</span>
              <span class="xp-stat-label">Total XP</span>
            </div>
            <div class="xp-stat">
              <span class="xp-stat-value">${streak > 0 ? streak : '—'}</span>
              <span class="xp-stat-label">Day Streak</span>
            </div>
          </div>`;
    }

    // ── Achievements panel ──────────────────────────────────────────────────

    _renderAchievements() {
        const el = document.getElementById('gamification-achievements');
        if (!el) return;
        el.innerHTML = ACHIEVEMENTS.map(ach => {
            const earned = !!this.progress.achievements[ach.id];
            return `<div class="badge-card ${earned ? 'earned' : 'locked'}" title="${ach.desc}" aria-label="${ach.name}${earned ? ' — earned' : ' — locked'}">
              <span class="badge-icon" aria-hidden="true">${ach.icon}</span>
              <span class="badge-name">${ach.name}</span>
              <span class="badge-desc">${ach.desc}</span>
            </div>`;
        }).join('');
    }

    // ── Stats chart ──────────────────────────────────────────────────────────

    _renderStats() {
        const el = document.getElementById('gamification-chart');
        if (!el) return;
        const days = this.statsView === 'weekly'
            ? getLastNDays(this.progress.dailySessions, 7)
            : getLastNDays(this.progress.dailySessions, 30);
        el.innerHTML = buildBarChart(days);
    }

    _wireStatsToggle() {
        document.querySelectorAll('.stats-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.statsView = btn.dataset.view;
                document.querySelectorAll('.stats-tab').forEach(b => b.classList.toggle('active', b.dataset.view === this.statsView));
                this._renderStats();
            });
        });
    }

    // ── Toast notification ───────────────────────────────────────────────────

    _showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
}

// Initialise after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.gamificationTracker = new GamificationTracker(); });
} else {
    window.gamificationTracker = new GamificationTracker();
}
