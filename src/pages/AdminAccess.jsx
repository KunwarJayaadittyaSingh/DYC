import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// ---- PASSWORDS (edit here or in .env, then restart / redeploy) -----------
// Opens the admin page
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Youthvibe';
// Opens Settings inside the admin page
const SETTINGS_PASSWORD = import.meta.env.VITE_SETTINGS_PASSWORD || 'YouthCapital';
// --------------------------------------------------------------------------

const SESSION_KEY = 'dyc_admin_ok';
const POLL_MS = 10000;
const JUDGES = [1, 2, 3, 4];
const TEAMS = [1, 2, 3, 4];

// ---- EVENT SELECTOR (exact order + casing; extra events are appended after these) ----
const FEST_EVENTS = ['YOUTHVIBE', 'MAGNITUDE', 'FTS', 'CONCOCTION', 'TEDx', 'HULT PRIZE'];
// Ask dyc_list to filter by event (`p_event`). If the database function has not been updated yet,
// the page automatically falls back to filtering in the browser, so nothing breaks either way.
const SERVER_SIDE_EVENT_FILTER = true;
// While filtering on the client we ask the server for a larger page so the filter has enough rows.
const CLIENT_SCOPE_FETCH = 5000;
// Fields that can say which event a record belongs to.
const EVENT_FIELDS = ['event', 'eventName', 'event_name', 'eventId', 'event_id', 'category'];

// ---- DEFAULT EVENTS (can be edited live from Settings → Events) -----------
const EVENTS = [
  { id: 'paridhan', name: 'Paridhan', group: 'Lifestyle', min: 4, max: 15 },
  { id: 'mag gala', name: 'Magnitude Gala', group: 'Lifestyle', min: 1, max: 1 },
  { id: 'open-mic', name: 'Open Mic', group: 'Literary & Theatre', min: 1, max: 3 },
  { id: 'nukkad-natak', name: 'Nukkad Natak', group: 'Literary & Theatre', min: 1, max: 10 },
  { id: 'step-sync', name: 'Step Sync', group: 'Lifestyle', min: 4, max: 8 },
  { id: 'voice of-magnitude', name: 'Voice of Magnitude', group: 'Lifestyle', min: 1, max: 1 },
  { id: 'soundscape', name: 'Soundscape (Instrumental)', group: 'Lifestyle', min: 1, max: 10 },
  { id: 'dance-crew-showcase', name: 'Dance Crew Showcase', group: 'Lifestyle', min: 2, max: 10 },
  { id: 'spike-showdown', name: 'Spike Showdown (Valorant)', group: 'eSports', min: 5, max: 5 },
  { id: 'bgmi', name: 'Battleground Magnitude Series (BGMI)', group: 'eSports', min: 4, max: 4 },
  { id: 'free-fire', name: 'Free Fire Magnitude Series', group: 'eSports', min: 1, max: 4 },
  { id: 'kitchen-king', name: "LPU's Kitchen King", group: 'Management', min: 1, max: 2 },
  { id: 'rush-to-roadies', name: 'Rush to Roadies', group: 'Sports', min: 1, max: 1 },
  { id: 'group choir & ensemble showcase', name: 'Group Choir & Ensemble Showcase', group: 'Lifestyle', min: 2, max: 10 },
  { id: 'poetry-slam', name: 'Poetry Slam', group: 'Literary & Theatre', min: 1, max: 1 },
  { id: 'one act play', name: 'One Act Play', group: 'Literary & Theatre', min: 1, max: 1 },
  { id: 'news-debate', name: 'The News Debate', group: 'Literary & Theatre', min: 1, max: 1 },
];

const DEFAULT_CFG = {
  team_names: ['Team Spartans', 'Team Vikings', 'Team Titans', 'Team Gladiators'],
  categories: ['Open Mic', 'Mag Gala', 'Paridhan'],
  max_score: 10,
  score_step: 0.5, // step of the mark boxes
  rank_by: 'avg', // 'avg' | 'total'
  scoring_open: true, // flag saved with the event settings
  events: null, // null = use the EVENTS list above
  festival_events: [], // extra events for the Select Event list (names, in the order they were added)
};

const getEvents = (cfg) => (Array.isArray(cfg.events) && cfg.events.length ? cfg.events : EVENTS);

const GROUP_ICON = {
  Lifestyle: '✨', 'Literary & Theatre': '🎭', eSports: '🎮', Management: '🍳', Sports: '🏃',
};
const sizeLabel = (ev) =>
  ev.max === 1 ? 'Solo' : ev.min === ev.max ? `Team of ${ev.max}` : `Team of ${ev.min}–${ev.max}`;
// --------------------------------------------------------------------------

// ---- BACKGROUND THEMES (colours: glow 1, glow 2, glow 3, deep base) -------
const THEMES = {
  crimson: { name: 'Crimson', colors: ['#ef4444', '#be123c', '#f97316', '#450a0a'] },
  sunset: { name: 'Sunset', colors: ['#f97316', '#ec4899', '#facc15', '#431407'] },
  rose: { name: 'Rose', colors: ['#f43f5e', '#d946ef', '#fb7185', '#4c0519'] },
  plum: { name: 'Plum', colors: ['#a855f7', '#e11d48', '#6366f1', '#2e1065'] },
  midnight: { name: 'Midnight', colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#0f172a'] },
};
const BG_DEFAULT = { theme: 'crimson', motion: true };
// --------------------------------------------------------------------------

// Everything except Settings opens on laptops / desktops only.
const MOBILE_UA = /Android|iPhone|iPod|Mobile/i;
const isDesk = () => window.innerWidth >= 1024 && !MOBILE_UA.test(navigator.userAgent);

// Cards use a solid tint instead of backdrop-blur, so the animated background never makes them lag.
const GLASS = 'rounded-3xl border bg-zinc-950/60';
const IDLE = 'border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]';
const ACTIVE = 'border-red-500/60 shadow-[0_18px_60px_rgba(239,68,68,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]';
const INPUT = 'w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]';
const BTN = 'rounded-xl bg-red-500 px-6 py-3 font-semibold text-black shadow-[0_6px_24px_rgba(239,68,68,0.3)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50';
const GHOST = 'rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-300 transition hover:border-red-500/60 hover:text-white disabled:opacity-50';
const DANGER = 'rounded-xl border border-red-500/50 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50';

const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};

const downloadFile = (name, text, type) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

const downloadCsv = (name, list) => {
  if (!list.length) return;
  const cols = Object.keys(list[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [cols.join(','), ...list.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  downloadFile(name, text, 'text/csv');
};

// small CSV reader (handles quotes, commas and line breaks inside quotes)
const parseCsv = (text) => {
  const out = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i += 1; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim() !== '')) out.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== '')) out.push(row);
  return out;
};

const initials = (n) =>
  String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => (w[0] || '').toUpperCase()).join('') || '?';

// letters + digits only, lower case
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const slug = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';

const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

// header names accepted when importing a CSV → participant field
const HEADER_MAP = {
  registrationno: 'registration_no', registration: 'registration_no', regno: 'registration_no', reg: 'registration_no',
  studentname: 'student_name', name: 'student_name',
  phone: 'phone', mobile: 'phone', contact: 'phone',
  email: 'email', mail: 'email',
  category: 'category', event: 'category',
  chestno: 'chest_no', chest: 'chest_no',
  teamno: 'team_no', team: 'team_no',
};

// does a stored value (registered category / saved extra event) refer to this event?
// matches the event name or id, and still works for longer text like "Open Mic - Solo"
const matches = (value, ev) => {
  const v = norm(value);
  if (v.length < 3) return false;
  return [ev.name, ev.id].some((k) => {
    const n = norm(k);
    return v === n || v.includes(n) || n.includes(v);
  });
};

// ---- event scope: which records belong to the event picked at the top ----
const recordEventValues = (rec) => {
  if (!rec) return [];
  const out = EVENT_FIELDS.map((k) => rec[k]);
  if (Array.isArray(rec.extra_events)) out.push(...rec.extra_events);
  return out.filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
};

// `label` keeps its exact UI casing. Comparison is case/space/punctuation-insensitive,
// so "YOUTHVIBE" matches "youthvibe" and "YouthVibe" in the database.
// MAGNITUDE also owns its sub-events (Paridhan, Open Mic, ...), which is how its records are filed.
const makeScope = (label, subEvents = []) => {
  const key = norm(label);
  const isMagnitude = key === 'magnitude';
  const has = (rec) =>
    recordEventValues(rec).some((v) => norm(v) === key || (isMagnitude && subEvents.some((ev) => matches(v, ev))));
  const slugName = String(label).trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'EVENT';
  return {
    label,
    key,
    slug: slugName,
    has,
    // new / imported participants are filed under the event name (MAGNITUDE keeps its own categories)
    defaultCategory: isMagnitude ? '' : label,
    // e.g. YOUTHVIBE_participants_2026.csv
    file: (base, ext = 'csv') => `${slugName}_${base}_${new Date().getFullYear()}.${ext}`,
  };
};

// dyc_list, limited to the active event. Same RPC and arguments as before.
const fetchPeople = async (scope, q = '', limit = 300) => {
  if (scope && SERVER_SIDE_EVENT_FILTER) {
    try {
      return (await rpc('dyc_list', { p_q: q, p_limit: limit, p_event: scope.label })) || [];
    } catch (e) {
      // only an old dyc_list (no p_event yet) falls through to the browser-side filter below
      if (!/p_event|function/i.test(String(e.message))) throw e;
    }
  }
  const list = (await rpc('dyc_list', { p_q: q, p_limit: scope ? Math.max(limit, CLIENT_SCOPE_FETCH) : limit })) || [];
  return scope ? list.filter(scope.has).slice(0, limit) : list;
};

const ScopeContext = createContext(null);
const useScope = () => useContext(ScopeContext);

// Summary numbers for one event, worked out from that event's participants + marks.
function scopedStats(people, scoreRows, dueRemoval) {
  const hasChest = (p) => String(p.chest_no ?? '').trim() !== '';
  const picked = (p) => Number(p.team_no) > 0;
  const cats = new Map();
  people.forEach((p) => {
    const c = String(p.category ?? '').trim();
    if (!c) return;
    const e = cats.get(c) || { category: c, registered: 0, arrived: 0, selected: 0 };
    e.registered += 1;
    if (hasChest(p)) e.arrived += 1;
    if (picked(p)) e.selected += 1;
    cats.set(c, e);
  });
  return {
    registered: people.length,
    arrived: people.filter(hasChest).length,
    selected: people.filter(picked).length,
    waiting: people.filter((p) => hasChest(p) && !picked(p)).length,
    scores: scoreRows.length,
    teams: TEAMS.map((t) => ({ team: t, count: people.filter((p) => Number(p.team_no) === t).length })),
    categories: [...cats.values()].sort((a, b) => b.registered - a.registered),
    due_removal: dueRemoval, // only available across all events
  };
}

function useIsDesktop() {
  const [d, setD] = useState(isDesk);
  useEffect(() => {
    const f = () => setD(isDesk());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return d;
}

function useConfig() {
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await rpc('dyc_get_config');
      if (d) setCfg({ ...DEFAULT_CFG, ...d });
    } catch { /* keep defaults */ }
    finally { setReady(true); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return [cfg, load, ready];
}

// value kept in this browser only (appearance, auto-lock)
function useLocalState(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s === null ? initial : JSON.parse(s);
    } catch { return initial; }
  });
  const set = useCallback((n) => {
    setV(n);
    try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ }
  }, [key]);
  return [v, set];
}

// save one setting to the event config and refresh it
function usePut(reloadCfg) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const put = async (key, value, okText) => {
    setBusy(true);
    setMsg(null);
    try {
      await rpc('dyc_set_config', { p_key: key, p_value: value });
      await reloadCfg();
      setMsg({ ok: true, text: okText });
      return true;
    } catch (e) {
      setMsg({ ok: false, text: e.message });
      return false;
    } finally { setBusy(false); }
  };
  return [put, msg, busy];
}

function usePoll(fn, deps) {
  const [data, setData] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => { try { setData(await fn()); } catch { /* ignore */ } }, deps);
  useEffect(() => {
    run();
    const t = setInterval(run, POLL_MS);
    return () => clearInterval(t);
  }, [run]);
  return [data, run];
}

