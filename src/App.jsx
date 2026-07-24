import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Home as HomeIcon, Bell, RefreshCw, ClipboardList, Clock, FileText, Target, Eye,
  Award, TrendingUp, BarChart2, Plus, Check, X, ChevronRight, ChevronLeft,
  Flame, Coffee, Droplet, BookOpen, Dumbbell, Moon, Sun, Brain, Apple, Music,
  PenTool, Wind, Code2, MoreVertical, Play, Pause, RotateCcw, CheckCircle2,
  Trophy, Zap, Star, User, Circle, PlusCircle, FileSignature, ListChecks,
  CalendarDays, Search, Trash2, Square, Volume2, VolumeX, AlertTriangle, Sprout,
  Minus, Equal, MapPin, Link2, Pencil, ArrowRight, ChevronDown, ChevronUp, NotebookPen, CornerDownRight, Menu,
  LogOut, Loader2, Mail, Lock
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------
   Small className combiner (no external deps)
--------------------------------------------------------- */
function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------------------------------------------------
   DATA / HELPERS
--------------------------------------------------------- */

const ICONS = {
  Droplet, BookOpen, Dumbbell, Moon, Sun, Brain, Apple, Music, PenTool, Wind,
  Coffee, Code2, Flame, Plus, Minus, Equal,
};

const HABIT_CATALOG = [
  { id: "cat-1", name: "Run daily", icon: "Flame" },
  { id: "cat-2", name: "Drink water", icon: "Droplet" },
  { id: "cat-3", name: "Read 20 minutes", icon: "BookOpen" },
  { id: "cat-4", name: "Workout", icon: "Dumbbell" },
  { id: "cat-5", name: "Sleep 8 hours", icon: "Moon" },
  { id: "cat-6", name: "Morning sunlight", icon: "Sun" },
  { id: "cat-7", name: "Meditate", icon: "Brain" },
  { id: "cat-8", name: "Eat healthy", icon: "Apple" },
  { id: "cat-9", name: "Practice instrument", icon: "Music" },
  { id: "cat-10", name: "Journal", icon: "PenTool" },
  { id: "cat-11", name: "Breathing exercise", icon: "Wind" },
  { id: "cat-12", name: "No caffeine after 5pm", icon: "Coffee" },
  { id: "cat-13", name: "Code 30 minutes", icon: "Code2" },
];

// Habit Scorecard categories ("positive"/"negative"/"neutral") mapped to an icon
// so scorecard habits can be shown the same way tracked habits are everywhere else.
const SCORECARD_CATEGORY_ICON = { positive: "Plus", negative: "Minus", neutral: "Equal" };

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function fmtDayLabel(d) {
  return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

function getWeekDates(anchor) {
  const start = new Date(anchor);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthMatrix(anchor) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const start = new Date(year, month, 1 - startDay);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtMonthLabel(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function fmtModalDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function computeStreak(log) {
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = todayKey(cursor);
    if (log[key]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function makeTask(partial) {
  return {
    id: uid("t"),
    listId: "tasks",
    title: "",
    note: "",
    completed: false,
    important: false,
    myDay: false,
    dueDate: null,
    reminder: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    steps: [],
    ...partial,
  };
}

/* ===========================================================
   FOCUS GROVE MAIN — ported as-is from the standalone project.
   Only change made to this block: TypeScript type annotations
   were stripped (this file is .jsx, not .tsx) and each module
   (plants.ts, achievements.ts, store.ts, hooks.ts, sounds.ts,
   PlantSvg.tsx, LeafCoin.tsx) was concatenated into this single
   file instead of living as separate imports. No logic, no
   copy, no styling values, and no structure was altered.
=========================================================== */

/* ---- lib/plants.ts ---- */
const PLANTS = [
  { id: "sprout", name: "Little Sprout", price: 0, description: "Where every forest begins." },
  { id: "fern", name: "Curly Fern", price: 20, description: "Patient, layered, quietly ancient." },
  { id: "sunflower", name: "Sunflower", price: 40, description: "Faces the light — always." },
  { id: "cactus", name: "Round Cactus", price: 60, description: "Thrives in dry, distracted places." },
  { id: "mushroom", name: "Toadstool", price: 80, description: "Grows in the quietest hours." },
  { id: "bonsai", name: "Bonsai", price: 110, description: "A century of focus, in miniature." },
  { id: "lavender", name: "Lavender", price: 130, description: "Smells like a long deep breath." },
  { id: "maple", name: "Maple Sapling", price: 160, description: "Copper leaves, cool head." },
  { id: "pine", name: "Pine", price: 180, description: "Steady through every season." },
  { id: "bamboo", name: "Bamboo", price: 210, description: "Bends without breaking." },
  { id: "cherry", name: "Cherry Blossom", price: 240, description: "Rare, brief, worth the wait." },
  { id: "lotus", name: "Lotus", price: 280, description: "Blooms above the noise." },
];

const PLANT_MAP = Object.fromEntries(PLANTS.map((p) => [p.id, p]));

/* ---- lib/achievements.ts ---- */
const successSessions = (s) => s.sessions.filter((x) => x.status === "success");
const totalMinutes = (s) => successSessions(s).reduce((sum, x) => sum + x.actualMin, 0);

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function longestStreak(sessions) {
  const days = new Set(sessions.filter((s) => s.status === "success").map((s) => dayKey(s.startedAt)));
  if (days.size === 0) return 0;
  const sorted = Array.from(days)
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i] - sorted[i - 1]) / 86_400_000);
    if (diff === 1) cur++;
    else cur = 1;
    if (cur > best) best = cur;
  }
  return best;
}

const ACHIEVEMENTS = [
  { id: "first", name: "First Seed", description: "Complete your first session.", goal: 1, progress: (s) => successSessions(s).length },
  { id: "ten", name: "Sapling", description: "Complete 10 sessions.", goal: 10, progress: (s) => successSessions(s).length },
  { id: "fifty", name: "Grove", description: "Complete 50 sessions.", goal: 50, progress: (s) => successSessions(s).length },
  { id: "hundred", name: "Forest", description: "Complete 100 sessions.", goal: 100, progress: (s) => successSessions(s).length },
  { id: "hour", name: "Deep Focus", description: "Finish one session of 60+ minutes.", goal: 1, progress: (s) => successSessions(s).filter((x) => x.actualMin >= 60).length },
  { id: "twohour", name: "Marathon", description: "Finish one session of 120 minutes.", goal: 1, progress: (s) => successSessions(s).filter((x) => x.actualMin >= 120).length },
  { id: "min1000", name: "1,000 Minutes", description: "Accumulate 1000 focused minutes.", goal: 1000, progress: totalMinutes },
  { id: "min5000", name: "5,000 Minutes", description: "Accumulate 5000 focused minutes.", goal: 5000, progress: totalMinutes },
  { id: "streak3", name: "3-Day Streak", description: "Focus 3 days in a row.", goal: 3, progress: (s) => longestStreak(s.sessions) },
  { id: "streak7", name: "7-Day Streak", description: "Focus 7 days in a row.", goal: 7, progress: (s) => longestStreak(s.sessions) },
  { id: "streak30", name: "30-Day Streak", description: "Focus 30 days in a row.", goal: 30, progress: (s) => longestStreak(s.sessions) },
  { id: "nightowl", name: "Night Owl", description: "Complete a session starting after 10pm.", goal: 1, progress: (s) => successSessions(s).filter((x) => new Date(x.startedAt).getHours() >= 22).length },
  { id: "earlybird", name: "Early Bird", description: "Complete a session starting before 7am.", goal: 1, progress: (s) => successSessions(s).filter((x) => new Date(x.startedAt).getHours() < 7).length },
  { id: "collector", name: "Collector", description: "Unlock every plant.", goal: 12, progress: (s) => s.plants.filter((p) => p.unlocked).length },
  { id: "coins500", name: "Leaf Saver", description: "Accumulate 500 leaf coins in total (lifetime).", goal: 500, progress: (s) => s.sessions.reduce((n, x) => n + x.reward, 0) },
];

/* ---- lib/store.ts (updated to match the newer "grove" project) ---- */
const FOCUS_STORE_KEY = "grove.store.v1";
const focusListeners = new Set();
let focusCache = null;

function focusDefaultState() {
  const plants = PLANTS.map((p, i) => ({ id: p.id, unlocked: p.price === 0, equipped: i === 0 }));
  return {
    coins: 0,
    tasks: [],
    plants,
    sessions: [],
    achievements: [],
    settings: {
      masterVolume: 0.6,
      soundVolumes: { rain: 0.6, forest: 0.6, wind: 0.6 },
      warnOnLeave: true,
      theme: "light",
    },
  };
}

function focusLoad() {
  if (typeof window === "undefined") return focusDefaultState();
  if (focusCache) return focusCache;
  try {
    const raw = window.localStorage.getItem(FOCUS_STORE_KEY);
    if (!raw) {
      focusCache = focusDefaultState();
      return focusCache;
    }
    const parsed = JSON.parse(raw);
    const merged = {
      ...focusDefaultState(),
      ...parsed,
      settings: { ...focusDefaultState().settings, ...(parsed.settings ?? {}) },
    };
    const existingIds = new Set(merged.plants.map((p) => p.id));
    for (const p of PLANTS) {
      if (!existingIds.has(p.id)) {
        merged.plants.push({ id: p.id, unlocked: p.price === 0, equipped: false });
      }
    }
    focusCache = merged;
    return merged;
  } catch {
    focusCache = focusDefaultState();
    return focusCache;
  }
}

function focusPersist(next) {
  focusCache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FOCUS_STORE_KEY, JSON.stringify(next));
  }
  for (const fn of focusListeners) fn();
}

const focusStore = {
  get: () => focusLoad(),
  subscribe(fn) {
    focusListeners.add(fn);
    return () => focusListeners.delete(fn);
  },
  set(update) {
    focusPersist(update(focusLoad()));
  },
  addCoins(n) {
    focusStore.set((s) => ({ ...s, coins: s.coins + n }));
  },
  spendCoins(n) {
    focusStore.set((s) => ({ ...s, coins: Math.max(0, s.coins - n) }));
  },
  unlockPlant(id) {
    focusStore.set((s) => ({ ...s, plants: s.plants.map((p) => (p.id === id ? { ...p, unlocked: true } : p)) }));
  },
  equipPlant(id) {
    focusStore.set((s) => ({ ...s, plants: s.plants.map((p) => ({ ...p, equipped: p.id === id })) }));
  },
  addTask(t) {
    focusStore.set((s) => ({ ...s, tasks: [...s.tasks, t] }));
  },
  removeTask(id) {
    focusStore.set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  updateTask(id, patch) {
    focusStore.set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  },
  addSession(session) {
    focusStore.set((s) => {
      const next = { ...s, sessions: [session, ...s.sessions] };
      next.coins += session.reward;
      const newlyUnlocked = ACHIEVEMENTS.filter(
        (a) => a.progress(next) >= a.goal && !next.achievements.some((x) => x.id === a.id)
      ).map((a) => ({ id: a.id, unlockedAt: Date.now() }));
      if (newlyUnlocked.length) {
        next.achievements = [...next.achievements, ...newlyUnlocked];
      }
      return next;
    });
  },
  updateSettings(patch) {
    focusStore.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  resetAll() {
    focusCache = focusDefaultState();
    if (typeof window !== "undefined") window.localStorage.removeItem(FOCUS_STORE_KEY);
    for (const fn of focusListeners) fn();
  },
  importJson(json) {
    const parsed = JSON.parse(json);
    focusPersist({ ...focusDefaultState(), ...parsed });
  },
  exportJson() {
    return JSON.stringify(focusLoad(), null, 2);
  },
};

/* ---- lib/hooks.ts ---- */
function useFocusStore(select) {
  return React.useSyncExternalStore(
    focusStore.subscribe,
    () => select(focusStore.get()),
    () => select(focusStore.get())
  );
}

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

/* ---- lib/sounds.ts ---- */
let focusAudioCtx = null;
const focusActiveSounds = new Map();

function getFocusAudioCtx() {
  if (!focusAudioCtx) {
    focusAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (focusAudioCtx.state === "suspended") void focusAudioCtx.resume();
  return focusAudioCtx;
}

function makeNoiseBuffer(context, seconds = 4) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function playRain(context, gainOut) {
  const src = context.createBufferSource();
  src.buffer = makeNoiseBuffer(context, 6);
  src.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200;
  const hp = context.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 500;
  src.connect(hp).connect(lp).connect(gainOut);
  src.start();
  return () => src.stop();
}

function playWind(context, gainOut) {
  const src = context.createBufferSource();
  src.buffer = makeNoiseBuffer(context, 8);
  src.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500;
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain).connect(lp.frequency);
  lfo.start();
  src.connect(lp).connect(gainOut);
  src.start();
  return () => {
    src.stop();
    lfo.stop();
  };
}

function playForest(context, gainOut) {
  const src = context.createBufferSource();
  src.buffer = makeNoiseBuffer(context, 8);
  src.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const bgGain = context.createGain();
  bgGain.gain.value = 0.35;
  src.connect(lp).connect(bgGain).connect(gainOut);
  src.start();

  let stopped = false;
  const chirps = [];

  const scheduleChirp = () => {
    if (stopped) return;
    const delay = 800 + Math.random() * 3200;
    const t = window.setTimeout(() => {
      if (stopped) return;
      const osc = context.createOscillator();
      osc.type = "sine";
      const baseFreq = 1400 + Math.random() * 1600;
      osc.frequency.setValueAtTime(baseFreq, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, context.currentTime + 0.08);
      const g = context.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
      osc.connect(g).connect(gainOut);
      osc.start();
      osc.stop(context.currentTime + 0.22);
      scheduleChirp();
    }, delay);
    chirps.push(t);
  };
  scheduleChirp();

  return () => {
    stopped = true;
    src.stop();
    chirps.forEach((t) => clearTimeout(t));
  };
}

const sounds = {
  isPlaying(id) {
    return focusActiveSounds.has(id);
  },
  toggle(id, volume, master) {
    if (focusActiveSounds.has(id)) {
      focusActiveSounds.get(id).stop();
      focusActiveSounds.delete(id);
      return false;
    }
    const context = getFocusAudioCtx();
    const gain = context.createGain();
    gain.gain.value = volume * master;
    gain.connect(context.destination);
    let stop;
    if (id === "rain") stop = playRain(context, gain);
    else if (id === "wind") stop = playWind(context, gain);
    else stop = playForest(context, gain);
    focusActiveSounds.set(id, {
      stop: () => {
        stop();
        gain.disconnect();
      },
      setVolume: (v) => {
        gain.gain.value = v;
      },
    });
    return true;
  },
  setVolume(id, volume, master) {
    const node = focusActiveSounds.get(id);
    if (node) node.setVolume(volume * master);
  },
  setAllMaster(master, perSound) {
    for (const [id, node] of focusActiveSounds) {
      node.setVolume(perSound[id] * master);
    }
  },
  anyPlaying() {
    return focusActiveSounds.size > 0;
  },
  start(id, volume, master) {
    if (focusActiveSounds.has(id)) return;
    sounds.toggle(id, volume, master);
  },
  stop(id) {
    if (focusActiveSounds.has(id)) {
      focusActiveSounds.get(id).stop();
      focusActiveSounds.delete(id);
    }
  },
  stopAll() {
    for (const n of focusActiveSounds.values()) n.stop();
    focusActiveSounds.clear();
  },
};

/* ---- components/PlantSvg.tsx ---- */
function PlantSvg({ id, progress, withered = false, className, size = 220 }) {
  const p = Math.max(0, Math.min(1, progress));
  const stemH = 10 + p * 90;
  const bloomScale = Math.max(0, (p - 0.3) / 0.7);
  const soilY = 180;
  const baseX = 100;
  const color = withered ? "#8a8578" : undefined;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx={baseX} cy={soilY + 6} rx="70" ry="10" fill="var(--leaf-soft)" opacity="0.4" />
      <ellipse cx={baseX} cy={soilY + 4} rx="55" ry="7" fill="var(--bark)" opacity="0.35" />
      <g style={{ transformOrigin: `${baseX}px ${soilY}px` }}>
        <PlantBody id={id} baseX={baseX} soilY={soilY} stemH={stemH} bloomScale={bloomScale} override={color} withered={withered} />
      </g>
    </svg>
  );
}

function PlantBody({ id, baseX, soilY, stemH, bloomScale, override, withered }) {
  const stemColor = override ?? "var(--leaf-deep)";
  const leafColor = override ?? "var(--leaf)";
  const softColor = override ?? "var(--leaf-soft)";
  const topY = soilY - stemH;
  const droop = withered ? 12 : 0;

  const stem = (
    <path
      d={`M ${baseX} ${soilY} Q ${baseX + (withered ? 12 : 3)} ${soilY - stemH / 2} ${baseX + droop} ${topY}`}
      stroke={stemColor}
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
    />
  );

  const bloom = (children) => (
    <g
      style={{
        transform: `translate(${baseX + droop}px, ${topY}px) scale(${bloomScale})`,
        transformOrigin: `${baseX + droop}px ${topY}px`,
      }}
    >
      {children}
    </g>
  );

  switch (id) {
    case "sprout":
      return (
        <>
          {stem}
          {bloom(
            <>
              <ellipse cx={-8} cy={0} rx={12} ry={6} fill={leafColor} transform="rotate(-30)" />
              <ellipse cx={8} cy={0} rx={12} ry={6} fill={leafColor} transform="rotate(30)" />
            </>
          )}
        </>
      );
    case "fern":
      return (
        <>
          {stem}
          {bloom(
            <g>
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i} transform={`translate(0 ${i * 10}) `}>
                  <ellipse cx={-14 - i * 2} cy={0} rx={14} ry={4} fill={leafColor} transform="rotate(-25)" />
                  <ellipse cx={14 + i * 2} cy={0} rx={14} ry={4} fill={leafColor} transform="rotate(25)" />
                </g>
              ))}
            </g>
          )}
        </>
      );
    case "sunflower":
      return (
        <>
          {stem}
          {bloom(
            <g>
              {Array.from({ length: 12 }).map((_, i) => (
                <ellipse key={i} cx={0} cy={-16} rx={7} ry={16} fill="#f2b134" transform={`rotate(${i * 30})`} />
              ))}
              <circle r={11} fill="#5a3820" />
            </g>
          )}
        </>
      );
    case "cactus":
      return (
        <>
          <rect x={baseX - 14} y={soilY - stemH} width={28} height={stemH} rx={12} fill={leafColor} />
          {stemH > 40 && (
            <rect x={baseX + 14} y={soilY - stemH * 0.55} width={16} height={stemH * 0.4} rx={8} fill={leafColor} />
          )}
          {bloom(<circle r={9} fill="#e56b6f" />)}
        </>
      );
    case "mushroom":
      return (
        <>
          <rect x={baseX - 8} y={soilY - stemH * 0.5} width={16} height={stemH * 0.5} rx={4} fill={softColor} />
          {bloom(
            <g>
              <ellipse cx={0} cy={-6} rx={32} ry={20} fill="#c8443c" />
              <circle cx={-14} cy={-10} r={4} fill="#fff" opacity="0.85" />
              <circle cx={8} cy={-4} r={3} fill="#fff" opacity="0.85" />
              <circle cx={16} cy={-14} r={2.5} fill="#fff" opacity="0.85" />
            </g>
          )}
        </>
      );
    case "bonsai":
      return (
        <>
          <path
            d={`M ${baseX} ${soilY} Q ${baseX - 30} ${soilY - stemH * 0.6} ${baseX + 20} ${soilY - stemH}`}
            stroke="#5c3a20"
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
          />
          {bloom(
            <g transform="translate(20 0)">
              <circle cx={-14} cy={-4} r={16} fill={leafColor} />
              <circle cx={12} cy={-6} r={18} fill={leafColor} />
              <circle cx={0} cy={-18} r={14} fill={leafColor} />
            </g>
          )}
        </>
      );
    case "lavender":
      return (
        <>
          {[-14, 0, 14].map((dx) => (
            <path key={dx} d={`M ${baseX + dx} ${soilY} L ${baseX + dx} ${soilY - stemH}`} stroke={stemColor} strokeWidth={2} />
          ))}
          {bloom(
            <g>
              {[-14, 0, 14].map((dx) => (
                <g key={dx} transform={`translate(${dx} 0)`}>
                  {[0, -6, -12, -18].map((dy) => (
                    <circle key={dy} cx={0} cy={dy} r={3.5} fill="#a06cd5" />
                  ))}
                </g>
              ))}
            </g>
          )}
        </>
      );
    case "maple":
      return (
        <>
          <rect x={baseX - 4} y={soilY - stemH} width={8} height={stemH} fill="#6b4423" />
          {bloom(
            <g>
              <circle cx={-16} cy={-6} r={18} fill="#d95d39" />
              <circle cx={14} cy={-6} r={18} fill="#e07a45" />
              <circle cx={0} cy={-20} r={20} fill="#c94c2c" />
            </g>
          )}
        </>
      );
    case "pine":
      return (
        <>
          <rect x={baseX - 4} y={soilY - stemH * 0.3} width={8} height={stemH * 0.3} fill="#6b4423" />
          {bloom(
            <g>
              <polygon points="0,-70 -30,-25 30,-25" fill={leafColor} />
              <polygon points="0,-50 -34,0 34,0" fill={leafColor} />
              <polygon points="0,-30 -40,20 40,20" fill={leafColor} />
            </g>
          )}
        </>
      );
    case "bamboo":
      return (
        <>
          {[-14, 0, 14].map((dx) => (
            <g key={dx}>
              <rect x={baseX + dx - 3} y={soilY - stemH} width={6} height={stemH} fill={leafColor} rx={2} />
              {Array.from({ length: Math.floor(stemH / 20) }).map((_, i) => (
                <rect key={i} x={baseX + dx - 4} y={soilY - stemH + i * 20} width={8} height={2} fill="var(--leaf-deep)" />
              ))}
            </g>
          ))}
          {bloom(
            <g>
              <ellipse cx={-16} cy={-4} rx={16} ry={5} fill={leafColor} transform="rotate(-20)" />
              <ellipse cx={16} cy={-8} rx={16} ry={5} fill={leafColor} transform="rotate(20)" />
              <ellipse cx={0} cy={-14} rx={16} ry={5} fill={leafColor} />
            </g>
          )}
        </>
      );
    case "cherry":
      return (
        <>
          <rect x={baseX - 4} y={soilY - stemH * 0.5} width={8} height={stemH * 0.5} fill="#6b4423" />
          {bloom(
            <g>
              <circle cx={-18} cy={-4} r={20} fill="#f8c8dc" />
              <circle cx={14} cy={-8} r={22} fill="#f8c8dc" />
              <circle cx={-2} cy={-22} r={20} fill="#f5b6cf" />
              <circle cx={-24} cy={-18} r={3} fill="#c94c8a" />
              <circle cx={10} cy={4} r={3} fill="#c94c8a" />
              <circle cx={18} cy={-24} r={3} fill="#c94c8a" />
            </g>
          )}
        </>
      );
    case "lotus":
      return (
        <>
          <rect x={baseX - 3} y={soilY - stemH} width={6} height={stemH} fill={leafColor} />
          {bloom(
            <g>
              {[-40, -20, 0, 20, 40].map((r) => (
                <ellipse key={r} cx={0} cy={-10} rx={9} ry={22} fill="#f8b7c9" transform={`rotate(${r})`} opacity="0.95" />
              ))}
              {[-60, -30, 0, 30, 60].map((r) => (
                <ellipse key={r} cx={0} cy={-4} rx={7} ry={16} fill="#fce4ec" transform={`rotate(${r})`} />
              ))}
              <circle r={5} fill="#f2b134" />
            </g>
          )}
        </>
      );
    default:
      return stem;
  }
}

/* ---- components/LeafCoin.tsx ---- */
function LeafCoin({ className, sway = false }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("inline-block", sway && "leaf-sway", className)} aria-hidden="true">
      <defs>
        <linearGradient id="leaf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--leaf-soft)" />
          <stop offset="60%" stopColor="var(--leaf)" />
          <stop offset="100%" stopColor="var(--leaf-deep)" />
        </linearGradient>
      </defs>
      <path d="M4 26 C 6 12, 18 4, 28 4 C 28 14, 20 26, 6 28 Z" fill="url(#leaf-grad)" stroke="var(--leaf-deep)" strokeWidth="1" />
      <path d="M6 27 C 12 20, 20 12, 27 6" stroke="var(--leaf-deep)" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M12 22 L 14 19 M 16 20 L 18 17 M 20 17 L 22 14" stroke="var(--leaf-deep)" strokeWidth="0.8" fill="none" opacity="0.55" />
    </svg>
  );
}

/* ---- components/TimerWheel.tsx (new in the "grove" replit project) ---- */
const TIMER_WHEEL_START_ANGLE = -90;
const TIMER_WHEEL_SWEEP = 360;

function timerWheelAngleForValue(value, min, max) {
  const frac = (value - min) / (max - min);
  return TIMER_WHEEL_START_ANGLE + frac * TIMER_WHEEL_SWEEP;
}

function timerWheelPolar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const TIMER_WHEEL_DEFAULT_SNAP_POINTS = [10, 15, 25, 30, 45, 60, 90, 120];
const TIMER_WHEEL_SNAP_THRESHOLD = 4;

function TimerWheel({
  size = 320,
  min = 10,
  max = 120,
  step = 5,
  snapPoints = TIMER_WHEEL_DEFAULT_SNAP_POINTS,
  value,
  onChange,
  disabled = false,
  progress,
  children,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const wrapRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const applySnap = useCallback(
    (raw) => {
      const clamped = Math.min(max, Math.max(min, raw));
      let closestSnap = null;
      let closestDist = Infinity;
      for (const sp of snapPoints) {
        if (sp < min || sp > max) continue;
        const dist = Math.abs(clamped - sp);
        if (dist < closestDist) {
          closestDist = dist;
          closestSnap = sp;
        }
      }
      if (closestSnap != null && closestDist <= TIMER_WHEEL_SNAP_THRESHOLD) {
        return closestSnap;
      }
      const stepped = Math.round(clamped / step) * step;
      return Math.min(max, Math.max(min, stepped));
    },
    [max, min, snapPoints, step]
  );

  const valueFromClientPoint = useCallback(
    (clientX, clientY) => {
      const el = wrapRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      const px = clientX - (rect.left + rect.width / 2);
      const py = clientY - (rect.top + rect.height / 2);
      let angle = (Math.atan2(py, px) * 180) / Math.PI;
      let rel = angle - TIMER_WHEEL_START_ANGLE;
      rel = ((rel % 360) + 360) % 360;
      const frac = rel / TIMER_WHEEL_SWEEP;
      const raw = min + frac * (max - min);
      return applySnap(raw);
    },
    [applySnap, max, min]
  );

  const handlePointerMove = useCallback(
    (e) => {
      onChange(valueFromClientPoint(e.clientX, e.clientY));
    },
    [onChange, valueFromClientPoint]
  );

  const stopDragging = useCallback(() => {
    setDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [handlePointerMove]);

  const startDragging = (e) => {
    if (disabled) return;
    e.preventDefault();
    setDragging(true);
    onChange(valueFromClientPoint(e.clientX, e.clientY));
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
  };

  const knobAngle = timerWheelAngleForValue(value, min, max);
  const knobPos = timerWheelPolar(cx, cy, r, knobAngle);
  const trackDash = 2 * Math.PI * r;
  const valueFrac = (value - min) / (max - min);
  const activeFrac = progress != null ? Math.min(1, Math.max(0, progress)) : valueFrac;

  return (
    <div
      ref={wrapRef}
      className={cn("relative select-none", disabled ? "cursor-default" : "cursor-grab", dragging && "cursor-grabbing")}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--wheel-track)" strokeWidth={10} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={progress != null ? "var(--leaf-deep)" : "var(--leaf)"}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${trackDash * activeFrac} ${trackDash}`}
        />
        {!disabled && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="transparent"
            strokeWidth={64}
            style={{ pointerEvents: "stroke", cursor: dragging ? "grabbing" : "grab" }}
            onPointerDown={startDragging}
          />
        )}
      </svg>
      {!disabled && (
        <div
          role="slider"
          aria-label="Session length in minutes"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
          onPointerDown={startDragging}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + step));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(min, value - step));
          }}
          className="absolute flex items-center justify-center rounded-full shadow-md ring-4 transition-transform"
          style={{
            width: 30,
            height: 30,
            left: knobPos.x - 15,
            top: knobPos.y - 15,
            transform: dragging ? "scale(1.15)" : undefined,
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            "--tw-ring-color": "var(--background)",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}



/* ===========================================================
   END FOCUS GROVE LIBRARY (plants/achievements/store/sounds/
   PlantSvg/LeafCoin/TimerWheel — all ported, see note above)
=========================================================== */

/* ---------------------------------------------------------
   PERSISTENCE HELPER
   Same idea as the Grove store above (localStorage-backed),
   but generic so any piece of App state can opt in. Data is
   read once on first render and written back on every change,
   so it survives refreshes / closing the tab on this device.
--------------------------------------------------------- */
const APP_STORE_PREFIX = "loggd.app.v1.";

function loadPersisted(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(APP_STORE_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => loadPersisted(key, initialValue));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(APP_STORE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — fail silently, app still works in-memory
    }
  }, [key, state]);

  return [state, setState];
}

/* ---------------------------------------------------------
   AUTH SCREEN — email/password login + sign up.
   Shown whenever there's no active Supabase session.
--------------------------------------------------------- */
function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError(err.message);
      } else {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) setError(err.message);
        else setNotice("Account created. Check your email to confirm, then log in.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-[720px] w-full items-center justify-center bg-slate-950 px-4 text-slate-200" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500">
            <div className="h-3 w-3 rounded-sm bg-slate-950" />
          </div>
          <span className="text-lg font-semibold text-white">
            Dishant<span className="text-emerald-400">.verse</span>
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex rounded-lg bg-slate-950 p-1 text-sm">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setNotice(""); }}
              className={cn("flex-1 rounded-md py-1.5 font-medium transition-colors", mode === "login" ? "bg-slate-800 text-white" : "text-slate-500")}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(""); setNotice(""); }}
              className={cn("flex-1 rounded-md py-1.5 font-medium transition-colors", mode === "signup" ? "bg-slate-800 text-white" : "text-slate-500")}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
              <Mail size={14} className="text-slate-500" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
              <Lock size={14} className="text-slate-500" />
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-slate-200 outline-none placeholder:text-slate-600"
              />
            </label>

            {error ? <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div> : null}
            {notice ? <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{notice}</div> : null}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Your tasks, habits and contracts sync to your account and follow you across devices.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CLOUD SYNC
   Pulls the signed-in user's saved data down once on login,
   then pushes local changes back up (debounced) so the same
   account sees the same data on any device/browser.
--------------------------------------------------------- */
const CLOUD_SYNC_DEBOUNCE_MS = 1200;

