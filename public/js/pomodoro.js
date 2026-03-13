/* ===== Pomodoro Focus Session ===== */

const PREF_KEY = 'pomodoro_prefs';
const STATE_KEY = 'pomodoro_state';
const TIMER_RING_CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

// ── Color helpers ────────────────────────────────────────────────────────────

function hexLerp(a, b, t) {
    const parse = h => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16)
    ];
    const [ar, ag, ab] = parse(a);
    const [br, bg, bb] = parse(b);
    const r    = Math.round(ar + (br - ar) * t);
    const g    = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

// progress: 1.0 (full time) → 0.0 (elapsed) — smoothly blue → yellow → red
function lerpTimerColor(progress) {
    if (progress >= 0.5) {
        return hexLerp('#4361ee', '#f4a261', (1 - progress) * 2);
    }
    return hexLerp('#f4a261', '#e63946', (0.5 - progress) * 2);
}

class PomodoroTimer {
    constructor() {
        this.running = false;
        this.interval = null;
        this.audioCtx = null;

        this.prefs = this.loadPrefs();
        this.duration = this.prefs.duration;
        this.timeLeft = this.duration * 60;

        this.initDOM();
        this.restoreTimerState();
        this.applyPrefs();
        this.updateDisplay();
    }

    // ── Preferences ─────────────────────────────────────────────────────────

    loadPrefs() {
        try {
            const saved = localStorage.getItem(PREF_KEY);
            if (saved) {
                return Object.assign(this.defaultPrefs(), JSON.parse(saved));
            }
        } catch (_) { /* ignore */ }
        return this.defaultPrefs();
    }

    defaultPrefs() {
        return {
            duration: 25,
            theme: 'light',
            soundStart: true,
            soundEnd: true,
            soundTick: false
        };
    }

    savePrefs() {
        try {
            localStorage.setItem(PREF_KEY, JSON.stringify(this.prefs));
        } catch (_) { /* ignore */ }
    }

    // ── Timer state persistence ──────────────────────────────────────────────

    saveTimerState() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify({
                timeLeft: this.timeLeft,
                duration: this.duration,
                savedAt: Date.now(),
                wasRunning: this.running
            }));
        } catch (_) { /* ignore */ }
    }

    restoreTimerState() {
        try {
            const raw = localStorage.getItem(STATE_KEY);
            if (!raw) return;
            const state = JSON.parse(raw);
            // Discard saved state if the duration has since been changed
            if (state.duration !== this.duration) return;
            let timeLeft = state.timeLeft;
            if (state.wasRunning) {
                const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
                timeLeft = Math.max(0, timeLeft - elapsed);
            }
            this.timeLeft = timeLeft;
        } catch (_) { /* ignore */ }
    }

    clearTimerState() {
        try {
            localStorage.removeItem(STATE_KEY);
        } catch (_) { /* ignore */ }
    }

    applyPrefs() {
        this.setTheme(this.prefs.theme);

        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes, 10) === this.prefs.duration);
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.prefs.theme);
        });

        document.getElementById('sound-start').checked = this.prefs.soundStart;
        document.getElementById('sound-end').checked = this.prefs.soundEnd;
        document.getElementById('sound-tick').checked = this.prefs.soundTick;
    }

    // ── DOM wiring ───────────────────────────────────────────────────────────

    initDOM() {
        this.card = document.querySelector('.pomodoro-card');

        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.running) return;
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.prefs.duration = minutes;
                this.savePrefs();
                this.duration = minutes;
                this.timeLeft = minutes * 60;
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.clearTimerState();
                this.updateDisplay();
            });
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.prefs.theme = btn.dataset.theme;
                this.savePrefs();
                this.setTheme(btn.dataset.theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Sound toggles
        const soundMap = {
            'sound-start': 'soundStart',
            'sound-end': 'soundEnd',
            'sound-tick': 'soundTick'
        };
        Object.entries(soundMap).forEach(([id, key]) => {
            document.getElementById(id).addEventListener('change', e => {
                this.prefs[key] = e.target.checked;
                this.savePrefs();
            });
        });

        // Controls
        document.getElementById('timer-start').addEventListener('click', () => this.toggleTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
    }

    // ── Timer logic ──────────────────────────────────────────────────────────

    toggleTimer() {
        if (this.running) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.timeLeft === 0) {
            this.timeLeft = this.duration * 60;
        }
        this.running = true;
        document.getElementById('timer-start').textContent = 'Pause';
        if (this.card) this.card.classList.add('session-active');
        this.playSound('start');
        this.saveTimerState();

        this.interval = setInterval(() => {
            this.timeLeft--;
            // Tick sound is gated here to avoid creating AudioContext objects when disabled
            if (this.prefs.soundTick) this.playSound('tick');
            this.updateDisplay();
            this.saveTimerState();
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        this.running = false;
        clearInterval(this.interval);
        document.getElementById('timer-start').textContent = 'Resume';
        if (this.card) this.card.classList.remove('session-active');
        this.saveTimerState();
    }

    resetTimer() {
        this.running = false;
        clearInterval(this.interval);
        this.timeLeft = this.duration * 60;
        document.getElementById('timer-start').textContent = 'Start';
        if (this.card) this.card.classList.remove('session-active');
        this.clearTimerState();
        this.updateDisplay();
    }

    complete() {
        this.running = false;
        clearInterval(this.interval);
        document.getElementById('timer-start').textContent = 'Start';
        if (this.card) this.card.classList.remove('session-active');
        this.clearTimerState();
        this.playSound('end');
        this.updateDisplay();
    }

    // ── Display ──────────────────────────────────────────────────────────────

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const label = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        document.getElementById('timer-time').textContent = label;

        const total = this.duration * 60;
        const progress = total > 0 ? this.timeLeft / total : 1;
        const offset = TIMER_RING_CIRCUMFERENCE * (1 - progress);
        const ring = document.querySelector('.timer-ring-progress');
        ring.style.strokeDashoffset = offset;

        const color = lerpTimerColor(progress);
        ring.style.stroke = color;
        document.getElementById('timer-time').style.color = color;
        if (this.card) this.card.style.setProperty('--timer-color', color);
    }

    // ── Theme ────────────────────────────────────────────────────────────────

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    // ── Audio ────────────────────────────────────────────────────────────────

    getAudioContext() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioCtx;
    }

    playSound(type) {
        try {
            const ctx = this.getAudioContext();
            const now = ctx.currentTime;

            if (type === 'tick') {
                if (!this.prefs.soundTick) return;
                this._tone(ctx, 800, 'sine', 0.08, now, 0.05);
            } else if (type === 'start') {
                if (!this.prefs.soundStart) return;
                [440, 550, 660].forEach((freq, i) => {
                    this._tone(ctx, freq, 'sine', 0.25, now + i * 0.15, 0.2);
                });
            } else if (type === 'end') {
                if (!this.prefs.soundEnd) return;
                [660, 550, 440, 550, 660].forEach((freq, i) => {
                    this._tone(ctx, freq, 'sine', 0.25, now + i * 0.2, 0.25);
                });
            }
        } catch (_) { /* audio not available */ }
    }

    _tone(ctx, frequency, type, volume, startTime, duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = type;
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }
}

// Initialise after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PomodoroTimer());
} else {
    new PomodoroTimer();
}