// Team totals + ranked participants from the raw score rows
function summarise(rows, rankBy) {
  const teamStats = TEAMS.map((t) => {
    const r = rows.filter((x) => x.team === t);
    return { team: t, entries: r.length, total: r.reduce((a, x) => a + Number(x.score || 0), 0) };
  });
  const map = {};
  rows.forEach((r) => {
    const key = `${r.team}|${r.category}|${r.chest_no}`;
    if (!map[key])
      map[key] = {
        key, team: r.team, category: r.category, chest_no: r.chest_no,
        registration_no: r.registration_no || '', name: r.student_name, total: 0, marks: [],
      };
    if (!map[key].registration_no && r.registration_no) map[key].registration_no = r.registration_no;
    map[key].total += Number(r.score || 0);
    map[key].marks.push({ id: r.id, judge: r.judge, score: Number(r.score || 0) });
  });
  const students = Object.values(map)
    .map((s) => ({
      ...s,
      judgeCount: new Set(s.marks.map((m) => m.judge)).size,
      avg: s.total / s.marks.length,
      marks: [...s.marks].sort((a, b) => a.judge - b.judge),
    }))
    .sort((a, b) => (rankBy === 'total' ? b.total - a.total || b.avg - a.avg : b.avg - a.avg || b.total - a.total));
  return { teamStats, students, rankBy: rankBy === 'total' ? 'total' : 'avg' };
}

/* ---------- animated background (transform-only, so it stays smooth) ---------- */
const PAGE_CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
  @keyframes ringPulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.55);opacity:0}}
  @keyframes driftA{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(12vmax,8vmax,0) scale(1.12)}}
  @keyframes driftB{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-10vmax,-9vmax,0) scale(1.1)}}
  @keyframes driftC{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(8vmax,-10vmax,0) scale(1.15)}}
  .fade-up{animation:fadeUp .4s ease both}
  .pop{animation:pop .35s cubic-bezier(.2,1.4,.4,1) both}
  @keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
  .drop-in{animation:dropIn .18s ease-out both;transform-origin:top center}
  .ring{position:relative}
  .ring::after{content:'';position:absolute;inset:0;border-radius:9999px;border:2px solid rgba(239,68,68,.55);animation:ringPulse 1.8s ease-out infinite;pointer-events:none}
  .bg-blob{position:absolute;border-radius:9999px;will-change:transform;transform:translate3d(0,0,0)}
  .bg-blob-a{animation:driftA 38s ease-in-out infinite}
  .bg-blob-b{animation:driftB 46s ease-in-out infinite}
  .bg-blob-c{animation:driftC 54s ease-in-out infinite}
  @media (prefers-reduced-motion:reduce){.fade-up,.pop,.drop-in,.ring::after,.bg-blob-a,.bg-blob-b,.bg-blob-c{animation:none}}
`;

const Backdrop = memo(function Backdrop({ theme, motion }) {
  const [a, b, c, d] = (THEMES[theme] || THEMES.crimson).colors;
  const blob = (color, extra) => ({
    ...extra,
    background: `radial-gradient(circle at center, ${color}59 0%, ${color}00 62%)`,
  });
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" style={{ contain: 'strict' }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${d}80 0%, #000 58%)` }} />
      <div className={`bg-blob ${motion ? 'bg-blob-a' : ''}`} style={blob(a, { width: '68vmax', height: '68vmax', left: '-18vmax', top: '-26vmax' })} />
      <div className={`bg-blob ${motion ? 'bg-blob-b' : ''}`} style={blob(b, { width: '60vmax', height: '60vmax', right: '-20vmax', top: '18vh' })} />
      <div className={`bg-blob ${motion ? 'bg-blob-c' : ''}`} style={blob(c, { width: '56vmax', height: '56vmax', left: '12vw', bottom: '-30vmax' })} />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 28%, #000 0%, transparent 72%)',
          maskImage: 'radial-gradient(ellipse at 50% 28%, #000 0%, transparent 72%)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)' }} />
    </div>
  );
});

/* ---------- small shared pieces ---------- */
const Page = ({ children, theme, motion }) => (
  <div className="relative min-h-screen overflow-hidden bg-black px-4 pb-14 pt-28 text-white">
    <style>{PAGE_CSS}</style>
    <Backdrop theme={theme} motion={motion} />
    <div className="relative z-10 mx-auto max-w-6xl">{children}</div>
  </div>
);

const Msg = ({ m }) =>
  m ? <p className={`text-sm ${m.ok ? 'text-green-400' : 'text-red-400'}`}>{m.text}</p> : null;

const Chip = ({ children }) => (
  <span className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400">{children}</span>
);

const Soft = ({ children }) => (
  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300">{children}</span>
);

const Field = ({ label, value, onChange, ...p }) => (
  <div>
    <label className="text-sm text-zinc-400">{label}</label>
    <input className={INPUT} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />
  </div>
);

const Info = ({ k, v }) => (
  <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
    <p className="text-xs text-zinc-500">{k}</p>
    <p className="mt-0.5 wrap-break-word font-medium">{v || '—'}</p>
  </div>
);

const Section = ({ title, hint, children, className = '' }) => (
  <div className={`space-y-3 p-6 ${GLASS} ${IDLE} ${className}`}>
    <div>
      <h3 className="font-semibold">{title}</h3>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
    {children}
  </div>
);

// pill-style choice buttons
const Seg = ({ value, options, onChange, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(([v, label]) => (
      <button key={String(v)} type="button" disabled={disabled} onClick={() => onChange(v)}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${value === v ? 'border-red-500 bg-red-500 text-black' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
        {label}
      </button>
    ))}
  </div>
);

const Spinner = ({ className = 'h-5 w-5' }) => (
  <span aria-hidden="true" className={`inline-block animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 motion-reduce:animate-none ${className}`} />
);

const WorkspaceLoading = ({ label }) => (
  <div role="status" aria-live="polite" className="space-y-6">
    <div className="flex items-center gap-3 text-sm text-zinc-300"><Spinner /> {label}…</div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className={`h-40 animate-pulse motion-reduce:animate-none ${GLASS} ${IDLE}`} />)}
    </div>
  </div>
);

const EventEmptyState = () => (
  <div role="status" className={`fade-up mx-auto mt-4 max-w-lg space-y-3 p-10 text-center ${GLASS} ${IDLE}`}>
    <div className="text-5xl">🗂️</div>
    <h2 className="text-xl font-semibold">No event selected</h2>
    <p className="text-sm text-zinc-400">Select an event above to load participant records, stats and exports.</p>
  </div>
);

// each festival gets its own colour; events added later cycle through the spare colours
const EVENT_ACCENT = { youthvibe: '#f97316', magnitude: '#ec4899', fts: '#06b6d4', concoction: '#a855f7', tedx: '#ef4444', hultprize: '#facc15' };
const SPARE_ACCENT = ['#22c55e', '#3b82f6', '#f43f5e', '#14b8a6'];
const accentFor = (label, i) => EVENT_ACCENT[norm(label)] || SPARE_ACCENT[(i - FEST_EVENTS.length) % SPARE_ACCENT.length] || '#ef4444';