function useCloudSync(userId, bundle, applyBundle) {
  const [cloudReady, setCloudReady] = useState(false);
  const hydrating = useRef(false);
  const saveTimer = useRef(null);

  // Pull down on login
  useEffect(() => {
    if (!userId) {
      setCloudReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      hydrating.current = true;
      const { data, error } = await supabase
        .from("app_data")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data && data.data) {
        applyBundle(data.data);
      } else {
        // First time this account has logged in — seed the cloud row
        // with whatever's currently in local state/defaults.
        await supabase.from("app_data").upsert({ user_id: userId, data: bundle, updated_at: new Date().toISOString() });
      }
      hydrating.current = false;
      setCloudReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Push up on change (debounced), skipped while we're still hydrating
  useEffect(() => {
    if (!userId || !cloudReady || hydrating.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("app_data").upsert({ user_id: userId, data: bundle, updated_at: new Date().toISOString() });
    }, CLOUD_SYNC_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, cloudReady, JSON.stringify(bundle)]);

  return cloudReady;
}

/* ---------------------------------------------------------
   ROOT APP
--------------------------------------------------------- */

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex h-full min-h-[720px] w-full items-center justify-center bg-slate-950 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <AppShell
      key={session.user.id}
      userId={session.user.id}
      userEmail={session.user.email}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}

function AppShell({ userId, userEmail, onSignOut }) {
  const [view, setView] = useState("home");

  /* ---------- Tasks + Lists (shared across Home / Tasks / Focus Session) ---------- */
  const [lists, setLists] = usePersistentState("lists", [{ id: "tasks", name: "Tasks", emoji: "🏠" }]);
  const [tasks, setTasks] = usePersistentState("tasks", [
    makeTask({ title: "Set up my workspace", myDay: true }),
    makeTask({ title: "Plan tomorrow's priorities", myDay: true, important: true }),
  ]);

  // Habits (tracked / picked from scorecard)
  const [trackedHabits, setTrackedHabits] = usePersistentState("trackedHabits", [
    { id: uid("hab"), catalogId: "cat-1", name: "Run daily", icon: "Flame", log: {} },
  ]);

  // Habit Scorecard's own habit list (the "field ledger" entries logged in
  // the Habit Scorecard section) — lifted here so Home/Habits can offer them
  // in the "+ Add Habit" picker and track them.
  const [scorecardHabits, setScorecardHabits] = usePersistentState("scorecardHabits", []);

  // Habit contracts
  const [contracts, setContracts] = usePersistentState("contracts", [
    { id: uid("con"), name: "No sugar for 21 days", active: true, log: {}, createdAt: Date.now() },
  ]);

  // Reflection
  const [reflection, setReflection] = usePersistentState("reflection", { text: "", mood: null });

  // Notifications
  const [notifications, setNotifications] = usePersistentState("notifications", [
    { id: uid("n"), type: "welcome", title: "Welcome to Dishant.verse", desc: "Start tracking your day to earn XP and build streaks.", xp: null, ts: Date.now() - 1000 * 60 * 60 * 20, unread: true },
  ]);

  /* ---------- Cloud sync (Supabase) ----------
     Bundles the persisted pieces of state together, pulls them down
     once on login, and pushes changes back up (debounced) so the
     same account sees the same data on any device. */
  const cloudBundle = useMemo(
    () => ({ lists, tasks, trackedHabits, scorecardHabits, contracts, reflection, notifications }),
    [lists, tasks, trackedHabits, scorecardHabits, contracts, reflection, notifications]
  );
  const applyCloudBundle = useCallback((data) => {
    if (!data) return;
    if (data.lists) setLists(data.lists);
    if (data.tasks) setTasks(data.tasks);
    if (data.trackedHabits) setTrackedHabits(data.trackedHabits);
    if (data.scorecardHabits) setScorecardHabits(data.scorecardHabits);
    if (data.contracts) setContracts(data.contracts);
    if (data.reflection) setReflection(data.reflection);
    if (data.notifications) setNotifications(data.notifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useCloudSync(userId, cloudBundle, applyCloudBundle);

  const pushNotification = (n) =>
    setNotifications((prev) => [{ id: uid("n"), ts: Date.now(), unread: true, ...n }, ...prev]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  /* ---------- Task actions ---------- */
  const addTask = (title, opts = {}) => {
    if (!title.trim()) return;
    const t = makeTask({ title: title.trim(), myDay: true, ...opts });
    setTasks((prev) => [t, ...prev]);
    return t.id;
  };

  const updateTask = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const toggleTaskComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        if (completed) {
          pushNotification({ type: "task", title: "Task Complete!", desc: `You completed '${t.title}'! +5 points`, xp: 5 });
        }
        return { ...t, completed, completedAt: completed ? new Date().toISOString() : null };
      })
    );
  };

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addStep = (taskId, title) => {
    const step = { id: uid("s"), title, completed: false };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, steps: [...t.steps, step] } : t)));
  };
  const toggleStep = (taskId, stepId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s)) }
          : t
      )
    );
  };
  const deleteStep = (taskId, stepId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) } : t)));
  };

  const addList = (name) => {
    const l = { id: uid("list"), name, emoji: "📋" };
    setLists((prev) => [...prev, l]);
    return l.id;
  };
  const deleteList = (id) => {
    if (id === "tasks") return;
    setLists((prev) => prev.filter((l) => l.id !== id));
    setTasks((prev) => prev.filter((t) => t.listId !== id));
  };
  const renameList = (id, name) => setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));

  /* ---------- Habit actions ---------- */
  const addHabitFromCatalog = (catalogHabit) => {
    if (trackedHabits.some((h) => h.catalogId === catalogHabit.id)) return;
    setTrackedHabits((prev) => [...prev, { id: uid("hab"), catalogId: catalogHabit.id, name: catalogHabit.name, icon: catalogHabit.icon, log: {} }]);
    pushNotification({ type: "habit_added", title: "Habit Added", desc: `'${catalogHabit.name}' is now being tracked.`, xp: null });
  };

  const toggleHabitToday = (id) => {
    setTrackedHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const key = todayKey();
        const nowDone = !h.log[key];
        const newLog = { ...h.log, [key]: nowDone };
        if (nowDone) {
          const streak = computeStreak(newLog);
          pushNotification({ type: "habit", title: "Habit Logged!", desc: `You checked off '${h.name}'. Streak: ${streak} day${streak === 1 ? "" : "s"}.`, xp: 4 });
          if (streak === 3 || streak === 7 || streak === 30) {
            pushNotification({ type: "badge", title: "Streak Milestone!", desc: `'${h.name}' hit a ${streak}-day streak. +10 points`, xp: 10 });
          }
        }
        return { ...h, log: newLog };
      })
    );
  };

  /* ---------- Contract actions ---------- */
  const addContract = (name) => {
    if (!name.trim()) return;
    setContracts((prev) => [{ id: uid("con"), name: name.trim(), active: true, log: {}, createdAt: Date.now() }, ...prev]);
    pushNotification({ type: "contract_start", title: "Habit Contract Started", desc: `You started the contract '${name.trim()}'.`, xp: null });
  };

  const toggleContractToday = (id) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const key = todayKey();
        const nowDone = !c.log[key];
        const newLog = { ...c.log, [key]: nowDone };
        if (nowDone) {
          pushNotification({ type: "contract_log", title: "Contract Logged", desc: `Logged today for '${c.name}'.`, xp: 6 });
        }
        return { ...c, log: newLog };
      })
    );
  };

  const endContract = (id) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        pushNotification({ type: "contract_end", title: "Habit Contract Ended", desc: `'${c.name}' has ended.`, xp: null });
        return { ...c, active: false };
      })
    );
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ctx = {
    view, setView,
    lists, addList, deleteList, renameList,
    tasks, addTask, updateTask, toggleTaskComplete, deleteTask, addStep, toggleStep, deleteStep,
    trackedHabits, addHabitFromCatalog, toggleHabitToday,
    scorecardHabits, setScorecardHabits,
    contracts, addContract, toggleContractToday, endContract,
    reflection, setReflection,
    notifications, unreadCount, markAllRead, pushNotification,
    mobileNavOpen, setMobileNavOpen,
    userEmail, onSignOut,
  };

  return (
    <div className="flex h-full min-h-[720px] w-full bg-slate-950 text-slate-200" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <style>{`
        button:not(:disabled) { cursor: pointer; }
        [role="button"] { cursor: pointer; }

        /* Grove theme tokens — retuned to match this app's dark slate +
           emerald theme (see bg-slate-950 / emerald-500 elsewhere in the
           app). Leaf/bark/wheel-track tones are left as natural
           green/brown since they render the actual growing-tree
           illustration, not surrounding UI chrome. */
        .focus-grove-theme {
          --radius: 0.5rem;
          --leaf: #6fa06a;
          --leaf-deep: #3f6b45;
          --leaf-soft: #a8cf9e;
          --bark: #7a5b3d;
          --wheel-track: #1e293b;
          --success: #34d399;
          --broken: #f87171;
          --background: #020617;
          --foreground: #f1f5f9;
          --card: #0f172a;
          --card-foreground: #f1f5f9;
          --primary: #10b981;
          --primary-foreground: #022c22;
          --secondary: #1e293b;
          --secondary-foreground: #e2e8f0;
          --muted-foreground: #94a3b8;
          --accent: #334155;
          --accent-foreground: #f1f5f9;
          --destructive: #f87171;
          --destructive-foreground: #450a0a;
          --border: #1e293b;
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        }
        .focus-grove-theme .font-display {
          font-family: "Fraunces", ui-serif, Georgia, serif;
          letter-spacing: -0.01em;
        }
        @keyframes leaf-sway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        .leaf-sway { animation: leaf-sway 2.4s ease-in-out infinite; transform-origin: 50% 90%; }
        @keyframes fg-fade-scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .fg-plant-enter { animation: fg-fade-scale-in 0.4s ease both; }
        @keyframes fg-reward-in {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fg-reward-pop { animation: fg-reward-in 0.35s ease both; }
        @keyframes fg-banner-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fg-banner-in { animation: fg-banner-in 0.25s ease both; }
      `}</style>
      <Sidebar ctx={ctx} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top bar: hamburger to open the nav drawer, since the
            sidebar is hidden below the md breakpoint (see Sidebar). Without
            this there'd be no way to switch sections on a phone. */}
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-slate-900"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-[15px] font-semibold text-white">
            Dishant<span className="text-emerald-400">.verse</span>
          </span>
        </div>
        <div className={cn("min-w-0 flex-1", view === "tasks" || view === "goals" ? "overflow-hidden" : "overflow-y-auto")}>
          {view === "home" && <HomeView ctx={ctx} />}
          {view === "notifications" && <NotificationsView ctx={ctx} />}
          {view === "habits" && <HabitsView ctx={ctx} />}
          {view === "tasks" && <TasksView ctx={ctx} />}
          {view === "focus" && <FocusSessionView ctx={ctx} />}
          {view === "goals" && <GoalsView />}
          {view === "habitScorecard" && <HabitScorecard ctx={ctx} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   OUTER APP SIDEBAR (loggd.life nav)
--------------------------------------------------------- */

function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }`}
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Sidebar({ ctx }) {
  const { view, setView, unreadCount, mobileNavOpen, setMobileNavOpen, userEmail, onSignOut } = ctx;

  // Below md, this same nav becomes a slide-out drawer (triggered by the
  // hamburger button in the mobile top bar) instead of a permanent column,
  // so the vertical divider between nav and content no longer eats into
  // the content width on small screens.
  const goTo = (v) => {
    setView(v);
    setMobileNavOpen(false);
  };

  const navBody = (
    <>
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500">
          <div className="h-2.5 w-2.5 rounded-sm bg-slate-950" />
        </div>
        <span className="text-[15px] font-semibold text-white">
          Dishant<span className="text-emerald-400">.verse</span>
        </span>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 md:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <NavItem icon={HomeIcon} label="Home" active={view === "home"} onClick={() => goTo("home")} />
        <NavItem icon={Bell} label="Notifications" active={view === "notifications"} onClick={() => goTo("notifications")} badge={unreadCount || null} />
      </div>

      <div className="mb-1 mt-5 px-2 text-[11px] font-semibold tracking-wider text-slate-600">TRACK</div>
      <div className="flex flex-col gap-0.5">
        <NavItem icon={RefreshCw} label="Habits" active={view === "habits"} onClick={() => goTo("habits")} />
        <NavItem icon={ClipboardList} label="Tasks" active={view === "tasks"} onClick={() => goTo("tasks")} />
        <NavItem icon={Clock} label="Focus Session" active={view === "focus"} onClick={() => goTo("focus")} />
        <NavItem icon={ListChecks} label="Habit Scorecard" active={view === "habitScorecard"} onClick={() => goTo("habitScorecard")} />
        <NavItem icon={FileText} label="Notes" active={false} onClick={() => {}} />
      </div>

      <div className="mb-1 mt-5 px-2 text-[11px] font-semibold tracking-wider text-slate-600">PLAN</div>
      <div className="flex flex-col gap-0.5">
        <NavItem icon={Target} label="Goals" active={view === "goals"} onClick={() => goTo("goals")} />
        <NavItem icon={Eye} label="Vision" active={false} onClick={() => {}} />
      </div>

      <div className="my-3 border-t border-slate-800" />
      <div className="flex flex-col gap-0.5">
        <NavItem icon={Award} label="Badges" active={false} onClick={() => {}} />
        <NavItem icon={TrendingUp} label="Leaderboard" active={false} onClick={() => {}} />
        <NavItem icon={BarChart2} label="Analytics" active={false} onClick={() => {}} />
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
          <User size={14} />
        </div>
        <span className="flex-1 truncate" title={userEmail || ""}>{userEmail || "@you"}</span>
        {onSignOut ? (
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut size={14} />
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: permanent column, always visible */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-3 py-4 md:flex">
        {navBody}
      </aside>

      {/* Mobile: slide-out drawer, only mounted in the DOM while open so it
          never reserves layout width and never clips page content */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col border-r border-slate-800 bg-slate-950 px-3 py-4 shadow-xl">
            {navBody}
          </aside>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------
   SHARED UI BITS (dark theme, used by Home/Habits/Notifications/etc)
--------------------------------------------------------- */

function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
            {Icon && <Icon size={16} className="text-slate-400" />}
            {title}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function LinkBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
      {children}
    </button>
  );
}

function TaskRow({ task, onToggle, onStar }) {
  return (
    <div
      onClick={() => onToggle(task.id)}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-800/50"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
          task.completed ? "border-emerald-500 bg-emerald-500" : "border-slate-600 hover:border-emerald-500"
        }`}
      >
        {task.completed && <Check size={11} className="text-slate-950" strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-sm ${task.completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
        {task.title}
      </span>
      {onStar && (
        <button onClick={(e) => { e.stopPropagation(); onStar(task.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Star size={14} className={task.important ? "fill-amber-400 text-amber-400 opacity-100" : "text-slate-600"} />
        </button>
      )}
    </div>
  );
}

function AddTaskInline({ onAdd, placeholder = "Add Task" }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = () => {
    if (val.trim()) {
      onAdd(val);
      setVal("");
    }
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <Plus size={14} /> {placeholder}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setOpen(false); setVal(""); }
        }}
        onBlur={submit}
        placeholder="Task name..."
        className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MONTH CALENDAR (whole-month track record)
--------------------------------------------------------- */

function MonthCalendar({ ctx }) {
  const { tasks, toggleTaskComplete } = ctx;
  const [anchor, setAnchor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const today = new Date();

  const matrix = useMemo(() => getMonthMatrix(anchor), [anchor]);
  const monthIndex = anchor.getMonth();

  const tasksForDay = (d) => tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), d));

  const daysWithTasks = useMemo(() => {
    return matrix
      .filter((d) => d.getMonth() === monthIndex)
      .map((d) => ({ date: d, dayTasks: tasksForDay(d) }))
      .filter((x) => x.dayTasks.length > 0);
  }, [matrix, monthIndex, tasks]);

  const perfectDays = daysWithTasks.filter((x) => x.dayTasks.every((t) => t.completed)).length;
  const avg =
    daysWithTasks.length === 0
      ? 0
      : Math.round(
          daysWithTasks.reduce(
            (sum, x) => sum + (x.dayTasks.filter((t) => t.completed).length / x.dayTasks.length) * 100,
            0
          ) / daysWithTasks.length
        );

  const goPrev = () =>
    setAnchor((a) => {
      const d = new Date(a);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  const goNext = () =>
    setAnchor((a) => {
      const d = new Date(a);
      d.setMonth(d.getMonth() + 1);
      return d;
    });

  const selectedTasks = selectedDate ? tasksForDay(selectedDate) : [];

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={goPrev} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">{fmtMonthLabel(anchor)}</h2>
          <div className="mt-1 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> {perfectDays} perfect days
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <BarChart2 className="h-3.5 w-3.5" /> {avg}% avg
            </span>
          </div>
        </div>
        <button onClick={goNext} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-slate-500">
        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {matrix.map((d, i) => {
          const inMonth = d.getMonth() === monthIndex;
          const dayTasks = tasksForDay(d);
          const hasTasks = dayTasks.length > 0;
          const completedCount = dayTasks.filter((t) => t.completed).length;
          const pct = hasTasks ? Math.round((completedCount / dayTasks.length) * 100) : null;
          const isToday = isSameDay(d, today);
          const isFuture = d > today && !isToday;
          const clickable = hasTasks;

          return (
            <button
              key={i}
              onClick={() => clickable && setSelectedDate(d)}
              disabled={!clickable}
              className={cn(
                "flex min-h-[84px] flex-col items-start rounded-lg border p-2 text-left transition-colors",
                !inMonth && "opacity-40",
                isToday ? "border-blue-500" : "border-slate-800",
                hasTasks && pct === 100 && "border-emerald-500 bg-emerald-500/10",
                hasTasks && pct !== 100 && "bg-slate-900/40",
                clickable ? "cursor-pointer hover:border-slate-600" : "cursor-default"
              )}
            >
              <div className="mb-1 flex w-full items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday ? "text-blue-400" : inMonth ? "text-slate-300" : "text-slate-700"
                  )}
                >
                  {d.getDate()}
                </span>
                {hasTasks && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      pct === 100 ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-300"
                    )}
                  >
                    {pct}%
                  </span>
                )}
              </div>
              {hasTasks ? (
                <div className="flex w-full items-center gap-1 truncate text-[11px] text-slate-400">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                      pct === 100 ? "bg-emerald-500" : "bg-slate-600"
                    )}
                  />
                  <span className="truncate">{dayTasks[0].title}</span>
                </div>
              ) : isFuture && inMonth ? (
                <span className="text-[11px] italic text-slate-600">No plans</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <Modal title={fmtModalDate(selectedDate)} onClose={() => setSelectedDate(null)}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              <ClipboardList className="h-4 w-4" /> Tasks
            </div>
            <span
              className={cn(
                "text-xs font-semibold",
                selectedTasks.length > 0 && selectedTasks.every((t) => t.completed) ? "text-emerald-400" : "text-slate-400"
              )}
            >
              {selectedTasks.filter((t) => t.completed).length}/{selectedTasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {selectedTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskComplete(t.id)}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-slate-800/50"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors",
                    t.completed ? "border-emerald-500 bg-emerald-500" : "border-slate-600 hover:border-emerald-500"
                  )}
                >
                  {t.completed && <Check className="h-3 w-3 text-slate-950" strokeWidth={3} />}
                </span>
                <span className={cn("text-sm", t.completed ? "text-slate-500 line-through" : "text-slate-200")}>
                  {t.title}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   HOME VIEW
--------------------------------------------------------- */

function HomeView({ ctx }) {
  const { tasks, addTask, toggleTaskComplete, setView } = ctx;
  const { trackedHabits, toggleHabitToday, addHabitFromCatalog } = ctx;
  const { scorecardHabits } = ctx;
  const { contracts, toggleContractToday } = ctx;
  const { reflection, setReflection } = ctx;

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [calMode, setCalMode] = useState("week");
  const today = new Date();
  const week = useMemo(() => getWeekDates(today), []);
  const tKey = todayKey();

  const myDayTasks = tasks.filter((t) => t.myDay);
  const availableCatalog = scorecardHabits
    .filter((h) => !trackedHabits.some((th) => th.catalogId === h.id))
    .map((h) => ({ id: h.id, name: h.name, icon: SCORECARD_CATEGORY_ICON[h.category] || "Flame" }));
  const activeContracts = contracts.filter((c) => c.active);

  return (
    <div className="mx-auto max-w-5xl px-8 py-6">
      {/* Header / date strip */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setCalMode("week")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${calMode === "week" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            Week
          </button>
          <button
            onClick={() => setCalMode("month")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${calMode === "month" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            Month
          </button>
        </div>
      </div>

      {calMode === "month" ? (
        <MonthCalendar ctx={ctx} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-8 gap-2">
            {week.map((d, i) => {
              const isToday = todayKey(d) === tKey;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center rounded-lg border py-2 text-center ${
                    isToday ? "border-blue-500 bg-blue-500 text-white" : "border-slate-800 bg-slate-900/60 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-medium tracking-wide">{fmtDayLabel(d)}</div>
                  <div className="text-lg font-semibold">{d.getDate()}</div>
                  {isToday && <div className="text-[9px] font-medium">TODAY</div>}
                </div>
              );
            })}
            <button className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300">
              <span className="text-[10px]">MORE</span>
            </button>
          </div>

      {/* Grid: Tasks / Reflection / Habits / Contracts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tasks */}
        <Card
          title="Tasks"
          icon={ClipboardList}
          action={<LinkBtn onClick={() => setView("tasks")}>Manage</LinkBtn>}
        >
          <div className="mb-2 flex flex-col">
            {myDayTasks.length === 0 && (
              <p className="py-3 text-center text-sm text-slate-500">No tasks for today</p>
            )}
            {myDayTasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={toggleTaskComplete} />
            ))}
          </div>
          <div className="mt-1 border-t border-slate-800 pt-2">
            <AddTaskInline onAdd={(title) => addTask(title, { myDay: true })} placeholder="Add Task" />
          </div>
        </Card>

        {/* Reflection */}
        <Card title="Reflection" icon={Moon}>
          <textarea
            value={reflection.text}
            onChange={(e) => setReflection((r) => ({ ...r, text: e.target.value }))}
            placeholder="How did today go? Wins, challenges, thoughts..."
            rows={3}
            className="mb-3 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-600"
          />
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium tracking-wide text-slate-500">
            <span>TODAY'S MOOD</span>
            <span>Tap to select</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const hue = 0 + (n - 1) * 13;
              const selected = reflection.mood === n;
              return (
                <button
                  key={n}
                  onClick={() => setReflection((r) => ({ ...r, mood: n }))}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white transition-transform"
                  style={{
                    backgroundColor: `hsl(${hue}, 70%, ${selected ? 45 : 35}%)`,
                    outline: selected ? "2px solid white" : "none",
                    outlineOffset: 1,
                    transform: selected ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>Rough</span>
            <span>Amazing</span>
          </div>
        </Card>

        {/* Habits */}
        <Card
          title="Habits"
          icon={RefreshCw}
          action={
            <button
              onClick={() => setShowHabitModal(true)}
              className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
            >
              <Plus size={12} /> Add Habit
            </button>
          }
        >
          <div className="flex flex-col">
            {trackedHabits.length === 0 && (
              <p className="py-3 text-center text-sm text-slate-500">No habits yet</p>
            )}
            {trackedHabits.map((h) => {
              const Icon = ICONS[h.icon] || Flame;
              const done = !!h.log[tKey];
              const streak = computeStreak(h.log);
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHabitToday(h.id)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-800/50"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHabitToday(h.id); }}
                    className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                      done ? "border-emerald-500 bg-emerald-500" : "border-slate-600 hover:border-emerald-500"
                    }`}
                  >
                    {done && <Check size={11} className="text-slate-950" strokeWidth={3} />}
                  </button>
                  <Icon size={14} className="text-slate-500" />
                  <span className={`flex-1 text-sm ${done ? "text-slate-500" : "text-slate-200"}`}>{h.name}</span>
                  <span className="flex items-center gap-1 text-xs text-orange-400">
                    <Flame size={12} /> {streak}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Habit Contracts */}
        <Card
          title="Habit Contracts"
          icon={FileSignature}
          action={<LinkBtn onClick={() => setView("goals")}>Manage</LinkBtn>}
        >
          <div className="flex flex-col gap-1">
            {activeContracts.length === 0 && (
              <p className="py-3 text-center text-sm text-slate-500">No active contracts</p>
            )}
            {activeContracts.map((c) => {
              const done = !!c.log[tKey];
              const streak = computeStreak(c.log);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-200">{c.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-orange-400">
                      <Flame size={11} /> {streak} day streak
                    </span>
                  </div>
                  <button
                    onClick={() => toggleContractToday(c.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      done ? "bg-emerald-500 text-slate-950" : "border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
                    }`}
                  >
                    {done ? "Logged" : "Log Today"}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
        </>
      )}

      {showHabitModal && (
        <Modal title="Add a habit from your scorecard" onClose={() => setShowHabitModal(false)}>
          <div className="flex flex-col gap-1">
            {availableCatalog.length === 0 && (
              <p className="py-3 text-center text-sm text-slate-500">
                {scorecardHabits.length === 0
                  ? "No habits in your scorecard yet — log one there first."
                  : "All scorecard habits are already tracked."}
              </p>
            )}
            {availableCatalog.map((c) => {
              const Icon = ICONS[c.icon] || Flame;
              return (
                <button
                  key={c.id}
                  onClick={() => { addHabitFromCatalog(c); setShowHabitModal(false); }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-800"
                >
                  <Icon size={15} className="text-slate-400" />
                  <span className="flex-1 text-sm text-slate-200">{c.name}</span>
                  <Plus size={14} className="text-slate-500" />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   NOTIFICATIONS VIEW
--------------------------------------------------------- */

const NOTIF_ICON = {
  welcome: { icon: Zap, color: "text-blue-400 bg-blue-500/10" },
  task: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  habit: { icon: RefreshCw, color: "text-emerald-400 bg-emerald-500/10" },
  habit_added: { icon: Plus, color: "text-blue-400 bg-blue-500/10" },
  badge: { icon: Trophy, color: "text-amber-400 bg-amber-500/10" },
  contract_start: { icon: FileSignature, color: "text-blue-400 bg-blue-500/10" },
  contract_end: { icon: FileSignature, color: "text-slate-400 bg-slate-500/10" },
  contract_log: { icon: FileSignature, color: "text-emerald-400 bg-emerald-500/10" },
  focus: { icon: Clock, color: "text-purple-400 bg-purple-500/10" },
};

function NotificationsView({ ctx }) {
  const { notifications, markAllRead } = ctx;
  const [tab, setTab] = useState("all");
  const unread = notifications.filter((n) => n.unread);
  const shown = tab === "unread" ? unread : notifications;

  return (
    <div className="mx-auto max-w-3xl px-8 py-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-800 p-0.5">
            <button onClick={() => setTab("all")} className={`rounded-md px-2.5 py-1 text-xs ${tab === "all" ? "bg-slate-800 text-white" : "text-slate-500"}`}>All</button>
            <button onClick={() => setTab("unread")} className={`rounded-md px-2.5 py-1 text-xs ${tab === "unread" ? "bg-slate-800 text-white" : "text-slate-500"}`}>Unread</button>
          </div>
          <button onClick={markAllRead} className="text-xs text-blue-400 hover:underline">Mark all read</button>
        </div>
      </div>
      <p className="mb-5 text-sm text-slate-500">{unread.length} unread</p>

      <div className="flex flex-col gap-2">
        {shown.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Nothing here yet.</p>}
        {shown.map((n) => {
          const meta = NOTIF_ICON[n.type] || NOTIF_ICON.task;
          const Icon = meta.icon;
          return (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                <Icon size={15} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  <span className="text-sm font-semibold text-white">{n.title}</span>
                </div>
                <p className="text-sm text-slate-400">{n.desc}</p>
                <span className="text-[11px] text-slate-600">{timeAgo(n.ts)}</span>
              </div>
              {n.xp != null && (
                <span className="flex-shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  +{n.xp} XP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   HABITS VIEW
--------------------------------------------------------- */

function HabitsView({ ctx }) {
  const { trackedHabits, toggleHabitToday, addHabitFromCatalog } = ctx;
  const { scorecardHabits } = ctx;
  const [mode, setMode] = useState("cards");
  const [showModal, setShowModal] = useState(false);
  const week = useMemo(() => getWeekDates(new Date()), []);
  const tKey = todayKey();
  const availableCatalog = scorecardHabits
    .filter((h) => !trackedHabits.some((th) => th.catalogId === h.id))
    .map((h) => ({ id: h.id, name: h.name, icon: SCORECARD_CATEGORY_ICON[h.category] || "Flame" }));

  return (
    <div className="mx-auto max-w-5xl px-8 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">Habits</h1>
            <span className="text-sm text-slate-500">{trackedHabits.length}/{scorecardHabits.length}</span>
          </div>
          <p className="text-sm text-slate-500">Build consistency with daily habits</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 p-0.5">
            <button onClick={() => setMode("cards")} className={`rounded-md px-2.5 py-1 text-xs ${mode === "cards" ? "bg-slate-800 text-white" : "text-slate-500"}`}>Cards</button>
            <button onClick={() => setMode("weekly")} className={`rounded-md px-2.5 py-1 text-xs ${mode === "weekly" ? "bg-slate-800 text-white" : "text-slate-500"}`}>Weekly</button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-emerald-500 hover:text-emerald-400"
          >
            <Plus size={14} /> New Habit
          </button>
        </div>
      </div>

      {trackedHabits.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center text-sm text-slate-500">
          No habits yet — add one from your scorecard to start tracking.
        </div>
      )}

      {mode === "weekly" && trackedHabits.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="grid grid-cols-[1fr_repeat(7,44px)_44px] items-center border-b border-slate-800 px-3 py-2 text-[11px] font-medium tracking-wide text-slate-500">
            <div>HABIT</div>
            {week.map((d, i) => (
              <div key={i} className={`text-center ${todayKey(d) === tKey ? "text-blue-400" : ""}`}>{fmtDayLabel(d)}<br/>{d.getDate()}</div>
            ))}
            <div />
          </div>
          {trackedHabits.map((h) => {
            const Icon = ICONS[h.icon] || Flame;
            const streak = computeStreak(h.log);
            return (
              <div key={h.id} className="grid grid-cols-[1fr_repeat(7,44px)_44px] items-center px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Icon size={14} className="text-slate-500" /> {h.name}
                </div>
                {week.map((d, i) => {
                  const key = todayKey(d);
                  const done = !!h.log[key];
                  const isToday = key === tKey;
                  return (
                    <div key={i} className="flex justify-center">
                      <button
                        onClick={() => isToday && toggleHabitToday(h.id)}
                        disabled={!isToday}
                        className={`h-6 w-6 rounded-md border flex items-center justify-center ${
                          done ? "border-emerald-500 bg-emerald-500" : isToday ? "border-blue-500" : "border-slate-800"
                        } ${!isToday ? "opacity-50" : "cursor-pointer"}`}
                      >
                        {done && <Check size={12} className="text-slate-950" strokeWidth={3} />}
                      </button>
                    </div>
                  );
                })}
                <div className="flex items-center justify-center gap-1 text-xs text-orange-400">
                  <Flame size={12} /> {streak}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === "cards" && trackedHabits.length > 0 && (
        <div className="flex flex-col gap-3">
          {trackedHabits.map((h) => {
            const Icon = ICONS[h.icon] || Flame;
            const streak = computeStreak(h.log);
            const done = !!h.log[tKey];
            return (
              <div key={h.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => toggleHabitToday(h.id)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        done ? "border-emerald-500 bg-emerald-500" : "border-slate-600"
                      }`}
                    >
                      {done && <Check size={13} className="text-slate-950" strokeWidth={3} />}
                    </button>
                    <Icon size={15} className="text-slate-400" />
                    <div>
                      <div className="text-sm font-semibold text-white">{h.name}</div>
                      <div className="text-xs text-slate-500">Daily</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400">
                      <Flame size={12} /> {streak}
                    </span>
                    <span className="text-xs text-slate-500">{Object.values(h.log).filter(Boolean).length} days</span>
                    <MoreVertical size={15} className="text-slate-600" />
                  </div>
                </div>
                <div className="text-[11px] text-slate-600">Last 365 days</div>
                <div className="mt-1 flex flex-wrap gap-[3px]">
                  {Array.from({ length: 52 }, (_, i) => (
                    <div key={i} className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="Choose a habit from your scorecard" onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-1">
            {availableCatalog.length === 0 && (
              <p className="py-3 text-center text-sm text-slate-500">
                {scorecardHabits.length === 0
                  ? "No habits in your scorecard yet — log one there first."
                  : "All scorecard habits are already tracked."}
              </p>
            )}
            {availableCatalog.map((c) => {
              const Icon = ICONS[c.icon] || Flame;
              return (
                <button
                  key={c.id}
                  onClick={() => { addHabitFromCatalog(c); setShowModal(false); }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-800"
                >
                  <Icon size={15} className="text-slate-400" />
                  <span className="flex-1 text-sm text-slate-200">{c.name}</span>
                  <Plus size={14} className="text-slate-500" />
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===========================================================
   TASKS VIEW — exact clone of the "To Do Delight" template
   (Microsoft To Do–style: own sidebar, task list, details panel)
   Recolored from CSS-variable tokens to concrete light-theme
   Tailwind classes; wired to shared ctx state instead of its
   own localStorage store, so it stays in sync with Home and
   Focus Session.
=========================================================== */

function todayHeader() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const smartMeta = {
  myday: { title: "My Day", subtitle: todayHeader(), icon: <Sun className="h-6 w-6" />, accent: "text-amber-500" },
  important: { title: "Important", icon: <Star className="h-6 w-6" />, accent: "text-amber-400" },
  planned: { title: "Planned", icon: <CalendarDays className="h-6 w-6" />, accent: "text-rose-500" },
  all: { title: "All", icon: <ListChecks className="h-6 w-6" />, accent: "text-sky-500" },
  completed: { title: "Completed", icon: <ListChecks className="h-6 w-6" />, accent: "text-emerald-500" },
  tasks: { title: "Tasks", icon: <HomeIcon className="h-6 w-6" />, accent: "text-emerald-400" },
};

function TasksView({ ctx }) {
  const store = ctx; // addTask, updateTask, toggleTaskComplete, deleteTask, addStep, toggleStep, deleteStep, lists, addList, deleteList
  const [selection, setSelection] = useState({ kind: "smart", id: "myday" });
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");

  const activeList = useMemo(() => {
    if (selection.kind === "list") return store.lists.find((l) => l.id === selection.id);
    return null;
  }, [selection, store.lists]);

  const header = useMemo(() => {
    if (selection.kind === "smart") return smartMeta[selection.id];
    return {
      title: activeList?.name ?? "Tasks",
      icon: <span className="text-2xl leading-none">{activeList?.emoji ?? "📋"}</span>,
      accent: "text-emerald-400",
      subtitle: undefined,
    };
  }, [selection, activeList]);

  const filtered = useMemo(() => {
    let list = store.tasks;
    if (selection.kind === "smart") {
      switch (selection.id) {
        case "myday": list = list.filter((t) => t.myDay); break;
        case "important": list = list.filter((t) => t.important); break;
        case "planned": list = list.filter((t) => t.dueDate); break;
        case "all": break;
        case "completed": list = list.filter((t) => t.completed); break;
        case "tasks": list = list.filter((t) => t.listId === "tasks"); break;
      }
    } else {
      list = list.filter((t) => t.listId === selection.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.note.toLowerCase().includes(q));
    }
    return list;
  }, [store.tasks, selection, search]);

  const incomplete = filtered.filter((t) => !t.completed);
  const complete = filtered.filter((t) => t.completed);
  const selectedTask = store.tasks.find((t) => t.id === selectedTaskId) ?? null;
  const targetListId = selection.kind === "list" ? selection.id : "tasks";

  const submitTask = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const partial = { listId: targetListId };
    if (selection.kind === "smart") {
      if (selection.id === "myday") partial.myDay = true;
      if (selection.id === "important") partial.important = true;
      if (selection.id === "planned") partial.dueDate = new Date().toISOString();
    }
    store.addTask(title, partial);
    setNewTitle("");
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 text-slate-100">
      <TodoSidebar
        lists={store.lists}
        tasks={store.tasks}
        selection={selection}
        onSelect={(s) => { setSelection(s); setSelectedTaskId(null); }}
        onAddList={(n) => { const id = store.addList(n); setSelection({ kind: "list", id }); }}
        onDeleteList={(id) => {
          store.deleteList(id);
          if (selection.kind === "list" && selection.id === id) setSelection({ kind: "smart", id: "myday" });
        }}
        search={search}
        onSearchChange={setSearch}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 px-6 pt-6 pb-3">
          <span className={header.accent}>{header.icon}</span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{header.title}</h1>
            {header.subtitle && <p className="text-xs text-slate-400">{header.subtitle}</p>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mx-auto max-w-3xl space-y-1.5">
            {incomplete.length === 0 && complete.length === 0 && (
              <div className="mt-16 text-center text-sm text-slate-400">No tasks yet. Add one below.</div>
            )}
            {incomplete.map((t) => (
              <TodoTaskItem
                key={t.id}
                task={t}
                active={t.id === selectedTaskId}
                onToggle={() => store.toggleTaskComplete(t.id)}
                onSelect={() => setSelectedTaskId(t.id)}
                onToggleImportant={() => store.updateTask(t.id, { important: !t.important })}
                onDelete={() => { store.deleteTask(t.id); if (selectedTaskId === t.id) setSelectedTaskId(null); }}
              />
            ))}
            {complete.length > 0 && (
              <div className="pt-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="rounded bg-slate-800/70 px-2 py-0.5">Completed {complete.length}</span>
                </div>
                {complete.map((t) => (
                  <TodoTaskItem
                    key={t.id}
                    task={t}
                    active={t.id === selectedTaskId}
                    onToggle={() => store.toggleTaskComplete(t.id)}
                    onSelect={() => setSelectedTaskId(t.id)}
                    onToggleImportant={() => store.updateTask(t.id, { important: !t.important })}
                    onDelete={() => { store.deleteTask(t.id); if (selectedTaskId === t.id) setSelectedTaskId(null); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={submitTask}
          className="mx-6 mb-6 flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-md"
        >
          <Plus className="h-5 w-5 text-emerald-400" />
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitTask(e);
              }
            }}
            placeholder="Add a task"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
          <button type="submit" className="cursor-pointer rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-emerald-400">
            Add
          </button>
        </form>
      </main>

      {selectedTask && (
        <TodoDetailsPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onToggle={() => store.toggleTaskComplete(selectedTask.id)}
          onUpdate={(patch) => store.updateTask(selectedTask.id, patch)}
          onDelete={() => { store.deleteTask(selectedTask.id); setSelectedTaskId(null); }}
          onAddStep={(t) => store.addStep(selectedTask.id, t)}
          onToggleStep={(id) => store.toggleStep(selectedTask.id, id)}
          onDeleteStep={(id) => store.deleteStep(selectedTask.id, id)}
        />
      )}
    </div>
  );
}

function TodoSidebar({ lists, tasks, selection, onSelect, onAddList, onDeleteList, search, onSearchChange }) {
  const [newList, setNewList] = useState("");

  const counts = {
    myday: tasks.filter((t) => t.myDay && !t.completed).length,
    important: tasks.filter((t) => t.important && !t.completed).length,
    planned: tasks.filter((t) => t.dueDate && !t.completed).length,
    all: tasks.filter((t) => !t.completed).length,
  };

  const smartItems = [
    { id: "myday", label: "My Day", icon: <Sun className="h-4 w-4" />, count: counts.myday, color: "text-amber-500" },
    { id: "important", label: "Important", icon: <Star className="h-4 w-4" />, count: counts.important, color: "text-amber-400" },
    { id: "planned", label: "Planned", icon: <CalendarDays className="h-4 w-4" />, count: counts.planned, color: "text-rose-500" },
    { id: "all", label: "All", icon: <ListChecks className="h-4 w-4" />, count: counts.all, color: "text-sky-500" },
  ];

  const submitList = (e) => {
    e.preventDefault();
    const n = newList.trim();
    if (!n) return;
    onAddList(n);
    setNewList("");
  };

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900/60 text-slate-300">
      <div className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full rounded-md border border-slate-800 bg-slate-800/60 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <ul className="space-y-0.5">
          {smartItems.map((item) => {
            const active = selection.kind === "smart" && selection.id === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSelect({ kind: "smart", id: item.id })}
                  className={cn(
                    "flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                    active ? "bg-slate-800 font-medium" : "hover:bg-slate-800/70"
                  )}
                >
                  <span className={item.color}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count ? <span className="text-xs text-slate-400">{item.count}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="my-3 h-px bg-slate-800" />

        <ul className="space-y-0.5">
          {lists.map((list) => {
            const active = selection.kind === "list" && selection.id === list.id;
            const count = tasks.filter((t) => t.listId === list.id && !t.completed).length;
            return (
              <li key={list.id} className="group">
                <div
                  className={cn(
                    "flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                    active ? "bg-slate-800 font-medium" : "hover:bg-slate-800/70"
                  )}
                >
                  <button onClick={() => onSelect({ kind: "list", id: list.id })} className="flex flex-1 items-center gap-3 text-left">
                    {list.id === "tasks" ? (
                      <HomeIcon className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className="text-base leading-none">{list.emoji}</span>
                    )}
                    <span className="flex-1 truncate">{list.name}</span>
                    {count ? <span className="text-xs text-slate-400">{count}</span> : null}
                  </button>
                  {list.id !== "tasks" && (
                    <button
                      onClick={() => onDeleteList(list.id)}
                      className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      aria-label={`Delete ${list.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      <form onSubmit={submitList} className="flex items-center gap-2 border-t border-slate-800 p-3">
        <Plus className="h-4 w-4 text-emerald-400" />
        <input
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitList(e);
            }
          }}
          placeholder="New list"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
        />
      </form>
    </aside>
  );
}

function formatDue(iso) {
  const d = new Date(iso);
  const now = new Date();
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (same(d, now)) return "Today";
  if (same(d, tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function TodoTaskItem({ task, active, onToggle, onSelect, onToggleImportant, onDelete }) {
  const stepsDone = task.steps.filter((s) => s.completed).length;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-md border border-transparent bg-slate-900/70 px-3 py-2.5 shadow-sm transition-colors hover:bg-slate-900/60",
        active && "border-emerald-600/40 bg-emerald-500/10"
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600 hover:border-emerald-500"
        )}
        aria-label={task.completed ? "Mark as not completed" : "Mark as completed"}
      >
        {task.completed && (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", task.completed && "text-slate-500 line-through")}>{task.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {task.steps.length > 0 && <span>{stepsDone} of {task.steps.length}</span>}
          {task.myDay && (
            <span className="inline-flex items-center gap-1">
              <Sun className="h-3 w-3" /> My Day
            </span>
          )}
          {task.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatDue(task.dueDate)}
            </span>
          )}
          {task.note && <span className="truncate">Note</span>}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleImportant(); }}
        className={cn("shrink-0 rounded p-1 transition-colors hover:bg-slate-800/70", task.important ? "text-amber-400" : "text-slate-500")}
        aria-label="Toggle important"
      >
        <Star className={cn("h-4 w-4", task.important && "fill-current")} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="shrink-0 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-slate-800/70 hover:text-red-400 group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function toInputDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function TodoDetailsPanel({ task, onClose, onToggle, onUpdate, onDelete, onAddStep, onToggleStep, onDeleteStep }) {
  const [step, setStep] = useState("");
  const [note, setNote] = useState(task.note);
  const [title, setTitle] = useState(task.title);

  useEffect(() => {
    setNote(task.note);
    setTitle(task.title);
  }, [task.id]);

  const created = new Date(task.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  const submitStep = (e) => {
    e.preventDefault();
    const t = step.trim();
    if (!t) return;
    onAddStep(t);
    setStep("");
  };

  return (
    <aside className="flex h-full w-full max-w-sm flex-shrink-0 flex-col border-l border-slate-800 bg-slate-900/60 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <span className="text-xs text-slate-400">Details</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-slate-800/70" aria-label="Close details">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="rounded-md bg-slate-900/70 p-3 shadow-sm">
          <div className="flex items-start gap-3">
            <button
              onClick={onToggle}
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600 hover:border-emerald-500"
              )}
              aria-label="Toggle complete"
            >
              {task.completed && (
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && onUpdate({ title: title.trim() })}
              className={cn("flex-1 bg-transparent text-base font-medium outline-none", task.completed && "text-slate-500 line-through")}
            />
            <button
              onClick={() => onUpdate({ important: !task.important })}
              className={cn("rounded p-1 transition-colors", task.important ? "text-amber-400" : "text-slate-500")}
              aria-label="Toggle important"
            >
              <Star className={cn("h-4 w-4", task.important && "fill-current")} />
            </button>
          </div>

          <div className="mt-3 space-y-1 border-t border-slate-800 pt-2">
            {task.steps.map((s) => (
              <div key={s.id} className="group flex items-center gap-2 py-1">
                <button onClick={() => onToggleStep(s.id)} aria-label="Toggle step">
                  {s.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-slate-500" />}
                </button>
                <span className={cn("flex-1 text-sm", s.completed && "text-slate-500 line-through")}>{s.title}</span>
                <button
                  onClick={() => onDeleteStep(s.id)}
                  className="opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete step"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <form onSubmit={submitStep} className="flex items-center gap-2 py-1">
              <Plus className="h-4 w-4 text-emerald-400" />
              <input
                value={step}
                onChange={(e) => setStep(e.target.value)}
                placeholder="Next step"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </form>
          </div>
        </div>

        <button
          onClick={() => onUpdate({ myDay: !task.myDay })}
          className={cn("flex w-full items-center gap-3 rounded-md bg-slate-900/70 px-3 py-2.5 text-sm shadow-sm hover:bg-slate-900/60", task.myDay && "text-emerald-400")}
        >
          <Sun className="h-4 w-4" />
          <span className="flex-1 text-left">{task.myDay ? "Added to My Day" : "Add to My Day"}</span>
          {task.myDay && (
            <X
              className="h-4 w-4 text-slate-500"
              onClick={(e) => { e.stopPropagation(); onUpdate({ myDay: false }); }}
            />
          )}
        </button>

        <div className="rounded-md bg-slate-900/70 px-3 py-2.5 text-sm shadow-sm">
          <label className="flex items-center gap-3">
            <Bell className="h-4 w-4" />
            <span className="flex-1">Remind me</span>
            <input
              type="datetime-local"
              value={task.reminder ? task.reminder.slice(0, 16) : ""}
              onChange={(e) => onUpdate({ reminder: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        <div className="rounded-md bg-slate-900/70 px-3 py-2.5 text-sm shadow-sm">
          <label className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4" />
            <span className="flex-1">Add due date</span>
            <input
              type="date"
              value={toInputDate(task.dueDate)}
              onChange={(e) => onUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="bg-transparent text-xs outline-none"
            />
          </label>
        </div>

        <div className="rounded-md bg-slate-900/70 p-3 shadow-sm">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onUpdate({ note })}
            placeholder="Add note"
            rows={5}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
        <button onClick={onClose} className="hover:text-slate-100" aria-label="Hide details">
          <X className="h-4 w-4" />
        </button>
        <span>Created {created}</span>
        <button onClick={onDelete} className="hover:text-red-400" aria-label="Delete task">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------
   FOCUS SESSION VIEW — Focus Grove Main, ported in full.
   This is the FocusPage component from src/routes/index.tsx,
   unchanged in layout, copy, section order, duration list,
   plant grid, sounds, timer, reward popup and give-up flow.

   Two things were necessarily adapted to live inside loggd
   (everything else — every string, class, and piece of logic
   below — is the same as the standalone project):
     1. framer-motion's <motion.div>/<AnimatePresence> aren't
        available in this single-file setup, so the same
        enter animations are done with the CSS keyframes
        registered above (fg-plant-enter / fg-reward-pop /
        fg-banner-in) instead of the framer-motion API.
     2. The "Task" section and the "Sounds"/"Plant" panels
        read from loggd's own shared task list — filtered to
        My Day + Important, same as the rest of the app — and
        finishing a session with status "success" calls
        loggd's toggleTaskComplete() so the task flips to done
        on the Home page and in Tasks too. Focus Grove Main's
        own coins/plants/achievements system is untouched.
--------------------------------------------------------- */

/* ---------------------------------------------------------
   GROVE APP — the full multi-page app from the new "grove"
   Replit project (Nav + Focus / Timeline / Forest / Shop /
   Achievements / Settings), ported page by page. Every page,
   every string of copy, every layout section below matches
   its source file 1:1 — nothing was left out.

   Necessary adaptations (the same categories as before, now
   applied consistently across all six pages):
     1. No build step here, so TypeScript annotations are
        stripped and every file (Nav.tsx, TimerWheel.tsx,
        pages/*.tsx) is merged into this one instead of being
        separate imports.
     2. The source app uses "wouter" for real URL routing
        (<Link>, useLocation) and shadcn/ui + Radix primitives
        (Button, Card, Switch, Slider, Progress) styled through
        Tailwind's @theme system and a "hover-elevate" utility
        layer. None of that tooling exists in this single file,
        so: routing is done with local tab state instead of URL
        routes (matching how the rest of loggd already
        navigates), and Button/Card/Switch/Slider/Progress are
        rebuilt as plain styled elements using the same color
        tokens the source project defines in its dark theme.
        Every page's actual layout, copy, and behavior is
        unchanged.
     3. `sonner` toasts are swapped for a small local toast
        list (same messages, same trigger points).
     4. As established from your first request: the Focus tab's
        "Task" picker and its "+ New" quick-add both read from
        and write to loggd's own shared task list (My Day /
        Important), not a separate Grove-only task list, so a
        session still completes the right task on the Home page
        and in Tasks too. Grove's own isolated Tasks page
        (pages/tasks.tsx) is still ported below for completeness
        — it's in the source code too — but like the source
        project's own Nav, it isn't linked from the tab bar.
--------------------------------------------------------- */

const GROVE_LINKS = [
  { id: "focus", label: "Focus" },
  { id: "timeline", label: "Timeline" },
  { id: "forest", label: "Forest" },
  { id: "shop", label: "Shop" },
  { id: "achievements", label: "Achievements" },
  { id: "settings", label: "Settings" },
];

/* ---- tiny local stand-in for the `sonner` toast package ---- */
const groveToastListeners = new Set();
function groveEmitToast(toastItem) {
  for (const fn of groveToastListeners) fn(toastItem);
}
const toast = {
  success: (msg) => groveEmitToast({ id: uid("toast"), kind: "success", msg }),
  error: (msg) => groveEmitToast({ id: uid("toast"), kind: "error", msg }),
  warning: (msg) => groveEmitToast({ id: uid("toast"), kind: "warning", msg }),
};

function GroveToaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    };
    groveToastListeners.add(onToast);
    return () => groveToastListeners.delete(onToast);
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="fg-banner-in pointer-events-auto rounded-md px-4 py-2 text-sm font-medium shadow-lg"
          style={{
            background: "var(--card)",
            color:
              t.kind === "error" ? "var(--destructive)" : t.kind === "warning" ? "var(--destructive)" : "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ---- tiny local stand-ins for shadcn/ui primitives used across the grove pages ---- */
function GroveButton({ children, onClick, disabled, variant = "default", size = "default", className = "", type = "button" }) {
  const sizeCls =
    size === "sm" ? "min-h-8 rounded-md px-3 text-xs" : size === "icon" ? "h-9 w-9 rounded-md" : size === "lg" ? "min-h-10 rounded-md px-8 text-sm" : "min-h-9 rounded-md px-4 py-2 text-sm";
  const variantStyle =
    variant === "destructive"
      ? { background: "var(--destructive)", color: "var(--destructive-foreground)", border: "1px solid var(--destructive)" }
      : variant === "secondary"
      ? { background: "var(--secondary)", color: "var(--secondary-foreground)", border: "1px solid var(--border)" }
      : variant === "outline"
      ? { background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }
      : { background: "var(--primary)", color: "var(--primary-foreground)", border: "1px solid var(--primary)" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", sizeCls, className)}
      style={variantStyle}
    >
      {children}
    </button>
  );
}

function GroveCard({ children, className = "" }) {
  return (
    <div className={cn("rounded-lg", className)} style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}>
      {children}
    </div>
  );
}
function GroveCardHeader({ children }) {
  return <div className="flex flex-col gap-1.5 p-6">{children}</div>;
}
function GroveCardTitle({ children }) {
  return <h3 className="font-display text-base font-semibold">{children}</h3>;
}
function GroveCardDescription({ children }) {
  return <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{children}</p>;
}
function GroveCardContent({ children, className = "" }) {
  return <div className={cn("px-6", className)}>{children}</div>;
}

function GroveSwitch({ checked, onCheckedChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
      style={{ background: checked ? "var(--primary)" : "var(--secondary)" }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function GroveSlider({ value, max = 100, step = 1, onValueChange }) {
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className="w-full"
      style={{ accentColor: "var(--primary)" }}
    />
  );
}

function GroveProgress({ value, className = "" }) {
  return (
    <div className={cn("overflow-hidden rounded-full", className)} style={{ background: "var(--secondary)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: "var(--primary)" }} />
    </div>
  );
}

/* ---- components/Nav.tsx (ported: URL <Link>s become tab-switch buttons) ---- */
function GroveNav({ active, onNavigate }) {
  const coins = useFocusStore((s) => s.coins);
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md" style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in oklab, var(--background) 85%, transparent)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="invisible font-display text-lg font-semibold tracking-tight" aria-hidden="true">
          🌱 Grove
        </div>
        <nav className="hidden items-center gap-1 sm:flex">
          {GROVE_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => onNavigate(l.id)}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={active === l.id ? { background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { color: "var(--muted-foreground)" }}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
          <LeafCoin className="h-4 w-4" />
          {coins}
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {GROVE_LINKS.map((l) => (
          <button
            key={l.id}
            onClick={() => onNavigate(l.id)}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium"
            style={active === l.id ? { background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { color: "var(--muted-foreground)" }}
          >
            {l.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

/* ---- pages/focus.tsx (ported) ---- */
const GROVE_SOUND_LABELS = { rain: "🌧 Rain", forest: "🌲 Forest", wind: "🍃 Wind" };

function groveComputeReward(minutes, status) {
  if (status === "success") return Math.round(minutes * 1.2);
  if (status === "broken") return Math.round(minutes * 0.4);
  return 0;
}

function groveFormatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function GroveFocusPage({ ctx }) {
  const { tasks: loggdTasks, addTask: loggdAddTask, toggleTaskComplete, pushNotification } = ctx;

  const settings = useFocusStore((s) => s.settings);
  const plants = useFocusStore((s) => s.plants);
  const equippedPlant = plants.find((p) => p.equipped)?.id ?? "sprout";

  // Sourced from loggd's shared My Day + Important tasks (see note at top of this block).
  const tasks = useMemo(
    () =>
      loggdTasks
        .filter((t) => (t.myDay || t.important) && !t.completed)
        .map((t, i) => ({ id: t.id, title: t.title, color: TASK_COLORS[i % TASK_COLORS.length] })),
    [loggdTasks]
  );

  const [duration, setDuration] = useState(25);
  const [plantId, setPlantId] = useState(equippedPlant);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [broken, setBroken] = useState(false);
  const [reward, setReward] = useState(null);
  const [activeSounds, setActiveSounds] = useState([]);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const startedAtRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (status !== "running") return;
    const tick = () => {
      if (startedAtRef.current) {
        setElapsedSec((Date.now() - startedAtRef.current) / 1000);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  const totalSec = duration * 60;

  useEffect(() => {
    if (status === "running" && elapsedSec >= totalSec) {
      finishSession("success");
    }
  }, [elapsedSec, status, totalSec]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status !== "running" || !settings.warnOnLeave) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        setBroken(true);
        toast.warning("You left the tab — this session will count as broken if you don't return soon.");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [status, settings.warnOnLeave]);

  useEffect(() => {
    return () => {
      sounds.stopAll();
    };
  }, []);

  function toggleSound(id) {
    if (activeSounds.includes(id)) {
      sounds.stop(id);
      setActiveSounds((prev) => prev.filter((s) => s !== id));
      return;
    }
    sounds.start(id, settings.soundVolumes[id], settings.masterVolume);
    setActiveSounds((prev) => [...prev, id]);
  }

  function startSession() {
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    setBroken(false);
    setStatus("running");
  }

  function finishSession(finalStatus) {
    if (!startedAtRef.current) return;
    const actualMin = Math.min(duration, Math.round(elapsedSec / 60));
    const finalized = finalStatus === "success" && broken ? "broken" : finalStatus;
    const coinsEarned = groveComputeReward(actualMin, finalized);
    const session = {
      id: uid("s"),
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      durationMin: duration,
      actualMin,
      plantId,
      taskId,
      status: finalized,
      reward: coinsEarned,
    };
    focusStore.addSession(session);
    if (finalized === "success" && taskId) {
      toggleTaskComplete(taskId);
    }
    setStatus("finished");
    setReward({ coins: coinsEarned, withered: finalized !== "success" });
    startedAtRef.current = null;
  }

  function giveUp() {
    finishSession("given_up");
  }

  function reset() {
    setStatus("idle");
    setElapsedSec(0);
    setBroken(false);
    setReward(null);
  }

  const progress = status === "running" ? elapsedSec / totalSec : status === "finished" ? 1 : 0;
  const unlockedPlants = useMemo(() => plants.filter((p) => p.unlocked), [plants]);

  function addTask() {
    if (!newTaskTitle.trim()) return;
    const id = loggdAddTask(newTaskTitle.trim(), { myDay: true });
    setTaskId(id);
    setNewTaskTitle("");
    setNewTaskOpen(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-col items-center">
        <div className="relative">
          <TimerWheel
            size={300}
            value={duration}
            onChange={setDuration}
            disabled={status !== "idle"}
            progress={status === "idle" ? undefined : progress}
          >
            <div className="flex flex-col items-center gap-1">
              <PlantSvg id={plantId} progress={status === "idle" ? 0.15 : Math.max(0.1, progress)} withered={broken && status === "running"} size={150} />
              <div
                className="font-display text-2xl font-semibold tabular-nums"
                style={broken && status === "running" ? { color: "var(--destructive)" } : undefined}
              >
                {status === "idle" ? `${duration}:00` : groveFormatClock(Math.max(0, totalSec - elapsedSec))}
              </div>
            </div>
          </TimerWheel>
        </div>

        <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
          {status === "idle" ? "Drag the ring to set your session length — it snaps to common durations." : status === "running" ? "Stay on this tab to keep your plant healthy." : null}
        </p>

        {reward && status === "finished" && (
          <GroveCard className="mt-4 w-full max-w-sm">
            <GroveCardContent className="flex items-center justify-between gap-3 py-6">
              <div>
                <p className="font-display text-lg font-semibold">
                  {reward.withered ? "Your plant wilted a little" : "Session complete!"}
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {reward.withered ? "Partial credit — every minute still counts." : "Great focus. Your plant grew fully."}
                </p>
              </div>
              <div className="flex items-center gap-1 text-lg font-semibold" style={{ color: "var(--primary)" }}>
                <LeafCoin className="h-5 w-5" sway />+{reward.coins}
              </div>
            </GroveCardContent>
          </GroveCard>
        )}

        <div className="mt-6 flex gap-3">
          {status === "idle" && (
            <GroveButton size="lg" onClick={startSession} className="gap-2">
              <Play className="h-4 w-4" /> Start focusing
            </GroveButton>
          )}
          {status === "running" && (
            <GroveButton size="lg" variant="destructive" onClick={giveUp} className="gap-2">
              <X className="h-4 w-4" /> Give up
            </GroveButton>
          )}
          {status === "finished" && (
            <GroveButton size="lg" onClick={reset}>
              Plant another
            </GroveButton>
          )}
        </div>
      </div>

      <GroveCard className="mt-8">
        <GroveCardContent className="py-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Task</h2>
            <button
              type="button"
              onClick={() => setNewTaskOpen((v) => !v)}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              <Plus className="mr-0.5 inline h-3 w-3" />
              New
            </button>
          </div>
          {newTaskOpen && (
            <div className="mb-2 flex gap-2">
              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="What are you working on?"
                className="min-h-8 flex-1 rounded-md px-2 text-sm outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--background)" }}
              />
              <GroveButton size="sm" onClick={addTask}>
                Add
              </GroveButton>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTaskId(null)}
              disabled={status !== "idle"}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={taskId === null ? { border: "1px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              No task
            </button>
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTaskId(t.id)}
                disabled={status !== "idle"}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={taskId === t.id ? { border: "1px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.title}
              </button>
            ))}
            {tasks.length === 0 && !newTaskOpen && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Add a My Day or Important task in Tasks to tag your sessions.</p>
            )}
          </div>
        </GroveCardContent>
      </GroveCard>

      <GroveCard className="mt-4">
        <GroveCardContent className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-display text-sm font-semibold">Ambient sound</h2>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(GROVE_SOUND_LABELS).map((id) => {
                const on = activeSounds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSound(id)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={on ? { border: "1px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                  >
                    {on ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    {GROVE_SOUND_LABELS[id]}
                  </button>
                );
              })}
            </div>
            <button onClick={() => ctx.setGroveTab("settings")} className="mt-2 inline-block text-xs hover:underline" style={{ color: "var(--muted-foreground)" }}>
              Adjust volume in Settings →
            </button>
          </div>

          <div>
            <h2 className="mb-2 font-display text-sm font-semibold">Plant</h2>
            <div className="flex flex-wrap gap-1.5">
              {unlockedPlants.map((p) => {
                const def = PLANT_MAP[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlantId(p.id)}
                    disabled={status !== "idle"}
                    title={def.name}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={plantId === p.id ? { border: "1px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)", color: "var(--primary)" } : { border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                  >
                    <Sprout className="h-3 w-3" />
                    {def.name}
                  </button>
                );
              })}
              <button onClick={() => ctx.setGroveTab("shop")} className="rounded-full px-3 py-1 text-xs hover:underline" style={{ border: "1px dashed var(--border)", color: "var(--muted-foreground)" }}>
                Unlock more →
              </button>
            </div>
          </div>
        </GroveCardContent>
      </GroveCard>
    </div>
  );
}

/* ---- pages/timeline.tsx (ported) ---- */
function groveKeyFor(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function GroveTimelinePage() {
  const sessions = useFocusStore((s) => s.sessions);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const k = groveKeyFor(new Date(s.startedAt));
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return map;
  }, [sessions]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedSessions = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Timeline</h1>
        <div className="flex items-center gap-2">
          <GroveButton size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </GroveButton>
          <span className="w-32 text-center text-sm font-medium">
            {firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <GroveButton size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </GroveButton>
        </div>
      </div>

      <GroveCard>
        <GroveCardContent className="py-6">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day == null) return <div key={i} />;
              const k = groveKeyFor(new Date(year, month, day));
              const daySessions = byDay.get(k) ?? [];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(daySessions.length ? k : null)}
                  className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-md text-sm"
                  style={selected === k ? { border: "1px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)" } : { border: "1px solid transparent" }}
                >
                  <span>{day}</span>
                  {daySessions.length > 0 && <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--primary)" }} />}
                </button>
              );
            })}
          </div>
        </GroveCardContent>
      </GroveCard>

      {selected && (
        <div className="mt-4 space-y-2">
          {selectedSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
              <span>
                {new Date(s.startedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {s.actualMin} min
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={
                  s.status === "success"
                    ? { background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" }
                    : s.status === "broken"
                    ? { background: "color-mix(in oklab, var(--destructive) 15%, transparent)", color: "var(--destructive)" }
                    : { background: "var(--secondary)", color: "var(--muted-foreground)" }
                }
              >
                {s.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- pages/forest.tsx (ported) ---- */
function groveDayLabel(ts) {
  return new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function GroveForestPage() {
  const sessions = useFocusStore((s) => s.sessions);

  const groups = useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const key = groveDayLabel(s.startedAt);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries());
  }, [sessions]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Your forest</h1>
      {groups.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No plants yet — finish a focus session to grow your first one.</p>
      )}
      <div className="space-y-6">
        {groups.map(([day, items]) => (
          <div key={day}>
            <h2 className="mb-2 text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>{day}</h2>
            <GroveCard>
              <GroveCardContent className="flex flex-wrap gap-3 py-6">
                {items.map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-1" title={`${s.actualMin} min · ${s.status}`}>
                    <PlantSvg id={s.plantId} progress={s.status === "success" ? 1 : 0.5} withered={s.status !== "success"} size={70} />
                    <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{s.actualMin}m</span>
                  </div>
                ))}
              </GroveCardContent>
            </GroveCard>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- pages/shop.tsx (ported) ---- */
function GroveShopPage() {
  const coins = useFocusStore((s) => s.coins);
  const plants = useFocusStore((s) => s.plants);

  function unlock(id, price) {
    if (coins < price) {
      toast.error("Not enough leaf coins yet — keep focusing!");
      return;
    }
    focusStore.spendCoins(price);
    focusStore.unlockPlant(id);
    toast.success("New plant unlocked!");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Shop</h1>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
          <LeafCoin className="h-4 w-4" />
          {coins}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PLANTS.map((def) => {
          const entry = plants.find((p) => p.id === def.id);
          const unlocked = entry?.unlocked ?? false;
          const equipped = entry?.equipped ?? false;
          return (
            <GroveCard key={def.id} className={cn(!unlocked && "opacity-90")}>
              <GroveCardContent className="flex flex-col items-center gap-2 py-6 text-center">
                <PlantSvg id={def.id} progress={1} size={100} className={cn(!unlocked && "grayscale")} />
                <p className="font-display text-sm font-semibold">{def.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{def.description}</p>
                {unlocked ? (
                  <GroveButton
                    size="sm"
                    variant={equipped ? "secondary" : "default"}
                    disabled={equipped}
                    onClick={() => focusStore.equipPlant(def.id)}
                    className="mt-1 w-full"
                  >
                    {equipped ? "Equipped" : "Equip"}
                  </GroveButton>
                ) : (
                  <GroveButton size="sm" onClick={() => unlock(def.id, def.price)} className="mt-1 w-full gap-1">
                    <LeafCoin className="h-3.5 w-3.5" /> {def.price}
                  </GroveButton>
                )}
              </GroveCardContent>
            </GroveCard>
          );
        })}
      </div>
    </div>
  );
}

/* ---- pages/achievements.tsx (ported) ---- */
function GroveAchievementsPage() {
  const state = useFocusStore((s) => s);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold">Achievements</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const progress = Math.min(a.goal, a.progress(state));
          const unlocked = state.achievements.some((u) => u.id === a.id);
          return (
            <GroveCard key={a.id} className={cn(unlocked && "")} >
              <GroveCardContent className="flex items-start gap-3 py-6">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={unlocked ? { background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" } : { background: "var(--secondary)", color: "var(--muted-foreground)" }}
                >
                  <Award className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold">{a.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <GroveProgress value={(progress / a.goal) * 100} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {progress}/{a.goal}
                    </span>
                  </div>
                </div>
              </GroveCardContent>
            </GroveCard>
          );
        })}
      </div>
    </div>
  );
}

/* ---- pages/settings.tsx (ported) ---- */
const GROVE_SETTINGS_SOUND_LABELS = { rain: "Rain", forest: "Forest", wind: "Wind" };

function GroveSettingsPage() {
  const settings = useFocusStore((s) => s.settings);
  const fileRef = useRef(null);

  function setMaster(v) {
    focusStore.updateSettings({ masterVolume: v });
    sounds.setAllMaster(v, settings.soundVolumes);
  }

  function setSoundVolume(id, v) {
    const next = { ...settings.soundVolumes, [id]: v };
    focusStore.updateSettings({ soundVolumes: next });
    sounds.setVolume(id, v, settings.masterVolume);
  }

  function toggleTheme() {
    const next = settings.theme === "light" ? "dark" : "light";
    focusStore.updateSettings({ theme: next });
  }

  function exportData() {
    const json = focusStore.exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grove-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        focusStore.importJson(String(reader.result));
        toast.success("Data imported.");
      } catch {
        toast.error("That file could not be read.");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    sounds.stopAll();
    focusStore.resetAll();
    toast.success("Everything has been reset.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <GroveCard>
        <GroveCardHeader>
          <GroveCardTitle>Ambient sounds</GroveCardTitle>
          <GroveCardDescription>Tune volume for the sounds you can turn on from the Focus page.</GroveCardDescription>
        </GroveCardHeader>
        <GroveCardContent className="space-y-5 pb-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Master volume</label>
            <GroveSlider value={[settings.masterVolume * 100]} max={100} step={1} onValueChange={([v]) => setMaster(v / 100)} />
          </div>
          {Object.keys(GROVE_SETTINGS_SOUND_LABELS).map((id) => (
            <div key={id}>
              <div className="mb-1 flex items-center justify-between text-sm font-medium">
                <span>{GROVE_SETTINGS_SOUND_LABELS[id]}</span>
              </div>
              <GroveSlider value={[settings.soundVolumes[id] * 100]} max={100} step={1} onValueChange={([v]) => setSoundVolume(id, v / 100)} />
            </div>
          ))}
        </GroveCardContent>
      </GroveCard>

      <GroveCard>
        <GroveCardHeader>
          <GroveCardTitle>Session</GroveCardTitle>
        </GroveCardHeader>
        <GroveCardContent className="flex items-center justify-between pb-6">
          <div>
            <p className="text-sm font-medium">Warn when I leave the tab</p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>A session counts as broken if you switch away for too long.</p>
          </div>
          <GroveSwitch checked={settings.warnOnLeave} onCheckedChange={(v) => focusStore.updateSettings({ warnOnLeave: v })} />
        </GroveCardContent>
      </GroveCard>

      <GroveCard>
        <GroveCardHeader>
          <GroveCardTitle>Appearance</GroveCardTitle>
        </GroveCardHeader>
        <GroveCardContent className="flex items-center justify-between pb-6">
          <p className="text-sm font-medium">Dark mode</p>
          <GroveSwitch checked={settings.theme === "dark"} onCheckedChange={toggleTheme} />
        </GroveCardContent>
      </GroveCard>

      <GroveCard>
        <GroveCardHeader>
          <GroveCardTitle>Your data</GroveCardTitle>
          <GroveCardDescription>Everything is stored locally in this browser.</GroveCardDescription>
        </GroveCardHeader>
        <GroveCardContent className="flex flex-wrap gap-2 pb-6">
          <GroveButton variant="secondary" onClick={exportData}>
            Export JSON
          </GroveButton>
          <GroveButton variant="secondary" onClick={() => fileRef.current?.click()}>
            Import JSON
          </GroveButton>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importData} />
          <GroveButton variant="destructive" onClick={resetAll}>
            Reset everything
          </GroveButton>
        </GroveCardContent>
      </GroveCard>
    </div>
  );
}

/* ---- pages/tasks.tsx (ported for completeness, matching the source's own
   Nav which also doesn't link to it — Grove's own isolated task list is not
   used by the Focus tab above, which reads loggd's shared tasks instead) ---- */
const TASK_COLORS = ["#7fae7a", "#e0a458", "#c1666b", "#5b8a9a", "#a06cd5", "#d9a441"];

function GroveTasksPage() {
  const tasks = useFocusStore((s) => s.tasks);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(TASK_COLORS[0]);

  function addTask() {
    if (!title.trim()) return;
    focusStore.addTask({ id: uid("gt"), title: title.trim(), color });
    setTitle("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <h1 className="font-display text-2xl font-semibold">Tasks</h1>

      <GroveCard>
        <GroveCardContent className="space-y-3 py-6">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task…"
              className="min-h-9 flex-1 rounded-md px-3 text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--background)" }}
            />
            <GroveButton onClick={addTask} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add
            </GroveButton>
          </div>
          <div className="flex gap-2">
            {TASK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: c, border: color === c ? "2px solid var(--foreground)" : "2px solid transparent" }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </GroveCardContent>
      </GroveCard>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-sm font-medium">{t.title}</span>
            </div>
            <button type="button" onClick={() => focusStore.removeTask(t.id)} className="hover:text-destructive" style={{ color: "var(--muted-foreground)" }} aria-label="Delete task">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No tasks yet.</p>}
      </div>
    </div>
  );
}

/* ---- App.tsx (ported: wouter <Switch>/<Route> becomes local tab state) ---- */
function FocusSessionView({ ctx }) {
  const [groveTab, setGroveTab] = useState("focus");
  const groveCtx = { ...ctx, setGroveTab };

  return (
    <div className="focus-grove-theme min-h-full" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <GroveToaster />
      <GroveNav active={groveTab} onNavigate={setGroveTab} />
      {groveTab === "focus" && <GroveFocusPage ctx={groveCtx} />}
      {groveTab === "timeline" && <GroveTimelinePage />}
      {groveTab === "forest" && <GroveForestPage />}
      {groveTab === "shop" && <GroveShopPage />}
      {groveTab === "achievements" && <GroveAchievementsPage />}
      {groveTab === "settings" && <GroveSettingsPage />}
    </div>
  );
}

const HABIT_CONTRACT_HTML_B64 =
  "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiPgo8dGl0bGU+VGhlIENvbW1pdG1lbnQgTGVkZ2VyIOKAlCBIYWJpdCBDb250cmFjdHM8L3RpdGxlPgo8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBz" +
  "Oi8vZm9udHMuZ29vZ2xlYXBpcy5jb20iPgo8bGluayByZWw9InByZWNvbm5lY3QiIGhyZWY9Imh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb20iIGNyb3Nzb3JpZ2luPgo8bGluayBocmVmPSJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PUZyYXVuY2VzOml0YWwsb3Bzeix3Z2h0QDAsOS4uMTQ0LDQwMDswLDkuLjE0NCw1MDA7MCw5Li4xNDQsNjAwOzAsOS4uMTQ0LDcwMDsx" +
  "LDkuLjE0NCw1MDAmZmFtaWx5PUludGVyOndnaHRANDAwOzUwMDs2MDA7NzAwJmZhbWlseT1JQk0rUGxleCtNb25vOndnaHRANDAwOzUwMDs2MDAmZGlzcGxheT1zd2FwIiByZWw9InN0eWxlc2hlZXQiPgo8c3R5bGU+Cjpyb290ewogIC0tcGFwZXI6IzBiMTIyMDsKICAtLXBhcGVyLTI6IzFlMjkzYjsKICAtLWNhcmQ6IzBmMTcyYTsKICAtLWluazojZjFmNWY5OwogIC0taW5rLXNvZnQ6Izk0YTNi" +
  "ODsKICAtLWluay1mYWludDojNjQ3NDhiOwogIC0tc2VhbDojZjg3MTcxOwogIC0tc2VhbC1kYXJrOiNmY2E1YTU7CiAgLS1zZWFsLXRpbnQ6cmdiYSgyNDgsMTEzLDExMywwLjE0KTsKICAtLWVtZXJhbGQ6IzEwYjk4MTsKICAtLWVtZXJhbGQtZGFyazojMzRkMzk5OwogIC0tZW1lcmFsZC10aW50OnJnYmEoMTYsMTg1LDEyOSwwLjE0KTsKICAtLWdvbGQ6I2ZiYmYyNDsKICAtLWdvbGQtZGFyazoj" +
  "ZmNkMzRkOwogIC0tbGluZTojMWUyOTNiOwogIC0tbGluZS1zdHJvbmc6IzMzNDE1NTsKICAtLXdoaXRlOiMxZTI5M2I7CiAgLS1yYWRpdXMtc206NnB4OwogIC0tcmFkaXVzOjEwcHg7CiAgLS1mb250LWRpc3BsYXk6J0ZyYXVuY2VzJywgc2VyaWY7CiAgLS1mb250LWJvZHk6J0ludGVyJywgc2Fucy1zZXJpZjsKICAtLWZvbnQtbW9ubzonSUJNIFBsZXggTW9ubycsIG1vbm9zcGFjZTsKfQoqe2Jv" +
  "eC1zaXppbmc6Ym9yZGVyLWJveDt9Cmh0bWwsYm9keXttYXJnaW46MDtwYWRkaW5nOjA7fQpib2R5ewogIGJhY2tncm91bmQ6dmFyKC0tcGFwZXIpOwogIGJhY2tncm91bmQtaW1hZ2U6cmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCAxcHggMXB4LCByZ2JhKDI0MSwyNDUsMjQ5LDAuMDUpIDFweCwgdHJhbnNwYXJlbnQgMCk7CiAgYmFja2dyb3VuZC1zaXplOjIycHggMjJweDsKICBjb2xvcjp2YXIo" +
  "LS1pbmspOwogIGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtYm9keSk7CiAgZm9udC1zaXplOjE1cHg7CiAgbGluZS1oZWlnaHQ6MS42OwogIG1pbi1oZWlnaHQ6MTAwdmg7CiAgcGFkZGluZy1ib3R0b206ODBweDsKfQoud3JhcHttYXgtd2lkdGg6OTYwcHg7IG1hcmdpbjowIGF1dG87IHBhZGRpbmc6MCAyNHB4O30KLm1hc3RoZWFkewogIHBhZGRpbmc6NDBweCAwIDI4cHg7CiAgYm9yZGVyLWJvdHRv" +
  "bToxcHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOwogIG1hcmdpbi1ib3R0b206MzZweDsKICBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmZsZXgtZW5kOyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjsKICBnYXA6MTZweDsgZmxleC13cmFwOndyYXA7Cn0KLmJyYW5ke2Rpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBnYXA6MTRweDt9Ci5icmFuZC1tYXJrewogIHdpZHRo" +
  "OjQ0cHg7aGVpZ2h0OjQ0cHg7Ym9yZGVyLXJhZGl1czo1MCU7CiAgYm9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWluayk7CiAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOwogIGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7IGZvbnQtd2VpZ2h0OjYwMDsgZm9udC1zaXplOjE4cHg7CiAgZmxleC1zaHJpbms6MDsKfQouYnJhbmQtdGV4" +
  "dCAuZXllYnJvd3t0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7IGxldHRlci1zcGFjaW5nOjAuMTRlbTsgZm9udC1zaXplOjExcHg7IGNvbG9yOnZhcigtLWluay1zb2Z0KTsgZm9udC13ZWlnaHQ6NjAwO30KLmJyYW5kLXRleHQgaDF7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTsgZm9udC13ZWlnaHQ6NjAwOyBmb250LXNpemU6MjZweDsgbWFyZ2luOjJweCAwIDA7fQoud2FsbGV0LXBp" +
  "bGx7CiAgZm9udC1mYW1pbHk6dmFyKC0tZm9udC1tb25vKTsgZm9udC1zaXplOjEzcHg7CiAgYmFja2dyb3VuZDp2YXIoLS1jYXJkKTsgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lLXN0cm9uZyk7CiAgYm9yZGVyLXJhZGl1czo5OTlweDsgcGFkZGluZzo4cHggMTZweDsgZGlzcGxheTpmbGV4OyBnYXA6MTRweDsKfQoud2FsbGV0LXBpbGwgc3Bhbi5sYmx7Y29sb3I6dmFyKC0taW5rLWZhaW50" +
  "KTsgZm9udC1mYW1pbHk6dmFyKC0tZm9udC1ib2R5KTsgZm9udC1zaXplOjExcHg7IHRleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTsgbGV0dGVyLXNwYWNpbmc6LjA2ZW07IG1hcmdpbi1yaWdodDo0cHg7fQoud2FsbGV0LXBpbGwgYntjb2xvcjp2YXIoLS1lbWVyYWxkLWRhcmspO30KCi5zY3JlZW57ZGlzcGxheTpibG9jazt9Ci5zY3JlZW4uaGlkZGVue2Rpc3BsYXk6bm9uZTt9CgovKiAtLS0tIGxp" +
  "c3Qgc2NyZWVuIC0tLS0gKi8KLmxpc3QtaGVhZGVye2Rpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IGFsaWduLWl0ZW1zOmZsZXgtZW5kOyBtYXJnaW4tYm90dG9tOjI0cHg7IGdhcDoxNnB4OyBmbGV4LXdyYXA6d3JhcDt9Ci5saXN0LWhlYWRlciBoMntmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3BsYXkpOyBmb250LXNpemU6MjRweDsgZm9udC13ZWlnaHQ6NjAw" +
  "OyBtYXJnaW46MDt9Ci5saXN0LWhlYWRlciBwe2NvbG9yOnZhcigtLWluay1zb2Z0KTsgZm9udC1zaXplOjEzLjVweDsgbWFyZ2luOjRweCAwIDA7fQouZW1wdHktc3RhdGV7CiAgYm9yZGVyOjFweCBkYXNoZWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cyk7CiAgcGFkZGluZzo0OHB4IDMwcHg7IHRleHQtYWxpZ246Y2VudGVyOyBiYWNrZ3JvdW5kOnZhcigt" +
  "LWNhcmQpOwp9Ci5lbXB0eS1zdGF0ZSAuZXMtaWNvbntmb250LXNpemU6MzBweDsgY29sb3I6dmFyKC0taW5rLWZhaW50KTsgbWFyZ2luLWJvdHRvbToxMnB4O30KLmVtcHR5LXN0YXRlIGgze2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtZGlzcGxheSk7IGZvbnQtc2l6ZToyMHB4OyBtYXJnaW46MCAwIDZweDt9Ci5lbXB0eS1zdGF0ZSBwe2NvbG9yOnZhcigtLWluay1zb2Z0KTsgZm9udC1zaXplOjE0" +
  "cHg7IG1heC13aWR0aDo0MjBweDsgbWFyZ2luOjAgYXV0byAyMHB4O30KCi5jb250cmFjdHMtZ3JpZHtkaXNwbGF5OmdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maWxsLG1pbm1heCgyNjBweCwxZnIpKTsgZ2FwOjE2cHg7fQouY29udHJhY3QtY2FyZHsKICBiYWNrZ3JvdW5kOnZhcigtLWNhcmQpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9y" +
  "ZGVyLXJhZGl1czp2YXIoLS1yYWRpdXMpOwogIHBhZGRpbmc6MjBweDsgY3Vyc29yOnBvaW50ZXI7IHRyYW5zaXRpb246Ym9yZGVyLWNvbG9yIC4xNXMgZWFzZSwgdHJhbnNmb3JtIC4xcyBlYXNlOwogIGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBnYXA6MTBweDsKfQouY29udHJhY3QtY2FyZDpob3Zlcntib3JkZXItY29sb3I6dmFyKC0taW5rKTsgdHJhbnNmb3JtOnRyYW5z" +
  "bGF0ZVkoLTFweCk7fQouY2MtdG9we2Rpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IGFsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7IGdhcDo4cHg7fQouY2MtdGl0bGV7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTsgZm9udC13ZWlnaHQ6NjAwOyBmb250LXNpemU6MTdweDsgbGluZS1oZWlnaHQ6MS4zO30KLmNjLWJhZGdle2ZvbnQtc2l6ZToxMC41cHg7IGZv" +
  "bnQtd2VpZ2h0OjYwMDsgdGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlOyBsZXR0ZXItc3BhY2luZzouMDRlbTsgcGFkZGluZzo0cHggOXB4OyBib3JkZXItcmFkaXVzOjk5OXB4OyB3aGl0ZS1zcGFjZTpub3dyYXA7fQouY2MtYmFkZ2UuYWN0aXZle2JhY2tncm91bmQ6dmFyKC0tZW1lcmFsZC10aW50KTsgY29sb3I6dmFyKC0tZW1lcmFsZC1kYXJrKTt9Ci5jYy1iYWRnZS5lbmRlZHtiYWNrZ3JvdW5k" +
  "OnZhcigtLXBhcGVyLTIpOyBjb2xvcjp2YXIoLS1pbmstc29mdCk7fQouY2MtbWV0YXtmb250LXNpemU6MTIuNXB4OyBjb2xvcjp2YXIoLS1pbmstc29mdCk7fQouY2MtcHJvZ3Jlc3MtdHJhY2t7aGVpZ2h0OjVweDsgYmFja2dyb3VuZDp2YXIoLS1wYXBlci0yKTsgYm9yZGVyLXJhZGl1czo5OXB4OyBvdmVyZmxvdzpoaWRkZW47fQouY2MtcHJvZ3Jlc3MtZmlsbHtoZWlnaHQ6MTAwJTsgYmFja2dy" +
  "b3VuZDp2YXIoLS1lbWVyYWxkKTt9Ci5jYy1zdGF0c3tkaXNwbGF5OmZsZXg7IGp1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuOyBmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm8pOyBmb250LXNpemU6MTJweDsgY29sb3I6dmFyKC0taW5rLXNvZnQpOyBtYXJnaW4tdG9wOjJweDt9Ci5jYy1zdGF0cyBie2NvbG9yOnZhcigtLWluayk7IGZvbnQtd2VpZ2h0OjYwMDt9Ci5uZXctY2FyZHsKICBi" +
  "b3JkZXI6MS41cHggZGFzaGVkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czp2YXIoLS1yYWRpdXMpOwogIGRpc3BsYXk6ZmxleDsgZmxleC1kaXJlY3Rpb246Y29sdW1uOyBhbGlnbi1pdGVtczpjZW50ZXI7IGp1c3RpZnktY29udGVudDpjZW50ZXI7CiAgZ2FwOjhweDsgcGFkZGluZzoyMHB4OyBjdXJzb3I6cG9pbnRlcjsgY29sb3I6dmFyKC0taW5rLXNvZnQpOyBtaW4taGVpZ2h0" +
  "OjE1MHB4OwogIGJhY2tncm91bmQ6dHJhbnNwYXJlbnQ7Cn0KLm5ldy1jYXJkOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS1pbmspOyBjb2xvcjp2YXIoLS1pbmspO30KLm5ldy1jYXJkIGl7Zm9udC1zaXplOjI0cHg7fQoubmV3LWNhcmQgc3Bhbntmb250LXdlaWdodDo2MDA7IGZvbnQtc2l6ZToxMy41cHg7fQoKLyogLS0tLSB0cmFja2VyIC0tLS0gKi8KLnRyYWNrZXJ7ZGlzcGxheTpncmlkOyBn" +
  "cmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDQsMWZyKTsgbWFyZ2luLWJvdHRvbTo0MHB4OyBwb3NpdGlvbjpyZWxhdGl2ZTt9Ci50cmFja2VyOjpiZWZvcmV7Y29udGVudDoiIjsgcG9zaXRpb246YWJzb2x1dGU7IHRvcDoxOXB4OyBsZWZ0OjEyJTsgcmlnaHQ6MTIlOyBoZWlnaHQ6MXB4OyBiYWNrZ3JvdW5kOnZhcigtLWxpbmUtc3Ryb25nKTsgei1pbmRleDowO30KLnQtc3RlcHtkaXNwbGF5" +
  "OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2FsaWduLWl0ZW1zOmNlbnRlcjsgdGV4dC1hbGlnbjpjZW50ZXI7IHBvc2l0aW9uOnJlbGF0aXZlO3otaW5kZXg6MTsgZ2FwOjhweDt9Ci50LW51bXt3aWR0aDozOHB4O2hlaWdodDozOHB4O2JvcmRlci1yYWRpdXM6NTAlOyBiYWNrZ3JvdW5kOnZhcigtLXBhcGVyKTsgYm9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsgZGlzcGxh" +
  "eTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyBmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm8pOyBmb250LXNpemU6MTNweDtjb2xvcjp2YXIoLS1pbmstZmFpbnQpOyB0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7fQoudC1zdGVwLmFjdGl2ZSAudC1udW17YmFja2dyb3VuZDp2YXIoLS1pbmspOyBib3JkZXItY29sb3I6dmFyKC0taW5rKTsgY29sb3I6dmFy" +
  "KC0td2hpdGUpO30KLnQtc3RlcC5kb25lIC50LW51bXtiYWNrZ3JvdW5kOnZhcigtLWVtZXJhbGQpOyBib3JkZXItY29sb3I6dmFyKC0tZW1lcmFsZCk7IGNvbG9yOnZhcigtLXdoaXRlKTt9Ci50LWxhYmVse2ZvbnQtc2l6ZToxMS41cHg7IGNvbG9yOnZhcigtLWluay1zb2Z0KTsgZm9udC13ZWlnaHQ6NTAwOyBtYXgtd2lkdGg6MTEwcHg7fQoudC1zdGVwLmFjdGl2ZSAudC1sYWJlbHtjb2xvcjp2" +
  "YXIoLS1pbmspOyBmb250LXdlaWdodDo2MDA7fQoKLnBhbmVse2JhY2tncm91bmQ6dmFyKC0tY2FyZCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cyk7IHBhZGRpbmc6MzZweCA0MHB4OyBwb3NpdGlvbjpyZWxhdGl2ZTt9Ci5wYW5lbDo6YmVmb3Jle2NvbnRlbnQ6IiI7IHBvc2l0aW9uOmFic29sdXRlOyBpbnNldDo2cHg7IGJv" +
  "cmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7IGJvcmRlci1yYWRpdXM6N3B4OyBwb2ludGVyLWV2ZW50czpub25lO30KLnN0ZXAtZXllYnJvd3tmb250LXNpemU6MTFweDsgdGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlOyBsZXR0ZXItc3BhY2luZzouMTRlbTsgY29sb3I6dmFyKC0tc2VhbCk7IGZvbnQtd2VpZ2h0OjYwMDsgbWFyZ2luLWJvdHRvbTo2cHg7fQouc3RlcC10aXRsZXtmb250LWZhbWls" +
  "eTp2YXIoLS1mb250LWRpc3BsYXkpOyBmb250LXNpemU6MjhweDsgZm9udC13ZWlnaHQ6NjAwOyBtYXJnaW46MCAwIDZweDt9Ci5zdGVwLXN1Yntjb2xvcjp2YXIoLS1pbmstc29mdCk7IGZvbnQtc2l6ZToxNC41cHg7IG1hcmdpbjowIDAgMjhweDsgbWF4LXdpZHRoOjU2MHB4O30KCmxhYmVsLmZpZWxkLWxhYmVse2Rpc3BsYXk6YmxvY2s7IGZvbnQtd2VpZ2h0OjYwMDsgZm9udC1zaXplOjEzLjVw" +
  "eDsgbWFyZ2luLWJvdHRvbTo4cHg7IGNvbG9yOnZhcigtLWluayk7fQouaGludHtmb250LXNpemU6MTIuNXB4OyBjb2xvcjp2YXIoLS1pbmstZmFpbnQpOyBtYXJnaW4tdG9wOjZweDt9CmlucHV0W3R5cGU9dGV4dF0sIGlucHV0W3R5cGU9ZW1haWxdLCBpbnB1dFt0eXBlPW51bWJlcl0sIGlucHV0W3R5cGU9ZGF0ZV0sIHRleHRhcmVhLCBzZWxlY3R7CiAgd2lkdGg6MTAwJTsgZm9udC1mYW1pbHk6" +
  "dmFyKC0tZm9udC1ib2R5KTsgZm9udC1zaXplOjE0LjVweDsgcGFkZGluZzoxMXB4IDEzcHg7CiAgYm9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lLXN0cm9uZyk7IGJvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzLXNtKTsgYmFja2dyb3VuZDp2YXIoLS13aGl0ZSk7IGNvbG9yOnZhcigtLWluayk7Cn0KdGV4dGFyZWF7cmVzaXplOnZlcnRpY2FsOyBtaW4taGVpZ2h0OjgwcHg7IGZvbnQtZmFtaWx5" +
  "OnZhcigtLWZvbnQtYm9keSk7fQppbnB1dDpmb2N1cywgdGV4dGFyZWE6Zm9jdXMsIHNlbGVjdDpmb2N1c3tvdXRsaW5lOm5vbmU7IGJvcmRlci1jb2xvcjp2YXIoLS1lbWVyYWxkKTsgYm94LXNoYWRvdzowIDAgMCAzcHggcmdiYSgxNiwxODUsMTI5LDAuMTgpO30KLnJvd3tkaXNwbGF5OmZsZXg7IGdhcDoyNHB4OyBmbGV4LXdyYXA6d3JhcDt9Ci5yb3cgPiBkaXZ7ZmxleDoxOyBtaW4td2lkdGg6" +
  "MjIwcHg7fQouZmllbGR7bWFyZ2luLWJvdHRvbToyNHB4O30KCi5jYXQtZ3JpZHtkaXNwbGF5OmdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMiwxZnIpOyBnYXA6NnB4IDIwcHg7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZSk7IGJvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzLXNtKTsgcGFkZGluZzoxNnB4OyBiYWNrZ3JvdW5kOnZhcigtLXdoaXRlKTt9Ci5jYXQtaXRlbXtk" +
  "aXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsgZ2FwOjlweDsgZm9udC1zaXplOjEzLjVweDsgcGFkZGluZzo1cHggMDsgY3Vyc29yOnBvaW50ZXI7IHVzZXItc2VsZWN0Om5vbmU7fQouY2F0LWl0ZW0gaW5wdXR7d2lkdGg6YXV0bzsgcGFkZGluZzowO30KLmNhdC1pdGVtLmRpc2FibGVke29wYWNpdHk6MC4zNTsgY3Vyc29yOm5vdC1hbGxvd2VkO30KCi5jaG9pY2Utcm93e2Rpc3BsYXk6" +
  "ZmxleDsgZ2FwOjE0cHg7IGZsZXgtd3JhcDp3cmFwO30KLmNob2ljZS1jYXJke2ZsZXg6MTsgbWluLXdpZHRoOjE1MHB4OyBib3JkZXI6MS41cHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cy1zbSk7IHBhZGRpbmc6MTZweCAxNHB4OyBjdXJzb3I6cG9pbnRlcjsgdGV4dC1hbGlnbjpjZW50ZXI7IGJhY2tncm91bmQ6dmFyKC0td2hpdGUpOyB0cmFu" +
  "c2l0aW9uOmJvcmRlci1jb2xvciAuMTVzIGVhc2UsIGJhY2tncm91bmQgLjE1cyBlYXNlO30KLmNob2ljZS1jYXJkIGl7Zm9udC1zaXplOjIycHg7IGRpc3BsYXk6YmxvY2s7IG1hcmdpbi1ib3R0b206OHB4OyBjb2xvcjp2YXIoLS1pbmstc29mdCk7fQouY2hvaWNlLWNhcmQgLmNjLWNhcmR0aXRsZXtmb250LXdlaWdodDo2MDA7IGZvbnQtc2l6ZToxMy41cHg7fQouY2hvaWNlLWNhcmQgLmNjLXN1" +
  "YjJ7Zm9udC1zaXplOjExLjVweDsgY29sb3I6dmFyKC0taW5rLWZhaW50KTsgbWFyZ2luLXRvcDozcHg7fQouY2hvaWNlLWNhcmQuc2Vse2JvcmRlci1jb2xvcjp2YXIoLS1pbmspOyBiYWNrZ3JvdW5kOnZhcigtLXBhcGVyLTIpO30KLmNob2ljZS1jYXJkLnNlbCBpe2NvbG9yOnZhcigtLWluayk7fQouY2hvaWNlLWNhcmRbZGF0YS1yZWM9InN0cmVha2NvaW4iXS5zZWx7Ym9yZGVyLWNvbG9yOnZh" +
  "cigtLWdvbGQtZGFyayk7IGJhY2tncm91bmQ6cmdiYSgyNTEsMTkxLDM2LDAuMTQpO30KLmNob2ljZS1jYXJkW2RhdGEtcmVjPSJzdHJlYWtjb2luIl0uc2VsIGl7Y29sb3I6dmFyKC0tZ29sZC1kYXJrKTt9CgouY2hhci1jb3VudHt0ZXh0LWFsaWduOnJpZ2h0OyBmb250LXNpemU6MTEuNXB4OyBjb2xvcjp2YXIoLS1pbmstZmFpbnQpOyBtYXJnaW4tdG9wOjRweDsgZm9udC1mYW1pbHk6dmFyKC0t" +
  "Zm9udC1tb25vKTt9Cgouc3Rha2UtcmVjaXBpZW50c3tkaXNwbGF5OmdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoNSwxZnIpOyBnYXA6MTBweDsgbWFyZ2luLWJvdHRvbTo4cHg7fQpAbWVkaWEobWF4LXdpZHRoOjc2MHB4KXsuc3Rha2UtcmVjaXBpZW50c3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDMsMWZyKTt9fQpAbWVkaWEobWF4LXdpZHRoOjQ4MHB4KXsuc3Rha2Ut" +
  "cmVjaXBpZW50c3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsMWZyKTt9fQoKLmNhbGxvdXR7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkIHZhcigtLXNlYWwpOyBiYWNrZ3JvdW5kOnZhcigtLXNlYWwtdGludCk7IHBhZGRpbmc6MTRweCAxNnB4OyBib3JkZXItcmFkaXVzOjAgdmFyKC0tcmFkaXVzLXNtKSB2YXIoLS1yYWRpdXMtc20pIDA7IGZvbnQtc2l6ZToxM3B4OyBjb2xvcjp2YXIoLS1z" +
  "ZWFsLWRhcmspOyBtYXJnaW46MThweCAwO30KLmNhbGxvdXQuZ29vZHtib3JkZXItY29sb3I6dmFyKC0tZW1lcmFsZCk7IGJhY2tncm91bmQ6dmFyKC0tZW1lcmFsZC10aW50KTsgY29sb3I6dmFyKC0tZW1lcmFsZC1kYXJrKTt9Ci5jYWxsb3V0IG9se21hcmdpbjo2cHggMCAwOyBwYWRkaW5nLWxlZnQ6MThweDt9Ci5jYWxsb3V0IGxpe21hcmdpbi1ib3R0b206MnB4O30KCi5zdGFrZS1jYWxje2Jv" +
  "cmRlcjoxcHggZGFzaGVkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czp2YXIoLS1yYWRpdXMtc20pOyBwYWRkaW5nOjE4cHggMjBweDsgYmFja2dyb3VuZDp2YXIoLS13aGl0ZSk7IG1hcmdpbi10b3A6MjBweDt9Ci5jYWxjLWxpbmV7ZGlzcGxheTpmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjsgYWxpZ24taXRlbXM6YmFzZWxpbmU7IGZvbnQtZmFtaWx5OnZhcigt" +
  "LWZvbnQtbW9ubyk7IGZvbnQtc2l6ZToxMy41cHg7IHBhZGRpbmc6NnB4IDA7IGJvcmRlci1ib3R0b206MXB4IGRvdHRlZCB2YXIoLS1saW5lLXN0cm9uZyk7fQouY2FsYy1saW5lOmxhc3QtY2hpbGR7Ym9yZGVyLWJvdHRvbTpub25lO30KLmNhbGMtbGluZSAuY2wtbGFiZWx7Y29sb3I6dmFyKC0taW5rLXNvZnQpOyBmb250LWZhbWlseTp2YXIoLS1mb250LWJvZHkpO30KLmNhbGMtbGluZSAuY2wt" +
  "dmFse2ZvbnQtd2VpZ2h0OjYwMDt9Ci5jYWxjLXRvdGFse2Rpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtbW9ubyk7IGZvbnQtc2l6ZToxN3B4OyBmb250LXdlaWdodDo2MDA7IHBhZGRpbmctdG9wOjEycHg7IG1hcmdpbi10b3A6NnB4OyBib3JkZXItdG9wOjEuNXB4IHNvbGlkIHZhcigtLWluayk7fQoKLmFncmVlLXJvd3tk" +
  "aXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7IGdhcDoxMHB4OyBmb250LXNpemU6MTNweDsgY29sb3I6dmFyKC0taW5rLXNvZnQpOyBtYXJnaW4tdG9wOjIycHg7fQouYWdyZWUtcm93IGlucHV0e3dpZHRoOmF1dG87IG1hcmdpbi10b3A6M3B4O30KLmFncmVlLXJvdyBhe2NvbG9yOnZhcigtLXNlYWwpOyB0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO30KCi5idG4tcm93e2Rpc3Bs" +
  "YXk6ZmxleDsganVzdGlmeS1jb250ZW50OmZsZXgtZW5kOyBnYXA6MTBweDsgbWFyZ2luLXRvcDozMnB4OyBwYWRkaW5nLXRvcDoyMnB4OyBib3JkZXItdG9wOjFweCBzb2xpZCB2YXIoLS1saW5lKTsgZmxleC13cmFwOndyYXA7fQpidXR0b257Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1ib2R5KTsgZm9udC13ZWlnaHQ6NjAwOyBmb250LXNpemU6MTMuNXB4OyBwYWRkaW5nOjEycHggMjJweDsgYm9y" +
  "ZGVyLXJhZGl1czo5OTlweDsgYm9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWluayk7IGJhY2tncm91bmQ6dHJhbnNwYXJlbnQ7IGNvbG9yOnZhcigtLWluayk7IGN1cnNvcjpwb2ludGVyOyB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuMTJzIGVhc2UsIGJhY2tncm91bmQgLjE1cyBlYXNlO30KYnV0dG9uOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tcGFwZXItMik7fQpidXR0b246YWN0aXZle3RyYW5zZm9y" +
  "bTpzY2FsZSgwLjk3KTt9CmJ1dHRvbi5wcmltYXJ5e2JhY2tncm91bmQ6dmFyKC0tZW1lcmFsZCk7IGJvcmRlci1jb2xvcjp2YXIoLS1lbWVyYWxkKTsgY29sb3I6IzAyMmMyMjt9CmJ1dHRvbi5wcmltYXJ5OmhvdmVye2JhY2tncm91bmQ6dmFyKC0tZW1lcmFsZC1kYXJrKTsgYm9yZGVyLWNvbG9yOnZhcigtLWVtZXJhbGQtZGFyayk7fQpidXR0b24uZ2hvc3R7Ym9yZGVyLWNvbG9yOnRyYW5zcGFy" +
  "ZW50OyBjb2xvcjp2YXIoLS1pbmstc29mdCk7fQpidXR0b24uZ2hvc3Q6aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1wYXBlci0yKTt9CmJ1dHRvbi5kYW5nZXItYnRue2JvcmRlci1jb2xvcjp2YXIoLS1zZWFsKTsgY29sb3I6dmFyKC0tc2VhbC1kYXJrKTt9CmJ1dHRvbi5kYW5nZXItYnRuOmhvdmVye2JhY2tncm91bmQ6dmFyKC0tc2VhbC10aW50KTt9CmJ1dHRvbi5nb29kLWJ0bntib3JkZXItY29s" +
  "b3I6dmFyKC0tZW1lcmFsZCk7IGNvbG9yOnZhcigtLWVtZXJhbGQtZGFyayk7fQpidXR0b24uZ29vZC1idG46aG92ZXJ7YmFja2dyb3VuZDp2YXIoLS1lbWVyYWxkLXRpbnQpO30KYnV0dG9uOmRpc2FibGVke29wYWNpdHk6MC40OyBjdXJzb3I6bm90LWFsbG93ZWQ7fQpidXR0b24uc21hbGx7cGFkZGluZzo4cHggMTRweDsgZm9udC1zaXplOjEyLjVweDt9CgouZnJpZW5kLWNoaXB7ZGlzcGxheTpp" +
  "bmxpbmUtZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBnYXA6OHB4OyBiYWNrZ3JvdW5kOnZhcigtLXBhcGVyLTIpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czo5OTlweDsgcGFkZGluZzo2cHggOHB4IDZweCAxNHB4OyBmb250LXNpemU6MTNweDsgbWFyZ2luOjRweCA2cHggNHB4IDA7fQouZnJpZW5kLWNoaXAgYnV0dG9ue2JvcmRlcjpub25lOyBi" +
  "YWNrZ3JvdW5kOm5vbmU7IHBhZGRpbmc6MnB4IDZweDsgZm9udC1zaXplOjE0cHg7IGJvcmRlci1yYWRpdXM6NTAlOyBjb2xvcjp2YXIoLS1pbmstZmFpbnQpO30KLmZyaWVuZC1jaGlwIGJ1dHRvbjpob3ZlcntiYWNrZ3JvdW5kOnZhcigtLXBhcGVyKTsgY29sb3I6dmFyKC0tc2VhbCk7fQouYWRkLWZyaWVuZC1yb3d7ZGlzcGxheTpmbGV4OyBnYXA6MTBweDt9Ci5hZGQtZnJpZW5kLXJvdyBpbnB1" +
  "dHtmbGV4OjE7fQoKLnN0YW1wLXdyYXB7ZGlzcGxheTpmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyBwYWRkaW5nOjE0cHggMCA2cHg7fQouc3RhbXB7d2lkdGg6MTIwcHg7IGhlaWdodDoxMjBweDsgYm9yZGVyLXJhZGl1czo1MCU7IGJvcmRlcjozcHggc29saWQgdmFyKC0tc2VhbCk7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyB0" +
  "cmFuc2Zvcm06cm90YXRlKC0xMWRlZykgc2NhbGUoMC40KTsgb3BhY2l0eTowOyB0cmFuc2l0aW9uOnRyYW5zZm9ybSAuNTVzIGN1YmljLWJlemllciguMiwxLjQsLjQsMSksIG9wYWNpdHkgLjRzIGVhc2U7fQouc3RhbXAuc2hvd3t0cmFuc2Zvcm06cm90YXRlKC0xMWRlZykgc2NhbGUoMSk7IG9wYWNpdHk6MTt9Ci5zdGFtcC1pbm5lcntib3JkZXI6MXB4IHNvbGlkIHZhcigtLXNlYWwpOyBib3Jk" +
  "ZXItcmFkaXVzOjUwJTsgd2lkdGg6OTZweDsgaGVpZ2h0Ojk2cHg7IGRpc3BsYXk6ZmxleDsgYWxpZ24taXRlbXM6Y2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyOyB0ZXh0LWFsaWduOmNlbnRlcjsgZm9udC1mYW1pbHk6dmFyKC0tZm9udC1kaXNwbGF5KTsgZm9udC13ZWlnaHQ6NjAwOyBmb250LXNpemU6MTNweDsgbGV0dGVyLXNwYWNpbmc6LjA2ZW07IGNvbG9yOnZhcigtLXNlYWwpOyB0" +
  "ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7IGxpbmUtaGVpZ2h0OjEuMzt9CgoucGFzc2Jvb2t7YmFja2dyb3VuZDp2YXIoLS13aGl0ZSk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cy1zbSk7IHBhZGRpbmc6NHB4IDA7IG1hcmdpbjoyMnB4IDA7fQoucGItcm93e2Rpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJl" +
  "dHdlZW47IGFsaWduLWl0ZW1zOmJhc2VsaW5lOyBwYWRkaW5nOjEwcHggMjBweDsgYm9yZGVyLWJvdHRvbToxcHggZGFzaGVkIHZhcigtLWxpbmUpOyBmb250LXNpemU6MTMuNXB4O30KLnBiLXJvdzpsYXN0LWNoaWxke2JvcmRlci1ib3R0b206bm9uZTt9Ci5wYi1yb3cgLnBiLWt7Y29sb3I6dmFyKC0taW5rLXNvZnQpO30KLnBiLXJvdyAucGItdntmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm8p" +
  "OyBmb250LXdlaWdodDo2MDA7fQoKLndhbGxldC1jYXJkc3tkaXNwbGF5OmdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KDE1MHB4LDFmcikpOyBnYXA6MTRweDsgbWFyZ2luLWJvdHRvbToyNnB4O30KLndjYXJke2JhY2tncm91bmQ6dmFyKC0td2hpdGUpOyBib3JkZXI6MXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsgYm9yZGVyLXJhZGl1czp2YXIo" +
  "LS1yYWRpdXMtc20pOyBwYWRkaW5nOjE2cHggMThweDt9Ci53Y2FyZCAud2MtbGFiZWx7Zm9udC1zaXplOjExLjVweDsgdGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlOyBsZXR0ZXItc3BhY2luZzouMDhlbTsgY29sb3I6dmFyKC0taW5rLWZhaW50KTsgZm9udC13ZWlnaHQ6NjAwO30KLndjYXJkIC53Yy12YWx7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1tb25vKTsgZm9udC1zaXplOjIycHg7IGZvbnQt" +
  "d2VpZ2h0OjYwMDsgbWFyZ2luLXRvcDo2cHg7fQoud2NhcmQubG9jayAud2MtdmFse2NvbG9yOnZhcigtLXNlYWwtZGFyayk7fQoud2NhcmQucmV3YXJkIC53Yy12YWx7Y29sb3I6dmFyKC0tZW1lcmFsZC1kYXJrKTt9Ci53Y2FyZC5zdHJlYWsgLndjLXZhbHtjb2xvcjp2YXIoLS1nb2xkLWRhcmspO30KLndjYXJkLnN0cmVhayAud2MtbGFiZWwgaXttYXJnaW4tcmlnaHQ6NHB4O30KCi50b3B1cC1i" +
  "b3h7Ym9yZGVyOjFweCBkYXNoZWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cy1zbSk7IHBhZGRpbmc6MjBweDsgYmFja2dyb3VuZDp2YXIoLS1wYXBlci0yKTt9Ci50b3B1cC1yb3d7ZGlzcGxheTpmbGV4OyBnYXA6MTBweDsgYWxpZ24taXRlbXM6Y2VudGVyO30KLnRvcHVwLXJvdyBpbnB1dHtmbGV4OjE7fQoKLmJhY2stbGlua3sKICBkaXNwbGF5OmlubGlu" +
  "ZS1mbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGdhcDo4cHg7CiAgY29sb3I6dmFyKC0taW5rKTsgZm9udC1zaXplOjE0LjVweDsgZm9udC13ZWlnaHQ6NjAwOwogIGN1cnNvcjpwb2ludGVyOyBtYXJnaW4tYm90dG9tOjIycHg7CiAgYmFja2dyb3VuZDp2YXIoLS1jYXJkKTsgYm9yZGVyOjEuNXB4IHNvbGlkIHZhcigtLWxpbmUtc3Ryb25nKTsKICBib3JkZXItcmFkaXVzOjk5OXB4OyBwYWRkaW5n" +
  "OjExcHggMjBweCAxMXB4IDE2cHg7CiAgdHJhbnNpdGlvbjpib3JkZXItY29sb3IgLjE1cyBlYXNlLCBiYWNrZ3JvdW5kIC4xNXMgZWFzZSwgdHJhbnNmb3JtIC4xcyBlYXNlOwp9Ci5iYWNrLWxpbmsgaXtmb250LXNpemU6MTZweDt9Ci5iYWNrLWxpbms6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLWVtZXJhbGQpOyBjb2xvcjp2YXIoLS1lbWVyYWxkLWRhcmspOyBiYWNrZ3JvdW5kOnZhcigtLWVt" +
  "ZXJhbGQtdGludCk7fQouYmFjay1saW5rOmFjdGl2ZXt0cmFuc2Zvcm06c2NhbGUoMC45Nyk7fQoKLmRhc2gtaGVhZGVye2Rpc3BsYXk6ZmxleDsganVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47IGFsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7IG1hcmdpbi1ib3R0b206MjZweDsgZmxleC13cmFwOndyYXA7IGdhcDoxNnB4O30KLmRhc2gtZ29hbHtmb250LWZhbWlseTp2YXIoLS1mb250LWRpc3Bs" +
  "YXkpOyBmb250LXNpemU6MjJweDsgZm9udC13ZWlnaHQ6NjAwOyBtYXgtd2lkdGg6NTIwcHg7fQouZGFzaC1tZXRhe2ZvbnQtc2l6ZToxMi41cHg7IGNvbG9yOnZhcigtLWluay1zb2Z0KTsgbWFyZ2luLXRvcDo0cHg7fQoucHJvZ3Jlc3MtdHJhY2t7aGVpZ2h0OjZweDsgYmFja2dyb3VuZDp2YXIoLS1wYXBlci0yKTsgYm9yZGVyLXJhZGl1czo5OXB4OyBvdmVyZmxvdzpoaWRkZW47IG1hcmdpbjox" +
  "OHB4IDAgMjZweDt9Ci5wcm9ncmVzcy1maWxse2hlaWdodDoxMDAlOyBiYWNrZ3JvdW5kOnZhcigtLWVtZXJhbGQpO30KCi5sZWRnZXJ7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1saW5lLXN0cm9uZyk7IGJvcmRlci1yYWRpdXM6dmFyKC0tcmFkaXVzLXNtKTsgb3ZlcmZsb3c6aGlkZGVuO30KLmxlZGdlci1yb3d7ZGlzcGxheTpncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6NDRweCAxZnIgYXV0" +
  "byBhdXRvOyBnYXA6MTRweDsgYWxpZ24taXRlbXM6Y2VudGVyOyBwYWRkaW5nOjE0cHggMThweDsgYm9yZGVyLWJvdHRvbToxcHggc29saWQgdmFyKC0tbGluZSk7IGJhY2tncm91bmQ6dmFyKC0td2hpdGUpO30KLmxlZGdlci1yb3c6bGFzdC1jaGlsZHtib3JkZXItYm90dG9tOm5vbmU7fQoubGVkZ2VyLXJvdy5wYXN0e2JhY2tncm91bmQ6dmFyKC0tcGFwZXIpO30KLmxyLWlkeHt3aWR0aDozMnB4" +
  "OyBoZWlnaHQ6MzJweDsgYm9yZGVyLXJhZGl1czo1MCU7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7IGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtbW9ubyk7IGZvbnQtc2l6ZToxMnB4OyBjb2xvcjp2YXIoLS1pbmstc29mdCk7fQoubHItaWR4LndpbntiYWNrZ3JvdW5kOnZhcigt" +
  "LWVtZXJhbGQpOyBib3JkZXItY29sb3I6dmFyKC0tZW1lcmFsZCk7IGNvbG9yOnZhcigtLXdoaXRlKTt9Ci5sci1pZHgubG9zc3tiYWNrZ3JvdW5kOnZhcigtLXNlYWwpOyBib3JkZXItY29sb3I6dmFyKC0tc2VhbCk7IGNvbG9yOnZhcigtLXdoaXRlKTt9Ci5sci1tYWluIC5sci1kYXRle2ZvbnQtd2VpZ2h0OjYwMDsgZm9udC1zaXplOjEzLjVweDt9Ci5sci1tYWluIC5sci1zdWJ7Zm9udC1zaXpl" +
  "OjEycHg7IGNvbG9yOnZhcigtLWluay1mYWludCk7IG1hcmdpbi10b3A6MnB4O30KLmxyLWFtdHtmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm8pOyBmb250LXNpemU6MTMuNXB4OyB0ZXh0LWFsaWduOnJpZ2h0OyBtaW4td2lkdGg6OTBweDt9Ci5sci1hY3Rpb25ze2Rpc3BsYXk6ZmxleDsgZ2FwOjhweDt9Ci5sci10YWd7Zm9udC1zaXplOjExcHg7IGZvbnQtd2VpZ2h0OjYwMDsgcGFkZGluZzo1" +
  "cHggMTBweDsgYm9yZGVyLXJhZGl1czo5OTlweDsgdGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlOyBsZXR0ZXItc3BhY2luZzouMDRlbTt9Ci5sci10YWcud2lue2JhY2tncm91bmQ6dmFyKC0tZW1lcmFsZC10aW50KTsgY29sb3I6dmFyKC0tZW1lcmFsZC1kYXJrKTt9Ci5sci10YWcubG9zc3tiYWNrZ3JvdW5kOnZhcigtLXNlYWwtdGludCk7IGNvbG9yOnZhcigtLXNlYWwtZGFyayk7fQoubHItdGFn" +
  "LndhaXR7YmFja2dyb3VuZDp2YXIoLS1wYXBlci0yKTsgY29sb3I6dmFyKC0taW5rLWZhaW50KTt9CgouZm9vdC1ub3Rle2ZvbnQtc2l6ZToxMnB4OyBjb2xvcjp2YXIoLS1pbmstZmFpbnQpOyB0ZXh0LWFsaWduOmNlbnRlcjsgbWFyZ2luLXRvcDozNHB4O30KLmZvb3QtbGlua3tiYWNrZ3JvdW5kOm5vbmU7IGJvcmRlcjpub25lOyBjb2xvcjp2YXIoLS1pbmstZmFpbnQpOyB0ZXh0LWRlY29yYXRp" +
  "b246dW5kZXJsaW5lOyBjdXJzb3I6cG9pbnRlcjsgZm9udC1zaXplOjEycHg7IGZvbnQtZmFtaWx5OnZhcigtLWZvbnQtYm9keSk7fQouaGlkZGVue2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50O30KLm1vZGFsLW92ZXJsYXl7cG9zaXRpb246Zml4ZWQ7IGluc2V0OjA7IGJhY2tncm91bmQ6cmdiYSgzMiwzOCw1OCwwLjUpOyBkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsganVzdGlmeS1j" +
  "b250ZW50OmNlbnRlcjsgei1pbmRleDoxMDAwOyBwYWRkaW5nOjIwcHg7fQoubW9kYWwtYm94e2JhY2tncm91bmQ6dmFyKC0tY2FyZCk7IGJvcmRlcjoxcHggc29saWQgdmFyKC0tbGluZS1zdHJvbmcpOyBib3JkZXItcmFkaXVzOnZhcigtLXJhZGl1cyk7IHBhZGRpbmc6MjZweCAyOHB4OyBtYXgtd2lkdGg6MzgwcHg7IHdpZHRoOjEwMCU7IGJveC1zaGFkb3c6MCAxMnB4IDQwcHggcmdiYSgyMCwy" +
  "MiwzNCwwLjI4KTt9Ci5tb2RhbC1ib3ggcHtmb250LXNpemU6MTRweDsgY29sb3I6dmFyKC0taW5rKTsgbWFyZ2luOjAgMCAyMnB4OyBsaW5lLWhlaWdodDoxLjU1O30KLm1vZGFsLWFjdGlvbnN7ZGlzcGxheTpmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7IGdhcDoxMHB4O30KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KPGRpdiBjbGFzcz0id3JhcCI+CgogIDxkaXYgY2xhc3M9Im1hc3Ro" +
  "ZWFkIj4KICAgIDxkaXYgY2xhc3M9ImJyYW5kIj4KICAgICAgPGRpdiBjbGFzcz0iYnJhbmQtbWFyayI+QzwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJicmFuZC10ZXh0Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJleWVicm93Ij5UaGUgQ29tbWl0bWVudCBMZWRnZXI8L2Rpdj4KICAgICAgICA8aDE+SGFiaXQgQ29udHJhY3RzPC9oMT4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xh" +
  "c3M9IndhbGxldC1waWxsIj4KICAgICAgPHNwYW4+PHNwYW4gY2xhc3M9ImxibCI+V2FsbGV0PC9zcGFuPjxiIGlkPSJoZHItd2FsbGV0Ij7igrkwPC9iPjwvc3Bhbj4KICAgICAgPHNwYW4+PHNwYW4gY2xhc3M9ImxibCI+QXQgc3Rha2U8L3NwYW4+PHNwYW4gaWQ9Imhkci1sb2NrZWQiPuKCuTA8L3NwYW4+PC9zcGFuPgogICAgICA8c3Bhbj48c3BhbiBjbGFzcz0ibGJsIj48aSBjbGFzcz0idGkg" +
  "dGktZmxhbWUiIHN0eWxlPSJmb250LXNpemU6MTJweDsgdmVydGljYWwtYWxpZ246LTFweDsgY29sb3I6dmFyKC0tZ29sZC1kYXJrKTsiIGFyaWEtaGlkZGVuPSJ0cnVlIj48L2k+IFN0cmVhayBjb2luPC9zcGFuPjxzcGFuIGlkPSJoZHItc3RyZWFrIj7igrkwPC9zcGFuPjwvc3Bhbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8IS0tIFNDUkVFTjogTElTVCAtLT4KICA8ZGl2IGNsYXNzPSJzY3Jl" +
  "ZW4iIGlkPSJzY3JlZW4tbGlzdCI+CiAgICA8ZGl2IGNsYXNzPSJsaXN0LWhlYWRlciI+CiAgICAgIDxkaXY+CiAgICAgICAgPGgyPllvdXIgaGFiaXQgY29udHJhY3RzPC9oMj4KICAgICAgICA8cD5FdmVyeSBjb250cmFjdCBydW5zIG9uIGl0cyBvd24gZ29hbCBhbmQgc3Rha2VzLCBidXQgdGhleSBhbGwgZHJhdyBmcm9tIG9uZSB3YWxsZXQuPC9wPgogICAgICA8L2Rpdj4KICAgICAgPGJ1dHRv" +
  "biBjbGFzcz0icHJpbWFyeSIgb25jbGljaz0iZ29OZXdDb250cmFjdCgpIj5OZXcgaGFiaXQgY29udHJhY3Q8L2J1dHRvbj4KICAgIDwvZGl2PgogICAgPGRpdiBjbGFzcz0iZW1wdHktc3RhdGUgaGlkZGVuIiBpZD0iY29udHJhY3RzLWVtcHR5Ij4KICAgICAgPGRpdiBjbGFzcz0iZXMtaWNvbiI+PGkgY2xhc3M9InRpIHRpLWZsYWctMyIgYXJpYS1oaWRkZW49InRydWUiPjwvaT48L2Rpdj4KICAg" +
  "ICAgPGgzPk5vIGNvbnRyYWN0cyB5ZXQ8L2gzPgogICAgICA8cD5TdGFydCB5b3VyIGZpcnN0IGNvbW1pdG1lbnQgY29udHJhY3Qg4oCUIHBpY2sgYSBnb2FsLCBzZXQgdGhlIHN0YWtlcywgYW5kIGZ1bmQgaXQgc28gc3VjY2VzcyBhbmQgc2xpcC11cHMgYm90aCBoYXBwZW4gaW4gcmVhbCBtb25leSwgaW1tZWRpYXRlbHkuPC9wPgogICAgICA8YnV0dG9uIGNsYXNzPSJwcmltYXJ5IiBvbmNsaWNr" +
  "PSJnb05ld0NvbnRyYWN0KCkiPkNyZWF0ZSB5b3VyIGZpcnN0IGNvbnRyYWN0PC9idXR0b24+CiAgICA8L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImNvbnRyYWN0cy1ncmlkIiBpZD0iY29udHJhY3RzLWdyaWQiPjwvZGl2PgogIDwvZGl2PgoKICA8IS0tIFNDUkVFTjogV0laQVJEIC0tPgogIDxkaXYgY2xhc3M9InNjcmVlbiBoaWRkZW4iIGlkPSJzY3JlZW4td2l6YXJkIj4KICAgIDxkaXYgY2xhc3M9" +
  "InRyYWNrZXIiIGlkPSJ0cmFja2VyIj4KICAgICAgPGRpdiBjbGFzcz0idC1zdGVwIiBkYXRhLXM9IjEiPjxkaXYgY2xhc3M9InQtbnVtIj4xPC9kaXY+PGRpdiBjbGFzcz0idC1sYWJlbCI+U2VsZWN0IHlvdXIgZ29hbDwvZGl2PjwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJ0LXN0ZXAiIGRhdGEtcz0iMiI+PGRpdiBjbGFzcz0idC1udW0iPjI8L2Rpdj48ZGl2IGNsYXNzPSJ0LWxhYmVsIj5TZXQg" +
  "dGhlIHN0YWtlcyAobW9uZXkgaXMgb3B0aW9uYWwpPC9kaXY+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InQtc3RlcCIgZGF0YS1zPSIzIj48ZGl2IGNsYXNzPSJ0LW51bSI+MzwvZGl2PjxkaXYgY2xhc3M9InQtbGFiZWwiPkdldCBhIHJlZmVyZWU8L2Rpdj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0idC1zdGVwIiBkYXRhLXM9IjQiPjxkaXYgY2xhc3M9InQtbnVtIj40PC9kaXY+PGRpdiBjbGFz" +
  "cz0idC1sYWJlbCI+QWRkIGZyaWVuZHMgZm9yIHN1cHBvcnQ8L2Rpdj48L2Rpdj4KICAgIDwvZGl2PgoKICAgIDwhLS0gU1RFUCAxIC0tPgogICAgPGRpdiBjbGFzcz0icGFuZWwgc3RlcC1wYW5lbCIgaWQ9InBhbmVsLTEiPgogICAgICA8ZGl2IGNsYXNzPSJzdGVwLWV5ZWJyb3ciPkN1c3RvbSBnb2FsPC9kaXY+CiAgICAgIDxoMiBjbGFzcz0ic3RlcC10aXRsZSI+U2VsZWN0IHlvdXIgZ29hbDwv" +
  "aDI+CiAgICAgIDxwIGNsYXNzPSJzdGVwLXN1YiI+WW91ciBwcml2YWN5IGlzIGltcG9ydGFudCB0byB1cy4gWW91IGNhbiBhZGp1c3QgeW91ciBwcml2YWN5IHNldHRpbmdzIG9uY2UgeW91J3JlIGRvbmUgY3JlYXRpbmcgeW91ciBjb21taXRtZW50LjwvcD4KCiAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgICAgICA8bGFiZWwgY2xhc3M9ImZpZWxkLWxhYmVsIj5DcmVhdGUgeW91ciBvd24g" +
  "Z29hbDwvbGFiZWw+CiAgICAgICAgPGlucHV0IHR5cGU9InRleHQiIGlkPSJnLXRpdGxlIiBwbGFjZWhvbGRlcj0iUnVuIDUga20gZXZlcnkgbW9ybmluZyI+CiAgICAgIDwvZGl2PgoKICAgICAgPGRpdiBjbGFzcz0iZmllbGQiPgogICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiPkdvYWwgY2F0ZWdvcnkgPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OjQwMDtjb2xvcjp2YXIoLS1pbmst" +
  "ZmFpbnQpIj4oY2hlY2sgdXAgdG8gMyk8L3NwYW4+PC9sYWJlbD4KICAgICAgICA8ZGl2IGNsYXNzPSJjYXQtZ3JpZCIgaWQ9ImNhdC1ncmlkIj48L2Rpdj4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+CiAgICAgICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+SSdkIGxpa2UgdG8gcmVwb3J0PC9sYWJlbD4KICAgICAgICA8ZGl2IGNsYXNzPSJjaG9pY2Utcm93IiBp" +
  "ZD0iZnJlcS1yb3ciPgogICAgICAgICAgPGRpdiBjbGFzcz0iY2hvaWNlLWNhcmQiIGRhdGEtZnJlcT0iZGFpbHkiPjxpIGNsYXNzPSJ0aSB0aS1jYWxlbmRhci1ldmVudCIgYXJpYS1oaWRkZW49InRydWUiPjwvaT48ZGl2IGNsYXNzPSJjYy1jYXJkdGl0bGUiPkRhaWx5PC9kaXY+PGRpdiBjbGFzcz0iY2Mtc3ViMiI+UmVwb3J0IGV2ZXJ5IGRheTwvZGl2PjwvZGl2PgogICAgICAgICAgPGRpdiBj" +
  "bGFzcz0iY2hvaWNlLWNhcmQiIGRhdGEtZnJlcT0id2Vla2x5Ij48aSBjbGFzcz0idGkgdGktY2FsZW5kYXItd2VlayIgYXJpYS1oaWRkZW49InRydWUiPjwvaT48ZGl2IGNsYXNzPSJjYy1jYXJkdGl0bGUiPldlZWtseTwvZGl2PjxkaXYgY2xhc3M9ImNjLXN1YjIiPlJlcG9ydCBvbmNlIGEgd2VlazwvZGl2PjwvZGl2PgogICAgICAgICAgPGRpdiBjbGFzcz0iY2hvaWNlLWNhcmQiIGRhdGEtZnJl" +
  "cT0ib25jZSI+PGkgY2xhc3M9InRpIHRpLWNhbGVuZGFyLWNoZWNrIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PC9pPjxkaXYgY2xhc3M9ImNjLWNhcmR0aXRsZSI+T25jZSwgYXQgdGhlIGVuZDwvZGl2PjxkaXYgY2xhc3M9ImNjLXN1YjIiPlNpbmdsZSBmaW5hbCByZXBvcnQ8L2Rpdj48L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJmaWVsZCI+CiAgICAg" +
  "ICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+SSBjb21taXQgdG8gPHNwYW4gc3R5bGU9ImZvbnQtd2VpZ2h0OjQwMDtjb2xvcjp2YXIoLS1pbmstZmFpbnQpIj4oNTAwIGNoYXJhY3RlcnMgbWF4KTwvc3Bhbj48L2xhYmVsPgogICAgICAgIDx0ZXh0YXJlYSBpZD0iZy1jb21taXQiIG1heGxlbmd0aD0iNTAwIiBwbGFjZWhvbGRlcj0iRGVzY3JpYmUgZXhhY3RseSB3aGF0IGNvdW50cyBhcyBz" +
  "dWNjZXNzIGZvciBlYWNoIHJlcG9ydC4iPjwvdGV4dGFyZWE+CiAgICAgICAgPGRpdiBjbGFzcz0iY2hhci1jb3VudCI+PHNwYW4gaWQ9ImctY29tbWl0LWNvdW50Ij4wPC9zcGFuPi81MDA8L2Rpdj4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiPkNvbW1pdG1l" +
  "bnQgc3RhcnRzIG9uPC9sYWJlbD4KICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0iZy1zdGFydCI+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iZmllbGQiPgogICAgICAgICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+Q29tbWl0bWVudCBlbmRzIG9uPC9sYWJlbD4KICAgICAgICAgIDxpbnB1dCB0eXBlPSJkYXRlIiBpZD0iZy1lbmQiPgogICAgICAgIDwvZGl2" +
  "PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9ImJ0bi1yb3ciPgogICAgICAgIDxidXR0b24gY2xhc3M9Imdob3N0IiBvbmNsaWNrPSJjYW5jZWxXaXphcmQoKSI+Q2FuY2VsPC9idXR0b24+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0icHJpbWFyeSIgb25jbGljaz0iZ29TdGVwKDIpIj5OZXh0IHN0ZXA8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8IS0tIFNURVAg" +
  "MiAtLT4KICAgIDxkaXYgY2xhc3M9InBhbmVsIHN0ZXAtcGFuZWwgaGlkZGVuIiBpZD0icGFuZWwtMiI+CiAgICAgIDxkaXYgY2xhc3M9InN0ZXAtZXllYnJvdyI+Q3VzdG9tIGdvYWw8L2Rpdj4KICAgICAgPGgyIGNsYXNzPSJzdGVwLXRpdGxlIj5TZXQgdGhlIHN0YWtlczwvaDI+CiAgICAgIDxwIGNsYXNzPSJzdGVwLXN1YiI+UmVhbCBtb25leSwgbW92ZWQgdGhlIG1vbWVudCB5b3UgcmVwb3J0" +
  "LiBGdW5kIHRoZSBjb250cmFjdCB1cCBmcm9udCwgdGhlbiBldmVyeSByZXBvcnQgcGF5cyBvdXQgb3IgcGF5cyBhd2F5IGltbWVkaWF0ZWx5IOKAlCBubyB3YWl0aW5nIHVudGlsIHRoZSBlbmQuPC9wPgoKICAgICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+V2hlcmUgZG9lcyBmb3JmZWl0ZWQgbW9uZXkgZ28/PC9sYWJlbD4KICAgICAgPGRpdiBjbGFzcz0ic3Rha2UtcmVjaXBpZW50cyIg" +
  "aWQ9InJlY2lwaWVudC1yb3ciPgogICAgICAgIDxkaXYgY2xhc3M9ImNob2ljZS1jYXJkIiBkYXRhLXJlYz0iYW50aWNoYXJpdHkiPjxpIGNsYXNzPSJ0aSB0aS1mbGFnLW9mZiIgYXJpYS1oaWRkZW49InRydWUiPjwvaT48ZGl2IGNsYXNzPSJjYy1jYXJkdGl0bGUiPkFudGktY2hhcml0eTwvZGl2PjxkaXYgY2xhc3M9ImNjLXN1YjIiPkEgY2F1c2UgeW91IG9wcG9zZTwvZGl2PjwvZGl2PgogICAg" +
  "ICAgIDxkaXYgY2xhc3M9ImNob2ljZS1jYXJkIiBkYXRhLXJlYz0iY2hhcml0eSI+PGkgY2xhc3M9InRpIHRpLWhlYXJ0LWhhbmRzaGFrZSIgYXJpYS1oaWRkZW49InRydWUiPjwvaT48ZGl2IGNsYXNzPSJjYy1jYXJkdGl0bGUiPkNoYXJpdHk8L2Rpdj48ZGl2IGNsYXNzPSJjYy1zdWIyIj5BIGNhdXNlIHlvdSBzdXBwb3J0PC9kaXY+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iY2hvaWNlLWNh" +
  "cmQiIGRhdGEtcmVjPSJzdHJlYWtjb2luIj48aSBjbGFzcz0idGkgdGktZmxhbWUiIGFyaWEtaGlkZGVuPSJ0cnVlIj48L2k+PGRpdiBjbGFzcz0iY2MtY2FyZHRpdGxlIj5TdHJlYWsgY29pbjwvZGl2PjxkaXYgY2xhc3M9ImNjLXN1YjIiPlN0YXlzIHlvdXJzLCBhcyBjb2luPC9kaXY+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0iY2hvaWNlLWNhcmQiIGRhdGEtcmVjPSJwbGF0Zm9ybSI+PGkg" +
  "Y2xhc3M9InRpIHRpLWJ1aWxkaW5nLWJhbmsiIGFyaWEtaGlkZGVuPSJ0cnVlIj48L2k+PGRpdiBjbGFzcz0iY2MtY2FyZHRpdGxlIj5TdXBwb3J0IHVzPC9kaXY+PGRpdiBjbGFzcz0iY2Mtc3ViMiI+S2VlcHMgdGhlIGxpZ2h0cyBvbjwvZGl2PjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImNob2ljZS1jYXJkIiBkYXRhLXJlYz0ibm9uZSI+PGkgY2xhc3M9InRpIHRpLWJhbiIgYXJpYS1oaWRk" +
  "ZW49InRydWUiPjwvaT48ZGl2IGNsYXNzPSJjYy1jYXJkdGl0bGUiPk5vIG1vbmV5PC9kaXY+PGRpdiBjbGFzcz0iY2Mtc3ViMiI+UmV3YXJkLW9ubHkgY29udHJhY3Q8L2Rpdj48L2Rpdj4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIiBpZD0ib3JnLWZpZWxkIiBzdHlsZT0ibWFyZ2luLXRvcDoxNHB4OyI+CiAgICAgICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+Q2hv" +
  "b3NlIG9yZ2FuaXNhdGlvbjwvbGFiZWw+CiAgICAgICAgPHNlbGVjdCBpZD0iZy1vcmciPgogICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iIj5TZWxlY3Qgb25lPC9vcHRpb24+CiAgICAgICAgPC9zZWxlY3Q+CiAgICAgIDwvZGl2PgoKICAgICAgPGRpdiBjbGFzcz0iY2FsbG91dCIgaWQ9InJlYy1ub3RlIj5BdCB0aGUgZW5kIG9mIGVhY2ggcmVwb3J0aW5nIHBlcmlvZCwgYW55IHN0YWtlIHlvdSBm" +
  "b3JmZWl0IGdvZXMgc3RyYWlnaHQgdG8geW91ciBzZWxlY3RlZCByZWNpcGllbnQuPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJyb3ciPgogICAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIiBpZD0ic3Rha2UtZmllbGQiPgogICAgICAgICAgPGxhYmVsIGNsYXNzPSJmaWVsZC1sYWJlbCI+QW1vdW50IGF0IHN0YWtlIGZvciBlYWNoIHJlcG9ydCAobG9zcyk8L2xhYmVsPgogICAgICAgICAgPGRpdiBz" +
  "dHlsZT0iZGlzcGxheTpmbGV4OyBhbGlnbi1pdGVtczpjZW50ZXI7IGdhcDo4cHg7Ij4KICAgICAgICAgICAgPHNwYW4gc3R5bGU9ImZvbnQtZmFtaWx5OnZhcigtLWZvbnQtbW9ubyk7IGZvbnQtd2VpZ2h0OjYwMDsiPuKCuTwvc3Bhbj4KICAgICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgbWluPSIwIiBzdGVwPSIxMCIgaWQ9Imctc3Rha2UiIHBsYWNlaG9sZGVyPSIwIj4KICAgICAgICAg" +
  "IDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiPlJld2FyZCBmb3IgZWFjaCBzdWNjZXNzZnVsIHJlcG9ydDwvbGFiZWw+CiAgICAgICAgICA8ZGl2IHN0eWxlPSJkaXNwbGF5OmZsZXg7IGFsaWduLWl0ZW1zOmNlbnRlcjsgZ2FwOjhweDsiPgogICAgICAgICAgICA8c3BhbiBzdHlsZT0iZm9u" +
  "dC1mYW1pbHk6dmFyKC0tZm9udC1tb25vKTsgZm9udC13ZWlnaHQ6NjAwOyI+4oK5PC9zcGFuPgogICAgICAgICAgICA8aW5wdXQgdHlwZT0ibnVtYmVyIiBtaW49IjAiIHN0ZXA9IjEwIiBpZD0iZy1yZXdhcmQiIHBsYWNlaG9sZGVyPSIwIj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9ImNhbGxvdXQiIGlkPSJzdGFrZS1ydWxl" +
  "LWNhbGxvdXQiPgogICAgICAgIDxiPllvdXIgc3Rha2UgZm9yIGEgcmVwb3J0aW5nIHBlcmlvZCBpcyBmb3JmZWl0ZWQgaW1tZWRpYXRlbHkgaWY6PC9iPgogICAgICAgIDxvbD4KICAgICAgICAgIDxsaT5Zb3UgcmVwb3J0IHRoYXQgeW91IHdlcmUgdW5zdWNjZXNzZnVsOyBvcjwvbGk+CiAgICAgICAgICA8bGk+WW91ciByZWZlcmVlIHJlcG9ydHMgdGhhdCB5b3Ugd2VyZSB1bnN1Y2Nlc3NmdWw7" +
  "IG9yPC9saT4KICAgICAgICAgIDxsaT5Zb3UgZmFpbCB0byBtYWtlIGEgcmVxdWlyZWQgcmVwb3J0IGJ5IHRoZSBlbmQgb2YgdGhlIGRheSAoMTE6NTkgUC5NLikgb2YgYSByZXF1aXJlZCByZXBvcnRpbmcgZGF5LjwvbGk+CiAgICAgICAgPC9vbD4KICAgICAgPC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImNhbGxvdXQgZ29vZCI+CiAgICAgICAgPGI+WW91ciByZXdhcmQgZm9yIGEgcmVwb3J0aW5n" +
  "IHBlcmlvZCBpcyBjcmVkaXRlZCB0byB5b3VyIHdhbGxldCBpbW1lZGlhdGVseSBpZjo8L2I+CiAgICAgICAgPG9sPgogICAgICAgICAgPGxpPllvdSByZXBvcnQgc3VjY2VzcywgYW5kPC9saT4KICAgICAgICAgIDxsaT5Zb3VyIHJlZmVyZWUgKGlmIHlvdSBjaG9zZSBvbmUpIGNvbmZpcm1zIGl0LjwvbGk+CiAgICAgICAgPC9vbD4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJzdGFr" +
  "ZS1jYWxjIj4KICAgICAgICA8ZGl2IGNsYXNzPSJjYWxjLWxpbmUiPjxzcGFuIGNsYXNzPSJjbC1sYWJlbCI+UmVwb3J0aW5nIHBlcmlvZHMgaW4gdGhpcyBjb250cmFjdDwvc3Bhbj48c3BhbiBjbGFzcz0iY2wtdmFsIiBpZD0iY2FsYy1wZXJpb2RzIj4wPC9zcGFuPjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImNhbGMtbGluZSIgaWQ9ImNhbGMtc3Rha2UtbGluZSI+PHNwYW4gY2xhc3M9ImNs" +
  "LWxhYmVsIj5TdGFrZSDDlyBwZXJpb2RzIChsb3NzIHJlc2VydmUpPC9zcGFuPjxzcGFuIGNsYXNzPSJjbC12YWwiIGlkPSJjYWxjLXN0YWtlLXRvdGFsIj7igrkwPC9zcGFuPjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImNhbGMtbGluZSI+PHNwYW4gY2xhc3M9ImNsLWxhYmVsIj5SZXdhcmQgw5cgcGVyaW9kcyAocmV3YXJkIHJlc2VydmUpPC9zcGFuPjxzcGFuIGNsYXNzPSJjbC12YWwiIGlk" +
  "PSJjYWxjLXJld2FyZC10b3RhbCI+4oK5MDwvc3Bhbj48L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJjYWxjLXRvdGFsIj48c3Bhbj5Ub3RhbCB5b3UgbXVzdCBkZXBvc2l0PC9zcGFuPjxzcGFuIGlkPSJjYWxjLWdyYW5kLXRvdGFsIj7igrkwPC9zcGFuPjwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9ImFncmVlLXJvdyI+CiAgICAgICAgPGlucHV0IHR5cGU9ImNoZWNrYm94" +
  "IiBpZD0iZy1hZ3JlZSI+CiAgICAgICAgPGxhYmVsIGZvcj0iZy1hZ3JlZSI+SSBoYXZlIHJlYWQgYW5kIGFncmVlZCB0byB0aGUgPGEgaHJlZj0iIyIgb25jbGljaz0icmV0dXJuIGZhbHNlOyI+dGVybXMgYW5kIGNvbmRpdGlvbnM8L2E+IGFuZCBJIGFjY2VwdCB0aGlzIENvbW1pdG1lbnQgQ29udHJhY3QuPC9sYWJlbD4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJidG4tcm93Ij4K" +
  "ICAgICAgICA8YnV0dG9uIGNsYXNzPSJnaG9zdCIgb25jbGljaz0iY2FuY2VsV2l6YXJkKCkiPkNhbmNlbDwvYnV0dG9uPgogICAgICAgIDxidXR0b24gb25jbGljaz0iZ29TdGVwKDEpIj5QcmV2aW91cyBzdGVwPC9idXR0b24+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0icHJpbWFyeSIgb25jbGljaz0iZ29TdGVwKDMpIj5OZXh0IHN0ZXA8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4K" +
  "CiAgICA8IS0tIFNURVAgMyAtLT4KICAgIDxkaXYgY2xhc3M9InBhbmVsIHN0ZXAtcGFuZWwgaGlkZGVuIiBpZD0icGFuZWwtMyI+CiAgICAgIDxkaXYgY2xhc3M9InN0ZXAtZXllYnJvdyI+Q3VzdG9tIGdvYWw8L2Rpdj4KICAgICAgPGgyIGNsYXNzPSJzdGVwLXRpdGxlIj5HZXQgYSByZWZlcmVlPC9oMj4KICAgICAgPHAgY2xhc3M9InN0ZXAtc3ViIj5DaG9vc2UgYSByZWZlcmVlIOKAlCBwZW9w" +
  "bGUgd2hvIGRvIGFyZSB0d2ljZSBhcyBzdWNjZXNzZnVsITwvcD4KCiAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgICAgICA8bGFiZWwgY2xhc3M9ImZpZWxkLWxhYmVsIj5XaG8gd2lsbCBiZSB5b3VyIHJlZmVyZWU8L2xhYmVsPgogICAgICAgIDxzZWxlY3QgaWQ9ImctcmVmLXR5cGUiPgogICAgICAgICAgPG9wdGlvbiB2YWx1ZT0iaW5kaXZpZHVhbCI+SW5kaXZpZHVhbCByZWZlcmVlPC9v" +
  "cHRpb24+CiAgICAgICAgICA8b3B0aW9uIHZhbHVlPSJob25vciI+T24geW91ciBob25vcjwvb3B0aW9uPgogICAgICAgIDwvc2VsZWN0PgogICAgICA8L2Rpdj4KCiAgICAgIDxkaXYgaWQ9InJlZi1pbmRpdmlkdWFsIiBjbGFzcz0iZmllbGQiPgogICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiPkludml0ZSB5b3VyIHJlZmVyZWU8L2xhYmVsPgogICAgICAgIDxpbnB1dCB0eXBlPSJ0" +
  "ZXh0IiBpZD0iZy1yZWYtY29udGFjdCIgcGxhY2Vob2xkZXI9Im5hbWVAZXhhbXBsZS5jb20iPgogICAgICAgIDxkaXYgY2xhc3M9ImhpbnQiPkVudGVyIHlvdXIgcmVmZXJlZSdzIDxiPmVtYWlsIGFkZHJlc3M8L2I+IG9yIDxiPnVzZXJuYW1lPC9iPi48L2Rpdj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJzbWFsbCIgc3R5bGU9Im1hcmdpbi10b3A6MTRweDsiIG9uY2xpY2s9InNraXBSZWZlcmVl" +
  "KCkiPk5vIHRoYW5rcywgSSdsbCBkbyBpdCBvbiBteSBvd24uPC9idXR0b24+CiAgICAgIDwvZGl2PgoKICAgICAgPGRpdiBpZD0icmVmLWhvbm9yIiBjbGFzcz0iY2FsbG91dCBoaWRkZW4iPgogICAgICAgIFlvdSBoYXZlIHBpY2tlZCB0aGUgaG9ub3Igc3lzdGVtIHRvIHZlcmlmeSB5b3VyIHByb2dyZXNzLCB3aGljaCBtZWFucyB5b3UgYXJlIHlvdXIgb3duIHJlZmVyZWUuIEl0IGlzIHRoZXJl" +
  "Zm9yZSB1cCB0byB5b3UgdG8gYmUgaG9uZXN0IGFuZCBmYWlyIHRvd2FyZHMgeW91cnNlbGYgYW5kIHlvdXIgc3VwcG9ydGVycy4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJidG4tcm93Ij4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJnaG9zdCIgb25jbGljaz0iY2FuY2VsV2l6YXJkKCkiPkNhbmNlbDwvYnV0dG9uPgogICAgICAgIDxidXR0b24gb25jbGljaz0iZ29TdGVwKDIpIj5Q" +
  "cmV2aW91cyBzdGVwPC9idXR0b24+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0icHJpbWFyeSIgb25jbGljaz0iZ29TdGVwKDQpIj5OZXh0IHN0ZXA8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8IS0tIFNURVAgNCAtLT4KICAgIDxkaXYgY2xhc3M9InBhbmVsIHN0ZXAtcGFuZWwgaGlkZGVuIiBpZD0icGFuZWwtNCI+CiAgICAgIDxkaXYgY2xhc3M9InN0ZXAtZXllYnJvdyI+" +
  "Q3VzdG9tIGdvYWw8L2Rpdj4KICAgICAgPGgyIGNsYXNzPSJzdGVwLXRpdGxlIj5BZGQgZnJpZW5kcyBmb3Igc3VwcG9ydDwvaDI+CiAgICAgIDxwIGNsYXNzPSJzdGVwLXN1YiI+U3VwcG9ydGVycyBjYW4gY2hlZXIgeW91IG9uIGFuZCBzZWUgeW91ciBwcm9ncmVzcy4gT3B0aW9uYWwg4oCUIHlvdSBjYW4gc2tpcCB0aGlzLjwvcD4KCiAgICAgIDxkaXYgY2xhc3M9ImZpZWxkIj4KICAgICAgICA8" +
  "bGFiZWwgY2xhc3M9ImZpZWxkLWxhYmVsIj5JbnZpdGUgYSBmcmllbmQ8L2xhYmVsPgogICAgICAgIDxkaXYgY2xhc3M9ImFkZC1mcmllbmQtcm93Ij4KICAgICAgICAgIDxpbnB1dCB0eXBlPSJlbWFpbCIgaWQ9ImctZnJpZW5kLWlucHV0IiBwbGFjZWhvbGRlcj0iZnJpZW5kQGV4YW1wbGUuY29tIj4KICAgICAgICAgIDxidXR0b24gb25jbGljaz0iYWRkRnJpZW5kKCkiPkFkZDwvYnV0dG9uPgog" +
  "ICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgc3R5bGU9Im1hcmdpbi10b3A6MTRweDsiIGlkPSJmcmllbmQtbGlzdCI+PC9kaXY+CiAgICAgIDwvZGl2PgoKICAgICAgPGRpdiBjbGFzcz0iYnRuLXJvdyI+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iZ2hvc3QiIG9uY2xpY2s9ImNhbmNlbFdpemFyZCgpIj5DYW5jZWw8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIG9uY2xpY2s9ImdvU3RlcCgzKSI+" +
  "UHJldmlvdXMgc3RlcDwvYnV0dG9uPgogICAgICAgIDxidXR0b24gY2xhc3M9InByaW1hcnkiIG9uY2xpY2s9ImdvU3RlcCg1KSI+UmV2aWV3IGNvbnRyYWN0PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgPC9kaXY+CgogICAgPCEtLSBTVEVQIDU6IFJFVklFVyArIEZVTkQgLS0+CiAgICA8ZGl2IGNsYXNzPSJwYW5lbCBzdGVwLXBhbmVsIGhpZGRlbiIgaWQ9InBhbmVsLTUiPgogICAgICA8ZGl2" +
  "IGNsYXNzPSJzdGVwLWV5ZWJyb3ciPkZpbmFsIHN0ZXA8L2Rpdj4KICAgICAgPGgyIGNsYXNzPSJzdGVwLXRpdGxlIj5GdW5kIGFuZCBhY3RpdmF0ZTwvaDI+CiAgICAgIDxwIGNsYXNzPSJzdGVwLXN1YiI+VGhpcyBjb250cmFjdCBydW5zIG9uIG1vbmV5IHRoYXQgYWxyZWFkeSBleGlzdHMuIERlcG9zaXQgaXRzIHJlc2VydmUgbm93IOKAlCByZXdhcmRzIGFuZCBsb3NzZXMgd2lsbCBtb3ZlIGF1" +
  "dG9tYXRpY2FsbHkgYXMgeW91IHJlcG9ydCwgbm8gaW52b2ljZXMgbGF0ZXIuPC9wPgoKICAgICAgPGRpdiBjbGFzcz0icGFzc2Jvb2siIGlkPSJzdW1tYXJ5LXBhc3Nib29rIj48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9IndhbGxldC1jYXJkcyI+CiAgICAgICAgPGRpdiBjbGFzcz0id2NhcmQiPjxkaXYgY2xhc3M9IndjLWxhYmVsIj5XYWxsZXQgYmFsYW5jZTwvZGl2PjxkaXYgY2xhc3M9Indj" +
  "LXZhbCIgaWQ9ImZ1bmQtd2FsbGV0LXZhbCI+4oK5MDwvZGl2PjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9IndjYXJkIGxvY2siPjxkaXYgY2xhc3M9IndjLWxhYmVsIj5SZXF1aXJlZCBkZXBvc2l0PC9kaXY+PGRpdiBjbGFzcz0id2MtdmFsIiBpZD0iZnVuZC1yZXF1aXJlZC12YWwiPuKCuTA8L2Rpdj48L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJ3Y2FyZCByZXdhcmQiPjxkaXYgY2xhc3M9" +
  "IndjLWxhYmVsIj5TdGlsbCBuZWVkZWQ8L2Rpdj48ZGl2IGNsYXNzPSJ3Yy12YWwiIGlkPSJmdW5kLXNob3J0ZmFsbC12YWwiPuKCuTA8L2Rpdj48L2Rpdj4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJ0b3B1cC1ib3giPgogICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiPkFkZCBtb25leSB0byB3YWxsZXQ8L2xhYmVsPgogICAgICAgIDxkaXYgY2xhc3M9InRvcHVwLXJv" +
  "dyI+CiAgICAgICAgICA8c3BhbiBzdHlsZT0iZm9udC1mYW1pbHk6dmFyKC0tZm9udC1tb25vKTsgZm9udC13ZWlnaHQ6NjAwOyI+4oK5PC9zcGFuPgogICAgICAgICAgPGlucHV0IHR5cGU9Im51bWJlciIgbWluPSIwIiBzdGVwPSI1MCIgaWQ9InRvcHVwLWFtb3VudCIgcGxhY2Vob2xkZXI9IkFtb3VudCB0byBhZGQiPgogICAgICAgICAgPGJ1dHRvbiBvbmNsaWNrPSJ0b3BVcCgpIj5BZGQgbW9u" +
  "ZXk8L2J1dHRvbj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJoaW50Ij5UaGlzIHNpbXVsYXRlcyBhIGRlcG9zaXQgaW50byB5b3VyIExlZGdlciB3YWxsZXQgKFVQSSAvIGNhcmQpLiBObyByZWFsIHBheW1lbnQgaXMgcHJvY2Vzc2VkIGhlcmUuIFRoaXMgd2FsbGV0IGlzIHNoYXJlZCBhY3Jvc3MgYWxsIHlvdXIgY29udHJhY3RzLjwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAg" +
  "IDxkaXYgY2xhc3M9InN0YW1wLXdyYXAiPjxkaXYgY2xhc3M9InN0YW1wIiBpZD0ic3RhbXAiPjxkaXYgY2xhc3M9InN0YW1wLWlubmVyIj5Db250cmFjdDxicj5Db21taXR0ZWQ8L2Rpdj48L2Rpdj48L2Rpdj4KCiAgICAgIDxkaXYgY2xhc3M9ImJ0bi1yb3ciPgogICAgICAgIDxidXR0b24gY2xhc3M9Imdob3N0IiBvbmNsaWNrPSJjYW5jZWxXaXphcmQoKSI+Q2FuY2VsPC9idXR0b24+CiAgICAg" +
  "ICAgPGJ1dHRvbiBvbmNsaWNrPSJnb1N0ZXAoNCkiPlByZXZpb3VzIHN0ZXA8L2J1dHRvbj4KICAgICAgICA8YnV0dG9uIGNsYXNzPSJwcmltYXJ5IiBpZD0iYWN0aXZhdGUtYnRuIiBvbmNsaWNrPSJhY3RpdmF0ZUNvbnRyYWN0KCkiIGRpc2FibGVkPkRlcG9zaXQgJmFtcDsgYWN0aXZhdGUgY29udHJhY3Q8L2J1dHRvbj4KICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICA8L2Rpdj4KCiAgPCEtLSBT" +
  "Q1JFRU46IERFVEFJTCAtLT4KICA8ZGl2IGNsYXNzPSJzY3JlZW4gaGlkZGVuIiBpZD0ic2NyZWVuLWRldGFpbCI+CiAgICA8YnV0dG9uIGNsYXNzPSJiYWNrLWxpbmsiIG9uY2xpY2s9ImdvTGlzdCgpIj48aSBjbGFzcz0idGkgdGktYXJyb3ctbGVmdCIgYXJpYS1oaWRkZW49InRydWUiPjwvaT4gQmFjayB0byBNeSBDb250cmFjdHM8L2J1dHRvbj4KCiAgICA8ZGl2IGNsYXNzPSJwYW5lbCI+CiAg" +
  "ICAgIDxkaXYgY2xhc3M9ImRhc2gtaGVhZGVyIj4KICAgICAgICA8ZGl2PgogICAgICAgICAgPGRpdiBjbGFzcz0ic3RlcC1leWVicm93IiBpZD0iZGFzaC1leWVicm93Ij5BY3RpdmUgY29udHJhY3Q8L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9ImRhc2gtZ29hbCIgaWQ9ImRhc2gtZ29hbC10aXRsZSI+PC9kaXY+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJkYXNoLW1ldGEiIGlkPSJkYXNoLWdv" +
  "YWwtbWV0YSI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBpZD0iZGFzaC1hY3Rpb25zIiBzdHlsZT0iZGlzcGxheTpmbGV4OyBnYXA6OHB4OyI+CiAgICAgICAgICA8YnV0dG9uIGNsYXNzPSJkYW5nZXItYnRuIHNtYWxsIiBpZD0iZW5kLWNvbnRyYWN0LWJ0biIgb25jbGljaz0iZW5kQ29udHJhY3QoKSI+RW5kIGNvbnRyYWN0PC9idXR0b24+CiAgICAgICAgPC9kaXY+CiAgICAg" +
  "IDwvZGl2PgoKICAgICAgPGRpdiBjbGFzcz0iY2FsbG91dCIgaWQ9ImVuZGVkLWJhbm5lciIgc3R5bGU9ImJvcmRlci1jb2xvcjp2YXIoLS1pbmspOyBiYWNrZ3JvdW5kOnZhcigtLXBhcGVyLTIpOyBjb2xvcjp2YXIoLS1pbmspOyBkaXNwbGF5Om5vbmU7Ij4KICAgICAgICBUaGlzIGNvbnRyYWN0IGhhcyBlbmRlZC4gRXZlcnkgcGVyaW9kIHRoYXQgd2FzIHN0aWxsIHBlbmRpbmcgd2FzIHJlcG9y" +
  "dGVkIGFzIG1pc3NlZCwgYW5kIGl0cyBzdGFrZSBoYXMgYWxyZWFkeSBtb3ZlZC4KICAgICAgPC9kaXY+CgogICAgICA8ZGl2IGNsYXNzPSJ3YWxsZXQtY2FyZHMiPgogICAgICAgIDxkaXYgY2xhc3M9IndjYXJkIGxvY2siPjxkaXYgY2xhc3M9IndjLWxhYmVsIj5Mb2NrZWQgaW4gdGhpcyBjb250cmFjdDwvZGl2PjxkaXYgY2xhc3M9IndjLXZhbCIgaWQ9ImRhc2gtbG9ja2VkLXZhbCI+4oK5MDwv" +
  "ZGl2PjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9IndjYXJkIHJld2FyZCI+PGRpdiBjbGFzcz0id2MtbGFiZWwiPlJld2FyZGVkIGZyb20gdGhpcyBjb250cmFjdDwvZGl2PjxkaXYgY2xhc3M9IndjLXZhbCIgaWQ9ImRhc2gtcmV3YXJkZWQtdmFsIj7igrkwPC9kaXY+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0id2NhcmQiPjxkaXYgY2xhc3M9IndjLWxhYmVsIj5Gb3JmZWl0ZWQgZnJvbSB0" +
  "aGlzIGNvbnRyYWN0PC9kaXY+PGRpdiBjbGFzcz0id2MtdmFsIiBpZD0iZGFzaC1mb3JmZWl0ZWQtdmFsIj7igrkwPC9kaXY+PC9kaXY+CiAgICAgIDwvZGl2PgoKICAgICAgPGRpdiBjbGFzcz0icHJvZ3Jlc3MtdHJhY2siPjxkaXYgY2xhc3M9InByb2dyZXNzLWZpbGwiIGlkPSJkYXNoLXByb2dyZXNzIiBzdHlsZT0id2lkdGg6MCUiPjwvZGl2PjwvZGl2PgoKICAgICAgPGRpdiBpZD0idG9kYXkt" +
  "bG9nLXdyYXAiPgogICAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQtbGFiZWwiIHN0eWxlPSJtYXJnaW4tYm90dG9tOjEwcHg7IGRpc3BsYXk6YmxvY2s7Ij5Mb2cgdG9kYXk8L2xhYmVsPgogICAgICAgIDxkaXYgY2xhc3M9ImxlZGdlciIgaWQ9InRvZGF5LWxvZyIgc3R5bGU9Im1hcmdpbi1ib3R0b206MjZweDsiPjwvZGl2PgogICAgICA8L2Rpdj4KCiAgICAgIDxsYWJlbCBjbGFzcz0iZmllbGQt" +
  "bGFiZWwiIHN0eWxlPSJtYXJnaW4tYm90dG9tOjEwcHg7IGRpc3BsYXk6YmxvY2s7Ij5GdWxsIGxlZGdlcjwvbGFiZWw+CiAgICAgIDxkaXYgY2xhc3M9ImxlZGdlciIgaWQ9ImRhc2gtbGVkZ2VyIj48L2Rpdj4KICAgIDwvZGl2PgoKICAgIDxkaXYgY2xhc3M9ImZvb3Qtbm90ZSIgc3R5bGU9Im1hcmdpbi10b3A6MjRweDsiPgogICAgICA8YnV0dG9uIGNsYXNzPSJwcmltYXJ5IiBvbmNsaWNrPSJn" +
  "b05ld0NvbnRyYWN0KCkiPlN0YXJ0IGFub3RoZXIgaGFiaXQgY29udHJhY3Q8L2J1dHRvbj4KICAgIDwvZGl2PgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJmb290LW5vdGUiPkFtb3VudHMgYXJlIHNob3duIGluIEluZGlhbiBSdXBlZXMgKOKCuSkuIE1vbmV5IG1vdmVzIHRoZSBpbnN0YW50IGEgcGVyaW9kIGlzIHJlcG9ydGVkIOKAlCB0aGF0IGltbWVkaWFjeSBpcyB0aGUgd2hvbGUgcG9pbnQu" +
  "PC9kaXY+CiAgPGRpdiBjbGFzcz0iZm9vdC1ub3RlIj48YnV0dG9uIGNsYXNzPSJmb290LWxpbmsiIG9uY2xpY2s9InJlc2V0QWxsKCkiPkNsZWFyIGV2ZXJ5dGhpbmcgKHdhbGxldCBhbmQgYWxsIGNvbnRyYWN0cyk8L2J1dHRvbj48L2Rpdj4KPC9kaXY+Cgo8ZGl2IGNsYXNzPSJtb2RhbC1vdmVybGF5IGhpZGRlbiIgaWQ9ImNvbmZpcm0tbW9kYWwiPgogIDxkaXYgY2xhc3M9Im1vZGFsLWJveCI+" +
  "CiAgICA8cCBpZD0iY29uZmlybS1tZXNzYWdlIj48L3A+CiAgICA8ZGl2IGNsYXNzPSJtb2RhbC1hY3Rpb25zIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iZ2hvc3QiIG9uY2xpY2s9ImNsb3NlQ29uZmlybU1vZGFsKCkiPk5ldmVyIG1pbmQ8L2J1dHRvbj4KICAgICAgPGJ1dHRvbiBjbGFzcz0iZGFuZ2VyLWJ0biIgaWQ9ImNvbmZpcm0teWVzLWJ0biI+WWVzLCBjb250aW51ZTwvYnV0dG9uPgogICAg" +
  "PC9kaXY+CiAgPC9kaXY+CjwvZGl2PgoKPHNjcmlwdCBzcmM9Imh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3RhYmxlci1pY29ucy8yLjQ0LjAvaWNvbmZvbnQvdGFibGVyLWljb25zLm1pbi5jc3MiPjwvc2NyaXB0Pgo8c2NyaXB0Pgpjb25zdCBDQVRTID0gWyJDYXJlZXIiLCJEaWV0ICYgTnV0cml0aW9uIiwiRWR1Y2F0aW9uIiwiRXhlcmNpc2UiLCJGYW1pbHkgJiBGcmll" +
  "bmRzIiwiR3JlZW4gSW5pdGlhdGl2ZXMiLCJIZWFsdGggJiBXZWxsbmVzcyIsIkhvbWUgSW1wcm92ZW1lbnQiLCJNb25leSAmIEZpbmFuY2UiLCJQZXJzb25hbCBEZXZlbG9wbWVudCIsIlF1aXQgU21va2luZyIsIlJlbGlnaW9uICYgU3Bpcml0dWFsaXR5IiwiU3BvcnRzICYgRml0bmVzcyIsIldlaWdodCBMb3NzIl07CmNvbnN0IE9SR19PUFRJT05TID0gewogIGFudGljaGFyaXR5OiBbIkEgY2F1" +
  "c2UgSSBmaW5kIGhhcmQgdG8gc3VwcG9ydCIsICJBIHJpdmFsIHNwb3J0cyBjbHViIGZ1bmQiLCAiQSBwb2xpdGljYWwgcGFydHkgSSBkaXNhZ3JlZSB3aXRoIl0sCiAgY2hhcml0eTogWyJBIGNoaWxkcmVuJ3MgZWR1Y2F0aW9uIHRydXN0IiwgIkFuIGFuaW1hbCB3ZWxmYXJlIHNoZWx0ZXIiLCAiQSBkaXNhc3RlciByZWxpZWYgZnVuZCJdCn07CmNvbnN0IFNUT1JBR0VfS0VZID0gImNvbW1pdG1l" +
  "bnRfbGVkZ2VyX3N0YXRlX3YyIjsKCmZ1bmN0aW9uIGZtdERhdGUoZCl7IHJldHVybiBkLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwxMCk7IH0KZnVuY3Rpb24gaW5yKG4peyByZXR1cm4gIuKCuSIgKyBNYXRoLnJvdW5kKG4pLnRvTG9jYWxlU3RyaW5nKCJlbi1JTiIpOyB9CmZ1bmN0aW9uIHVpZCgpeyByZXR1cm4gRGF0ZS5ub3coKS50b1N0cmluZygzNikgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5n" +
  "KDM2KS5zbGljZSgyLDcpOyB9CgovKiAtLS0tLS0tLS0tIENVU1RPTSBDT05GSVJNIE1PREFMICh3aW5kb3cuY29uZmlybSBpcyBibG9ja2VkIGluIHNvbWUgc2FuZGJveGVkIHByZXZpZXdzKSAtLS0tLS0tLS0tICovCmxldCBfY29uZmlybUNhbGxiYWNrID0gbnVsbDsKZnVuY3Rpb24gc2hvd0NvbmZpcm0obWVzc2FnZSwgb25ZZXMpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJjb25maXJt" +
  "LW1lc3NhZ2UiKS50ZXh0Q29udGVudCA9IG1lc3NhZ2U7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNvbmZpcm0tbW9kYWwiKS5jbGFzc0xpc3QucmVtb3ZlKCJoaWRkZW4iKTsKICBfY29uZmlybUNhbGxiYWNrID0gb25ZZXM7Cn0KZnVuY3Rpb24gY2xvc2VDb25maXJtTW9kYWwoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY29uZmlybS1tb2RhbCIpLmNsYXNzTGlzdC5hZGQoImhp" +
  "ZGRlbiIpOwogIF9jb25maXJtQ2FsbGJhY2sgPSBudWxsOwp9CmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJjb25maXJtLXllcy1idG4iKS5hZGRFdmVudExpc3RlbmVyKCJjbGljayIsICgpPT57CiAgY29uc3QgY2IgPSBfY29uZmlybUNhbGxiYWNrOwogIGNsb3NlQ29uZmlybU1vZGFsKCk7CiAgaWYoY2IpIGNiKCk7Cn0pOwoKZnVuY3Rpb24gZnJlc2hEcmFmdCgpewogIGNvbnN0IHRvZGF5ID0g" +
  "bmV3IERhdGUoKTsKICBjb25zdCBlbmQgPSBuZXcgRGF0ZSgpOyBlbmQuc2V0RGF0ZShlbmQuZ2V0RGF0ZSgpKzMwKTsKICByZXR1cm4gewogICAgZ29hbDp7IHRpdGxlOiIiLCBjYXRlZ29yaWVzOltdLCBmcmVxdWVuY3k6ImRhaWx5IiwgY29tbWl0VGV4dDoiIiwgc3RhcnQ6IGZtdERhdGUodG9kYXkpLCBlbmQ6IGZtdERhdGUoZW5kKSB9LAogICAgc3Rha2VzOnsgcmVjaXBpZW50OiJjaGFyaXR5" +
  "Iiwgb3JnOiIiLCBzdGFrZUFtb3VudDowLCByZXdhcmRBbW91bnQ6MCwgYWdyZWU6ZmFsc2UgfSwKICAgIHJlZmVyZWU6eyB0eXBlOiJpbmRpdmlkdWFsIiwgY29udGFjdDoiIiB9LAogICAgZnJpZW5kczpbXQogIH07Cn0KZnVuY3Rpb24gZnJlc2hTdGF0ZSgpewogIHJldHVybiB7CiAgICB3YWxsZXQ6eyBiYWxhbmNlOjAsIHN0cmVha0NvaW5zOjAgfSwKICAgIGNvbnRyYWN0czpbXSwKICAgIGRy" +
  "YWZ0Om51bGwsCiAgICBzdGVwOjEsCiAgICBzY3JlZW46Imxpc3QiLAogICAgY3VycmVudENvbnRyYWN0SWQ6bnVsbAogIH07Cn0KCmxldCBzdGF0ZSA9IGxvYWQoKTsKZnVuY3Rpb24gbG9hZCgpewogIHRyeXsKICAgIGNvbnN0IHJhdyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFNUT1JBR0VfS0VZKTsKICAgIGlmKHJhdyl7CiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KTsKICAg" +
  "ICAgaWYoIXBhcnNlZC53YWxsZXQpIHBhcnNlZC53YWxsZXQgPSB7YmFsYW5jZTowLCBzdHJlYWtDb2luczowfTsKICAgICAgaWYodHlwZW9mIHBhcnNlZC53YWxsZXQuc3RyZWFrQ29pbnMgIT09ICJudW1iZXIiKSBwYXJzZWQud2FsbGV0LnN0cmVha0NvaW5zID0gMDsKICAgICAgaWYoIUFycmF5LmlzQXJyYXkocGFyc2VkLmNvbnRyYWN0cykpIHBhcnNlZC5jb250cmFjdHMgPSBbXTsKICAgICAg" +
  "aWYoIXBhcnNlZC5zY3JlZW4pIHBhcnNlZC5zY3JlZW4gPSAibGlzdCI7CiAgICAgIHJldHVybiBwYXJzZWQ7CiAgICB9CiAgfWNhdGNoKGUpe30KICByZXR1cm4gZnJlc2hTdGF0ZSgpOwp9CmZ1bmN0aW9uIHNhdmUoKXsKICB0cnl7IGxvY2FsU3RvcmFnZS5zZXRJdGVtKFNUT1JBR0VfS0VZLCBKU09OLnN0cmluZ2lmeShzdGF0ZSkpOyB9Y2F0Y2goZSl7fQp9CgovKiAtLS0tLS0tLS0tIENBVEVH" +
  "T1JZIEdSSUQgLS0tLS0tLS0tLSAqLwpjb25zdCBjYXRHcmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNhdC1ncmlkIik7CkNBVFMuZm9yRWFjaChjYXQ9PnsKICBjb25zdCBpZCA9ICJjYXQtIitjYXQucmVwbGFjZSgvW15hLXowLTldL2dpLCIiKTsKICBjb25zdCB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgibGFiZWwiKTsKICB3cmFwLmNsYXNzTmFtZSA9ICJjYXQtaXRlbSI7" +
  "CiAgd3JhcC5pbm5lckhUTUwgPSBgPGlucHV0IHR5cGU9ImNoZWNrYm94IiB2YWx1ZT0iJHtjYXR9IiBpZD0iJHtpZH0iPiAke2NhdH1gOwogIHdyYXAucXVlcnlTZWxlY3RvcigiaW5wdXQiKS5hZGRFdmVudExpc3RlbmVyKCJjaGFuZ2UiLCBvbkNhdENoYW5nZSk7CiAgY2F0R3JpZC5hcHBlbmRDaGlsZCh3cmFwKTsKfSk7CmZ1bmN0aW9uIG9uQ2F0Q2hhbmdlKCl7CiAgY29uc3QgY2hlY2tlZCA9" +
  "IFsuLi5jYXRHcmlkLnF1ZXJ5U2VsZWN0b3JBbGwoImlucHV0OmNoZWNrZWQiKV0ubWFwKGk9PmkudmFsdWUpOwogIHN0YXRlLmRyYWZ0LmdvYWwuY2F0ZWdvcmllcyA9IGNoZWNrZWQ7CiAgY29uc3QgYXRMaW1pdCA9IGNoZWNrZWQubGVuZ3RoID49IDM7CiAgY2F0R3JpZC5xdWVyeVNlbGVjdG9yQWxsKCIuY2F0LWl0ZW0iKS5mb3JFYWNoKGl0ZW09PnsKICAgIGNvbnN0IGlucHV0ID0gaXRlbS5x" +
  "dWVyeVNlbGVjdG9yKCJpbnB1dCIpOwogICAgaXRlbS5jbGFzc0xpc3QudG9nZ2xlKCJkaXNhYmxlZCIsIGF0TGltaXQgJiYgIWlucHV0LmNoZWNrZWQpOwogICAgaW5wdXQuZGlzYWJsZWQgPSBhdExpbWl0ICYmICFpbnB1dC5jaGVja2VkOwogIH0pOwogIHNhdmUoKTsKfQoKLyogLS0tLS0tLS0tLSBGUkVRVUVOQ1kgLS0tLS0tLS0tLSAqLwpkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCIjZnJl" +
  "cS1yb3cgLmNob2ljZS1jYXJkIikuZm9yRWFjaChjYXJkPT57CiAgY2FyZC5hZGRFdmVudExpc3RlbmVyKCJjbGljayIsICgpPT57CiAgICBzdGF0ZS5kcmFmdC5nb2FsLmZyZXF1ZW5jeSA9IGNhcmQuZGF0YXNldC5mcmVxOwogICAgcmVmcmVzaEZyZXFVSSgpOyBzYXZlKCk7IHJlZnJlc2hTdGFrZUNhbGMoKTsKICB9KTsKfSk7CmZ1bmN0aW9uIHJlZnJlc2hGcmVxVUkoKXsKICBkb2N1bWVudC5x" +
  "dWVyeVNlbGVjdG9yQWxsKCIjZnJlcS1yb3cgLmNob2ljZS1jYXJkIikuZm9yRWFjaChjPT57CiAgICBjLmNsYXNzTGlzdC50b2dnbGUoInNlbCIsIGMuZGF0YXNldC5mcmVxID09PSBzdGF0ZS5kcmFmdC5nb2FsLmZyZXF1ZW5jeSk7CiAgfSk7Cn0KCi8qIC0tLS0tLS0tLS0gU1RFUCAxIGZpZWxkIGJpbmRpbmdzIC0tLS0tLS0tLS0gKi8KY29uc3QgZ1RpdGxlID0gZG9jdW1lbnQuZ2V0RWxlbWVu" +
  "dEJ5SWQoImctdGl0bGUiKTsKY29uc3QgZ0NvbW1pdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJnLWNvbW1pdCIpOwpjb25zdCBnQ29tbWl0Q291bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZy1jb21taXQtY291bnQiKTsKY29uc3QgZ1N0YXJ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImctc3RhcnQiKTsKY29uc3QgZ0VuZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJn" +
  "LWVuZCIpOwoKZ1RpdGxlLmFkZEV2ZW50TGlzdGVuZXIoImlucHV0IiwgKCk9Pnsgc3RhdGUuZHJhZnQuZ29hbC50aXRsZSA9IGdUaXRsZS52YWx1ZTsgc2F2ZSgpOyB9KTsKZ0NvbW1pdC5hZGRFdmVudExpc3RlbmVyKCJpbnB1dCIsICgpPT57CiAgc3RhdGUuZHJhZnQuZ29hbC5jb21taXRUZXh0ID0gZ0NvbW1pdC52YWx1ZTsKICBnQ29tbWl0Q291bnQudGV4dENvbnRlbnQgPSBnQ29tbWl0LnZh" +
  "bHVlLmxlbmd0aDsKICBzYXZlKCk7Cn0pOwpnU3RhcnQuYWRkRXZlbnRMaXN0ZW5lcigiY2hhbmdlIiwgKCk9Pnsgc3RhdGUuZHJhZnQuZ29hbC5zdGFydCA9IGdTdGFydC52YWx1ZTsgc2F2ZSgpOyByZWZyZXNoU3Rha2VDYWxjKCk7IH0pOwpnRW5kLmFkZEV2ZW50TGlzdGVuZXIoImNoYW5nZSIsICgpPT57IHN0YXRlLmRyYWZ0LmdvYWwuZW5kID0gZ0VuZC52YWx1ZTsgc2F2ZSgpOyByZWZyZXNo" +
  "U3Rha2VDYWxjKCk7IH0pOwoKLyogLS0tLS0tLS0tLSBTVEVQIDIgLS0tLS0tLS0tLSAqLwpjb25zdCByZWNSb3cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgicmVjaXBpZW50LXJvdyIpOwpjb25zdCBvcmdGaWVsZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJvcmctZmllbGQiKTsKY29uc3QgZ09yZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJnLW9yZyIpOwpjb25zdCByZWNOb3Rl" +
  "ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInJlYy1ub3RlIik7CmNvbnN0IGdTdGFrZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJnLXN0YWtlIik7CmNvbnN0IGdSZXdhcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZy1yZXdhcmQiKTsKY29uc3QgZ0FncmVlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImctYWdyZWUiKTsKY29uc3Qgc3Rha2VGaWVsZCA9IGRvY3VtZW50Lmdl" +
  "dEVsZW1lbnRCeUlkKCJzdGFrZS1maWVsZCIpOwpjb25zdCBzdGFrZVJ1bGVDYWxsb3V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInN0YWtlLXJ1bGUtY2FsbG91dCIpOwpjb25zdCBjYWxjU3Rha2VMaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNhbGMtc3Rha2UtbGluZSIpOwoKcmVjUm93LnF1ZXJ5U2VsZWN0b3JBbGwoIi5jaG9pY2UtY2FyZCIpLmZvckVhY2goY2FyZD0+ewog" +
  "IGNhcmQuYWRkRXZlbnRMaXN0ZW5lcigiY2xpY2siLCAoKT0+ewogICAgc3RhdGUuZHJhZnQuc3Rha2VzLnJlY2lwaWVudCA9IGNhcmQuZGF0YXNldC5yZWM7CiAgICByZWZyZXNoUmVjaXBpZW50VUkoKTsgc2F2ZSgpOwogIH0pOwp9KTsKZnVuY3Rpb24gcmVmcmVzaFJlY2lwaWVudFVJKCl7CiAgcmVjUm93LnF1ZXJ5U2VsZWN0b3JBbGwoIi5jaG9pY2UtY2FyZCIpLmZvckVhY2goYz0+Yy5jbGFz" +
  "c0xpc3QudG9nZ2xlKCJzZWwiLCBjLmRhdGFzZXQucmVjPT09c3RhdGUuZHJhZnQuc3Rha2VzLnJlY2lwaWVudCkpOwogIGNvbnN0IHJlYyA9IHN0YXRlLmRyYWZ0LnN0YWtlcy5yZWNpcGllbnQ7CiAgaWYocmVjPT09ImFudGljaGFyaXR5IiB8fCByZWM9PT0iY2hhcml0eSIpewogICAgb3JnRmllbGQuY2xhc3NMaXN0LnJlbW92ZSgiaGlkZGVuIik7CiAgICBnT3JnLmlubmVySFRNTCA9IGA8b3B0" +
  "aW9uIHZhbHVlPSIiPlNlbGVjdCBvbmU8L29wdGlvbj5gICsgT1JHX09QVElPTlNbcmVjXS5tYXAobz0+YDxvcHRpb24gJHtzdGF0ZS5kcmFmdC5zdGFrZXMub3JnPT09bz8nc2VsZWN0ZWQnOicnfSB2YWx1ZT0iJHtvfSI+JHtvfTwvb3B0aW9uPmApLmpvaW4oIiIpOwogIH0gZWxzZSB7CiAgICBvcmdGaWVsZC5jbGFzc0xpc3QuYWRkKCJoaWRkZW4iKTsKICB9CiAgY29uc3QgaXNOb25lID0gcmVj" +
  "PT09Im5vbmUiOwogIHN0YWtlRmllbGQuY2xhc3NMaXN0LnRvZ2dsZSgiaGlkZGVuIiwgaXNOb25lKTsKICBzdGFrZVJ1bGVDYWxsb3V0LmNsYXNzTGlzdC50b2dnbGUoImhpZGRlbiIsIGlzTm9uZSk7CiAgY2FsY1N0YWtlTGluZS5jbGFzc0xpc3QudG9nZ2xlKCJoaWRkZW4iLCBpc05vbmUpOwogIGlmKGlzTm9uZSl7CiAgICBzdGF0ZS5kcmFmdC5zdGFrZXMuc3Rha2VBbW91bnQgPSAwOwogICAg" +
  "Z1N0YWtlLnZhbHVlID0gIiI7CiAgfQogIGNvbnN0IG5vdGVzID0gewogICAgYW50aWNoYXJpdHk6IkF0IHRoZSBlbmQgb2YgZWFjaCByZXBvcnRpbmcgcGVyaW9kLCBhbnkgc3Rha2UgeW91IGZvcmZlaXQgZ29lcyB0byBhbiBhbnRpLWNoYXJpdHkg4oCUIGEgY2F1c2UgeW91J2QgaGF0ZSB0byBmdW5kLiBOb3RoaW5nIG1vdGl2YXRlcyBsaWtlIHRoYXQuIiwKICAgIGNoYXJpdHk6IkF0IHRoZSBl" +
  "bmQgb2YgZWFjaCByZXBvcnRpbmcgcGVyaW9kLCBhbnkgc3Rha2UgeW91IGZvcmZlaXQgZ29lcyB0byB5b3VyIGNob3NlbiBjaGFyaXR5LiBFdmVuIGZhaWx1cmUgZG9lcyBzb21lIGdvb2QuIiwKICAgIHN0cmVha2NvaW46IkF0IHRoZSBlbmQgb2YgZWFjaCByZXBvcnRpbmcgcGVyaW9kLCBhbnkgc3Rha2UgeW91IGZvcmZlaXQgZG9lc24ndCBsZWF2ZSB5b3VyIGFjY291bnQg4oCUIGl0IGNvbnZl" +
  "cnRzIGludG8gc3RyZWFrIGNvaW5zLCByZWFsIG1vbmV5IHRoYXQgc3RheXMgd2l0aCB5b3UgYnV0IGlzIHNldCBhcGFydCBmcm9tIHlvdXIgc3BlbmRhYmxlIHdhbGxldC4iLAogICAgcGxhdGZvcm06IkF0IHRoZSBlbmQgb2YgZWFjaCByZXBvcnRpbmcgcGVyaW9kLCBhbnkgc3Rha2UgeW91IGZvcmZlaXQgZ29lcyB0byBzdXBwb3J0IHRoaXMgcGxhdGZvcm0uIFRoYW5rcyBmb3IgaGVscGluZyB1" +
  "cyBrZWVwIHRoZSBsaWdodHMgb24hIiwKICAgIG5vbmU6IlRoZXJlJ3Mgbm90aGluZyB0byBmdW5kIGZvciBtaXNzZWQgcmVwb3J0cyDigJQgdGhpcyBpcyBhIHJld2FyZC1vbmx5IGNvbnRyYWN0LiBZb3UnbGwgb25seSBldmVyIGJlIGFza2VkIHRvIGRlcG9zaXQgdGhlIHJld2FyZCBwb29sLCBhbmQgeW91J2xsIGVhcm4gZnJvbSBpdCBvbiBldmVyeSBzdWNjZXNzLiIKICB9OwogIHJlY05vdGUu" +
  "dGV4dENvbnRlbnQgPSBub3Rlc1tyZWNdOwogIHJlZnJlc2hTdGFrZUNhbGMoKTsKfQpnT3JnLmFkZEV2ZW50TGlzdGVuZXIoImNoYW5nZSIsICgpPT57IHN0YXRlLmRyYWZ0LnN0YWtlcy5vcmcgPSBnT3JnLnZhbHVlOyBzYXZlKCk7IH0pOwpnU3Rha2UuYWRkRXZlbnRMaXN0ZW5lcigiaW5wdXQiLCAoKT0+eyBzdGF0ZS5kcmFmdC5zdGFrZXMuc3Rha2VBbW91bnQgPSBwYXJzZUZsb2F0KGdTdGFr" +
  "ZS52YWx1ZSl8fDA7IHJlZnJlc2hTdGFrZUNhbGMoKTsgc2F2ZSgpOyB9KTsKZ1Jld2FyZC5hZGRFdmVudExpc3RlbmVyKCJpbnB1dCIsICgpPT57IHN0YXRlLmRyYWZ0LnN0YWtlcy5yZXdhcmRBbW91bnQgPSBwYXJzZUZsb2F0KGdSZXdhcmQudmFsdWUpfHwwOyByZWZyZXNoU3Rha2VDYWxjKCk7IHNhdmUoKTsgfSk7CmdBZ3JlZS5hZGRFdmVudExpc3RlbmVyKCJjaGFuZ2UiLCAoKT0+eyBzdGF0" +
  "ZS5kcmFmdC5zdGFrZXMuYWdyZWUgPSBnQWdyZWUuY2hlY2tlZDsgc2F2ZSgpOyB9KTsKCmZ1bmN0aW9uIGNvbXB1dGVQZXJpb2RzKGdvYWwpewogIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoZ29hbC5zdGFydCk7CiAgY29uc3QgZW5kID0gbmV3IERhdGUoZ29hbC5lbmQpOwogIGlmKGlzTmFOKHN0YXJ0KXx8aXNOYU4oZW5kKXx8ZW5kPHN0YXJ0KSByZXR1cm4gW107CiAgY29uc3QgZnJlcSA9IGdv" +
  "YWwuZnJlcXVlbmN5OwogIGNvbnN0IHBlcmlvZHMgPSBbXTsKICBpZihmcmVxPT09Im9uY2UiKXsKICAgIHBlcmlvZHMucHVzaCh7ZGF0ZTpmbXREYXRlKGVuZCksIGxhYmVsOiJGaW5hbCByZXBvcnQifSk7CiAgICByZXR1cm4gcGVyaW9kczsKICB9CiAgY29uc3Qgc3RlcERheXMgPSBmcmVxPT09ImRhaWx5IiA/IDEgOiA3OwogIGxldCBjdXIgPSBuZXcgRGF0ZShzdGFydCk7CiAgbGV0IGlkeCA9" +
  "IDE7CiAgd2hpbGUoY3VyIDw9IGVuZCl7CiAgICBwZXJpb2RzLnB1c2goe2RhdGU6IGZtdERhdGUoY3VyKSwgbGFiZWw6IChmcmVxPT09ImRhaWx5Ij8iRGF5ICI6IldlZWsgIikgKyBpZHh9KTsKICAgIGN1ci5zZXREYXRlKGN1ci5nZXREYXRlKCkrc3RlcERheXMpOwogICAgaWR4Kys7CiAgfQogIHJldHVybiBwZXJpb2RzOwp9CmZ1bmN0aW9uIHJlZnJlc2hTdGFrZUNhbGMoKXsKICBjb25zdCBw" +
  "ZXJpb2RzID0gY29tcHV0ZVBlcmlvZHMoc3RhdGUuZHJhZnQuZ29hbCk7CiAgY29uc3QgbiA9IHBlcmlvZHMubGVuZ3RoOwogIGNvbnN0IHN0YWtlVG90YWwgPSBuICogKHN0YXRlLmRyYWZ0LnN0YWtlcy5zdGFrZUFtb3VudHx8MCk7CiAgY29uc3QgcmV3YXJkVG90YWwgPSBuICogKHN0YXRlLmRyYWZ0LnN0YWtlcy5yZXdhcmRBbW91bnR8fDApOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJj" +
  "YWxjLXBlcmlvZHMiKS50ZXh0Q29udGVudCA9IG47CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNhbGMtc3Rha2UtdG90YWwiKS50ZXh0Q29udGVudCA9IGlucihzdGFrZVRvdGFsKSArICIgKCIgKyBpbnIoc3RhdGUuZHJhZnQuc3Rha2VzLnN0YWtlQW1vdW50fHwwKSArICIgw5cgIiArIG4gKyAiKSI7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNhbGMtcmV3YXJkLXRvdGFsIikudGV4" +
  "dENvbnRlbnQgPSBpbnIocmV3YXJkVG90YWwpICsgIiAoIiArIGlucihzdGF0ZS5kcmFmdC5zdGFrZXMucmV3YXJkQW1vdW50fHwwKSArICIgw5cgIiArIG4gKyAiKSI7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNhbGMtZ3JhbmQtdG90YWwiKS50ZXh0Q29udGVudCA9IGlucihzdGFrZVRvdGFsK3Jld2FyZFRvdGFsKTsKfQoKLyogLS0tLS0tLS0tLSBTVEVQIDMgLS0tLS0tLS0tLSAqLwpj" +
  "b25zdCBnUmVmVHlwZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJnLXJlZi10eXBlIik7CmNvbnN0IHJlZkluZGl2aWR1YWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgicmVmLWluZGl2aWR1YWwiKTsKY29uc3QgcmVmSG9ub3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgicmVmLWhvbm9yIik7CmNvbnN0IGdSZWZDb250YWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImctcmVm" +
  "LWNvbnRhY3QiKTsKZ1JlZlR5cGUuYWRkRXZlbnRMaXN0ZW5lcigiY2hhbmdlIiwgKCk9PnsKICBzdGF0ZS5kcmFmdC5yZWZlcmVlLnR5cGUgPSBnUmVmVHlwZS52YWx1ZTsKICByZWZyZXNoUmVmVUkoKTsgc2F2ZSgpOwp9KTsKZ1JlZkNvbnRhY3QuYWRkRXZlbnRMaXN0ZW5lcigiaW5wdXQiLCAoKT0+eyBzdGF0ZS5kcmFmdC5yZWZlcmVlLmNvbnRhY3QgPSBnUmVmQ29udGFjdC52YWx1ZTsgc2F2" +
  "ZSgpOyB9KTsKZnVuY3Rpb24gcmVmcmVzaFJlZlVJKCl7CiAgY29uc3QgaG9ub3IgPSBzdGF0ZS5kcmFmdC5yZWZlcmVlLnR5cGU9PT0iaG9ub3IiOwogIHJlZkluZGl2aWR1YWwuY2xhc3NMaXN0LnRvZ2dsZSgiaGlkZGVuIiwgaG9ub3IpOwogIHJlZkhvbm9yLmNsYXNzTGlzdC50b2dnbGUoImhpZGRlbiIsICFob25vcik7Cn0KZnVuY3Rpb24gc2tpcFJlZmVyZWUoKXsKICBnUmVmVHlwZS52YWx1" +
  "ZSA9ICJob25vciI7CiAgc3RhdGUuZHJhZnQucmVmZXJlZS50eXBlID0gImhvbm9yIjsKICByZWZyZXNoUmVmVUkoKTsgc2F2ZSgpOwp9CgovKiAtLS0tLS0tLS0tIFNURVAgNCAtLS0tLS0tLS0tICovCmNvbnN0IGZyaWVuZElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImctZnJpZW5kLWlucHV0Iik7CmNvbnN0IGZyaWVuZExpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZnJp" +
  "ZW5kLWxpc3QiKTsKZnVuY3Rpb24gYWRkRnJpZW5kKCl7CiAgY29uc3QgdiA9IGZyaWVuZElucHV0LnZhbHVlLnRyaW0oKTsKICBpZighdikgcmV0dXJuOwogIHN0YXRlLmRyYWZ0LmZyaWVuZHMucHVzaCh2KTsKICBmcmllbmRJbnB1dC52YWx1ZSA9ICIiOwogIHNhdmUoKTsgcmVuZGVyRnJpZW5kcygpOwp9CmZ1bmN0aW9uIHJlbW92ZUZyaWVuZChpKXsKICBzdGF0ZS5kcmFmdC5mcmllbmRzLnNw" +
  "bGljZShpLDEpOwogIHNhdmUoKTsgcmVuZGVyRnJpZW5kcygpOwp9CmZ1bmN0aW9uIHJlbmRlckZyaWVuZHMoKXsKICBmcmllbmRMaXN0LmlubmVySFRNTCA9IHN0YXRlLmRyYWZ0LmZyaWVuZHMubWFwKChmLGkpPT4KICAgIGA8c3BhbiBjbGFzcz0iZnJpZW5kLWNoaXAiPiR7Zn08YnV0dG9uIG9uY2xpY2s9InJlbW92ZUZyaWVuZCgke2l9KSIgYXJpYS1sYWJlbD0iUmVtb3ZlIj7DlzwvYnV0dG9u" +
  "Pjwvc3Bhbj5gCiAgKS5qb2luKCIiKSB8fCBgPHNwYW4gY2xhc3M9ImhpbnQiPk5vIHN1cHBvcnRlcnMgYWRkZWQgeWV0Ljwvc3Bhbj5gOwp9CgovKiAtLS0tLS0tLS0tIFdJWkFSRCBOQVYgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBnb05ld0NvbnRyYWN0KCl7CiAgc3RhdGUuZHJhZnQgPSBmcmVzaERyYWZ0KCk7CiAgc3RhdGUuc3RlcCA9IDE7CiAgc3RhdGUuc2NyZWVuID0gIndpemFyZCI7CiAg" +
  "c2F2ZSgpOwogIGh5ZHJhdGVXaXphcmRJbnB1dHMoKTsKICByZW5kZXIoKTsKfQpmdW5jdGlvbiBjYW5jZWxXaXphcmQoKXsKICBzaG93Q29uZmlybSgiRGlzY2FyZCB0aGlzIG5ldyBjb250cmFjdCBkcmFmdD8iLCAoKT0+ewogICAgc3RhdGUuZHJhZnQgPSBudWxsOwogICAgc3RhdGUuc2NyZWVuID0gImxpc3QiOwogICAgc2F2ZSgpOwogICAgcmVuZGVyKCk7CiAgfSk7Cn0KZnVuY3Rpb24gZ29T" +
  "dGVwKG4pewogIHN0YXRlLnN0ZXAgPSBuOwogIHNhdmUoKTsKICByZW5kZXIoKTsKfQpmdW5jdGlvbiB1cGRhdGVUcmFja2VyKCl7CiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgiLnQtc3RlcCIpLmZvckVhY2goZWw9PnsKICAgIGNvbnN0IHMgPSBwYXJzZUludChlbC5kYXRhc2V0LnMpOwogICAgZWwuY2xhc3NMaXN0LnRvZ2dsZSgiYWN0aXZlIiwgcz09PXN0YXRlLnN0ZXApOwogICAgZWwu" +
  "Y2xhc3NMaXN0LnRvZ2dsZSgiZG9uZSIsIHMgPCBzdGF0ZS5zdGVwKTsKICB9KTsKfQoKLyogLS0tLS0tLS0tLSBTVEVQIDU6IFJFVklFVyArIEZVTkQgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiByZW5kZXJTdW1tYXJ5KCl7CiAgY29uc3QgZHJhZnQgPSBzdGF0ZS5kcmFmdDsKICBjb25zdCBwZXJpb2RzID0gY29tcHV0ZVBlcmlvZHMoZHJhZnQuZ29hbCk7CiAgY29uc3QgbiA9IHBlcmlvZHMubGVu" +
  "Z3RoOwogIGNvbnN0IHN0YWtlVG90YWwgPSBuKihkcmFmdC5zdGFrZXMuc3Rha2VBbW91bnR8fDApOwogIGNvbnN0IHJld2FyZFRvdGFsID0gbiooZHJhZnQuc3Rha2VzLnJld2FyZEFtb3VudHx8MCk7CiAgY29uc3QgZ3JhbmQgPSBzdGFrZVRvdGFsK3Jld2FyZFRvdGFsOwogIGNvbnN0IHBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInN1bW1hcnktcGFzc2Jvb2siKTsKICBjb25zdCByZWNM" +
  "YWJlbCA9IHthbnRpY2hhcml0eToiQW50aS1jaGFyaXR5IiwgY2hhcml0eToiQ2hhcml0eSIsIHN0cmVha2NvaW46IlN0cmVhayBjb2luIChzdGF5cyB5b3VycykiLCBwbGF0Zm9ybToiU3VwcG9ydCB1cyIsIG5vbmU6Ik5vIG1vbmV5IGF0IHN0YWtlIn1bZHJhZnQuc3Rha2VzLnJlY2lwaWVudF07CiAgY29uc3Qgcm93cyA9IFsKICAgIFsiR29hbCIsIGRyYWZ0LmdvYWwudGl0bGUgfHwgIih1bnRp" +
  "dGxlZCBnb2FsKSJdLAogICAgWyJDYXRlZ29yaWVzIiwgZHJhZnQuZ29hbC5jYXRlZ29yaWVzLmpvaW4oIiwgIikgfHwgIk5vbmUgc2VsZWN0ZWQiXSwKICAgIFsiUmVwb3J0aW5nIiwgZHJhZnQuZ29hbC5mcmVxdWVuY3kuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrZHJhZnQuZ29hbC5mcmVxdWVuY3kuc2xpY2UoMSldLAogICAgWyJDb250cmFjdCB3aW5kb3ciLCBkcmFmdC5nb2FsLnN0YXJ0ICsg" +
  "IiDihpIgIiArIGRyYWZ0LmdvYWwuZW5kXSwKICAgIFsiUmVwb3J0aW5nIHBlcmlvZHMiLCBuXSwKICBdOwogIGlmKGRyYWZ0LnN0YWtlcy5yZWNpcGllbnQhPT0ibm9uZSIpIHJvd3MucHVzaChbIlN0YWtlIHBlciByZXBvcnQiLCBpbnIoZHJhZnQuc3Rha2VzLnN0YWtlQW1vdW50fHwwKV0pOwogIHJvd3MucHVzaChbIlJld2FyZCBwZXIgcmVwb3J0IiwgaW5yKGRyYWZ0LnN0YWtlcy5yZXdhcmRB" +
  "bW91bnR8fDApXSk7CiAgcm93cy5wdXNoKFsiRm9yZmVpdHMgZ28gdG8iLCByZWNMYWJlbCArIChkcmFmdC5zdGFrZXMub3JnPyAiIOKAlCAiK2RyYWZ0LnN0YWtlcy5vcmcgOiAiIildKTsKICByb3dzLnB1c2goWyJSZWZlcmVlIiwgZHJhZnQucmVmZXJlZS50eXBlPT09Imhvbm9yIiA/ICJPbiB5b3VyIGhvbm9yIiA6IChkcmFmdC5yZWZlcmVlLmNvbnRhY3QgfHwgIkluZGl2aWR1YWwgcmVmZXJl" +
  "ZSIpXSk7CiAgcm93cy5wdXNoKFsiU3VwcG9ydGVycyIsIGRyYWZ0LmZyaWVuZHMubGVuZ3RoID8gZHJhZnQuZnJpZW5kcy5qb2luKCIsICIpIDogIk5vbmUiXSk7CiAgcGIuaW5uZXJIVE1MID0gcm93cy5tYXAoKFtrLHZdKT0+YDxkaXYgY2xhc3M9InBiLXJvdyI+PHNwYW4gY2xhc3M9InBiLWsiPiR7a308L3NwYW4+PHNwYW4gY2xhc3M9InBiLXYiPiR7dn08L3NwYW4+PC9kaXY+YCkuam9pbigi" +
  "Iik7CiAgcmV0dXJuIHtuLCBzdGFrZVRvdGFsLCByZXdhcmRUb3RhbCwgZ3JhbmQsIHBlcmlvZHN9Owp9CmZ1bmN0aW9uIHJlZnJlc2hGdW5kU3RlcCgpewogIGNvbnN0IHtncmFuZH0gPSByZW5kZXJTdW1tYXJ5KCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImZ1bmQtd2FsbGV0LXZhbCIpLnRleHRDb250ZW50ID0gaW5yKHN0YXRlLndhbGxldC5iYWxhbmNlKTsKICBkb2N1bWVudC5nZXRF" +
  "bGVtZW50QnlJZCgiZnVuZC1yZXF1aXJlZC12YWwiKS50ZXh0Q29udGVudCA9IGlucihncmFuZCk7CiAgY29uc3Qgc2hvcnRmYWxsID0gTWF0aC5tYXgoMCwgZ3JhbmQgLSBzdGF0ZS53YWxsZXQuYmFsYW5jZSk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImZ1bmQtc2hvcnRmYWxsLXZhbCIpLnRleHRDb250ZW50ID0gaW5yKHNob3J0ZmFsbCk7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQo" +
  "ImFjdGl2YXRlLWJ0biIpLmRpc2FibGVkID0gc2hvcnRmYWxsID4gMCB8fCBncmFuZDw9MDsKfQpmdW5jdGlvbiB0b3BVcCgpewogIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInRvcHVwLWFtb3VudCIpOwogIGNvbnN0IGFtdCA9IHBhcnNlRmxvYXQoZWwudmFsdWUpfHwwOwogIGlmKGFtdDw9MCkgcmV0dXJuOwogIHN0YXRlLndhbGxldC5iYWxhbmNlICs9IGFtdDsKICBlbC52" +
  "YWx1ZSA9ICIiOwogIHNhdmUoKTsgcmVmcmVzaEZ1bmRTdGVwKCk7IHVwZGF0ZUhlYWRlcldhbGxldCgpOwp9CmZ1bmN0aW9uIGFjdGl2YXRlQ29udHJhY3QoKXsKICBjb25zdCB7Z3JhbmQsIHBlcmlvZHN9ID0gcmVuZGVyU3VtbWFyeSgpOwogIGlmKHN0YXRlLndhbGxldC5iYWxhbmNlIDwgZ3JhbmQgfHwgZ3JhbmQ8PTApIHJldHVybjsKICBzdGF0ZS53YWxsZXQuYmFsYW5jZSAtPSBncmFuZDsK" +
  "ICBjb25zdCBkcmFmdCA9IHN0YXRlLmRyYWZ0OwogIGNvbnN0IGNvbnRyYWN0ID0gewogICAgaWQ6IHVpZCgpLAogICAgZ29hbDogZHJhZnQuZ29hbCwKICAgIHN0YWtlczogZHJhZnQuc3Rha2VzLAogICAgcmVmZXJlZTogZHJhZnQucmVmZXJlZSwKICAgIGZyaWVuZHM6IGRyYWZ0LmZyaWVuZHMsCiAgICBwZXJpb2RzOiBwZXJpb2RzLm1hcCgocCxpKT0+KHsgaWR4OmkrMSwgZGF0ZTpwLmRhdGUs" +
  "IGxhYmVsOnAubGFiZWwsIHN0YXR1czoicGVuZGluZyIgfSkpLAogICAgbG9ja2VkOiBncmFuZCwKICAgIHRvdGFsUmV3YXJkZWQ6IDAsCiAgICB0b3RhbEZvcmZlaXRlZDogMCwKICAgIGVuZGVkOiBmYWxzZSwKICAgIGNyZWF0ZWRBdDogRGF0ZS5ub3coKQogIH07CiAgc3RhdGUuY29udHJhY3RzLnB1c2goY29udHJhY3QpOwogIHN0YXRlLmRyYWZ0ID0gbnVsbDsKICBzdGF0ZS5jdXJyZW50Q29u" +
  "dHJhY3RJZCA9IGNvbnRyYWN0LmlkOwogIHNhdmUoKTsKICBjb25zdCBzdGFtcCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzdGFtcCIpOwogIHN0YW1wLmNsYXNzTGlzdC5hZGQoInNob3ciKTsKICBzZXRUaW1lb3V0KCgpPT57CiAgICBzdGFtcC5jbGFzc0xpc3QucmVtb3ZlKCJzaG93Iik7CiAgICBzdGF0ZS5zY3JlZW4gPSAiZGV0YWlsIjsKICAgIHNhdmUoKTsKICAgIHJlbmRlcigpOwog" +
  "IH0sIDY1MCk7Cn0KCi8qIC0tLS0tLS0tLS0gTElTVCBTQ1JFRU4gLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiBnb0xpc3QoKXsKICBzdGF0ZS5zY3JlZW4gPSAibGlzdCI7CiAgc3RhdGUuY3VycmVudENvbnRyYWN0SWQgPSBudWxsOwogIHNhdmUoKTsKICByZW5kZXIoKTsKfQpmdW5jdGlvbiBvcGVuQ29udHJhY3QoaWQpewogIHN0YXRlLmN1cnJlbnRDb250cmFjdElkID0gaWQ7CiAgc3RhdGUuc2Ny" +
  "ZWVuID0gImRldGFpbCI7CiAgc2F2ZSgpOwogIHJlbmRlcigpOwp9CmZ1bmN0aW9uIHJlbmRlckxpc3QoKXsKICBjb25zdCBncmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImNvbnRyYWN0cy1ncmlkIik7CiAgY29uc3QgZW1wdHkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiY29udHJhY3RzLWVtcHR5Iik7CiAgY29uc3QgY29udHJhY3RzID0gc3RhdGUuY29udHJhY3RzLnNsaWNlKCku" +
  "c29ydCgoYSxiKT0+IChhLmVuZGVkIC0gYi5lbmRlZCkgfHwgKGIuY3JlYXRlZEF0IC0gYS5jcmVhdGVkQXQpKTsKICBlbXB0eS5jbGFzc0xpc3QudG9nZ2xlKCJoaWRkZW4iLCBjb250cmFjdHMubGVuZ3RoPjApOwogIGdyaWQuaW5uZXJIVE1MID0gY29udHJhY3RzLm1hcChjPT57CiAgICBjb25zdCBkb25lID0gYy5wZXJpb2RzLmZpbHRlcihwPT5wLnN0YXR1cyE9PSJwZW5kaW5nIikubGVuZ3Ro" +
  "OwogICAgY29uc3QgcGN0ID0gYy5wZXJpb2RzLmxlbmd0aCA/IE1hdGgucm91bmQoMTAwKmRvbmUvYy5wZXJpb2RzLmxlbmd0aCkgOiAwOwogICAgY29uc3QgcmVjTGFiZWwgPSB7YW50aWNoYXJpdHk6ImFudGktY2hhcml0eSIsIGNoYXJpdHk6ImNoYXJpdHkiLCBzdHJlYWtjb2luOiJzdHJlYWsgY29pbiIsIHBsYXRmb3JtOiJzdXBwb3J0IHVzIiwgbm9uZToibm8gc3Rha2UifVtjLnN0YWtlcy5y" +
  "ZWNpcGllbnRdOwogICAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJjb250cmFjdC1jYXJkIiBvbmNsaWNrPSJvcGVuQ29udHJhY3QoJyR7Yy5pZH0nKSI+CiAgICAgIDxkaXYgY2xhc3M9ImNjLXRvcCI+CiAgICAgICAgPGRpdiBjbGFzcz0iY2MtdGl0bGUiPiR7ZXNjYXBlSHRtbChjLmdvYWwudGl0bGUgfHwgIlVudGl0bGVkIGdvYWwiKX08L2Rpdj4KICAgICAgICA8c3BhbiBjbGFzcz0iY2MtYmFkZ2Ug" +
  "JHtjLmVuZGVkPydlbmRlZCc6J2FjdGl2ZSd9Ij4ke2MuZW5kZWQ/J0VuZGVkJzonQWN0aXZlJ308L3NwYW4+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGNsYXNzPSJjYy1tZXRhIj4ke2MuZ29hbC5mcmVxdWVuY3kuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrYy5nb2FsLmZyZXF1ZW5jeS5zbGljZSgxKX0gwrcgZm9yZmVpdHMgdG8gJHtyZWNMYWJlbH08L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0i" +
  "Y2MtcHJvZ3Jlc3MtdHJhY2siPjxkaXYgY2xhc3M9ImNjLXByb2dyZXNzLWZpbGwiIHN0eWxlPSJ3aWR0aDoke3BjdH0lIj48L2Rpdj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iY2Mtc3RhdHMiPjxzcGFuPkxvY2tlZCA8Yj4ke2lucihjLmxvY2tlZCl9PC9iPjwvc3Bhbj48c3Bhbj4ke2RvbmV9LyR7Yy5wZXJpb2RzLmxlbmd0aH0gcmVwb3J0ZWQ8L3NwYW4+PC9kaXY+CiAgICA8L2Rpdj5gOwog" +
  "IH0pLmpvaW4oIiIpICsgYDxkaXYgY2xhc3M9Im5ldy1jYXJkIiBvbmNsaWNrPSJnb05ld0NvbnRyYWN0KCkiPjxpIGNsYXNzPSJ0aSB0aS1wbHVzIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PC9pPjxzcGFuPk5ldyBoYWJpdCBjb250cmFjdDwvc3Bhbj48L2Rpdj5gOwp9CmZ1bmN0aW9uIGVzY2FwZUh0bWwocyl7CiAgcmV0dXJuIChzfHwiIikucmVwbGFjZSgvWyY8PiInXS9nLCBtPT4oeycmJzonJmFt" +
  "cDsnLCc8JzonJmx0OycsJz4nOicmZ3Q7JywnIic6JyZxdW90OycsIiciOicmIzM5Oyd9W21dKSk7Cn0KCi8qIC0tLS0tLS0tLS0gREVUQUlMIC8gREFTSEJPQVJEIC0tLS0tLS0tLS0gKi8KZnVuY3Rpb24gdG9kYXlTdHIoKXsgcmV0dXJuIGZtdERhdGUobmV3IERhdGUoKSk7IH0KZnVuY3Rpb24gY3VycmVudENvbnRyYWN0KCl7CiAgcmV0dXJuIHN0YXRlLmNvbnRyYWN0cy5maW5kKGM9PmMuaWQ9" +
  "PT1zdGF0ZS5jdXJyZW50Q29udHJhY3RJZCk7Cn0KZnVuY3Rpb24gYXBwbHlSZXN1bHQoYywgcCwgcmVzdWx0KXsKICBpZighcCB8fCBwLnN0YXR1cyE9PSJwZW5kaW5nIikgcmV0dXJuOwogIGNvbnN0IHN0YWtlID0gYy5zdGFrZXMuc3Rha2VBbW91bnR8fDA7CiAgY29uc3QgcmV3YXJkID0gYy5zdGFrZXMucmV3YXJkQW1vdW50fHwwOwogIGNvbnN0IHJlYyA9IGMuc3Rha2VzLnJlY2lwaWVudDsK" +
  "ICBpZihyZXN1bHQ9PT0ic3VjY2VzcyIpewogICAgcC5zdGF0dXM9InN1Y2Nlc3MiOwogICAgY29uc3QgcGF5b3V0ID0gTWF0aC5taW4ocmV3YXJkLCBjLmxvY2tlZCk7CiAgICBjLmxvY2tlZCAtPSBwYXlvdXQ7CiAgICBzdGF0ZS53YWxsZXQuYmFsYW5jZSArPSBwYXlvdXQ7CiAgICBjLnRvdGFsUmV3YXJkZWQgKz0gcGF5b3V0OwogIH0gZWxzZSB7CiAgICBwLnN0YXR1cz0iZmFpbGVkIjsKICAg" +
  "IGlmKHJlYz09PSJub25lIil7CiAgICAgIHAuZm9yZmVpdEFtb3VudCA9IDA7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBmb3JmZWl0ID0gTWF0aC5taW4oc3Rha2UrcmV3YXJkLCBjLmxvY2tlZCk7CiAgICAgIGMubG9ja2VkIC09IGZvcmZlaXQ7CiAgICAgIHAuZm9yZmVpdEFtb3VudCA9IGZvcmZlaXQ7CiAgICAgIGlmKHJlYz09PSJzdHJlYWtjb2luIil7CiAgICAgICAgc3RhdGUud2FsbGV0" +
  "LnN0cmVha0NvaW5zICs9IGZvcmZlaXQ7CiAgICAgIH0gZWxzZSB7CiAgICAgICAgYy50b3RhbEZvcmZlaXRlZCArPSBmb3JmZWl0OwogICAgICB9CiAgICB9CiAgfQp9CmZ1bmN0aW9uIHBlcmlvZFJvd0h0bWwoYywgcCwgdG9kYXkpewogIGNvbnN0IHJlYyA9IGMuc3Rha2VzLnJlY2lwaWVudDsKICBsZXQgaWR4Q2xhc3MgPSAiIiwgdGFnID0gYDxzcGFuIGNsYXNzPSJsci10YWcgd2FpdCI+UGVu" +
  "ZGluZzwvc3Bhbj5gOwogIGxldCBhY3Rpb25zID0gIiI7CiAgbGV0IGFtdFRleHQgPSAiIjsKICBpZihwLnN0YXR1cz09PSJzdWNjZXNzIil7CiAgICBpZHhDbGFzcz0id2luIjsgdGFnID0gYDxzcGFuIGNsYXNzPSJsci10YWcgd2luIj5SZXBvcnRlZCBzdWNjZXNzPC9zcGFuPmA7CiAgICBhbXRUZXh0ID0gYCsgJHtpbnIoYy5zdGFrZXMucmV3YXJkQW1vdW50KX1gOwogIH0gZWxzZSBpZihwLnN0" +
  "YXR1cz09PSJmYWlsZWQiKXsKICAgIGlkeENsYXNzPSJsb3NzIjsgdGFnID0gYDxzcGFuIGNsYXNzPSJsci10YWcgbG9zcyI+UmVwb3J0ZWQgbWlzc2VkPC9zcGFuPmA7CiAgICBpZihyZWM9PT0ibm9uZSIpewogICAgICBhbXRUZXh0ID0gIuKCuTAiOwogICAgfSBlbHNlIGlmKHJlYz09PSJzdHJlYWtjb2luIil7CiAgICAgIGFtdFRleHQgPSBgPGkgY2xhc3M9InRpIHRpLWZsYW1lIiBzdHlsZT0i" +
  "Zm9udC1zaXplOjEzcHg7IGNvbG9yOnZhcigtLWdvbGQtZGFyayk7IHZlcnRpY2FsLWFsaWduOi0ycHg7IiBhcmlhLWhpZGRlbj0idHJ1ZSI+PC9pPiAke2lucihwLmZvcmZlaXRBbW91bnR8fDApfWA7CiAgICB9IGVsc2UgewogICAgICBhbXRUZXh0ID0gYOKIkiAke2lucihwLmZvcmZlaXRBbW91bnR8fDApfWA7CiAgICB9CiAgfSBlbHNlIGlmKCFjLmVuZGVkICYmIHAuZGF0ZSA8PSB0b2RheSl7" +
  "CiAgICBhY3Rpb25zID0gYDxidXR0b24gY2xhc3M9Imdvb2QtYnRuIHNtYWxsIiBvbmNsaWNrPSJyZXBvcnRQZXJpb2QoJHtwLmlkeH0sJ3N1Y2Nlc3MnKSI+TWFyayBkb25lPC9idXR0b24+CiAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9ImRhbmdlci1idG4gc21hbGwiIG9uY2xpY2s9InJlcG9ydFBlcmlvZCgke3AuaWR4fSwnZmFpbGVkJykiPk1hcmsgbWlzc2VkPC9idXR0b24+YDsKICB9" +
  "IGVsc2UgewogICAgYW10VGV4dCA9IGA8c3BhbiBzdHlsZT0iY29sb3I6dmFyKC0taW5rLWZhaW50KSI+4oCUPC9zcGFuPmA7CiAgfQogIHJldHVybiBgPGRpdiBjbGFzcz0ibGVkZ2VyLXJvdyAke3Auc3RhdHVzIT09J3BlbmRpbmcnPydwYXN0JzonJ30iPgogICAgPGRpdiBjbGFzcz0ibHItaWR4ICR7aWR4Q2xhc3N9Ij4ke3AuaWR4fTwvZGl2PgogICAgPGRpdiBjbGFzcz0ibHItbWFpbiI+PGRp" +
  "diBjbGFzcz0ibHItZGF0ZSI+JHtwLmxhYmVsfTwvZGl2PjxkaXYgY2xhc3M9ImxyLXN1YiI+JHtwLmRhdGV9PC9kaXY+PC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJsci1hbXQiPiR7YW10VGV4dH08L2Rpdj4KICAgIDxkaXYgY2xhc3M9ImxyLWFjdGlvbnMiPiR7YWN0aW9ucyB8fCB0YWd9PC9kaXY+CiAgPC9kaXY+YDsKfQpmdW5jdGlvbiByZW5kZXJEZXRhaWwoKXsKICBjb25zdCBjID0gY3VycmVu" +
  "dENvbnRyYWN0KCk7CiAgaWYoIWMpeyBnb0xpc3QoKTsgcmV0dXJuOyB9CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImRhc2gtZ29hbC10aXRsZSIpLnRleHRDb250ZW50ID0gYy5nb2FsLnRpdGxlIHx8ICJVbnRpdGxlZCBnb2FsIjsKICBjb25zdCByZWNMYWJlbCA9IHthbnRpY2hhcml0eToiYW50aS1jaGFyaXR5IiwgY2hhcml0eToiY2hhcml0eSIsIHN0cmVha2NvaW46InN0cmVhayBjb2lu" +
  "IiwgcGxhdGZvcm06InN1cHBvcnQgdXMiLCBub25lOiJubyBzdGFrZSJ9W2Muc3Rha2VzLnJlY2lwaWVudF07CiAgY29uc3Qgc3Rha2VCaXQgPSBjLnN0YWtlcy5yZWNpcGllbnQ9PT0ibm9uZSIgPyAibm8gbW9uZXkgYXQgc3Rha2UiIDogYCR7aW5yKGMuc3Rha2VzLnN0YWtlQW1vdW50KX0gYXQgc3Rha2VgOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJkYXNoLWdvYWwtbWV0YSIpLnRleHRD" +
  "b250ZW50ID0KICAgIGAke2MuZ29hbC5mcmVxdWVuY3kuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkrYy5nb2FsLmZyZXF1ZW5jeS5zbGljZSgxKX0gcmVwb3J0aW5nIMK3ICR7c3Rha2VCaXR9IC8gJHtpbnIoYy5zdGFrZXMucmV3YXJkQW1vdW50KX0gcmV3YXJkIHBlciByZXBvcnQgwrcgZm9yZmVpdHMgZ28gdG8gJHtyZWNMYWJlbH1gOwoKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZGFzaC1l" +
  "eWVicm93IikudGV4dENvbnRlbnQgPSBjLmVuZGVkID8gIkVuZGVkIGNvbnRyYWN0IiA6ICJBY3RpdmUgY29udHJhY3QiOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJlbmRlZC1iYW5uZXIiKS5zdHlsZS5kaXNwbGF5ID0gYy5lbmRlZCA/ICJibG9jayIgOiAibm9uZSI7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImVuZC1jb250cmFjdC1idG4iKS5zdHlsZS5kaXNwbGF5ID0gYy5lbmRl" +
  "ZCA/ICJub25lIiA6ICJpbmxpbmUtYmxvY2siOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJ0b2RheS1sb2ctd3JhcCIpLnN0eWxlLmRpc3BsYXkgPSBjLmVuZGVkID8gIm5vbmUiIDogImJsb2NrIjsKCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImRhc2gtbG9ja2VkLXZhbCIpLnRleHRDb250ZW50ID0gaW5yKGMubG9ja2VkKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZGFzaC1y" +
  "ZXdhcmRlZC12YWwiKS50ZXh0Q29udGVudCA9IGlucihjLnRvdGFsUmV3YXJkZWQpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJkYXNoLWZvcmZlaXRlZC12YWwiKS50ZXh0Q29udGVudCA9IGlucihjLnRvdGFsRm9yZmVpdGVkKTsKCiAgY29uc3QgZG9uZSA9IGMucGVyaW9kcy5maWx0ZXIocD0+cC5zdGF0dXMhPT0icGVuZGluZyIpLmxlbmd0aDsKICBjb25zdCBwY3QgPSBjLnBlcmlvZHMu" +
  "bGVuZ3RoID8gTWF0aC5yb3VuZCgxMDAqZG9uZS9jLnBlcmlvZHMubGVuZ3RoKSA6IDA7CiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImRhc2gtcHJvZ3Jlc3MiKS5zdHlsZS53aWR0aCA9IHBjdCsiJSI7CgogIGNvbnN0IHRvZGF5ID0gdG9kYXlTdHIoKTsKICBjb25zdCBkdWVUb2RheSA9IGMucGVyaW9kcy5maWx0ZXIocD0+cC5zdGF0dXM9PT0icGVuZGluZyIgJiYgcC5kYXRlPD10b2RheSk7" +
  "CiAgY29uc3QgdG9kYXlMb2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgidG9kYXktbG9nIik7CiAgdG9kYXlMb2cuaW5uZXJIVE1MID0gZHVlVG9kYXkubGVuZ3RoCiAgICA/IGR1ZVRvZGF5Lm1hcChwPT5wZXJpb2RSb3dIdG1sKGMsIHAsIHRvZGF5KSkuam9pbigiIikKICAgIDogYDxkaXYgc3R5bGU9InBhZGRpbmc6MjJweDsgdGV4dC1hbGlnbjpjZW50ZXI7IGNvbG9yOnZhcigtLWluay1m" +
  "YWludCk7Ij5Ob3RoaW5nIGR1ZSB0byBsb2cgcmlnaHQgbm93LiBDb21lIGJhY2sgb24geW91ciBuZXh0IHJlcG9ydGluZyBkYXkuPC9kaXY+YDsKCiAgY29uc3QgbGVkZ2VyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImRhc2gtbGVkZ2VyIik7CiAgbGVkZ2VyLmlubmVySFRNTCA9IGMucGVyaW9kcy5tYXAocD0+cGVyaW9kUm93SHRtbChjLCBwLCB0b2RheSkpLmpvaW4oIiIpCiAgICB8fCBg" +
  "PGRpdiBzdHlsZT0icGFkZGluZzozMHB4OyB0ZXh0LWFsaWduOmNlbnRlcjsgY29sb3I6dmFyKC0taW5rLWZhaW50KTsiPk5vIHJlcG9ydGluZyBwZXJpb2RzIHlldC48L2Rpdj5gOwp9CmZ1bmN0aW9uIHJlcG9ydFBlcmlvZChpZHgsIHJlc3VsdCl7CiAgY29uc3QgYyA9IGN1cnJlbnRDb250cmFjdCgpOwogIGlmKCFjKSByZXR1cm47CiAgY29uc3QgcCA9IGMucGVyaW9kcy5maW5kKHg9PnguaWR4" +
  "PT09aWR4KTsKICBhcHBseVJlc3VsdChjLCBwLCByZXN1bHQpOwogIHNhdmUoKTsKICByZW5kZXJEZXRhaWwoKTsgdXBkYXRlSGVhZGVyV2FsbGV0KCk7Cn0KZnVuY3Rpb24gZW5kQ29udHJhY3QoKXsKICBjb25zdCBjID0gY3VycmVudENvbnRyYWN0KCk7CiAgaWYoIWMpIHJldHVybjsKICBjb25zdCBwZW5kaW5nQ291bnQgPSBjLnBlcmlvZHMuZmlsdGVyKHA9PnAuc3RhdHVzPT09InBlbmRpbmci" +
  "KS5sZW5ndGg7CiAgY29uc3QgbXNnID0gcGVuZGluZ0NvdW50PjAKICAgID8gYEVuZGluZyBub3cgd2lsbCBtYXJrIGFsbCAke3BlbmRpbmdDb3VudH0gcmVtYWluaW5nIHBlbmRpbmcgcGVyaW9kKHMpIGFzIG1pc3NlZCwgYW5kIHRoZWlyIHN0YWtlcyB3aWxsIG1vdmUgaW1tZWRpYXRlbHkuIENvbnRpbnVlP2AKICAgIDogYEVuZCB0aGlzIGNvbnRyYWN0P2A7CiAgc2hvd0NvbmZpcm0obXNnLCAo" +
  "KT0+ewogICAgYy5wZXJpb2RzLmZvckVhY2gocD0+eyBpZihwLnN0YXR1cz09PSJwZW5kaW5nIikgYXBwbHlSZXN1bHQoYywgcCwgImZhaWxlZCIpOyB9KTsKICAgIGMuZW5kZWQgPSB0cnVlOwogICAgc2F2ZSgpOwogICAgcmVuZGVyRGV0YWlsKCk7IHVwZGF0ZUhlYWRlcldhbGxldCgpOwogIH0pOwp9CgovKiAtLS0tLS0tLS0tIEhFQURFUiAtLS0tLS0tLS0tICovCmZ1bmN0aW9uIHVwZGF0ZUhl" +
  "YWRlcldhbGxldCgpewogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJoZHItd2FsbGV0IikudGV4dENvbnRlbnQgPSBpbnIoc3RhdGUud2FsbGV0LmJhbGFuY2UpOwogIGNvbnN0IHRvdGFsTG9ja2VkID0gc3RhdGUuY29udHJhY3RzLnJlZHVjZSgoc3VtLGMpPT5zdW0gKyAoYy5sb2NrZWR8fDApLCAwKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiaGRyLWxvY2tlZCIpLnRleHRDb250ZW50" +
  "ID0gaW5yKHRvdGFsTG9ja2VkKTsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiaGRyLXN0cmVhayIpLnRleHRDb250ZW50ID0gaW5yKHN0YXRlLndhbGxldC5zdHJlYWtDb2lucyk7Cn0KCi8qIC0tLS0tLS0tLS0gUkVTRVQgLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiByZXNldEFsbCgpewogIHNob3dDb25maXJtKCJUaGlzIGNsZWFycyB5b3VyIHdhbGxldCBhbmQgZXZlcnkgY29udHJhY3QuIENv" +
  "bnRpbnVlPyIsICgpPT57CiAgICBzdGF0ZSA9IGZyZXNoU3RhdGUoKTsKICAgIHNhdmUoKTsKICAgIHJlbmRlcigpOwogIH0pOwp9CgovKiAtLS0tLS0tLS0tIFJFTkRFUiAvIFNDUkVFTiBTV0lUQ0ggLS0tLS0tLS0tLSAqLwpmdW5jdGlvbiByZW5kZXIoKXsKICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic2NyZWVuLWxpc3QiKS5jbGFzc0xpc3QuYWRkKCJoaWRkZW4iKTsKICBkb2N1bWVudC5n" +
  "ZXRFbGVtZW50QnlJZCgic2NyZWVuLXdpemFyZCIpLmNsYXNzTGlzdC5hZGQoImhpZGRlbiIpOwogIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzY3JlZW4tZGV0YWlsIikuY2xhc3NMaXN0LmFkZCgiaGlkZGVuIik7CgogIGlmKHN0YXRlLnNjcmVlbj09PSJ3aXphcmQiICYmIHN0YXRlLmRyYWZ0KXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzY3JlZW4td2l6YXJkIikuY2xhc3NMaXN0" +
  "LnJlbW92ZSgiaGlkZGVuIik7CiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCIuc3RlcC1wYW5lbCIpLmZvckVhY2gocD0+cC5jbGFzc0xpc3QuYWRkKCJoaWRkZW4iKSk7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgicGFuZWwtIitzdGF0ZS5zdGVwKS5jbGFzc0xpc3QucmVtb3ZlKCJoaWRkZW4iKTsKICAgIHVwZGF0ZVRyYWNrZXIoKTsKICAgIGlmKHN0YXRlLnN0ZXA9PT0yKSBy" +
  "ZWZyZXNoU3Rha2VDYWxjKCk7CiAgICBpZihzdGF0ZS5zdGVwPT09NSkgcmVmcmVzaEZ1bmRTdGVwKCk7CiAgfSBlbHNlIGlmKHN0YXRlLnNjcmVlbj09PSJkZXRhaWwiICYmIGN1cnJlbnRDb250cmFjdCgpKXsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzY3JlZW4tZGV0YWlsIikuY2xhc3NMaXN0LnJlbW92ZSgiaGlkZGVuIik7CiAgICByZW5kZXJEZXRhaWwoKTsKICB9IGVsc2Ugewog" +
  "ICAgc3RhdGUuc2NyZWVuID0gImxpc3QiOwogICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInNjcmVlbi1saXN0IikuY2xhc3NMaXN0LnJlbW92ZSgiaGlkZGVuIik7CiAgICByZW5kZXJMaXN0KCk7CiAgfQogIHVwZGF0ZUhlYWRlcldhbGxldCgpOwp9CgpmdW5jdGlvbiBoeWRyYXRlV2l6YXJkSW5wdXRzKCl7CiAgY29uc3QgZHJhZnQgPSBzdGF0ZS5kcmFmdDsKICBnVGl0bGUudmFsdWUgPSBk" +
  "cmFmdC5nb2FsLnRpdGxlOwogIGNhdEdyaWQucXVlcnlTZWxlY3RvckFsbCgiaW5wdXQiKS5mb3JFYWNoKGk9PnsgaS5jaGVja2VkID0gZHJhZnQuZ29hbC5jYXRlZ29yaWVzLmluY2x1ZGVzKGkudmFsdWUpOyBpLmRpc2FibGVkPWZhbHNlOyB9KTsKICBvbkNhdENoYW5nZSgpOwogIHJlZnJlc2hGcmVxVUkoKTsKICBnQ29tbWl0LnZhbHVlID0gZHJhZnQuZ29hbC5jb21taXRUZXh0OwogIGdDb21t" +
  "aXRDb3VudC50ZXh0Q29udGVudCA9IGRyYWZ0LmdvYWwuY29tbWl0VGV4dC5sZW5ndGg7CiAgZ1N0YXJ0LnZhbHVlID0gZHJhZnQuZ29hbC5zdGFydDsKICBnRW5kLnZhbHVlID0gZHJhZnQuZ29hbC5lbmQ7CgogIHJlZnJlc2hSZWNpcGllbnRVSSgpOwogIGdPcmcudmFsdWUgPSBkcmFmdC5zdGFrZXMub3JnOwogIGdTdGFrZS52YWx1ZSA9IGRyYWZ0LnN0YWtlcy5zdGFrZUFtb3VudCB8fCAiIjsK" +
  "ICBnUmV3YXJkLnZhbHVlID0gZHJhZnQuc3Rha2VzLnJld2FyZEFtb3VudCB8fCAiIjsKICBnQWdyZWUuY2hlY2tlZCA9IGRyYWZ0LnN0YWtlcy5hZ3JlZTsKCiAgZ1JlZlR5cGUudmFsdWUgPSBkcmFmdC5yZWZlcmVlLnR5cGU7CiAgZ1JlZkNvbnRhY3QudmFsdWUgPSBkcmFmdC5yZWZlcmVlLmNvbnRhY3Q7CiAgcmVmcmVzaFJlZlVJKCk7CgogIHJlbmRlckZyaWVuZHMoKTsKfQoKLyogLS0tLS0t" +
  "LS0tLSBJTklUIC0tLS0tLS0tLS0gKi8KaWYoc3RhdGUuc2NyZWVuPT09IndpemFyZCIgJiYgc3RhdGUuZHJhZnQpewogIGh5ZHJhdGVXaXphcmRJbnB1dHMoKTsKfQpyZW5kZXIoKTsKPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPgo=";

// Decode the embedded Commitment Ledger app (habit-contract.html) at runtime.
// Recolored to match this app's dark slate + emerald theme; structure, copy,
// and every feature/interaction are otherwise untouched.
function decodeHabitContractHtml() {
  try {
    return decodeURIComponent(escape(window.atob(HABIT_CONTRACT_HTML_B64)));
  } catch (e) {
    return "";
  }
}

/* ---------------------------------------------------------
   GOALS VIEW (Habit Contracts) — embeds the full standalone
   "Commitment Ledger" app (habit-contract.html) via a
   sandboxed iframe, so its markup/logic stay isolated from
   the host app's React tree and global CSS.

   IMPORTANT: this iframe is given a large, fixed viewport-
   relative height and scrolls INTERNALLY (its own scrollbar),
   rather than being stretched to match its full content height.
   The embedded app's confirm dialog (used for "End contract",
   discarding a draft, resetting data, etc.) uses CSS
   `position: fixed` to center itself over whatever is currently
   visible. If the iframe were stretched to match arbitrarily
   tall content instead, `position: fixed` would center the
   dialog within that *entire* height rather than the visible
   area, so it could open far off-screen and look like the
   button did nothing. Keeping a bounded, self-scrolling iframe
   keeps that dialog (and any other overlay in the embedded app)
   reliably on-screen.
--------------------------------------------------------- */

function GoalsView() {
  const [htmlDoc, setHtmlDoc] = useState("");

  useEffect(() => {
    setHtmlDoc(decodeHabitContractHtml());
  }, []);

  return (
    <div className="flex h-full w-full flex-col px-6 py-4">
      <div className="mb-4 w-full flex-shrink-0 md:w-4/5" style={{ margin: "0 auto" }}>
        <h1 className="mb-1 text-2xl font-semibold text-white">Goals</h1>
        <p className="text-sm text-slate-500">
          Habit Contracts — commit to a goal, put money on the line, and report in on schedule.
        </p>
      </div>

      <div
        className="w-full flex-1 md:w-4/5"
        style={{
          margin: "0 auto",
          minHeight: 0,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.25)",
          background: "#0b1220",
        }}
      >
        {htmlDoc ? (
          <iframe
            title="Habit Contracts"
            srcDoc={htmlDoc}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
              background: "#0b1220",
            }}
          />
        ) : (
          <div className="py-10 text-center text-sm text-slate-500">Loading habit contracts…</div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   NEW HABIT SCORECARD — ported in full, unchanged, from the
   uploaded smooth-scroll-pal-main project's
   src/components/HabitScorecard.jsx. Every token, color,
   animation keyframe, step, and interaction below is exactly
   as authored there. The only edit versus the source file is
   removing its own "import React, { useState }" and
   lucide-react import lines, since this file already imports
   React/useState and all the same icons once at the top —
   duplicate imports aren't valid in a single file. Nothing in
   the component itself was touched.
--------------------------------------------------------- */

/* ---------------------------------------------------------------
   Design tokens — "field ledger" system.
   Paper surface, ink typography, three semantic category inks.
   Not the cream+terracotta default: base is a cool stone paper,
   primary accent is deep slate-indigo, category colors carry the
   only saturation on the page.
----------------------------------------------------------------*/
const TOKENS = `
  .hs-root {
    --paper: #020617;
    --paper-raised: #1e293b;
    --card: #0f172a;
    --ink: #f1f5f9;
    --ink-soft: #94a3b8;
    --ink-faint: #64748b;
    --line: #1e293b;
    --line-strong: #334155;
    --brand: #34d399;
    --brand-soft: rgba(16,185,129,0.12);
    --positive: #34d399;
    --positive-bg: rgba(16,185,129,0.12);
    --negative: #f87171;
    --negative-bg: rgba(248,113,113,0.12);
    --neutral: #60a5fa;
    --neutral-bg: rgba(59,130,246,0.12);
    --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.55);
    background: var(--paper);
    color: var(--ink);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    min-height: 100%;
    position: relative;
  }
  .hs-root::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .hs-serif { font-family: 'Fraunces', Georgia, serif; }
  .hs-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

  .hs-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: var(--shadow);
  }

  .hs-input {
    background: var(--paper-raised);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    color: var(--ink);
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .hs-input:focus {
    outline: none;
    border-color: var(--line-strong);
    box-shadow: none;
  }
  .hs-input::placeholder { color: var(--ink-faint); }

  .hs-btn-primary {
    background: var(--brand);
    color: #020617;
    border-radius: 10px;
    transition: transform .12s ease, background .15s ease, box-shadow .15s ease;
    box-shadow: 0 1px 0 rgba(0,0,0,0.15);
  }
  .hs-btn-primary:hover:not(:disabled) { background: #10b981; transform: translateY(-1px); }
  .hs-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .hs-btn-ghost {
    background: transparent;
    color: var(--ink-soft);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    transition: background .15s ease, color .15s ease;
  }
  .hs-btn-ghost:hover { background: var(--brand-soft); color: var(--brand); }

  .hs-focus-ring:focus-visible {
    outline: none;
  }

  @keyframes hs-slide-in {
    from { opacity: 0; transform: translateX(14px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes hs-fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes hs-pop {
    0% { transform: scale(0.94); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .hs-anim-slide { animation: hs-slide-in .28s cubic-bezier(.22,1,.36,1); }
  .hs-anim-fade { animation: hs-fade-up .28s cubic-bezier(.22,1,.36,1); }
  .hs-anim-pop { animation: hs-pop .22s cubic-bezier(.22,1,.36,1); }

  @media (prefers-reduced-motion: reduce) {
    .hs-anim-slide, .hs-anim-fade, .hs-anim-pop { animation: none; }
  }

  .hs-tab { width: 5px; border-radius: 6px; align-self: stretch; }

  .hs-thread {
    width: 2px;
    background-image: linear-gradient(var(--line-strong) 60%, transparent 0%);
    background-size: 2px 8px;
    background-repeat: repeat-y;
  }

  .hs-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .hs-scrollbar::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 6px; }
`;

const CATEGORY_META = {
  positive: {
    label: "Positive",
    symbol: "+",
    Icon: Plus,
    color: "var(--positive)",
    bg: "var(--positive-bg)",
    tooltip: "Moves you toward the person you want to become.",
  },
  negative: {
    label: "Negative",
    symbol: "–",
    Icon: Minus,
    color: "var(--negative)",
    bg: "var(--negative-bg)",
    tooltip: "Moves you away from the person you want to become.",
  },
  neutral: {
    label: "Neutral",
    symbol: "=",
    Icon: Equal,
    color: "var(--neutral)",
    bg: "var(--neutral-bg)",
    tooltip: "Neither helpful nor harmful — just observed.",
  },
};

let idCounter = 1;
const nextId = () => `h${idCounter++}`;

function CategoryPill({ value, active, onClick }) {
  const meta = CATEGORY_META[value];
  const Icon = meta.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={meta.tooltip}
      className="hs-focus-ring"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        border: `1.5px solid ${active ? meta.color : "var(--line-strong)"}`,
        background: active ? meta.bg : "var(--paper-raised)",
        color: active ? meta.color : "var(--ink-soft)",
        fontWeight: 600,
        fontSize: 13.5,
        cursor: "pointer",
        transition: "all .15s ease",
        flex: "1 1 0",
        justifyContent: "center",
      }}
    >
      <Icon size={15} strokeWidth={2.75} />
      {meta.label}
    </button>
  );
}

function Stepper({ step }) {
  const steps = ["Log Habit", "Implementation Intention", "Habit Stacking"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n === step ? "active" : n < step ? "done" : "upcoming";
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                className="hs-mono"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1.5px solid ${state === "upcoming" ? "var(--line-strong)" : "var(--brand)"}`,
                  background: state === "done" ? "var(--brand)" : state === "active" ? "var(--paper-raised)" : "transparent",
                  color: state === "done" ? "#F5F3EA" : state === "active" ? "var(--brand)" : "var(--ink-faint)",
                  transition: "all .2s ease",
                }}
              >
                {state === "done" ? <Check size={12} strokeWidth={3} /> : n}
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: state === "active" ? 600 : 500,
                  color: state === "upcoming" ? "var(--ink-faint)" : "var(--ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {n < 3 && (
              <div
                style={{
                  flex: 1,
                  minWidth: 16,
                  height: 1,
                  background: n < step ? "var(--brand)" : "var(--line)",
                  transition: "background .2s ease",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ExplainerCard({ title, children }) {
  return (
    <div
      className="hs-anim-fade"
      style={{
        background: "var(--brand-soft)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: "16px 18px",
        marginBottom: 18,
      }}
    >
      <div className="hs-serif" style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--brand)" }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>{children}</div>
    </div>
  );
}

function HabitScorecard({ ctx }) {
  // Lifted to App-level state (ctx.scorecardHabits) so Home and the Habits
  // page can offer these same habits in their "+ Add Habit" picker and track
  // them. Aliased to habits/setHabits so nothing below this line changes.
  const { scorecardHabits: habits, setScorecardHabits: setHabits } = ctx;
  const [formStep, setFormStep] = useState(1);

  // step 1 draft
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState(null);

  // active habit moving through steps 2-3
  const [activeId, setActiveId] = useState(null);

  // step 2 draft
  const [iTime, setITime] = useState("");
  const [iLocation, setILocation] = useState("");

  // step 3 draft
  const [stackAnchor, setStackAnchor] = useState("");

  // edit drawer
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  const [collapsedIds, setCollapsedIds] = useState(new Set());

  const activeHabit = habits.find((h) => h.id === activeId) || null;

  function toggleCollapsed(id) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetLogForm() {
    setDraftName("");
    setDraftCategory(null);
    setITime("");
    setILocation("");
    setStackAnchor("");
    setActiveId(null);
    setFormStep(1);
  }

  function handleLogHabit(e) {
    e.preventDefault();
    if (!draftName.trim() || !draftCategory) return;
    const siblingCount = habits.filter((h) => !h.stackAfter).length;
    const habit = {
      id: nextId(),
      name: draftName.trim(),
      category: draftCategory,
      intention: null,
      stackAfter: null,
      order: siblingCount,
    };
    setHabits((prev) => [...prev, habit]);
    setActiveId(habit.id);
    setFormStep(2);
  }

  function saveIntention() {
    if (!activeId) return;
    setHabits((prev) =>
      prev.map((h) => (h.id === activeId ? { ...h, intention: { time: iTime.trim(), location: iLocation.trim() } } : h))
    );
    setITime("");
    setILocation("");
    setFormStep(3);
  }

  function skipIntention() {
    setFormStep(3);
  }

  function saveStack() {
    if (!activeId) return;
    setHabits((prev) => {
      let list = [...prev];
      let anchorId = stackAnchor;

      // no other habits exist — create the default "Wake up" anchor habit
      const otherHabits = list.filter((h) => h.id !== activeId);
      if (anchorId === "__default_wakeup__" || (otherHabits.length === 0 && !anchorId)) {
        const wakeUp = {
          id: nextId(),
          name: "Wake up",
          category: "neutral",
          intention: null,
          stackAfter: null,
          order: -1,
        };
        list = [wakeUp, ...list];
        anchorId = wakeUp.id;
      }

      if (!anchorId) return list;

      const anchorChildren = list.filter((h) => h.stackAfter === anchorId);
      return list.map((h) =>
        h.id === activeId ? { ...h, stackAfter: anchorId, order: anchorChildren.length } : h
      );
    });
    setStackAnchor("");
    resetLogForm();
  }

  function skipStack() {
    resetLogForm();
  }

  function deleteHabit(id) {
    setHabits((prev) => {
      // reattach any children of the deleted habit to its own parent
      const target = prev.find((h) => h.id === id);
      const parent = target ? target.stackAfter : null;
      return prev
        .filter((h) => h.id !== id)
        .map((h) => (h.stackAfter === id ? { ...h, stackAfter: parent } : h));
    });
  }

  // Move a habit up/down among its siblings (habits stacked at the same
  // level, sharing the same stackAfter parent) by swapping "order" values
  // with the neighbor in that direction. Habits in different stacks never
  // swap with each other.
  function moveSibling(id, direction) {
    setHabits((prev) => {
      const target = prev.find((h) => h.id === id);
      if (!target) return prev;
      const parentKey = target.stackAfter || null;
      const siblings = prev
        .filter((h) => (h.stackAfter || null) === parentKey)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((h) => h.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return prev.map((h) => {
        if (h.id === a.id) return { ...h, order: b.order };
        if (h.id === b.id) return { ...h, order: a.order };
        return h;
      });
    });
  }

  function openEdit(habit) {
    setEditingId(habit.id);
    setEditDraft({
      name: habit.name,
      category: habit.category,
      hasIntention: !!habit.intention,
      time: habit.intention?.time || "",
      location: habit.intention?.location || "",
      stackAfter: habit.stackAfter || "",
    });
  }

  function saveEdit() {
    if (!editingId || !editDraft) return;
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== editingId) return h;
        return {
          ...h,
          name: editDraft.name.trim() || h.name,
          category: editDraft.category,
          intention: editDraft.hasIntention
            ? { time: editDraft.time.trim(), location: editDraft.location.trim() }
            : null,
          stackAfter: editDraft.stackAfter || null,
        };
      })
    );
    setEditingId(null);
    setEditDraft(null);
  }

  function siblingsOf(parentId) {
    return habits.filter((h) => (h.stackAfter || null) === (parentId || null)).sort((a, b) => a.order - b.order);
  }

  const roots = siblingsOf(null);
  const otherHabitsForStack = habits.filter((h) => h.id !== activeId);

  return (
    <div className="hs-root" style={{ padding: "32px 16px 80px" }}>
      <style>{TOKENS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <div className="w-full md:w-4/5" style={{ margin: "0 auto", position: "relative" }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div
            className="hs-mono"
            style={{ fontSize: 11.5, letterSpacing: "0.12em", color: "var(--ink-faint)", marginBottom: 6, textTransform: "uppercase" }}
          >
            Habit Scorecard
          </div>
          <h1 className="hs-serif" style={{ fontSize: 30, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            Log and shape your habits
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6, maxWidth: 480 }}>
            Notice what you already do, decide when you'll do it, and chain new habits onto the routine you already have.
          </p>
        </div>

        {/* ---------------- Logging Dashboard ---------------- */}
        <div className="hs-card" style={{ padding: "24px 22px", marginBottom: 36 }}>
          <Stepper step={formStep} />

          {formStep === 1 && (
            <div className="hs-anim-slide">
              <h2 className="hs-serif" style={{ fontSize: 19, fontWeight: 600, margin: "0 0 14px" }}>
                Log a Habit
              </h2>
              <input
                autoFocus
                className="hs-input hs-focus-ring"
                style={{ width: "100%", padding: "12px 14px", fontSize: 14.5, marginBottom: 14 }}
                placeholder="Example: Check phone when I wake up"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogHabit(e);
                }}
              />
              <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                {Object.keys(CATEGORY_META).map((key) => (
                  <CategoryPill key={key} value={key} active={draftCategory === key} onClick={() => setDraftCategory(key)} />
                ))}
              </div>
              {(() => {
                const disabled = !draftName.trim() || !draftCategory;
                return (
                  <>
                    <p style={{ fontSize: 12.5, color: "var(--ink-faint)", margin: "0 0 16px", minHeight: 16 }}>
                      {!draftName.trim()
                        ? "Name your habit to continue."
                        : !draftCategory
                          ? "Pick a category to continue."
                          : ""}
                    </p>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={handleLogHabit}
                      className="hs-btn-primary hs-focus-ring"
                      style={{
                        padding: "11px 22px",
                        fontSize: 14,
                        fontWeight: 600,
                        border: "none",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {formStep === 2 && activeHabit && (
            <div className="hs-anim-slide">
              <h2 className="hs-serif" style={{ fontSize: 19, fontWeight: 600, margin: "0 0 14px" }}>
                Add Implementation Intention
              </h2>
              <ExplainerCard title="What is an implementation intention?">
                Implementation intention is the practice of deciding in advance exactly when and where you will perform a habit.
                Instead of relying on motivation, you create a simple commitment like <em>"I will [habit] at [time] in [location]."</em>{" "}
                This makes habits more automatic, consistent, and easier to maintain over time.
              </ExplainerCard>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--ink)" }}>
                  I will{" "}
                  <span style={{ fontWeight: 700, background: "var(--brand-soft)", padding: "2px 8px", borderRadius: 6 }}>
                    {activeHabit.name}
                  </span>{" "}
                  at{" "}
                  <input
                    className="hs-input hs-focus-ring"
                    style={{ padding: "6px 10px", fontSize: 13.5, width: 150, display: "inline-block" }}
                    placeholder="7:00 AM"
                    value={iTime}
                    onChange={(e) => setITime(e.target.value)}
                  />{" "}
                  in{" "}
                  <input
                    className="hs-input hs-focus-ring"
                    style={{ padding: "6px 10px", fontSize: 13.5, width: 150, display: "inline-block" }}
                    placeholder="Bedroom"
                    value={iLocation}
                    onChange={(e) => setILocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={saveIntention}
                  disabled={!iTime.trim() || !iLocation.trim()}
                  className="hs-btn-primary hs-focus-ring"
                  style={{ padding: "11px 20px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Save Implementation Intention
                </button>
                <button onClick={skipIntention} className="hs-btn-ghost hs-focus-ring" style={{ padding: "11px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Skip
                </button>
              </div>
            </div>
          )}

          {formStep === 3 && activeHabit && (
            <div className="hs-anim-slide">
              <h2 className="hs-serif" style={{ fontSize: 19, fontWeight: 600, margin: "0 0 14px" }}>
                Add Habit Stacking
              </h2>
              <ExplainerCard title="What is habit stacking?">
                Habit stacking is the practice of building a new habit by attaching it to an existing habit you already do
                consistently: <em>"After [current habit], I will [new habit]."</em> This makes habits easier to remember and
                helps create strong routines through repetition.
              </ExplainerCard>

              <div style={{ fontSize: 13.5, lineHeight: 1.9, color: "var(--ink)", marginBottom: 16 }}>
                After{" "}
                <select
                  className="hs-input hs-focus-ring"
                  style={{ padding: "7px 10px", fontSize: 13.5, display: "inline-block", minWidth: 160 }}
                  value={stackAnchor}
                  onChange={(e) => setStackAnchor(e.target.value)}
                >
                  <option value="">
                    {otherHabitsForStack.length === 0 ? "Wake up (default)" : "Choose a habit…"}
                  </option>
                  {otherHabitsForStack.length === 0 && <option value="__default_wakeup__">Wake up</option>}
                  {otherHabitsForStack.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                , I will{" "}
                <span style={{ fontWeight: 700, background: "var(--brand-soft)", padding: "2px 8px", borderRadius: 6 }}>
                  {activeHabit.name}
                </span>
                .
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveStack} className="hs-btn-primary hs-focus-ring" style={{ padding: "11px 20px", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  Create Habit Stack
                </button>
                <button onClick={skipStack} className="hs-btn-ghost hs-focus-ring" style={{ padding: "11px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- Sequence ---------------- */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 className="hs-serif" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Your sequence
          </h2>
          <span className="hs-mono" style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
            {habits.length} habit{habits.length === 1 ? "" : "s"}
          </span>
        </div>

        {habits.length === 0 ? (
          <div
            className="hs-card hs-anim-fade"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              borderStyle: "dashed",
              borderColor: "var(--line-strong)",
              boxShadow: "none",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                margin: "0 auto 14px",
                borderRadius: 12,
                background: "var(--brand-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NotebookPen size={20} color="var(--brand)" strokeWidth={1.75} />
            </div>
            <p className="hs-serif" style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
              Start building your Habit Scorecard
            </p>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: 0 }}>Log your first habit above to begin.</p>
          </div>
        ) : (
          <div>
            {roots.map((h, i) => (
              <HabitChain
                key={h.id}
                habit={h}
                depth={0}
                siblingsOf={siblingsOf}
                onEdit={openEdit}
                onDelete={deleteHabit}
                collapsed={collapsedIds.has(h.id)}
                onToggleCollapse={toggleCollapsed}
                allowCollapse
                onMove={moveSibling}
                isFirst={i === 0}
                isLast={i === roots.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {editingId && editDraft && (
        <EditDrawer
          draft={editDraft}
          setDraft={setEditDraft}
          habits={habits}
          editingId={editingId}
          onClose={() => {
            setEditingId(null);
            setEditDraft(null);
          }}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function HabitChain({
  habit,
  depth,
  siblingsOf,
  onEdit,
  onDelete,
  collapsed = false,
  onToggleCollapse,
  allowCollapse = false,
  onMove,
  isFirst = false,
  isLast = false,
}) {
  const children = siblingsOf(habit.id);
  const hasChildren = children.length > 0;

  function countDescendants(id) {
    const direct = siblingsOf(id);
    return direct.reduce((sum, child) => sum + 1 + countDescendants(child.id), 0);
  }
  const hiddenCount = hasChildren ? countDescendants(habit.id) : 0;

  return (
    <div style={{ marginLeft: depth * 26 }}>
      <div
        className="hs-card hs-anim-fade"
        style={{
          display: "flex",
          marginBottom: 0,
          overflow: "hidden",
        }}
      >
        <div className="hs-tab" style={{ background: CATEGORY_META[habit.category].color }} />
        <div style={{ flex: 1, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>

          <div
            className="hs-mono"
            title={CATEGORY_META[habit.category].tooltip}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: CATEGORY_META[habit.category].color,
              background: CATEGORY_META[habit.category].bg,
            }}
          >
            {CATEGORY_META[habit.category].symbol}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {habit.name}
            </div>
            {habit.intention && (habit.intention.time || habit.intention.location) && (
              <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                {habit.intention.time && (
                  <span style={{ fontSize: 11.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={11} /> {habit.intention.time}
                  </span>
                )}
                {habit.intention.location && (
                  <span style={{ fontSize: 11.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={11} /> {habit.intention.location}
                  </span>
                )}
              </div>
            )}
            {habit.stackAfter && (
              <span style={{ fontSize: 11.5, color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                <Link2 size={11} /> stacked habit
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            {onMove && (
              <div style={{ display: "flex", flexDirection: "column", marginRight: 2 }}>
                <button
                  type="button"
                  onClick={() => onMove(habit.id, "up")}
                  disabled={isFirst}
                  className="hs-focus-ring"
                  style={{
                    background: "none",
                    border: "none",
                    padding: "1px 4px",
                    cursor: isFirst ? "default" : "pointer",
                    opacity: isFirst ? 0.3 : 1,
                    lineHeight: 0,
                  }}
                  title="Move up in stack"
                >
                  <ChevronUp size={13} color="var(--ink-soft)" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(habit.id, "down")}
                  disabled={isLast}
                  className="hs-focus-ring"
                  style={{
                    background: "none",
                    border: "none",
                    padding: "1px 4px",
                    cursor: isLast ? "default" : "pointer",
                    opacity: isLast ? 0.3 : 1,
                    lineHeight: 0,
                  }}
                  title="Move down in stack"
                >
                  <ChevronDown size={13} color="var(--ink-soft)" />
                </button>
              </div>
            )}
            {allowCollapse && hasChildren && (
              <button
                type="button"
                onClick={() => onToggleCollapse(habit.id)}
                className="hs-focus-ring"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
                title={collapsed ? "Expand stack" : "Collapse stack"}
              >
                {collapsed ? <ChevronRight size={16} color="var(--brand)" /> : <ChevronDown size={16} color="var(--brand)" />}
              </button>
            )}
            <button onClick={() => onEdit(habit)} className="hs-focus-ring" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }} title="Edit habit">
              <Pencil size={14} color="var(--ink-soft)" />
            </button>
            <button onClick={() => onDelete(habit.id)} className="hs-focus-ring" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }} title="Delete habit">
              <Trash2 size={14} color="var(--negative)" />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div style={{ display: "flex", marginLeft: 20 }}>
          <div className="hs-thread" style={{ marginRight: 8 }} />
          <div style={{ flex: 1, paddingTop: 6, paddingBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <CornerDownRight size={12} color="var(--ink-faint)" />
              <span className="hs-mono" style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.06em" }}>
                THEN
              </span>
            </div>
            {children.map((child, i) => (
              <HabitChain
                key={child.id}
                habit={child}
                depth={0}
                siblingsOf={siblingsOf}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                isFirst={i === 0}
                isLast={i === children.length - 1}
              />
            ))}
          </div>
        </div>
      )}
      {hasChildren && collapsed && (
        <div
          onClick={() => onToggleCollapse(habit.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: 20,
            padding: "6px 0",
            cursor: "pointer",
            color: "var(--ink-faint)",
            fontSize: 12,
          }}
          title="Expand stack"
        >
          <div className="hs-thread" style={{ marginRight: 8, flexShrink: 0 }} />
          <ChevronRight size={14} />
          <span className="hs-mono">{hiddenCount} habit{hiddenCount === 1 ? "" : "s"} in this stack hidden</span>
        </div>
      )}
      <div style={{ height: 10 }} />
    </div>
  );
}

function EditDrawer({ draft, setDraft, habits, editingId, onClose, onSave }) {
  const stackOptions = habits.filter((h) => h.id !== editingId);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(34,48,58,0.35)", animation: "hs-fade-up .2s ease" }}
      />
      <div
        className="hs-anim-slide"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(400px, 92vw)",
          background: "var(--paper-raised)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-12px 0 32px -12px rgba(34,48,58,0.25)",
          padding: "22px 22px 24px",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 className="hs-serif" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Edit Habit
          </h3>
          <button onClick={onClose} className="hs-focus-ring" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color="var(--ink-soft)" />
          </button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Habit name</label>
        <input
          className="hs-input hs-focus-ring"
          style={{ width: "100%", padding: "10px 12px", fontSize: 14, marginBottom: 18 }}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Category</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {Object.keys(CATEGORY_META).map((key) => (
            <CategoryPill key={key} value={key} active={draft.category === key} onClick={() => setDraft({ ...draft, category: key })} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Implementation intention</label>
          <button
            onClick={() => setDraft({ ...draft, hasIntention: !draft.hasIntention })}
            className="hs-focus-ring"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              border: "none",
              background: "none",
              color: "var(--brand)",
              cursor: "pointer",
            }}
          >
            {draft.hasIntention ? "Remove" : "+ Add"}
          </button>
        </div>
        {draft.hasIntention && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <input
              className="hs-input hs-focus-ring"
              style={{ flex: 1, padding: "10px 12px", fontSize: 13.5 }}
              placeholder="Time (e.g. 7:00 AM)"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            />
            <input
              className="hs-input hs-focus-ring"
              style={{ flex: 1, padding: "10px 12px", fontSize: 13.5 }}
              placeholder="Location"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </div>
        )}

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>
          Stack after
        </label>
        <select
          className="hs-input hs-focus-ring"
          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, marginBottom: 26 }}
          value={draft.stackAfter}
          onChange={(e) => setDraft({ ...draft, stackAfter: e.target.value })}
        >
          <option value="">No stack — top-level habit</option>
          {stackOptions.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onSave} className="hs-btn-primary hs-focus-ring" style={{ flex: 1, padding: "11px 0", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Save changes
          </button>
          <button onClick={onClose} className="hs-btn-ghost hs-focus-ring" style={{ padding: "11px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