// numbers ease up to their value (skipped when the system asks for reduced motion)
function CountUp({ value }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from.current === value) { setN(value); from.current = value; return undefined; }
    const a = from.current;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min((t - t0) / 700, 1);
      setN(Math.round(a + (value - a) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

function EventSelector({ options, value, onChange, unknown, subEvents = [], stats = null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const [counts, setCounts] = useState(null);
  const trigger = useRef(null);
  const search = useRef(null);
  const itemRefs = useRef([]);
  const colsRef = useRef(1);

  const shown = useMemo(() => {
    const q = norm(query);
    return options.map((name, index) => ({ name, index })).filter((o) => !q || norm(o.name).includes(q));
  }, [options, query]);

  const valueIndex = value ? options.indexOf(value) : -1;
  const accent = value ? accentFor(value, valueIndex) : null;

  const close = (refocus) => { setOpen(false); if (refocus) trigger.current?.focus(); };
  const openMenu = useCallback(() => {
    const w = window.innerWidth;
    colsRef.current = w >= 1024 ? 3 : w >= 640 ? 2 : 1;
    setQuery('');
    setHi(Math.max(0, valueIndex));
    setOpen(true);
  }, [valueIndex]);
  const pick = (name) => { onChange(name); close(true); };

  // Ctrl / Cmd + K opens the switcher from anywhere on the page
  useEffect(() => {
    const f = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openMenu(); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [openMenu]);

  useEffect(() => { if (open) search.current?.focus(); }, [open]);
  useEffect(() => { if (open) itemRefs.current[hi]?.scrollIntoView({ block: 'nearest' }); }, [hi, open]);

  // registered people per event, refreshed every time the switcher opens
  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    (async () => {
      try {
        const list = await fetchPeople(null, '', CLIENT_SCOPE_FETCH);
        if (!live) return;
        const next = {};
        options.forEach((name) => {
          const sc = makeScope(name, subEvents);
          next[name] = sc.key === 'magnitude' && SERVER_SIDE_EVENT_FILTER ? list.length : list.filter(sc.has).length;
        });
        setCounts(next);
      } catch { /* counts are optional */ }
    })();
    return () => { live = false; };
  }, [open, options, subEvents]);

  const move = (d) => setHi((i) => Math.max(0, Math.min(i + d, shown.length - 1)));
  const onKey = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(colsRef.current); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-colsRef.current); }
    else if (e.key === 'ArrowRight' && !query) { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft' && !query) { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[hi]) pick(shown[hi].name); }
    else if (e.key === 'Tab') setOpen(false);
  };

  const spot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };

  return (
    <section aria-label="Event selector" className="relative z-20 mb-8">
      <p id="admin-event-label" className="mb-2 text-sm font-medium text-zinc-300">Select Event</p>

      <div className="relative z-30" onKeyDown={onKey}>
        {/* ---- the bar you see all the time ---- */}
        <button ref={trigger} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open}
          aria-controls="admin-event-list" aria-labelledby="admin-event-label"
          onClick={() => (open ? close(false) : openMenu())} onMouseMove={spot}
          className="group relative z-30 flex w-full flex-wrap items-center gap-x-6 gap-y-4 overflow-hidden rounded-[28px] border px-5 py-5 text-left outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-white/40 sm:px-6"
          style={{
            borderColor: accent ? (open ? `${accent}cc` : `${accent}55`) : (open ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'),
            background: `linear-gradient(100deg, ${accent || '#ef4444'}${accent ? '38' : '24'} 0%, rgba(9,9,11,0.55) 42%, rgba(9,9,11,0.28) 100%)`,
            boxShadow: accent ? `0 24px 60px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.1)` : 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(420px circle at var(--x, 30%) var(--y, 50%), ${accent || '#ef4444'}26, transparent 70%)` }} />

          <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-extrabold transition duration-300 group-hover:scale-105"
            style={accent
              ? { background: `linear-gradient(145deg, ${accent}, ${accent}b3)`, color: '#000', boxShadow: `0 10px 30px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.45)` }
              : { border: '1px dashed rgba(255,255,255,0.3)', color: '#a1a1aa', background: 'rgba(255,255,255,0.04)' }}>
            {value ? initials(value) : '＋'}
          </span>

          <span className="relative min-w-0 flex-1 basis-56">
            <span className="flex items-center gap-3">
              <span className={`truncate text-xl font-extrabold tracking-tight sm:text-2xl ${value ? 'text-white' : 'text-zinc-200'}`}>
                {value || '-- Choose an Event to View Data --'}
              </span>
              {value && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-400/25 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 motion-reduce:animate-none" />Live
                </span>
              )}
            </span>
            <span className="mt-1 block truncate text-sm text-zinc-400">
              {value ? 'Everything below shows this event only' : 'Pick an event to load its participants, stats and exports'}
            </span>
            {value && stats && (
              <span className="mt-3 flex max-w-sm items-center gap-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.registered ? Math.round((stats.arrived / stats.registered) * 100) : 0}%`, background: `linear-gradient(90deg, ${accent}, #ffffff)` }} />
                </span>
                <span className="text-xs tabular-nums text-zinc-400">{stats.registered ? Math.round((stats.arrived / stats.registered) * 100) : 0}% arrived</span>
              </span>
            )}
          </span>

          {value && stats && (
            <span className="relative flex items-stretch">
              {[['Registered', stats.registered], ['Arrived', stats.arrived]].map(([k, v], i) => (
                <span key={k} className={`px-5 text-center sm:px-7 ${i ? 'border-l border-white/10' : ''}`}>
                  <span className="block text-3xl font-extrabold leading-none tabular-nums sm:text-4xl"><CountUp value={v} /></span>
                  <span className="mt-2 block text-[11px] font-medium text-zinc-400">{k}</span>
                </span>
              ))}
            </span>
          )}

          <span className="relative flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-100 transition group-hover:border-white/30 group-hover:bg-white/10">
            {value ? 'Switch event' : 'Choose event'}
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 14 14" fill="none" className={`transition duration-300 ${open ? 'rotate-180' : ''}`}>
              <path d="M3 5.25 7 9.25l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:block">Ctrl K</kbd>
          </span>
        </button>

        {/* ---- the switcher ---- */}
        {open && (
          <>
            <div aria-hidden="true" className="fixed inset-0 z-20 bg-black/65" onClick={() => close(false)} />
            <div className="drop-in absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950/95 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="none" className="shrink-0 text-zinc-500">
                  <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.6" /><path d="m10.75 10.75 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input ref={search} value={query} onChange={(e) => { setQuery(e.target.value); setHi(0); }} autoComplete="off" spellCheck={false}
                  aria-label="Search events" aria-controls="admin-event-list" placeholder="Search events…"
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-600" />
                <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:block">esc</kbd>
              </div>

              <ul id="admin-event-list" role="listbox" aria-labelledby="admin-event-label"
                className="grid max-h-[26rem] grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.length === 0 && <li className="col-span-full px-4 py-10 text-center text-sm text-zinc-500">No event matches &quot;{query}&quot;</li>}
                {shown.map((o, i) => {
                  const on = o.name === value;
                  const active = i === hi;
                  const c = accentFor(o.name, o.index);
                  const n = counts ? counts[o.name] : null;
                  return (
                    <li key={o.name} role="option" aria-selected={on} ref={(el) => { itemRefs.current[i] = el; }}
                      className="fade-up" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                      <button type="button" tabIndex={-1} onClick={() => pick(o.name)} onMouseMove={(e) => { spot(e); if (hi !== i) setHi(i); }}
                        className="relative flex h-full w-full flex-col justify-between gap-5 overflow-hidden rounded-2xl border bg-zinc-900/70 p-4 text-left transition duration-200 hover:-translate-y-0.5"
                        style={{
                          borderColor: on ? c : active ? `${c}99` : 'rgba(255,255,255,0.08)',
                          boxShadow: on || active ? `0 14px 36px ${c}2b` : 'none',
                        }}>
                        <span aria-hidden="true" className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                          style={{ opacity: active ? 1 : 0, background: `radial-gradient(240px circle at var(--x, 50%) var(--y, 0%), ${c}33, transparent 70%)` }} />
                        <span className="relative flex items-center justify-between gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-xl text-xs font-extrabold text-black" style={{ background: c }}>{initials(o.name)}</span>
                          {on
                            ? <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-black" style={{ background: c }}>Selected</span>
                            : <span className={`text-[11px] text-zinc-500 transition ${active ? 'opacity-100' : 'opacity-0'}`}>Enter ↵</span>}
                        </span>
                        <span className="relative">
                          <span className="block truncate text-base font-bold text-white">{o.name}</span>
                          <span className="mt-1 flex items-baseline gap-1.5 text-xs text-zinc-500">
                            {n === null
                              ? <span className="inline-block h-4 w-8 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
                              : <span className="text-base font-bold tabular-nums text-zinc-200">{n}</span>}
                            registered
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-zinc-500">
                <span className="hidden sm:inline">Arrow keys to move · Enter to open · Esc to close</span>
                {value
                  ? <button type="button" onClick={() => pick('')} className="ml-auto rounded-full px-3 py-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white">Clear selection</button>
                  : <span className="ml-auto">{options.length} events</span>}
              </div>
            </div>
          </>
        )}
      </div>

      {unknown && <p className="mt-3 text-sm text-amber-300">&quot;{unknown}&quot; is not a known event. Pick one from the list.</p>}
    </section>
  );
}

/* =========================================================================
   MAIN
   ========================================================================= */
export default function AdminAccess() {
  const desktop = useIsDesktop();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [input, setInput] = useState('');
  const [pwError, setPwError] = useState(false);

  // 'home' | 'allot' | 'scores' | 'board' | 'overview' | 'teams' | 'settings'
  const [view, setView] = useState('home');
  const [settingsOk, setSettingsOk] = useState(false);

  // saved on this device only
  const [bgRaw, setBg] = useLocalState('dyc_admin_bg', BG_DEFAULT);
  const bg = { ...BG_DEFAULT, ...bgRaw };
  const [autoLock, setAutoLock] = useLocalState('dyc_admin_autolock', 0);
  const lastActive = useRef(Date.now());

  const [cfg, reloadCfg, cfgReady] = useConfig();
  const events = useMemo(() => getEvents(cfg), [cfg]);
  const tn = (n) => cfg.team_names[n - 1] || `Team ${n}`;

  // ---- event selection, kept in the URL (?event=YOUTHVIBE) so reloads and shared links keep it ----
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = (searchParams.get('event') || '').trim();
  const eventOptions = useMemo(() => {
    const seen = new Set(FEST_EVENTS.map(norm));
    const extra = [];
    (Array.isArray(cfg.festival_events) ? cfg.festival_events : []).forEach((x) => {
      const name = String(typeof x === 'string' ? x : x?.name ?? '').trim();
      if (name && !seen.has(norm(name))) { seen.add(norm(name)); extra.push(name); }
    });
    return [...FEST_EVENTS, ...extra];
  }, [cfg.festival_events]);
  const selectedEvent = useMemo(
    () => (eventParam ? eventOptions.find((o) => norm(o) === norm(eventParam)) || null : null),
    [eventParam, eventOptions]
  );
  const eventPending = Boolean(eventParam) && !selectedEvent && !cfgReady; // link to an extra event, list still loading
  const eventUnknown = Boolean(eventParam) && !selectedEvent && cfgReady;
  const selectedKey = selectedEvent ? norm(selectedEvent) : '';
  const scope = useMemo(() => (selectedEvent ? makeScope(selectedEvent, events) : null), [selectedEvent, events]);

  const chooseEvent = useCallback((label) => {
    const next = new URLSearchParams(searchParams);
    if (label) next.set('event', label); else next.delete('event');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const [rows, setRows] = useState([]); // every score row; narrowed to the event below
  const [rowsReady, setRowsReady] = useState(false);
  const [globalStats, setGlobalStats] = useState(null);
  const [people, setPeople] = useState([]); // participants of the selected event only
  const [peopleFor, setPeopleFor] = useState('');
  const [peopleError, setPeopleError] = useState('');
  const keyRef = useRef(selectedKey);

  const current = !desktop && view !== 'settings' ? 'home' : view;

  const tryUnlock = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      lastActive.current = Date.now();
      setUnlocked(true);
      setPwError(false);
    } else setPwError(true);
  };

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setInput('');
    setSettingsOk(false);
    setView('home');
  }, []);

  const goHome = () => { setSettingsOk(false); setView('home'); };
  const open = (id) => { if (desktop || id === 'settings') setView(id); };

  const loadRows = useCallback(async () => {
    const { data } = await supabase.from('judge_scores').select('*').order('created_at', { ascending: false });
    if (data) setRows(data);
    setRowsReady(true);
  }, []);

  const loadPeople = useCallback(async () => {
    if (!scope) return;
    const k = scope.key;
    try {
      const list = await fetchPeople(scope, '', CLIENT_SCOPE_FETCH);
      if (keyRef.current !== k) return; // the admin already switched to another event
      setPeople(list);
      setPeopleError('');
      setPeopleFor(k);
    } catch (e) {
      if (keyRef.current !== k) return;
      setPeopleError(e.message || 'Could not load participants.');
      setPeopleFor(k);
    }
  }, [scope]);

  // only used for the "arrived 5+ days ago" count, which the server can give for all events only
  const loadGlobalStats = useCallback(async () => {
    try { setGlobalStats(await rpc('dyc_stats')); } catch { /* ignore */ }
  }, []);

  const loadStats = useCallback(() => { loadPeople(); loadGlobalStats(); }, [loadPeople, loadGlobalStats]);

  // switching events: drop the old event's data straight away and show the loading state
  useEffect(() => {
    keyRef.current = selectedKey;
    setPeople([]);
    setPeopleFor('');
    setPeopleError('');
  }, [selectedKey]);

  // live scores (loaded once an event is chosen)
  const hasEvent = Boolean(selectedEvent);
  useEffect(() => {
    if (!unlocked || !hasEvent) return undefined;
    loadRows();
    const channel = supabase
      .channel('admin_scores_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'judge_scores' }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === 'INSERT')
            return prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev];
          if (payload.eventType === 'DELETE') return prev.filter((r) => r.id !== payload.old.id);
          if (payload.eventType === 'UPDATE') return prev.map((r) => (r.id === payload.new.id ? payload.new : r));
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [unlocked, hasEvent, loadRows]);

  // participants + stats of the selected event
  useEffect(() => {
    if (!unlocked || !hasEvent) return undefined;
    loadStats();
    const t = setInterval(loadStats, POLL_MS);
    return () => clearInterval(t);
  }, [unlocked, hasEvent, loadStats]);

  // auto-lock after a period of no clicks / keys / scrolling
  useEffect(() => {
    if (!unlocked || !autoLock) return undefined;
    lastActive.current = Date.now();
    const bump = () => { lastActive.current = Date.now(); };
    const names = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    names.forEach((n) => window.addEventListener(n, bump, { passive: true }));
    const t = setInterval(() => {
      if (Date.now() - lastActive.current > autoLock * 60000) lock();
    }, 15000);
    return () => {
      names.forEach((n) => window.removeEventListener(n, bump));
      clearInterval(t);
    };
  }, [unlocked, autoLock, lock]);

  const scopedRows = useMemo(() => (scope ? rows.filter(scope.has) : []), [rows, scope]);
  // scoring categories that belong to this event (falls back to the event name itself)
  const scopedCats = useMemo(() => {
    if (!scope) return cfg.categories;
    const own = cfg.categories.filter((c) => scope.has({ category: c }));
    return own.length ? own : [scope.label];
  }, [cfg.categories, scope]);
  const scopedCfg = useMemo(() => ({ ...cfg, categories: scopedCats }), [cfg, scopedCats]);
  const sum = useMemo(() => summarise(scopedRows, cfg.rank_by), [scopedRows, cfg.rank_by]);
  const peopleReady = Boolean(selectedKey) && peopleFor === selectedKey;
  const stats = useMemo(
    () => (peopleReady ? scopedStats(people, scopedRows, globalStats?.due_removal) : null),
    [peopleReady, people, scopedRows, globalStats]
  );
  const loadingEvent = hasEvent && (!peopleReady || !rowsReady);
  const noRecords = hasEvent && !loadingEvent && !peopleError && people.length === 0 && scopedRows.length === 0;
  const leader = [...sum.teamStats].sort((a, b) => b.total - a.total)[0];
  const theme = THEMES[bg.theme] ? bg.theme : 'crimson';
  const tc = THEMES[theme].colors;

  /* ---------- admin password gate ---------- */
  if (!unlocked)
    return (
      <Page theme={theme} motion={bg.motion}>
        <form onSubmit={tryUnlock} className={`fade-up mx-auto mt-10 max-w-sm space-y-5 p-8 ${GLASS} ${IDLE}`}>
          <h1 className="bg-linear-to-r from-white to-red-400 bg-clip-text text-3xl font-bold text-transparent">Admin Access</h1>
          <p className="text-sm text-zinc-400">Restricted to authorised members only.</p>
          <input type="password" className={INPUT} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter password" autoFocus />
          {pwError && <p className="text-sm text-red-400">Incorrect password.</p>}
          <button className={`${BTN} w-full`}>Unlock</button>
          <Link to="/" className="block text-center text-sm text-zinc-500 hover:text-zinc-300">← Back to home</Link>
        </form>
      </Page>
    );

  const titles = {
    home: 'Admin Control', allot: 'Allot Chest No.', scores: 'Score Control',
    board: 'Live Leaderboard', overview: 'Event Overview', teams: 'Team Selections', settings: 'Settings',
  };

  const cards = [
    { id: 'allot', icon: '🎫', title: 'Allot Chest No.', desk: true,
      blurb: 'Look up a registration number, see all details, add other events and give the chest number.',
      chips: [stats ? `${stats.arrived} allotted` : '…', stats ? `${stats.registered - stats.arrived} waiting` : ''] },
    { id: 'scores', icon: '🎯', title: 'Score Control', desk: true,
      blurb: 'Enter a mark, or change any judge’s mark for any participant, even after it was given.',
      chips: [`${scopedRows.length} marks`, `${JUDGES.length} judges`, cfg.scoring_open === false ? 'Scoring closed' : ''] },
    { id: 'board', icon: '🏆', title: 'Live Leaderboard', desk: true,
      blurb: 'Team totals and ranked participants, updating as marks come in.',
      chips: [`${sum.students.length} ranked`, leader && leader.entries > 0 ? `Leading: ${tn(leader.team)}` : 'No marks yet'] },
    { id: 'overview', icon: '📊', title: 'Event Overview', desk: true,
      blurb: 'Registrations, arrivals, team picks and categories at a glance.',
      chips: [stats ? `${stats.registered} registered` : '…', stats ? `${stats.selected} picked` : ''] },
    { id: 'teams', icon: '🛡️', title: 'Team Selections', desk: true,
      blurb: 'Who each team picked, with chest and registration numbers.',
      chips: [stats ? `${stats.selected} selected` : '…'] },
    { id: 'settings', icon: '⚙️', title: 'Settings', desk: false,
      blurb: 'Full control: participants, scoring, events, look, security, data and reset tools. Has its own password.',
      chips: ['Full control', 'Works on phones'] },
  ];

  return (
    <Page theme={theme} motion={bg.motion}>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="bg-linear-to-r from-white to-red-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">{titles[selectedEvent ? current : 'home']}</h1>
        <div className="flex shrink-0 gap-4 text-sm">
          <Link to="/" className="text-zinc-400 hover:text-white">Home</Link>
          <button onClick={lock} className="text-red-400 hover:text-red-300">Lock</button>
        </div>
      </header>

      <EventSelector options={eventOptions} value={selectedEvent} onChange={chooseEvent} unknown={eventUnknown ? eventParam : ''} subEvents={events} stats={stats} />

      {!selectedEvent && (eventPending ? <WorkspaceLoading label="Loading event" /> : <EventEmptyState />)}

      {selectedEvent && (
        <ScopeContext.Provider value={scope}>
          {current !== 'home' && (
            <button type="button" onClick={goHome} className={`${GHOST} mb-6 rounded-full py-2`}>← All sections</button>
          )}

          {!desktop && current === 'home' && (
            <p className={`mb-6 p-4 text-sm text-zinc-300 ${GLASS} ${ACTIVE}`}>
              Admin tools open on a laptop. On a phone you can use Settings.
            </p>
          )}

          {peopleError && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
              <span>Could not load participants for {selectedEvent}: {peopleError}</span>
              <button type="button" className={GHOST} onClick={loadStats}>Try again</button>
            </div>
          )}

          {loadingEvent ? (
            <WorkspaceLoading label={`Loading ${selectedEvent}`} />
          ) : (
            <>
              {noRecords && (
                <div role="status" className={`fade-up mb-6 space-y-1 p-6 text-center ${GLASS} ${IDLE}`}>
                  <p className="text-lg font-semibold">No participants found for {selectedEvent}</p>
                  <p className="text-sm text-zinc-400">
                    Nothing is registered under this event yet. Add people from Settings → Participants, or pick another event.
                  </p>
                </div>
              )}

              <div key={`${current}:${selectedKey}`} className="fade-up">
                {current === 'home' && (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((c) => {
                      const off = !desktop && c.desk;
                      return (
                        <article key={c.id}
                          className={`group relative flex h-85 flex-col justify-end overflow-hidden ${GLASS} ${IDLE} transition duration-300 ${off ? 'opacity-45' : 'hover:-translate-y-1 hover:border-red-500/50'}`}>
                          <div className="absolute inset-0" style={{ background: `linear-gradient(155deg, ${tc[0]}73 0%, ${tc[1]}40 42%, #000 100%)` }} />
                          <div className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${tc[2]}66 0%, ${tc[2]}00 68%)` }} />
                          <div className="absolute inset-x-0 top-8 flex justify-center text-6xl drop-shadow-[0_8px_24px_rgba(239,68,68,0.5)] transition duration-300 group-hover:scale-110">{c.icon}</div>
                          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black via-black/85 to-transparent" />
                          <div className="relative space-y-3 p-6">
                            <h2 className="text-xl font-semibold">{c.title}</h2>
                            <p className="min-h-15 text-sm leading-relaxed text-zinc-400">{c.blurb}</p>
                            <div className="flex flex-wrap gap-2">{c.chips.filter(Boolean).map((x) => <Soft key={x}>{x}</Soft>)}</div>
                            <button type="button" disabled={off} onClick={() => open(c.id)}
                              className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
                              {off ? 'Open on a laptop' : 'Open'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {current === 'allot' && <AllotPanel tn={tn} stats={stats} events={events} onChanged={loadStats} />}
                {current === 'scores' && <ScoresPanel rows={scopedRows} cfg={scopedCfg} tn={tn} sum={sum} />}
                {current === 'board' && <Board sum={sum} cats={scopedCats} tn={tn} />}
                {current === 'overview' && <OverviewPanel stats={stats} tn={tn} />}
                {current === 'teams' && <TeamsPanel tn={tn} />}

                {current === 'settings' && !settingsOk && <SettingsGate onOpen={() => setSettingsOk(true)} />}
                {current === 'settings' && settingsOk && (
                  <SettingsArea cfg={cfg} tn={tn} rows={scopedRows} events={events}
                    reloadCfg={reloadCfg} reloadRows={loadRows} onChanged={loadStats}
                    bg={bg} setBg={setBg} autoLock={autoLock} setAutoLock={setAutoLock} onLock={lock} />
                )}
              </div>
            </>
          )}
        </ScopeContext.Provider>
      )}
    </Page>
  );
}

/* ---------- settings lock ---------- */
function SettingsGate({ onOpen }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);
  const go = (e) => {
    e.preventDefault();
    if (val === SETTINGS_PASSWORD) onOpen();
    else setErr(true);
  };
  return (
    <form onSubmit={go} className={`mx-auto max-w-sm space-y-5 p-8 text-center ${GLASS} ${ACTIVE}`}>
      <div className="text-5xl">🔒</div>
      <div>
        <h2 className="text-xl font-semibold">Settings are locked</h2>
        <p className="mt-1 text-sm text-zinc-400">Enter the settings password to continue.</p>
      </div>
      <input type="password" className={INPUT} value={val} placeholder="Settings password" autoFocus
        onChange={(e) => { setVal(e.target.value); setErr(false); }} />
      {err && <p className="text-sm text-red-400">Incorrect settings password.</p>}
      <button disabled={!val} className={`${BTN} w-full`}>Unlock Settings</button>
    </form>
  );
}

/* =========================================================================
   01  ALLOT CHEST NUMBER  (auto-fill details, add other events, allot chest)
   ========================================================================= */
function AllotPanel({ tn, stats, events, onChanged }) {
  const scope = useScope();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [hi, setHi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [chest, setChest] = useState('');
  const [busy, setBusy] = useState(false);
  const [evBusy, setEvBusy] = useState(false);
  const [evQ, setEvQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState(null);
  const [done, setDone] = useState(null);
  const [recent, setRecent] = useState([]);

  const groups = useMemo(() => [...new Set(events.map((e) => e.group))], [events]);

  const nextFree = async () => {
    try { setChest(String(await rpc('dyc_next_chest'))); } catch { setChest(''); }
  };

  const choose = async (r) => {
    setPicked(r);
    setResults([]);
    setMsg(null);
    setDone(null);
    setEvQ('');
    if (r.chest_no) return setChest(String(r.chest_no));
    nextFree();
  };

  // live lookup while typing
  useEffect(() => {
    if (picked) return undefined;
    const term = q.trim();
    if (!term) { setResults([]); setSearched(false); return undefined; }
    let live = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = await fetchPeople(scope, term, 8);
        if (!live) return;
        setResults(list);
        setHi(0);
        setSearched(true);
        const exact = list.filter((r) => String(r.registration_no).toLowerCase() === term.toLowerCase());
        if (exact.length === 1) choose(exact[0]);
      } catch (e) { if (live) setMsg({ ok: false, text: e.message }); }
      finally { if (live) setSearching(false); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, picked]);

  const reset = () => { setPicked(null); setQ(''); setChest(''); setResults([]); setSearched(false); setEvQ(''); };

  const onKey = (e) => {
    if (picked || !results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); choose(results[hi] || results[0]); }
  };

  /* ---- events ---- */
  const extras = Array.isArray(picked?.extra_events) ? picked.extra_events : [];
  const primary = String(picked?.category ?? '').trim();
  const isPrimary = (ev) => matches(primary, ev);
  const isExtra = (ev) => extras.some((x) => matches(x, ev));
  const isOn = (ev) => isPrimary(ev) || isExtra(ev);
  const primaryListed = events.some(isPrimary);
  const orphans = extras.filter((x) => !events.some((ev) => matches(x, ev))); // saved earlier, not in the list
  const listedNames = [
    ...(primary && !primaryListed ? [primary] : []),
    ...events.filter(isOn).map((ev) => ev.name),
  ];
  const eventCount = listedNames.length + orphans.length;

  const evFilter = norm(evQ);
  const shownEvents = events.filter((ev) => !evFilter || norm(`${ev.name} ${ev.group}`).includes(evFilter));

  const saveEvents = async (next) => {
    const before = extras;
    setPicked((p) => ({ ...p, extra_events: next }));
    setEvBusy(true);
    setMsg(null);
    try {
      const res = await rpc('dyc_set_events', { p_id: String(picked.id), p_events: next });
      if (!res?.ok) throw new Error(res?.error || 'Could not update events.');
    } catch (e) {
      setPicked((p) => ({ ...p, extra_events: before }));
      setMsg({ ok: false, text: e.message });
    } finally { setEvBusy(false); }
  };

  const toggle = (ev) => {
    if (isPrimary(ev)) return;
    saveEvents(isExtra(ev) ? extras.filter((x) => !matches(x, ev)) : [...extras, ev.name]);
  };

  /* ---- allot ---- */
  const allot = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await rpc('dyc_allot', { p_id: String(picked.id), p_chest: chest.trim() });
      if (!res?.ok) throw new Error(res?.error || 'Could not allot.');
      const entry = { name: picked.student_name, reg: picked.registration_no, chest: chest.trim(), events: eventCount };
      setRecent((r) => [entry, ...r].slice(0, 8));
      setDone(entry);
      reset();
      onChanged();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const arrived = stats?.arrived ?? 0;
  const waiting = stats ? stats.registered - stats.arrived : 0;
  const pct = stats && stats.registered ? Math.round((arrived / stats.registered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* progress strip */}
      <div className={`flex flex-wrap items-center gap-x-8 gap-y-3 p-5 ${GLASS} ${IDLE}`}>
        <div><p className="text-xs text-zinc-500">Allotted</p><p className="text-2xl font-bold text-red-500">{stats ? arrived : '…'}</p></div>
        <div><p className="text-xs text-zinc-500">Waiting</p><p className="text-2xl font-bold">{stats ? waiting : '…'}</p></div>
        <div className="min-w-50 flex-1">
          <div className="mb-1 flex justify-between text-xs text-zinc-400"><span>Arrival progress</span><span>{pct}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-linear-to-r from-red-700 to-red-400 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`space-y-6 p-6 lg:col-span-3 ${GLASS} ${IDLE}`}>
          <div>
            <h2 className="text-xl font-semibold">Find a participant</h2>
            <p className="text-sm text-zinc-400">Type the registration number, name or phone. Details fill in automatically.</p>
          </div>

          {done && (
            <div className="pop flex items-center gap-4 rounded-2xl border border-green-500/40 bg-green-500/10 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-xl font-bold text-black">✓</span>
              <div>
                <p className="font-semibold text-green-300">Chest No. {done.chest} allotted</p>
                <p className="text-sm text-zinc-300">{done.name} · {done.events} event{done.events === 1 ? '' : 's'}</p>
              </div>
            </div>
          )}

          {/* search box */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔎</span>
                <input className={`${INPUT} pl-11`} value={q} autoFocus autoComplete="off"
                  placeholder="Registration number" onKeyDown={onKey}
                  onChange={(e) => { setQ(e.target.value); setDone(null); if (picked) { setPicked(null); setChest(''); } }} />
              </div>
              {(picked || q) && <button type="button" className={GHOST} onClick={reset}>Clear</button>}
            </div>

            {!picked && results.length > 0 && (
              <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => choose(r)} onMouseEnter={() => setHi(i)}
                      className={`flex w-full items-center gap-3 border-b border-zinc-800 px-4 py-3 text-left last:border-0 ${i === hi ? 'bg-red-500/15' : 'hover:bg-red-500/10'}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-300">{initials(r.student_name)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{r.student_name}</span>
                        <span className="text-xs text-zinc-400">Reg. {r.registration_no}{r.category ? ` · ${r.category}` : ''}</span>
                      </span>
                      {r.chest_no ? <Chip>Chest {r.chest_no}</Chip> : <Soft>Not arrived</Soft>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searching && <p className="mt-2 text-xs text-zinc-500">Checking…</p>}
            {!picked && searched && !searching && results.length === 0 && (
              <p className="mt-2 text-sm text-red-400">No registration found with that number.</p>
            )}
          </div>

          {!picked && !done && (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <div className="text-4xl">🎫</div>
              <p className="mt-2 text-sm text-zinc-400">Search for someone to see their details, events and chest number here.</p>
              <p className="mt-1 text-xs text-zinc-600">Tip: use ↑ ↓ and Enter to pick from the list.</p>
            </div>
          )}

          {picked && (
            <div className="space-y-6">
              {/* profile */}
              <div className="pop flex flex-wrap items-center gap-4 rounded-2xl border border-red-500/30 bg-linear-to-r from-red-600/15 to-transparent p-5">
                <span className="ring flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-xl font-bold text-black">{initials(picked.student_name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-semibold">{picked.student_name || 'Unnamed'}</p>
                  <p className="text-sm text-zinc-400">Registration No. {picked.registration_no}</p>
                </div>
                {picked.chest_no
                  ? <span className="rounded-full border border-green-500/50 bg-green-500/10 px-4 py-1.5 text-sm font-semibold text-green-300">Chest {picked.chest_no}</span>
                  : <span className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300">Not arrived yet</span>}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Info k="Phone" v={picked.phone} />
                <Info k="Email" v={picked.email} />
                <Info k="Team" v={picked.team_no ? tn(picked.team_no) : 'Not picked yet'} />
              </div>

              {/* events */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Events</h3>
                    <p className="text-xs text-zinc-500">Tap an event to add or remove it. Saves instantly.</p>
                  </div>
                  <Chip>{eventCount} event{eventCount === 1 ? '' : 's'}</Chip>
                </div>

                {/* what this person is in right now */}
                <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                  {eventCount === 0 && <span className="text-sm text-zinc-500">No event yet</span>}
                  {listedNames.map((n) => <Chip key={n}>{n}</Chip>)}
                  {orphans.map((o) => (
                    <span key={o} className="inline-flex items-center gap-2 rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400">
                      {o}
                      <button type="button" disabled={evBusy} aria-label={`Remove ${o}`}
                        onClick={() => saveEvents(extras.filter((x) => x !== o))}
                        className="text-zinc-400 hover:text-white disabled:opacity-50">✕</button>
                    </span>
                  ))}
                </div>

                <input className={`${INPUT} py-2.5 text-sm`} value={evQ} onChange={(e) => setEvQ(e.target.value)}
                  placeholder={`Search ${events.length} events…`} />

                <div className="max-h-110 space-y-5 overflow-y-auto pr-1">
                  {shownEvents.length === 0 && <p className="text-sm text-zinc-500">No event matches that search.</p>}
                  {groups.map((g) => {
                    const list = shownEvents.filter((ev) => ev.group === g);
                    if (!list.length) return null;
                    return (
                      <div key={g}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          {GROUP_ICON[g] || '•'} {g}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {list.map((ev) => {
                            const on = isOn(ev);
                            const locked = isPrimary(ev);
                            return (
                              <button key={ev.id} type="button" disabled={evBusy || locked} onClick={() => toggle(ev)}
                                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition duration-200 ${
                                  on ? 'border-red-500/70 bg-red-500/10 shadow-[0_8px_28px_rgba(239,68,68,0.18)]'
                                     : 'border-white/10 bg-black/40 hover:-translate-y-0.5 hover:border-red-500/40'} ${locked ? 'cursor-default' : ''} disabled:opacity-80`}>
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold leading-snug">{ev.name}</span>
                                  <span className="text-xs text-zinc-500">
                                    {locked ? 'Registered event' : on ? 'Added · tap to remove' : `${sizeLabel(ev)} · tap to add`}
                                  </span>
                                </span>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${on ? 'bg-red-500 text-black' : 'border border-white/15 text-zinc-500'}`}>
                                  {on ? '✓' : '+'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* chest */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5">
                <label className="text-sm text-zinc-400">Chest No.</label>
                <div className="flex flex-wrap gap-3">
                  <input className={`${INPUT} min-w-35 flex-1 text-center text-2xl font-bold tracking-wider`}
                    value={chest} placeholder="—" onChange={(e) => setChest(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && chest.trim() && !busy) allot(); }} />
                  <button type="button" className={GHOST} onClick={nextFree}>Next free number</button>
                </div>
                <button className={`${BTN} w-full`} disabled={busy || !chest.trim()} onClick={allot}>
                  {busy ? 'Saving…' : picked.chest_no ? 'Update chest no.' : 'Allot chest no.'}
                </button>
              </div>
            </div>
          )}
          <Msg m={msg} />
        </div>

        <div className={`p-6 lg:col-span-2 ${GLASS} ${IDLE}`}>
          <h3 className="mb-3 font-semibold">Allotted this session</h3>
          {recent.length === 0 && <p className="text-sm text-zinc-500">Nothing yet. Allotted numbers will appear here.</p>}
          <ul className="space-y-2">
            {recent.map((r, i) => (
              <li key={i} className="pop flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-300">{initials(r.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-xs text-zinc-500">Reg. {r.reg} · {r.events} event{r.events === 1 ? '' : 's'}</span>
                </span>
                <Chip>Chest {r.chest}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   02  SCORE CONTROL (enter or override any judge's mark)
   ========================================================================= */
function ScoresPanel({ rows, cfg, tn, sum }) {
  const scope = useScope();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState(null);
  const [category, setCategory] = useState('');
  const [team, setTeam] = useState(1);
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const cat = category || cfg.categories[0];
  const max = Number(cfg.max_score);
  const step = Number(cfg.score_step) || 0.5;

  const existing = useMemo(
    () => (sel ? rows.filter((r) => String(r.chest_no) === String(sel.chest_no) && r.category === cat) : []),
    [rows, sel, cat]
  );
  const sig = existing.map((m) => `${m.judge}:${m.score}:${m.team}`).join('|');

  useEffect(() => {
    setVals(Object.fromEntries(JUDGES.map((j) => [j, String(existing.find((m) => m.judge === j)?.score ?? '')])));
    if (existing[0]) setTeam(Number(existing[0].team));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.chest_no, cat, sig]);

  useEffect(() => {
    if (sel) return undefined;
    const term = q.trim();
    if (!term) { setResults([]); setSearching(false); return undefined; }
    let live = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = await fetchPeople(scope, term, 8);
        if (live) setResults(list);
      } catch (e) { if (live) setMsg({ ok: false, text: e.message }); }
      finally { if (live) setSearching(false); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, sel, scope]);

  const pick = (r) => {
    setSel(r);
    setQ(r.registration_no);
    setResults([]);
    setMsg(null);
    if (r.team_no) setTeam(Number(r.team_no));
  };

  const clear = () => { setSel(null); setQ(''); setResults([]); setMsg(null); };

  const loadFromBoard = (s) => {
    setSel({ registration_no: s.registration_no, student_name: s.name, chest_no: s.chest_no });
    setQ(s.registration_no || s.name);
    setCategory(s.category);
    setTeam(Number(s.team));
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    setMsg(null);
    if (!sel?.chest_no) return setMsg({ ok: false, text: 'Pick a participant who already has a chest number.' });
    const ops = [];
    for (const j of JUDGES) {
      const raw = String(vals[j] ?? '').trim();
      const cur = existing.find((m) => m.judge === j);
      if (raw === '') { if (cur) ops.push({ j, score: null }); continue; }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > max) return setMsg({ ok: false, text: `Judge ${j}: score must be between 0 and ${max}.` });
      if (!cur || Number(cur.score) !== n || Number(cur.team) !== team) ops.push({ j, score: n });
    }
    if (!ops.length) return setMsg({ ok: true, text: 'Nothing to change.' });
    setBusy(true);
    try {
      for (const o of ops) {
        const res = await rpc('dyc_set_score', {
          p_team: team, p_judge: o.j, p_category: cat, p_chest: String(sel.chest_no),
          p_name: sel.student_name, p_reg: sel.registration_no ?? null, p_score: o.score,
        });
        if (!res?.ok) throw new Error(res?.error || 'Could not save.');
      }
      setMsg({ ok: true, text: `Saved ${ops.length} change${ops.length > 1 ? 's' : ''} for ${sel.student_name}.` });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const noMatch = !sel && q.trim() && !searching && results.length === 0;

  return (
    <div className="space-y-8">
      <div className={`space-y-5 p-6 ${GLASS} ${IDLE}`}>
        <div>
          <h2 className="text-xl font-semibold">Enter or change marks</h2>
          <p className="text-sm text-zinc-400">
            Find a participant, then type a mark for any judge. Change a mark to override it, or empty the box to remove it.
          </p>
        </div>

        {cfg.scoring_open === false && (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Scoring is marked closed in Settings → Scoring. You can still edit marks here as admin.
          </p>
        )}

        <div className="relative">
          <label className="text-sm text-zinc-400">Registration No.</label>
          <div className="flex gap-2">
            <input className={INPUT} value={q} autoComplete="off" placeholder="Start typing the registration number"
              onChange={(e) => { setQ(e.target.value); if (sel) setSel(null); }} />
            {sel && <button type="button" className={GHOST} onClick={clear}>Clear</button>}
          </div>
          {!sel && results.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => pick(r)}
                    className="flex w-full items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3 text-left last:border-0 hover:bg-red-500/10">
                    <span><span className="block font-semibold">{r.student_name}</span><span className="text-xs text-zinc-400">Reg. {r.registration_no}</span></span>
                    <Chip>{r.chest_no ? `Chest ${r.chest_no}` : 'No chest yet'}</Chip>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searching && <p className="mt-2 text-xs text-zinc-500">Checking…</p>}
          {noMatch && <p className="mt-2 text-sm text-red-400">No participant found with that registration number.</p>}
        </div>

        {sel && (
          <div className="fade-up space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Info k="Student" v={sel.student_name} />
              <Info k="Registration No." v={sel.registration_no} />
              <Info k="Chest No." v={sel.chest_no} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-zinc-400">Category</label>
                <select className={INPUT} value={cat} onChange={(e) => setCategory(e.target.value)}>
                  {cfg.categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-400">Team</label>
                <select className={INPUT} value={team} onChange={(e) => setTeam(Number(e.target.value))}>
                  {TEAMS.map((t) => <option key={t} value={t}>{tn(t)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {JUDGES.map((j) => {
                const cur = existing.find((m) => m.judge === j);
                return (
                  <div key={j} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="mb-2 text-sm font-semibold">Judge {j}</p>
                    <input type="number" step={step} min="0" max={max} className={INPUT} placeholder="No mark"
                      value={vals[j] ?? ''} onChange={(e) => setVals({ ...vals, [j]: e.target.value })} />
                    <p className="mt-2 text-xs text-zinc-500">{cur ? `Currently ${cur.score}` : 'Not scored yet'}</p>
                  </div>
                );
              })}
            </div>

            <button className={BTN} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save marks'}</button>
          </div>
        )}
        <Msg m={msg} />
      </div>

      <Board sum={sum} cats={cfg.categories} tn={tn} onEdit={loadFromBoard} />
    </div>
  );
}

/* =========================================================================
   03  LEADERBOARD (also used inside Score Control)
   ========================================================================= */
function Board({ sum, cats, tn, onEdit }) {
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);
  const shown = sum.students.filter((s) => cat === 'All' || s.category === cat);
  const top = Math.max(0, ...sum.teamStats.map((t) => t.total));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {sum.teamStats.map((s) => (
          <div key={s.team} className={`p-5 ${GLASS} ${top > 0 && s.total === top ? ACTIVE : IDLE}`}>
            <p className="text-sm text-zinc-400">{tn(s.team)}</p>
            <p className="text-3xl font-bold text-red-500">{s.total.toFixed(1)}</p>
            <p className="text-xs text-zinc-500">{s.entries} marks submitted</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Ranking <span className="ml-2 text-xs text-green-400">● live</span>
            <span className="ml-2 text-xs font-normal text-zinc-500">by {sum.rankBy === 'total' ? 'total score' : 'average score'}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {['All', ...cats].map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === c ? 'border-red-500 bg-red-500 font-semibold text-black' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className={`overflow-x-auto ${GLASS} ${IDLE}`}>
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-400">
              <tr>
                <th className="p-3">#</th><th className="p-3">Reg. No.</th><th className="p-3">Chest</th>
                <th className="p-3">Student</th><th className="p-3">Team</th><th className="p-3">Category</th>
                <th className="p-3">Judges</th><th className="p-3">Total</th><th className="p-3">Avg</th>
                {onEdit && <th className="p-3" />}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="10" className="p-6 text-center text-zinc-500">No marks yet.</td></tr>}
              {shown.map((s, i) => {
                const rank = i + 1;
                const isOpen = open === s.key;
                return (
                  <FragmentRow key={s.key} s={s} rank={rank} isOpen={isOpen} onEdit={onEdit}
                    onToggle={() => setOpen(isOpen ? null : s.key)} tn={tn} />
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Click a row to see what each judge gave.</p>
      </section>
    </div>
  );
}

function FragmentRow({ s, rank, isOpen, onToggle, onEdit, tn }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
  return (
    <>
      <tr onClick={onToggle}
        className={`cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5 ${rank <= 3 ? 'bg-red-500/5' : ''}`}>
        <td className="p-3">{medal}</td>
        <td className="p-3">{s.registration_no || '—'}</td>
        <td className="p-3">{s.chest_no}</td>
        <td className="p-3 font-medium">{s.name}</td>
        <td className="p-3">{tn(s.team)}</td>
        <td className="p-3">{s.category}</td>
        <td className="p-3">{s.judgeCount}/{JUDGES.length}</td>
        <td className="p-3">{s.total.toFixed(1)}</td>
        <td className="p-3 font-semibold text-red-500">{s.avg.toFixed(2)}</td>
        {onEdit && (
          <td className="p-3 text-right">
            <button className="text-red-400 hover:text-red-300" onClick={(e) => { e.stopPropagation(); onEdit(s); }}>Edit marks</button>
          </td>
        )}
      </tr>
      {isOpen && (
        <tr className="bg-black/40">
          <td colSpan="10" className="px-5 py-4">
            <p className="mb-2 text-xs text-zinc-500">Marks given to {s.name} in {s.category}</p>
            <div className="flex flex-wrap gap-2">
              {s.marks.map((m) => (
                <span key={m.id} className="rounded-full border border-white/10 bg-zinc-900 px-4 py-1.5 text-sm">
                  Judge {m.judge}: <span className="font-semibold text-red-400">{m.score}</span>
                </span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* =========================================================================
   04  EVENT OVERVIEW
   ========================================================================= */
function OverviewPanel({ stats, tn }) {
  if (!stats) return <p className="text-zinc-500">Loading…</p>;
  const pct = stats.registered ? Math.round((stats.arrived / stats.registered) * 100) : 0;
  const counts = TEAMS.map((t) => stats.teams.find((x) => x.team === t)?.count || 0);
  const most = Math.max(1, ...counts);
  const tiles = [
    ['Registered', stats.registered, 'Total sign-ups'],
    ['Chest allotted', stats.arrived, 'Arrived'],
    ['Yet to arrive', stats.registered - stats.arrived, 'No chest number yet'],
    ['Picked by teams', stats.selected, 'Now in a team'],
    ['Waiting', stats.waiting, 'Allotted, not picked'],
    ['Marks saved', stats.scores, 'Judge scores'],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([k, v, h]) => (
          <div key={k} className={`p-5 ${GLASS} ${IDLE}`}>
            <p className="text-sm text-zinc-400">{k}</p>
            <p className="text-4xl font-bold text-red-500">{v}</p>
            <p className="text-xs text-zinc-500">{h}</p>
          </div>
        ))}
      </div>

      <div className={`p-6 ${GLASS} ${IDLE}`}>
        <div className="mb-2 flex justify-between text-sm"><span className="text-zinc-400">Arrival progress</span><span className="font-semibold">{pct}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-linear-to-r from-red-700 to-red-400 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`space-y-4 p-6 ${GLASS} ${IDLE}`}>
          <h3 className="font-semibold">Picks per team</h3>
          {TEAMS.map((t, i) => (
            <div key={t}>
              <div className="mb-1 flex justify-between text-sm"><span>{tn(t)}</span><span className="font-semibold text-red-400">{counts[i]}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-red-500 transition-all duration-700" style={{ width: `${(counts[i] / most) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className={`overflow-x-auto p-6 ${GLASS} ${IDLE}`}>
          <h3 className="mb-3 font-semibold">By category</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500"><tr><th className="py-1">Category</th><th>Reg.</th><th>Arrived</th><th>Picked</th></tr></thead>
            <tbody>
              {stats.categories.length === 0 && <tr><td colSpan="4" className="py-3 text-zinc-500">No category column found.</td></tr>}
              {stats.categories.map((c) => (
                <tr key={c.category} className="border-t border-white/5">
                  <td className="py-2">{c.category}</td><td>{c.registered}</td><td>{c.arrived}</td><td className="text-red-400">{c.selected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        {stats.due_removal ?? '…'} participant{stats.due_removal === 1 ? '' : 's'} across all events arrived more than 5 days ago and were never picked.
        Remove them from Settings → Reset tools (applies to every event).
      </p>
    </div>
  );
}

/* =========================================================================
   05  TEAM SELECTIONS
   ========================================================================= */
function TeamsPanel({ tn }) {
  const scope = useScope();
  const [members] = usePoll(() => fetchPeople(scope, '', 1000), [scope]);
  if (!members) return <p className="text-zinc-500">Loading…</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {TEAMS.map((t) => {
        const list = members.filter((m) => Number(m.team_no) === t);
        return (
          <div key={t} className={`p-6 ${GLASS} ${IDLE}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{tn(t)}</h3><Chip>{list.length} picked</Chip>
            </div>
            {list.length === 0 && <p className="text-sm text-zinc-500">No one selected yet.</p>}
            <ul className="space-y-2">
              {list.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                  <span>
                    <span className="block font-medium">{m.student_name}</span>
                    <span className="text-xs text-zinc-500">Reg. {m.registration_no || '—'} · {m.category || 'No category'}</span>
                  </span>
                  <Chip>Chest {m.chest_no || '—'}</Chip>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
   06  SETTINGS (full control, works on phones)
   ========================================================================= */
function SettingsArea({ cfg, tn, rows, events, reloadCfg, reloadRows, onChanged, bg, setBg, autoLock, setAutoLock, onLock }) {
  const [tab, setTab] = useState('people');
  // memoised so the Judges tab keeps its unsaved edits when the page refreshes in the background
  const judges = useMemo(() => cfg.judge_names || {}, [cfg.judge_names]);
  const tabs = [
    ['people', '👥 Participants'], ['judges', '🧑‍⚖️ Judges'], ['marks', '📝 Score records'],
    ['scoring', '🎚️ Scoring'], ['events', '🗓️ Events'], ['event', '🎛️ Event setup'],
    ['look', '🎨 Appearance'], ['security', '🔐 Security'], ['data', '💾 Data'], ['danger', '⚠️ Reset tools'],
  ];
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${tab === id ? 'border-red-500 bg-red-500 text-black shadow-[0_4px_22px_rgba(239,68,68,0.35)]' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
            {label}
          </button>
        ))}
      </nav>
      <div key={tab} className="fade-up">
        {tab === 'people' && <PeoplePane cfg={cfg} tn={tn} onChanged={onChanged} />}
        {tab === 'judges' && <JudgesPane tn={tn} judges={judges} reloadCfg={reloadCfg} />}
        {tab === 'marks' && <MarksPane rows={rows} tn={tn} reloadRows={reloadRows} judges={judges} step={Number(cfg.score_step) || 0.5} />}
        {tab === 'scoring' && <ScoringPane cfg={cfg} reloadCfg={reloadCfg} />}
        {tab === 'events' && <EventsPane events={events} reloadCfg={reloadCfg} />}
        {tab === 'event' && <EventPane cfg={cfg} reloadCfg={reloadCfg} />}
        {tab === 'look' && <AppearancePane bg={bg} setBg={setBg} />}
        {tab === 'security' && <SecurityPane autoLock={autoLock} setAutoLock={setAutoLock} setBg={setBg} onLock={onLock} />}
        {tab === 'data' && <DataPane cfg={cfg} rows={rows} tn={tn} onChanged={onChanged} />}
        {tab === 'danger' && <DangerPane reloadRows={reloadRows} onChanged={onChanged} />}
      </div>
    </div>
  );
}

const EMPTY = { registration_no: '', student_name: '', phone: '', email: '', category: '', chest_no: '', team_no: '' };

function PeoplePane({ tn, onChanged }) {
  const scope = useScope();
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setList(await fetchPeople(scope, q.trim(), 300)); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  }, [q, scope]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const set = (k) => (v) => setEdit((e) => ({ ...e, [k]: v }));

  const save = async () => {
    // extra_events is managed from the Allot screen, so it is not sent from here
    // eslint-disable-next-line no-unused-vars
    const { id, extra_events, ...data } = edit;
    try {
      const res = await rpc('dyc_save_participant', { p_id: id ? String(id) : '', p_data: data });
      if (!res?.ok) throw new Error(res?.error || 'Could not save.');
      const listed = scope.has(data);
      setMsg({
        ok: true,
        text: `${id ? 'Changes saved.' : 'Participant added.'}${listed ? '' : ` It will not be listed under ${scope.label} because its category does not match this event.`}`,
      });
      setEdit(null); load(); onChanged();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const del = async (r) => {
    if (!window.confirm(`Delete ${r.student_name}? This cannot be undone.`)) return;
    try {
      await rpc('dyc_delete_participant', { p_id: String(r.id) });
      setEdit(null); load(); onChanged();
      setMsg({ ok: true, text: 'Deleted.' });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className={`space-y-4 p-5 sm:p-6 ${GLASS} ${IDLE}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{scope.label} participants</h2>
        <div className="flex gap-2">
          <button className={GHOST}
            onClick={() => downloadCsv(scope.file('participants'), list.map(({ id, extra_events, ...r }) => ({ ...r, extra_events: (extra_events || []).join('; ') })))}>
            Export CSV
          </button>
          <button className={BTN} onClick={() => setEdit({ ...EMPTY, category: scope.defaultCategory })}>+ Add</button>
        </div>
      </div>
      <input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, registration no., chest no. or phone" />

      {edit && (
        <div className="fade-up space-y-4 rounded-2xl border border-red-500/40 bg-black/50 p-5">
          <h3 className="font-semibold">{edit.id ? 'Edit participant' : 'New participant'}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" value={edit.student_name} onChange={set('student_name')} />
            <Field label="Registration No." value={edit.registration_no} onChange={set('registration_no')} />
            <Field label="Chest No. (empty = none)" value={edit.chest_no} onChange={set('chest_no')} />
            <Field label="Phone" value={edit.phone} onChange={set('phone')} />
            <Field label="Email" value={edit.email} onChange={set('email')} />
            <Field label="Category" value={edit.category} onChange={set('category')} />
            <div>
              <label className="text-sm text-zinc-400">Team</label>
              <select className={INPUT} value={edit.team_no ?? ''} onChange={(e) => set('team_no')(e.target.value)}>
                <option value="">Not picked</option>
                {TEAMS.map((t) => <option key={t} value={t}>{tn(t)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={BTN} onClick={save}>Save changes</button>
            <button className={GHOST} onClick={() => setEdit(null)}>Cancel</button>
            {edit.id && <button className={DANGER} onClick={() => del(edit)}>Delete</button>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-140 text-sm">
          <thead className="bg-white/5 text-left text-zinc-400">
            <tr><th className="p-3">Name</th><th className="p-3">Reg. No.</th><th className="p-3">Chest</th><th className="p-3">Category</th><th className="p-3">Team</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-zinc-500">No participants found.</td></tr>}
            {list.map((r) => (
              <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3 font-medium">{r.student_name}</td>
                <td className="p-3">{r.registration_no || '—'}</td>
                <td className="p-3">{r.chest_no || '—'}</td>
                <td className="p-3">{r.category || '—'}</td>
                <td className="p-3">{r.team_no ? tn(r.team_no) : '—'}</td>
                <td className="p-3 text-right">
                  <button className="text-red-400 hover:text-red-300"
                    onClick={() => setEdit({ ...EMPTY, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? ''])) })}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Msg m={msg} />
    </div>
  );
}

function JudgesPane({ tn, judges, reloadCfg }) {
  const key = (t, j) => `${t}-${j}`;
  const [draft, setDraft] = useState(judges);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(judges); }, [judges]);

  const slots = TEAMS.flatMap((t) => JUDGES.map((j) => [t, j]));
  const val = (t, j) => (draft[key(t, j)] || '');
  const dirty = slots.filter(([t, j]) => val(t, j).trim() !== (judges[key(t, j)] || '').trim());
  const named = slots.filter(([t, j]) => (judges[key(t, j)] || '').trim()).length;

  const write = async (list, okText) => {
    setBusy(true);
    setMsg(null);
    try {
      const next = { ...judges };
      list.forEach(([t, j, name]) => { if (name) next[key(t, j)] = name; else delete next[key(t, j)]; });
      await rpc('dyc_set_config', { p_key: 'judge_names', p_value: next });
      await reloadCfg();
      setMsg({ ok: true, text: okText });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const save = () => write(dirty.map(([t, j]) => [t, j, val(t, j).trim()]), `Saved ${dirty.length} change${dirty.length === 1 ? '' : 's'}.`);

  const clearAll = () => {
    if (!window.confirm('Remove every judge name? Judges will be asked to add theirs again.')) return;
    write(slots.map(([t, j]) => [t, j, '']), 'All judge names removed.');
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 ${GLASS} ${IDLE}`}>
        <div>
          <h2 className="text-xl font-semibold">Judges</h2>
          <p className="text-sm text-zinc-400">
            Four judges per team. Names you save here show in Score records and are kept with the event settings.
          </p>
        </div>
        <Soft>{named} of {slots.length} named</Soft>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {TEAMS.map((t) => (
          <div key={t} className={`space-y-3 p-6 ${GLASS} ${IDLE}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{tn(t)}</h3>
              <span className="text-xs text-zinc-500">{JUDGES.filter((j) => (judges[key(t, j)] || '').trim()).length}/{JUDGES.length} named</span>
            </div>
            {JUDGES.map((j) => {
              const changed = val(t, j).trim() !== (judges[key(t, j)] || '').trim();
              return (
                <div key={j} className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xs font-semibold ${changed ? 'border-red-500 bg-red-500 text-black' : 'border-white/15 text-zinc-300'}`}>J{j}</span>
                  <input className={INPUT} value={val(t, j)} maxLength={60} placeholder={`Judge ${j} name`}
                    onChange={(e) => setDraft({ ...draft, [key(t, j)]: e.target.value })} />
                  {val(t, j) && (
                    <button type="button" aria-label={`Clear Judge ${j}`} className="text-zinc-500 hover:text-red-400"
                      onClick={() => setDraft({ ...draft, [key(t, j)]: '' })}>✕</button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className={BTN} disabled={busy || dirty.length === 0} onClick={save}>
          {busy ? 'Saving…' : dirty.length ? `Save ${dirty.length} change${dirty.length === 1 ? '' : 's'}` : 'No changes'}
        </button>
        <button className={GHOST} disabled={busy || dirty.length === 0} onClick={() => setDraft(judges)}>Undo edits</button>
        <button className={DANGER} disabled={busy || named === 0} onClick={clearAll}>Remove all names</button>
      </div>
      <Msg m={msg} />
    </div>
  );
}

function MarksPane({ rows, tn, reloadRows, judges = {}, step = 0.5 }) {
  const scope = useScope();
  const [q, setQ] = useState('');
  const [drafts, setDrafts] = useState({});
  const [msg, setMsg] = useState(null);

  const term = q.trim().toLowerCase();
  const list = rows
    .filter((r) => !term || [r.student_name, r.chest_no, r.registration_no, r.category].some((v) => String(v ?? '').toLowerCase().includes(term)))
    .slice(0, 200);

  const save = async (r) => {
    const raw = String(drafts[r.id] ?? '').trim();
    if (raw === '') return setMsg({ ok: false, text: 'Type a score, or use Delete to remove the mark.' });
    try {
      const res = await rpc('dyc_set_score', {
        p_team: r.team, p_judge: r.judge, p_category: r.category, p_chest: String(r.chest_no),
        p_name: r.student_name, p_reg: r.registration_no ?? null, p_score: Number(raw),
      });
      if (!res?.ok) throw new Error(res?.error || 'Could not save.');
      setDrafts((d) => { const n = { ...d }; delete n[r.id]; return n; });
      setMsg({ ok: true, text: 'Score updated.' });
      reloadRows();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const del = async (r) => {
    if (!window.confirm(`Delete Judge ${r.judge}'s mark (${r.score}) for ${r.student_name}?`)) return;
    try { await rpc('dyc_delete_score', { p_id: String(r.id) }); setMsg({ ok: true, text: 'Mark deleted.' }); reloadRows(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className={`space-y-4 p-5 sm:p-6 ${GLASS} ${IDLE}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Score records</h2>
          <p className="text-sm text-zinc-400">Change or delete any mark from any judge.</p>
        </div>
        <button className={GHOST}
          onClick={() => downloadCsv(scope.file('scores'), rows.map((r) => ({
            student: r.student_name, registration_no: r.registration_no, chest_no: r.chest_no,
            team: tn(r.team), category: r.category, judge: r.judge, score: r.score,
          })))}>
          Export CSV
        </button>
      </div>
      <input className={INPUT} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, chest no., registration no. or category" />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-160 text-sm">
          <thead className="bg-white/5 text-left text-zinc-400">
            <tr><th className="p-3">Student</th><th className="p-3">Chest</th><th className="p-3">Team</th><th className="p-3">Category</th><th className="p-3">Judge</th><th className="p-3">Score</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-zinc-500">No marks found.</td></tr>}
            {list.map((r) => {
              const changed = drafts[r.id] !== undefined && String(drafts[r.id]) !== String(r.score);
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="p-3 font-medium">{r.student_name}</td>
                  <td className="p-3">{r.chest_no}</td>
                  <td className="p-3">{tn(r.team)}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3">J{r.judge}{judges[`${r.team}-${r.judge}`] && <span className="block text-xs text-zinc-500">{judges[`${r.team}-${r.judge}`]}</span>}</td>
                  <td className="p-3">
                    <input type="number" step={step} className={`${INPUT} w-24 py-2`} value={drafts[r.id] ?? r.score ?? ''}
                      onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} />
                  </td>
                  <td className="space-x-3 whitespace-nowrap p-3 text-right">
                    {changed && <button className="font-semibold text-green-400 hover:text-green-300" onClick={() => save(r)}>Save</button>}
                    <button className="text-red-400 hover:text-red-300" onClick={() => del(r)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 200 && <p className="text-xs text-zinc-500">Showing the first 200. Use search to narrow down.</p>}
      <Msg m={msg} />
    </div>
  );
}

/* ---------- NEW: scoring controls ---------- */
function ScoringPane({ cfg, reloadCfg }) {
  const [put, msg, busy] = usePut(reloadCfg);
  const open = cfg.scoring_open !== false;
  const step = Number(cfg.score_step) || 0.5;
  const rankBy = cfg.rank_by === 'total' ? 'total' : 'avg';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section title="Scoring status"
        hint="Saved with the event settings so judge screens can read it. Admin screens can always edit marks.">
        <Seg value={open ? 'open' : 'closed'} disabled={busy}
          options={[['open', '🟢 Open'], ['closed', '🔴 Closed']]}
          onChange={(v) => put('scoring_open', v === 'open', v === 'open' ? 'Scoring marked open.' : 'Scoring marked closed.')} />
      </Section>

      <Section title="Rank participants by" hint="Used by the Live Leaderboard and the ranking inside Score Control.">
        <Seg value={rankBy} disabled={busy}
          options={[['avg', 'Average score'], ['total', 'Total score']]}
          onChange={(v) => put('rank_by', v, `Ranking by ${v === 'total' ? 'total' : 'average'} score.`)} />
      </Section>

      <Section title="Mark step" hint="How much the up / down arrows change a mark in the mark boxes.">
        <Seg value={step} disabled={busy}
          options={[[0.1, '0.1'], [0.25, '0.25'], [0.5, '0.5'], [1, '1']]}
          onChange={(v) => put('score_step', v, `Mark step set to ${v}.`)} />
      </Section>

      <Section title="Maximum score" hint="Change it from Settings → Event setup.">
        <p className="text-3xl font-bold text-red-500">{Number(cfg.max_score)}</p>
      </Section>

      <div className="md:col-span-2"><Msg m={msg} /></div>
    </div>
  );
}

/* ---------- NEW: manage the events list ---------- */
function EventsPane({ events, reloadCfg }) {
  const [list, setList] = useState(events);
  const [put, msg, busy] = usePut(reloadCfg);
  const [localMsg, setLocalMsg] = useState(null);
  useEffect(() => { setList(events); }, [events]);

  const groups = [...new Set(list.map((e) => e.group).filter(Boolean))];
  const dirty = JSON.stringify(list) !== JSON.stringify(events);
  const upd = (i, k, v) => setList((l) => l.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const add = () => setList((l) => [...l, { id: '', name: '', group: groups[0] || 'Lifestyle', min: 1, max: 1 }]);
  const remove = (i) => setList((l) => l.filter((_, j) => j !== i));

  const save = () => {
    setLocalMsg(null);
    const seen = new Set();
    const used = new Set();
    const clean = [];
    for (let i = 0; i < list.length; i += 1) {
      const e = list[i];
      const name = String(e.name).trim();
      if (!name) return setLocalMsg({ ok: false, text: `Row ${i + 1}: give the event a name.` });
      if (seen.has(norm(name))) return setLocalMsg({ ok: false, text: `"${name}" appears twice.` });
      seen.add(norm(name));
      const min = Math.round(Number(e.min));
      const max = Math.round(Number(e.max));
      if (!(min >= 1) || !(max >= min))
        return setLocalMsg({ ok: false, text: `${name}: team size must be at least 1, and max can't be below min.` });
      const base = e.id || slug(name);
      let id = base;
      let n = 2;
      while (used.has(id)) { id = `${base}-${n}`; n += 1; }
      used.add(id);
      clean.push({ id, name, group: String(e.group).trim() || 'Other', min, max });
    }
    if (!clean.length) return setLocalMsg({ ok: false, text: 'Keep at least one event.' });
    put('events', clean, 'Events saved.');
  };

  const resetDefaults = () => {
    if (!window.confirm('Put the original event list back? Press Save afterwards to keep it.')) return;
    setList(EVENTS.map((e) => ({ ...e })));
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 ${GLASS} ${IDLE}`}>
        <div>
          <h2 className="text-xl font-semibold">Events</h2>
          <p className="text-sm text-zinc-400">
            These appear on the Allot screen. Participants already saved keep working after a rename, as long as the name stays close to the old one.
          </p>
        </div>
        <Soft>{list.length} events</Soft>
      </div>

      <datalist id="event-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>

      <div className={`space-y-3 p-5 sm:p-6 ${GLASS} ${IDLE}`}>
        <div className="hidden gap-3 px-1 text-xs text-zinc-500 sm:grid sm:grid-cols-[2fr_1.2fr_80px_80px_40px]">
          <span>Event name</span><span>Group</span><span>Min</span><span>Max</span><span />
        </div>
        {list.map((e, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[2fr_1.2fr_80px_80px_40px] sm:items-center">
            <input className={`${INPUT} py-2.5 text-sm`} value={e.name} placeholder="Event name" onChange={(ev) => upd(i, 'name', ev.target.value)} />
            <input className={`${INPUT} py-2.5 text-sm`} list="event-groups" value={e.group} placeholder="Group" onChange={(ev) => upd(i, 'group', ev.target.value)} />
            <input type="number" min="1" className={`${INPUT} py-2.5 text-sm`} value={e.min} placeholder="Min" onChange={(ev) => upd(i, 'min', ev.target.value)} />
            <input type="number" min="1" className={`${INPUT} py-2.5 text-sm`} value={e.max} placeholder="Max" onChange={(ev) => upd(i, 'max', ev.target.value)} />
            <button type="button" aria-label={`Remove ${e.name || 'event'}`} onClick={() => remove(i)}
              className="text-zinc-500 transition hover:text-red-400">✕</button>
          </div>
        ))}
        <button type="button" className={GHOST} onClick={add}>+ Add event</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className={BTN} disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : dirty ? 'Save events' : 'No changes'}</button>
        <button className={GHOST} disabled={busy || !dirty} onClick={() => { setList(events); setLocalMsg(null); }}>Undo edits</button>
        <button className={DANGER} disabled={busy} onClick={resetDefaults}>Restore original list</button>
      </div>
      <Msg m={localMsg || msg} />
    </div>
  );
}

function EventPane({ cfg, reloadCfg }) {
  const [names, setNames] = useState(cfg.team_names);
  const [cats, setCats] = useState(cfg.categories.join(', '));
  const [max, setMax] = useState(String(cfg.max_score));
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setNames(cfg.team_names);
    setCats(cfg.categories.join(', '));
    setMax(String(cfg.max_score));
  }, [cfg]);

  const put = async (key, value, okText) => {
    try { await rpc('dyc_set_config', { p_key: key, p_value: value }); await reloadCfg(); setMsg({ ok: true, text: okText }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const saveCats = () => {
    const list = cats.split(',').map((c) => c.trim()).filter(Boolean);
    if (!list.length) return setMsg({ ok: false, text: 'Add at least one category.' });
    put('categories', list, 'Categories saved.');
  };

  const saveMax = () => {
    const n = Number(max);
    if (!n || n <= 0) return setMsg({ ok: false, text: 'Maximum score must be above 0.' });
    put('max_score', n, 'Maximum score saved.');
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className={`space-y-3 p-6 ${GLASS} ${IDLE}`}>
        <h3 className="font-semibold">Team names</h3>
        {TEAMS.map((t) => (
          <input key={t} className={INPUT} value={names[t - 1] || ''}
            onChange={(e) => setNames(names.map((n, i) => (i === t - 1 ? e.target.value : n)))} />
        ))}
        <button className={BTN} onClick={() => put('team_names', names.map((n, i) => n.trim() || `Team ${i + 1}`), 'Team names saved.')}>Save team names</button>
      </div>

      <div className="space-y-6">
        <div className={`space-y-3 p-6 ${GLASS} ${IDLE}`}>
          <h3 className="font-semibold">Scoring categories</h3>
          <input className={INPUT} value={cats} onChange={(e) => setCats(e.target.value)} />
          <p className="text-xs text-zinc-500">Used by Score Control and the leaderboard. Separate with commas.</p>
          <button className={BTN} onClick={saveCats}>Save categories</button>
        </div>
        <div className={`space-y-3 p-6 ${GLASS} ${IDLE}`}>
          <h3 className="font-semibold">Maximum score</h3>
          <input type="number" className={INPUT} value={max} onChange={(e) => setMax(e.target.value)} />
          <button className={BTN} onClick={saveMax}>Save maximum score</button>
        </div>
      </div>

      <div className={`space-y-3 p-6 md:col-span-2 ${GLASS} ${IDLE}`}>
        <h3 className="font-semibold">Passwords</h3>
        <p className="text-sm text-zinc-400">
          Both passwords live in your code. Change them in <code>.env</code> (or the two <code>const</code> lines at the top of this file), then restart <code>npm run dev</code> or redeploy.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black p-4 text-xs text-zinc-300">{`VITE_ADMIN_PASSWORD=YourAdminPassword
VITE_SETTINGS_PASSWORD=YourSettingsPassword`}</pre>
      </div>
      <div className="md:col-span-2"><Msg m={msg} /></div>
    </div>
  );
}

/* ---------- NEW: appearance (saved on this device) ---------- */
function AppearancePane({ bg, setBg }) {
  return (
    <div className="space-y-6">
      <Section title="Background theme" hint="Changes the animated background and the colour of the home cards. Saved on this device only.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Object.entries(THEMES).map(([id, t]) => {
            const on = bg.theme === id;
            return (
              <button key={id} type="button" onClick={() => setBg({ ...bg, theme: id })}
                className={`overflow-hidden rounded-2xl border text-left transition ${on ? 'border-red-500 shadow-[0_8px_28px_rgba(239,68,68,0.25)]' : 'border-white/10 hover:border-white/30'}`}>
                <div className="h-20" style={{
                  background: `radial-gradient(circle at 20% 20%, ${t.colors[0]}cc, transparent 60%), radial-gradient(circle at 80% 70%, ${t.colors[2]}99, transparent 55%), ${t.colors[3]}`,
                }} />
                <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
                  <span>{t.name}</span>{on && <span className="text-red-400">✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Background motion"
        hint="Animated drifts slowly using only GPU transforms. Pick Static on an older laptop. Your system's reduce-motion setting is always respected.">
        <Seg value={bg.motion} options={[[true, 'Animated'], [false, 'Static']]} onChange={(v) => setBg({ ...bg, motion: v })} />
      </Section>
    </div>
  );
}

/* ---------- NEW: security (saved on this device) ---------- */
function SecurityPane({ autoLock, setAutoLock, setBg, onLock }) {
  const [msg, setMsg] = useState(null);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section title="Auto-lock" hint="Locks the admin page after this long without a click, key press or scroll. Saved on this device.">
        <Seg value={autoLock} options={[[0, 'Off'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min'], [60, '1 hour']]}
          onChange={(v) => { setAutoLock(v); setMsg({ ok: true, text: v ? `Will lock after ${v} min of no activity.` : 'Auto-lock turned off.' }); }} />
      </Section>

      <Section title="Lock now" hint="Closes the admin page and Settings straight away.">
        <button className={DANGER} onClick={onLock}>Lock admin page</button>
      </Section>

      <Section title="This device" className="md:col-span-2"
        hint="Clears the appearance and auto-lock choices saved in this browser.">
        <button className={GHOST} onClick={() => { setBg(BG_DEFAULT); setAutoLock(0); setMsg({ ok: true, text: 'Device preferences reset.' }); }}>
          Reset device preferences
        </button>
      </Section>
      <div className="md:col-span-2"><Msg m={msg} /></div>
    </div>
  );
}

/* ---------- NEW: backups, exports and CSV import ---------- */
function DataPane({ cfg, rows, tn, onChanged }) {
  const scope = useScope();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');
  const [csv, setCsv] = useState(null);
  const [progress, setProgress] = useState(null);

  const loadEventPeople = () => fetchPeople(scope, '', 5000);

  const backup = async () => {
    setBusy('backup');
    setMsg(null);
    try {
      const participants = await loadEventPeople();
      downloadFile(
        `${scope.slug}_backup_${stamp()}.json`,
        JSON.stringify({ exported_at: new Date().toISOString(), event: scope.label, config: cfg, participants, scores: rows }, null, 2),
        'application/json'
      );
      setMsg({ ok: true, text: `Backup saved: ${participants.length} participants, ${rows.length} marks.` });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(''); }
  };

  const exportPeople = async () => {
    setBusy('people');
    setMsg(null);
    try {
      const list = await loadEventPeople();
      if (!list.length) return setMsg({ ok: false, text: 'No participants to export.' });
      downloadCsv(scope.file('participants'), list.map(({ id, extra_events, ...r }) => ({ ...r, extra_events: (extra_events || []).join('; ') })));
      setMsg({ ok: true, text: `Exported ${list.length} participants.` });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(''); }
  };

  const exportScores = () => {
    if (!rows.length) return setMsg({ ok: false, text: 'No marks to export.' });
    downloadCsv(scope.file('scores'), rows.map((r) => ({
      student: r.student_name, registration_no: r.registration_no, chest_no: r.chest_no,
      team: tn(r.team), category: r.category, judge: r.judge, score: r.score,
    })));
    setMsg({ ok: true, text: `Exported ${rows.length} marks.` });
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg(null);
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const table = parseCsv(text);
      if (table.length < 2) throw new Error('The file needs a header row and at least one participant.');
      const keys = table[0].map((h) => HEADER_MAP[norm(h)] || null);
      if (!keys.includes('student_name') && !keys.includes('registration_no'))
        throw new Error('Could not find a name or registration column in the header row.');
      const items = table.slice(1)
        .map((r) => {
          const o = {};
          keys.forEach((k, i) => { if (k) o[k] = String(r[i] ?? '').trim(); });
          return o;
        })
        .filter((o) => o.student_name || o.registration_no)
        .map((o) => (!o.category && scope.defaultCategory ? { ...o, category: scope.defaultCategory } : o));
      if (!items.length) throw new Error('No usable rows found.');
      setCsv({ name: file.name, items, columns: [...new Set(keys.filter(Boolean))] });
    } catch (err) {
      setCsv(null);
      setMsg({ ok: false, text: err.message });
    }
  };

  const runImport = async () => {
    const { items, name } = csv;
    if (!window.confirm(`Import ${items.length} participants from ${name}? Duplicates are not checked here.`)) return;
    setBusy('import');
    setMsg(null);
    let ok = 0;
    const errors = [];
    for (let i = 0; i < items.length; i += 1) {
      setProgress({ done: i, total: items.length });
      try {
        const res = await rpc('dyc_save_participant', { p_id: '', p_data: items[i] });
        if (!res?.ok) throw new Error(res?.error || 'Rejected');
        ok += 1;
      } catch (e) { errors.push(`Row ${i + 2}: ${e.message}`); }
    }
    setProgress(null);
    setBusy('');
    setCsv(null);
    onChanged();
    setMsg({
      ok: errors.length === 0,
      text: `Imported ${ok} of ${items.length}.${errors.length ? ` ${errors.slice(0, 3).join(' · ')}` : ''}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Section title="Full backup" hint={`Settings plus every ${scope.label} participant and mark, in one JSON file.`}>
          <button className={BTN} disabled={!!busy} onClick={backup}>{busy === 'backup' ? 'Preparing…' : 'Download backup'}</button>
        </Section>
        <Section title="Participants" hint={`Everyone registered for ${scope.label}, as a spreadsheet-friendly CSV.`}>
          <button className={GHOST} disabled={!!busy} onClick={exportPeople}>{busy === 'people' ? 'Preparing…' : 'Export participants CSV'}</button>
        </Section>
        <Section title="Marks" hint={`Every ${scope.label} judge mark with team and category.`}>
          <button className={GHOST} disabled={!!busy} onClick={exportScores}>Export scores CSV</button>
        </Section>
      </div>

      <Section title="Import participants from CSV"
        hint={`First row must be headers. Recognised: registration no, name, phone, email, category, chest no, team no.${scope.defaultCategory ? ` Rows without a category are filed under ${scope.label}.` : ''}`}>
        <input type="file" accept=".csv,text/csv" disabled={!!busy} onChange={pickFile}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-red-500 file:px-5 file:py-2.5 file:font-semibold file:text-black hover:file:bg-red-400" />

        {csv && (
          <div className="fade-up space-y-4">
            <p className="text-sm text-zinc-300">
              <span className="font-semibold">{csv.name}</span> · {csv.items.length} participant{csv.items.length === 1 ? '' : 's'} ready · columns: {csv.columns.join(', ')}
            </p>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-120 text-sm">
                <thead className="bg-white/5 text-left text-zinc-400">
                  <tr>{csv.columns.map((c) => <th key={c} className="p-3">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {csv.items.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {csv.columns.map((c) => <td key={c} className="p-3">{r[c] || '—'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csv.items.length > 5 && <p className="text-xs text-zinc-500">Showing the first 5 rows.</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button className={BTN} disabled={busy === 'import'} onClick={runImport}>
                {busy === 'import' && progress ? `Importing ${progress.done + 1} / ${progress.total}…` : `Import ${csv.items.length} participants`}
              </button>
              <button className={GHOST} disabled={busy === 'import'} onClick={() => setCsv(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Section>
      <Msg m={msg} />
    </div>
  );
}

function DangerPane({ reloadRows, onChanged }) {
  const scope = useScope();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');

  const run = async (id, fn, text) => {
    if (window.prompt(`${text}\n\nType DELETE to confirm.`) !== 'DELETE') return;
    setBusy(id);
    try {
      const out = await rpc(fn);
      setMsg({ ok: true, text: id === 'purge' ? `Removed ${out} participants.` : 'Done.' });
      reloadRows(); onChanged();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(''); }
  };

  const items = [
    ['purge', 'dyc_purge_unselected', 'Remove unpicked participants', 'Deletes participants who got a chest number more than 5 days ago and were never picked by a team.'],
    ['scores', 'dyc_reset_scores', 'Reset all scores', 'Deletes every mark from every judge. Participants are kept.'],
    ['chests', 'dyc_clear_chests', 'Clear chest numbers and teams', 'Removes every chest number and team pick. Participants and scores are kept.'],
    ['all', 'dyc_delete_all', 'Delete all participants', 'Deletes every registration. This cannot be undone.'],
  ];

  return (
    <div className="space-y-4">
      <p role="alert" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
        Reset tools apply to <span className="font-semibold">all events</span>, not only {scope.label}.
      </p>
      <p className="text-sm text-zinc-400">These actions cannot be undone. Download a backup from Settings → Data first if you may need the data.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(([id, fn, title, blurb]) => (
          <div key={id} className="flex flex-col justify-between gap-4 rounded-3xl border border-red-500/30 bg-red-950/20 p-6">
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{blurb}</p>
            </div>
            <button className={`${DANGER} self-start`} disabled={busy === id} onClick={() => run(id, fn, title)}>
              {busy === id ? 'Working…' : title}
            </button>
          </div>
        ))}
      </div>
      <Msg m={msg} />
    </div>
  );
}