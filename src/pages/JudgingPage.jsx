import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// ---- CONFIG -------------------------------------------------------------
// Temporary password. Change it here later (or set VITE_JUDGE_PASSWORD).
const PASSWORD = import.meta.env.VITE_JUDGE_PASSWORD || 'Youthvibe';
// --------------------------------------------------------------------------

const JUDGES = [1, 2, 3, 4];
const TEAMS = [1, 2, 3, 4];
const POLL_MS = 10000;
// Team names, categories and the maximum score are managed in Admin → Settings → Event setup.
const DEFAULT_CFG = {
  team_names: ['Team Spartans', 'Team Vikings', 'Team Titans', 'Team Gladiators'],
  categories: ['Open Mic', 'Mag Gala', 'Paridhan'],
  max_score: 10,
};

// Each team gets its own colour so it is recognisable at a glance.
const TEAM_HEX = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
const hex = (t) => TEAM_HEX[(t - 1) % TEAM_HEX.length];

const GLASS = 'rounded-3xl border bg-white/[0.04] backdrop-blur-xl';
const IDLE = 'border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]';
const ACTIVE = 'border-red-500/60 shadow-[0_18px_60px_rgba(239,68,68,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]';
const INPUT = 'w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]';
const BTN = 'rounded-xl bg-red-500 px-6 py-3 font-semibold text-black shadow-[0_6px_24px_rgba(239,68,68,0.3)] transition hover:bg-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const GHOST = 'inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-300 transition hover:border-red-500/60 hover:text-white active:scale-[0.98]';

const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};

const sameStudent = (r, s, cat) => String(r.chest_no) === String(s.chest_no) && r.category === cat;
const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
const matches = (s, term) =>
  !term || [s.student_name, s.chest_no, s.registration_no].some((v) => String(v ?? '').toLowerCase().includes(term));
const buzz = (ms = 25) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

const ago = (iso) => {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

const verdict = (pct) => (pct >= 90 ? 'Outstanding' : pct >= 75 ? 'Great' : pct >= 50 ? 'Good' : pct > 0 ? 'Needs work' : '');

/* ---------- hooks ---------- */
// Judge names, one per team + judge slot (e.g. "2-3" = Team 2, Judge 3). Remembered on this device.
function useJudgeNames() {
  const [names, setNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dyc_judge_names')) || {}; } catch { return {}; }
  });
  const setName = (team, judge, name) =>
    setNames((prev) => {
      const next = { ...prev, [`${team}-${judge}`]: name };
      try { localStorage.setItem('dyc_judge_names', JSON.stringify(next)); } catch { /* storage blocked */ }
      return next;
    });
  return [names, setName];
}
function useTick(ms) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

function useCountUp(target, ms = 700) {
  const [v, setV] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    if (from === target) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { prev.current = target; setV(target); return undefined; }
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setV(from + (target - from) * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// Students a team has picked; refreshes every few seconds
function useRoster(team) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [updated, setUpdated] = useState(null);
  const load = useCallback(async () => {
    if (!team) return;
    try {
      const d = await rpc('dyc_team_students', { p_team: team });
      setList(d || []);
      setErr('');
      setUpdated(Date.now());
    } catch (e) { setErr(e.message); }
  }, [team]);
  useEffect(() => {
    setList(null);
    setErr('');
    if (!team) return undefined;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [team, load]);
  return [list, err, load, updated];
}

// All four rosters at once (for the home screen)
function useRosters(enabled) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const load = async () => {
      try {
        const all = await Promise.all(TEAMS.map((t) => rpc('dyc_team_students', { p_team: t })));
        if (live) setData(Object.fromEntries(TEAMS.map((t, i) => [t, all[i] || []])));
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [enabled]);
  return data;
}

/* ---------- icons (no emoji) ---------- */
const ICONS = {
  pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  refresh: <><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  crown: <path d="M2 18h20M3 7l4.5 5L12 4l4.5 8L21 7l-2 11H5L3 7z" />,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2z" />,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
};
const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/* ---------- small shared pieces ---------- */
const Page = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-black px-4 pb-16 pt-28 text-white">
    <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      @keyframes pop{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
      @keyframes draw{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}
      .fade-up{animation:fadeUp .4s ease both}
      .pop{animation:pop .3s cubic-bezier(.2,.9,.3,1.2) both}
      .draw{stroke-dasharray:30;animation:draw .5s .15s ease both}
      .no-spin::-webkit-inner-spin-button,.no-spin::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      .no-spin{-moz-appearance:textfield}
      @media (prefers-reduced-motion:reduce){.fade-up,.pop,.draw{animation:none}}
    `}</style>
    <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-[120px]" />
    <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 rounded-full bg-red-900/20 blur-[140px]" />
    <div className="relative mx-auto max-w-6xl">{children}</div>
  </div>
);

const Msg = ({ m }) =>
  m ? <p className={`text-sm ${m.ok ? 'text-green-400' : 'text-red-400'}`}>{m.text}</p> : null;

const Chip = ({ children }) => (
  <span className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400">{children}</span>
);

const LiveDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
  </span>
);

const Avatar = ({ name, team, size = 'h-10 w-10', text = 'text-sm' }) => (
  <span className={`grid shrink-0 place-items-center rounded-full border font-semibold ${size} ${text}`}
    style={{ background: `${hex(team)}22`, borderColor: `${hex(team)}66`, color: hex(team) }}>
    {initials(name)}
  </span>
);

function Ring({ value, total, size = 64, stroke = 6, color = '#ef4444', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = total ? Math.min(1, value / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset .7s ease' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold">{children}</div>
    </div>
  );
}

// Card that leans towards the cursor and lights up where you point
function Tilt({ children, className = '' }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 7}deg) rotateX(${(0.5 - y) * 7}deg) translateY(-4px)`;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`group relative transition-transform duration-200 ${className}`}>
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,0%), rgba(239,68,68,0.22), transparent 60%)' }} />
      {children}
    </div>
  );
}

function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pop flex items-center gap-3 rounded-full border border-green-500/40 bg-zinc-950/95 px-5 py-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-black">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path className="draw" d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        {text}
      </div>
    </div>
  );
}

function Stepper({ step }) {
  const items = ['Choose team', 'Your name', 'Pick student', 'Give mark'];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {items.map((l, i) => (
        <li key={l} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition ${i < step ? 'border-red-500 bg-red-500 text-black' : i === step ? 'border-red-500 text-red-400' : 'border-white/15 text-zinc-500'}`}>
            {i < step ? <Icon name="check" className="h-4 w-4" /> : i + 1}
          </span>
          <span className={`hidden sm:block ${i <= step ? 'text-white' : 'text-zinc-500'}`}>{l}</span>
          {i < items.length - 1 && (
            <span className="h-px flex-1 bg-white/10">
              <span className="block h-full bg-red-500 transition-all duration-500" style={{ width: i < step ? '100%' : '0%' }} />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function Pills({ options, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([id, label, count]) => (
        <button key={id} type="button" onClick={() => onPick(id)}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${value === id ? 'border-red-500 bg-red-500 font-semibold text-black' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
          {label}{count !== undefined && <span className={`ml-2 text-xs ${value === id ? 'text-black/70' : 'text-zinc-500'}`}>{count}</span>}
        </button>
      ))}
    </div>
  );
}

const CategoryChips = ({ cats, value, onPick }) => <Pills options={cats.map((c) => [c, c])} value={value} onPick={onPick} />;

function TeamPicker({ rows, tn, value, onPick, rosters, compact }) {
  if (compact)
    return (
      <div className="flex flex-wrap gap-2">
        {TEAMS.map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${value === t ? 'border-transparent font-semibold text-black' : 'border-white/15 text-zinc-300 hover:border-white/30'}`}
            style={value === t ? { background: hex(t) } : undefined}>
            <span className="h-2 w-2 rounded-full" style={{ background: value === t ? '#000' : hex(t) }} />
            {tn(t)}
          </button>
        ))}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {TEAMS.map((t) => (
        <button key={t} type="button" onClick={() => onPick(t)}
          className={`group relative overflow-hidden p-5 text-left transition hover:-translate-y-1 active:scale-[0.98] ${GLASS} ${value === t ? ACTIVE : `${IDLE} hover:border-white/25`}`}>
          <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-80" style={{ background: hex(t) }} />
          <span className="relative mb-4 grid h-11 w-11 place-items-center rounded-2xl border" style={{ background: `${hex(t)}22`, borderColor: `${hex(t)}66`, color: hex(t) }}>
            <Icon name="shield" />
          </span>
          <p className="relative text-lg font-semibold">{tn(t)}</p>
          <p className="relative mt-1 text-xs text-zinc-500">
            {rosters?.[t] ? `${rosters[t].length} students · ` : ''}{rows.filter((r) => r.team === t).length} marks
          </p>
        </button>
      ))}
    </div>
  );
}

/* =========================================================================
   MAIN
   ========================================================================= */
export default function JudgingPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('dyc_judge_ok') === '1');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);

  const [view, setView] = useState('home'); // 'home' | 'score' | 'roster'
  const [judge, setJudgeState] = useState(() => Number(sessionStorage.getItem('dyc_judge_no')) || 1);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [rows, setRows] = useState([]);
  const rosters = useRosters(unlocked);
  const [judgeNames, setJudgeName] = useJudgeNames();
  useTick(30000);

  const tn = (n) => cfg.team_names[n - 1] || `Team ${n}`;
  const setJudge = (j) => { sessionStorage.setItem('dyc_judge_no', String(j)); setJudgeState(j); };

  const tryUnlock = (e) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem('dyc_judge_ok', '1');
      setUnlocked(true);
      setPwError(false);
    } else setPwError(true);
  };

  const lock = () => {
    sessionStorage.removeItem('dyc_judge_ok');
    setUnlocked(false);
    setPw('');
    setView('home');
  };

  // event settings (team names, categories, max score)
  useEffect(() => {
    if (!unlocked) return;
    rpc('dyc_get_config').then((d) => d && setCfg({ ...DEFAULT_CFG, ...d })).catch(() => {});
  }, [unlocked]);

  // live scores
  useEffect(() => {
    if (!unlocked) return undefined;
    let active = true;
    supabase.from('judge_scores').select('*').order('created_at', { ascending: false })
      .then(({ data }) => active && data && setRows(data));

    const channel = supabase
      .channel('judge_scores_live')
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
    return () => { active = false; supabase.removeChannel(channel); };
  }, [unlocked]);

  const teamStats = useMemo(
    () => TEAMS.map((t) => {
      const r = rows.filter((x) => x.team === t);
      return { team: t, entries: r.length, total: r.reduce((a, x) => a + Number(x.score || 0), 0) };
    }),
    [rows]
  );
  const ranked = useMemo(() => [...teamStats].sort((a, b) => b.total - a.total), [teamStats]);
  const top = ranked[0]?.total || 0;

  // how many of all students this judge has scored
  const mySeen = useMemo(() => new Set(rows.filter((r) => r.judge === judge).map((r) => String(r.chest_no))), [rows, judge]);
  const allStudents = rosters ? TEAMS.flatMap((t) => rosters[t]) : [];
  const myDone = allStudents.filter((s) => mySeen.has(String(s.chest_no))).length;
  const lastTeam = Number(sessionStorage.getItem('dyc_judge_team')) || null;
  const lastName = lastTeam ? judgeNames[`${lastTeam}-${judge}`] : '';

  /* ---------- password gate ---------- */
  if (!unlocked)
    return (
      <Page>
        <form onSubmit={tryUnlock} className={`fade-up mx-auto mt-10 max-w-sm space-y-5 p-8 ${GLASS} ${IDLE}`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400"><Icon name="lock" /></span>
          <div>
            <h1 className="bg-linear-to-r from-white to-red-400 bg-clip-text text-3xl font-bold text-transparent">Judges’ Login</h1>
            <p className="mt-1 text-sm text-zinc-400">This area is restricted to the appointed judges.</p>
          </div>
          <input type="password" className={INPUT} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Enter password" autoFocus />
          {pwError && <p className="text-sm text-red-400">Incorrect password.</p>}
          <button className={`${BTN} w-full`}>Unlock</button>
          <Link to="/" className="block text-center text-sm text-zinc-500 hover:text-zinc-300">← Back to home</Link>
        </form>
      </Page>
    );

  const titles = { home: 'Judging Panel', score: 'Score a Student', roster: 'Team Students' };
  const cards = [
    { id: 'score', icon: 'pen', title: 'Score a Student',
      blurb: 'Pick your team, choose a student, set a mark and lock it in.',
      chips: [`${rows.filter((r) => r.judge === judge).length} marks by you`, lastTeam ? `Continue with ${tn(lastTeam)}` : null] },
    { id: 'roster', icon: 'users', title: 'Team Students',
      blurb: 'Choose a team to see its students, every judge’s marks and who is leading.',
      chips: [`${rows.length} marks in total`] },
  ];

  return (
    <Page>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button type="button" onClick={() => setView('home')} aria-label="Back"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-zinc-300 transition hover:border-red-500/60 hover:text-white active:scale-90">
              <Icon name="back" />
            </button>
          )}
          <h1 className="bg-linear-to-r from-white to-red-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">{titles[view]}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <span className="hidden items-center gap-2 text-zinc-400 sm:flex"><LiveDot /> Live</span>
          <Link to="/" className="text-zinc-400 hover:text-white">Home</Link>
          <button onClick={lock} className="text-red-400 hover:text-red-300">Lock</button>
        </div>
      </header>

      {/* who is judging */}
      <div className={`mb-8 flex flex-wrap items-center justify-between gap-4 p-4 ${GLASS} ${IDLE}`}>
        <div className="flex items-center gap-4">
          <Ring value={myDone} total={allStudents.length} size={56} stroke={5}>
            <span className="text-xs">{allStudents.length ? Math.round((myDone / allStudents.length) * 100) : 0}%</span>
          </Ring>
          <div>
            <p className="font-semibold">Judge {judge}{lastName && <span className="font-normal text-zinc-400"> · {lastName}</span>}</p>
            <p className="text-xs text-zinc-400">
              {rosters ? `${myDone} of ${allStudents.length} students scored` : 'Loading your progress…'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Choose judge">
          {JUDGES.map((j) => (
            <button key={j} type="button" onClick={() => setJudge(j)} aria-pressed={judge === j}
              className={`grid h-11 w-11 place-items-center rounded-full border text-sm font-semibold transition active:scale-90 ${judge === j ? 'border-red-500 bg-red-500 text-black shadow-[0_4px_18px_rgba(239,68,68,0.45)]' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
              J{j}
            </button>
          ))}
        </div>
      </div>

      <div key={view} className="fade-up">
        {view === 'home' && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {cards.map((c) => (
                <Tilt key={c.id}>
                  <article className={`relative flex min-h-67.5 flex-col justify-between overflow-hidden p-7 ${GLASS} ${IDLE}`}>
                    <div className="absolute inset-0 bg-linear-to-br from-red-600/25 via-transparent to-transparent" />
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-red-500/25 blur-[60px]" />
                    <div className="relative">
                      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_8px_30px_rgba(239,68,68,0.25)]">
                        <Icon name={c.icon} className="h-8 w-8" />
                      </span>
                      <h2 className="mt-5 text-2xl font-semibold">{c.title}</h2>
                      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">{c.blurb}</p>
                    </div>
                    <div className="relative mt-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {c.chips.filter(Boolean).map((x) => (
                          <span key={x} className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300">{x}</span>
                        ))}
                      </div>
                      <button type="button" onClick={() => setView(c.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98]">
                        Open <Icon name="arrow" className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                </Tilt>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* standings */}
              <section className={`space-y-4 p-6 lg:col-span-3 ${GLASS} ${IDLE}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Team standings</h2>
                  <span className="flex items-center gap-2 text-xs text-zinc-400"><LiveDot /> updating live</span>
                </div>
                <ul className="space-y-4">
                  {ranked.map((s, i) => (
                    <StandingRow key={s.team} s={s} rank={i + 1} top={top} tn={tn} count={rosters?.[s.team]?.length} />
                  ))}
                </ul>
              </section>

              {/* live feed */}
              <section className={`space-y-4 p-6 lg:col-span-2 ${GLASS} ${IDLE}`}>
                <h2 className="text-lg font-semibold">Latest marks</h2>
                {rows.length === 0 && <p className="text-sm text-zinc-500">No marks yet. They will appear here as judges submit.</p>}
                <ul className="space-y-3">
                  {rows.slice(0, 6).map((r) => (
                    <li key={r.id} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-black/40" style={{ color: hex(r.team) }}>
                        <Icon name="star" className="h-4 w-4" />
                      </span>
                      <p className="text-sm">
                        <span className="text-zinc-400">Judge {r.judge} gave </span>
                        <span className="font-semibold text-red-400">{r.score}</span>
                        <span className="text-zinc-400"> to </span>
                        <span className="font-medium">{r.student_name}</span>
                        <span className="block text-xs text-zinc-500">{r.category} · {tn(r.team)} · {ago(r.created_at)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {view === 'score' && <ScorePanel rows={rows} cfg={cfg} tn={tn} judge={judge} rosters={rosters} judgeNames={judgeNames} setJudgeName={setJudgeName} />}
        {view === 'roster' && <RosterPanel rows={rows} cfg={cfg} tn={tn} rosters={rosters} />}
      </div>
    </Page>
  );
}

function StandingRow({ s, rank, top, tn, count }) {
  const total = useCountUp(s.total);
  return (
    <li className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full border text-sm font-semibold"
            style={{ borderColor: `${hex(s.team)}66`, background: `${hex(s.team)}22`, color: hex(s.team) }}>
            {rank === 1 && s.total > 0 ? <Icon name="crown" className="h-4 w-4" /> : rank}
          </span>
          <div>
            <p className="font-medium leading-tight">{tn(s.team)}</p>
            <p className="text-xs text-zinc-500">{count !== undefined ? `${count} students · ` : ''}{s.entries} marks</p>
          </div>
        </div>
        <p className="text-2xl font-bold tabular-nums">{total.toFixed(1)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${top ? (s.total / top) * 100 : 0}%`, background: hex(s.team) }} />
      </div>
    </li>
  );
}

/* =========================================================================
   CARD 1 — SCORE A STUDENT
   ========================================================================= */
function ScoreDial({ value, onChange, max }) {
  const n = value === '' ? null : Number(value);
  const pct = n === null || Number.isNaN(n) ? 0 : Math.min(100, (n / max) * 100);
  const step = (d) => {
    const next = Math.min(max, Math.max(0, Math.round(((n || 0) + d) * 2) / 2));
    onChange(String(next));
    buzz(10);
  };
  const quick = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map((x) => Math.round(x * max * 2) / 2);
  const tone = pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : n === null ? 'text-zinc-600' : 'text-red-400';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => step(-0.5)} aria-label="Lower by half a point"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/15 text-zinc-300 transition hover:border-red-500/60 active:scale-90">
          <Icon name="minus" />
        </button>
        <div className="text-center">
          <input type="number" inputMode="decimal" step="0.5" min="0" max={max} value={value} placeholder="–" aria-label="Score"
            onChange={(e) => onChange(e.target.value)}
            className={`no-spin w-36 bg-transparent text-center text-6xl font-bold tabular-nums outline-none placeholder:text-zinc-700 ${tone}`} />
          <p className="text-xs text-zinc-500">{verdict(pct) || `out of ${max}`}</p>
        </div>
        <button type="button" onClick={() => step(0.5)} aria-label="Raise by half a point"
          className="grid h-14 w-14 place-items-center rounded-full border border-white/15 text-zinc-300 transition hover:border-red-500/60 active:scale-90">
          <Icon name="plus" />
        </button>
      </div>

      <input type="range" min="0" max={max} step="0.5" value={n ?? 0} onChange={(e) => onChange(e.target.value)}
        aria-label="Score slider" className="w-full accent-red-500" />

      <div className="flex flex-wrap justify-center gap-2">
        {quick.map((q) => (
          <button key={q} type="button" onClick={() => { onChange(String(q)); buzz(10); }}
            className={`rounded-full border px-4 py-1.5 text-sm transition active:scale-90 ${n === q ? 'border-red-500 bg-red-500 font-semibold text-black' : 'border-white/15 text-zinc-300 hover:border-red-500/60'}`}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScorePanel({ rows, cfg, tn, judge, rosters, judgeNames, setJudgeName }) {
  const [team, setTeam] = useState(() => Number(sessionStorage.getItem('dyc_judge_team')) || null);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | done
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [toast, setToast] = useState('');
  const [list, err] = useRoster(team);
  const formRef = useRef(null);

  // judge's name for this team + judge slot; scoring opens only after it is added
  const jname = team ? judgeNames[`${team}-${judge}`] || '' : '';
  const [nameInput, setNameInput] = useState(jname);
  const [editingName, setEditingName] = useState(false);
  const ready = !!jname && !editingName;
  useEffect(() => {
    setNameInput(jname);
    setEditingName(false);
    setSel(null); setScore(''); setConfirming(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, judge]);
  const saveName = (e) => {
    e.preventDefault();
    const n = nameInput.trim();
    if (!n) return;
    setJudgeName(team, judge, n);
    setEditingName(false);
    buzz(20);
  };

  const cat = category || cfg.categories[0];
  const max = Number(cfg.max_score);

  const mine = (s) => rows.find((r) => sameStudent(r, s, cat) && r.judge === judge);
  const term = q.trim().toLowerCase();
  const L = list || [];
  const done = L.filter((s) => mine(s)).length;
  const shown = L.filter((s) => matches(s, term) && (filter === 'all' || (filter === 'done') === !!mine(s)));
  const selMark = sel ? mine(sel) : null;
  const step = !team ? 0 : !ready ? 1 : !sel ? 2 : 3;

  const pickTeam = (t) => {
    sessionStorage.setItem('dyc_judge_team', String(t));
    setTeam(t); setSel(null); setScore(''); setQ(''); setMsg(null); setConfirming(false);
  };

  const pickStudent = (s) => {
    setSel(s); setScore(''); setMsg(null); setConfirming(false);
    if (cfg.categories.includes(s.category)) setCategory(s.category); // jump to the student's own category
    if (window.innerWidth < 1024) setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const review = (e) => {
    e.preventDefault();
    setMsg(null);
    const n = Number(score);
    if (score === '' || Number.isNaN(n) || n < 0 || n > max)
      return setMsg({ ok: false, text: `Enter a score between 0 and ${max}.` });
    setConfirming(true);
  };

  const submit = async () => {
    const n = Number(score);
    setBusy(true);
    setMsg(null);
    try {
      const res = await rpc('dyc_judge_submit', {
        p_team: team, p_judge: judge, p_category: cat, p_chest: String(sel.chest_no),
        p_name: sel.student_name, p_reg: sel.registration_no ?? null, p_score: n,
      });
      if (!res?.ok) throw new Error(res?.error || 'Could not save.');
      buzz(35);
      setToast(`Saved ${n} for ${sel.student_name}`);
      // jump to the next student you have not scored yet
      const i = shown.findIndex((s) => s.id === sel.id);
      const next = [...shown.slice(i + 1), ...shown.slice(0, Math.max(i, 0))].find((s) => !mine(s));
      setSel(next || null);
      setScore('');
      setConfirming(false);
      if (next && cfg.categories.includes(next.category)) setCategory(next.category);
    } catch (ex) { setMsg({ ok: false, text: ex.message }); setConfirming(false); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <Stepper step={step} />

      <section className="space-y-3">
        {!team ? (
          <>
            <h2 className="text-xl font-semibold">Which team are you judging?</h2>
            <TeamPicker rows={rows} tn={tn} value={team} onPick={pickTeam} rosters={rosters} />
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-400">Team</span>
            <TeamPicker rows={rows} tn={tn} value={team} onPick={pickTeam} compact />
          </div>
        )}
      </section>

      {team && !ready && (
        <section className="pop">
          <form onSubmit={saveName} className={`mx-auto max-w-xl space-y-4 p-6 ${GLASS} ${ACTIVE}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
                style={{ background: `${hex(team)}22`, borderColor: `${hex(team)}66`, color: hex(team) }}>
                <Icon name="users" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Who is Judge {judge} for {tn(team)}?</h2>
                <p className="text-sm text-zinc-400">Add your name before you start scoring. It is remembered on this device.</p>
              </div>
            </div>
            <input className={INPUT} value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your full name" maxLength={60} autoFocus aria-label="Judge name" />
            <div className="flex gap-3">
              <button className={BTN} disabled={!nameInput.trim()}>Start scoring</button>
              {jname && <button type="button" className={GHOST} onClick={() => { setEditingName(false); setNameInput(jname); }}>Cancel</button>}
            </div>
          </form>
        </section>
      )}

      {team && ready && (
        <div className="fade-up flex flex-wrap items-center gap-3 text-sm">
          <span className="text-zinc-400">Judging as</span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 py-1 pl-1 pr-4">
            <Avatar name={jname} team={team} size="h-7 w-7" text="text-[11px]" />
            <span className="font-medium">{jname}</span>
            <span className="text-xs text-zinc-500">Judge {judge}</span>
          </span>
          <button type="button" onClick={() => { setNameInput(jname); setEditingName(true); }} className="text-red-400 hover:text-red-300">Change name</button>
        </div>
      )}

      {team && ready && (
        <section className="fade-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Students of {tn(team)}</h2>
            <CategoryChips cats={cfg.categories} value={cat} onPick={(c) => { setCategory(c); setMsg(null); setConfirming(false); }} />
          </div>

          <div className={`flex items-center gap-4 p-4 ${GLASS} ${IDLE}`}>
            <Ring value={done} total={L.length} size={52} stroke={5} color={hex(team)}>
              <span className="text-xs">{L.length ? Math.round((done / L.length) * 100) : 0}%</span>
            </Ring>
            <div>
              <p className="text-sm font-semibold">{done} of {L.length} scored by you in {cat}</p>
              <p className="text-xs text-zinc-500">{L.length - done > 0 ? `${L.length - done} still to go` : L.length ? 'You have scored everyone. Nice work.' : ''}</p>
            </div>
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}
          {!list && !err && (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
            </div>
          )}
          {list && list.length === 0 && (
            <p className={`p-6 text-sm text-zinc-400 ${GLASS} ${IDLE}`}>
              {tn(team)} has not picked any students with a chest number yet.
            </p>
          )}

          {list && list.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-5">
              <div className={`space-y-3 p-5 lg:col-span-3 ${GLASS} ${IDLE}`}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Icon name="search" className="h-4 w-4" /></span>
                  <input className={`${INPUT} pl-11`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, chest no. or registration no." />
                </div>
                <Pills value={filter} onPick={setFilter}
                  options={[['all', 'All', L.length], ['pending', 'Pending', L.length - done], ['done', 'Scored', done]]} />
                <ul className="max-h-120 space-y-2 overflow-y-auto pr-1">
                  {shown.length === 0 && <li className="p-4 text-center text-sm text-zinc-500">No student matches.</li>}
                  {shown.map((s) => {
                    const m = mine(s);
                    return (
                      <li key={s.id}>
                        <button type="button" onClick={() => pickStudent(s)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${sel?.id === s.id ? 'border-red-500/70 bg-red-500/10' : 'border-white/10 bg-black/40 hover:border-white/25'}`}>
                          <Avatar name={s.student_name} team={team} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{s.student_name}</span>
                            <span className="text-xs text-zinc-500">Chest {s.chest_no} · {s.category || 'No category'}</span>
                          </span>
                          {m
                            ? <span className="flex items-center gap-1.5 rounded-full border border-green-500/40 px-3 py-1 text-xs font-semibold text-green-400"><Icon name="check" className="h-3.5 w-3.5" />{m.score}</span>
                            : <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400"><Icon name="clock" className="h-3.5 w-3.5" />Pending</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div ref={formRef} className="lg:col-span-2">
                <form onSubmit={review} className={`space-y-5 p-6 lg:sticky lg:top-28 ${GLASS} ${sel ? ACTIVE : IDLE}`}>
                  {!sel && (
                    <div className="py-8 text-center text-sm text-zinc-500">
                      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 text-zinc-500"><Icon name="pen" /></span>
                      Select a student from the list to give a mark.
                    </div>
                  )}

                  {sel && (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar name={sel.student_name} team={team} size="h-12 w-12" text="text-base" />
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold leading-tight">{sel.student_name}</h3>
                          <p className="text-xs text-zinc-400">Chest {sel.chest_no} · {jname} · {cat}</p>
                        </div>
                      </div>

                      {selMark && (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
                          <p className="text-4xl font-bold tabular-nums text-green-400">{selMark.score}</p>
                          <p className="mt-2 text-sm text-zinc-400">You already scored this student in {cat}. Only the admin can change a mark.</p>
                        </div>
                      )}

                      {!selMark && !confirming && (
                        <>
                          <ScoreDial value={score} onChange={setScore} max={max} />
                          <button className={`${BTN} w-full`}>Review score</button>
                        </>
                      )}

                      {!selMark && confirming && (
                        <div className="pop space-y-4 rounded-2xl border border-red-500/40 bg-red-500/5 p-5 text-center">
                          <p className="text-sm text-zinc-300">Lock in this mark? You can’t change it afterwards.</p>
                          <p className="text-5xl font-bold tabular-nums text-red-400">{Number(score)}</p>
                          <p className="text-xs text-zinc-500">for {sel.student_name} as {jname} (Judge {judge}) in {cat}</p>
                          <div className="flex gap-3">
                            <button type="button" className={`${GHOST} flex-1 justify-center`} onClick={() => setConfirming(false)} disabled={busy}>Edit</button>
                            <button type="button" className={`${BTN} flex-1`} onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Lock in'}</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <Msg m={msg} />
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {toast && <Toast text={toast} onDone={() => setToast('')} />}
    </div>
  );
}

/* =========================================================================
   CARD 2 — TEAM STUDENTS (visible only after choosing a team)
   ========================================================================= */
function RosterPanel({ rows, cfg, tn, rosters }) {
  const [team, setTeam] = useState(null);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all | full | need
  const [sort, setSort] = useState('chest'); // chest | top
  const [list, err, refresh, updated] = useRoster(team);
  useTick(15000);

  const cat = category || cfg.categories[0];
  const max = Number(cfg.max_score);

  const enriched = useMemo(
    () => (list || []).map((s) => {
      const marks = rows.filter((r) => sameStudent(r, s, cat));
      const judges = new Set(marks.map((m) => m.judge)).size;
      const avg = marks.length ? marks.reduce((a, m) => a + Number(m.score || 0), 0) / marks.length : null;
      return { ...s, marks, judges, avg };
    }),
    [list, rows, cat]
  );

  if (!team)
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Choose a team</h2>
          <p className="text-sm text-zinc-400">Students are shown only after you pick a team.</p>
        </div>
        <TeamPicker rows={rows} tn={tn} value={team} onPick={(t) => { setTeam(t); setQ(''); }} rosters={rosters} />
      </section>
    );

  const term = q.trim().toLowerCase();
  const fully = enriched.filter((s) => s.judges === JUDGES.length).length;
  const topAvg = Math.max(0, ...enriched.map((s) => s.avg ?? 0));
  const teamTotal = rows.filter((r) => r.team === team && r.category === cat).reduce((a, r) => a + Number(r.score || 0), 0);

  let shown = enriched.filter((s) => matches(s, term) && (filter === 'all' || (filter === 'full') === (s.judges === JUDGES.length)));
  if (sort === 'top') shown = [...shown].sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  return (
    <div className="fade-up space-y-6">
      {/* team banner */}
      <div className={`relative overflow-hidden p-6 ${GLASS} ${IDLE}`}>
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-40 blur-[70px]" style={{ background: hex(team) }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border" style={{ background: `${hex(team)}22`, borderColor: `${hex(team)}66`, color: hex(team) }}>
              <Icon name="shield" className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">{tn(team)}</h2>
              <p className="text-sm text-zinc-400">{list ? `${list.length} students picked` : 'Loading…'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={refresh} className="flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white" title="Refresh now">
              <LiveDot /> {updated ? `Updated ${ago(new Date(updated).toISOString())}` : 'Updating…'} <Icon name="refresh" className="h-3.5 w-3.5" />
            </button>
            <button type="button" className={GHOST} onClick={() => { setTeam(null); setQ(''); setFilter('all'); }}>Change team</button>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className={`p-5 ${GLASS} ${IDLE}`}>
          <p className="text-sm text-zinc-400">Team total in {cat}</p>
          <p className="text-3xl font-bold tabular-nums text-red-500">{teamTotal.toFixed(1)}</p>
        </div>
        <div className={`p-5 ${GLASS} ${IDLE}`}>
          <p className="text-sm text-zinc-400">Best average</p>
          <p className="text-3xl font-bold tabular-nums text-red-500">{topAvg ? topAvg.toFixed(2) : '–'}</p>
        </div>
        <div className={`flex items-center gap-4 p-5 ${GLASS} ${IDLE}`}>
          <Ring value={fully} total={enriched.length} size={54} stroke={5} color={hex(team)}>
            <span className="text-xs">{enriched.length ? Math.round((fully / enriched.length) * 100) : 0}%</span>
          </Ring>
          <div>
            <p className="text-sm text-zinc-400">Fully scored</p>
            <p className="text-xl font-bold tabular-nums">{fully}<span className="text-sm text-zinc-500"> / {enriched.length}</span></p>
          </div>
        </div>
        <div className={`p-5 ${GLASS} ${IDLE}`}>
          <p className="mb-2 text-sm text-zinc-400">Category</p>
          <CategoryChips cats={cfg.categories} value={cat} onPick={setCategory} />
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-55 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><Icon name="search" className="h-4 w-4" /></span>
          <input className={`${INPUT} pl-11`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, chest no. or registration no." />
        </div>
        <Pills value={filter} onPick={setFilter}
          options={[['all', 'All', enriched.length], ['full', 'All judges done', fully], ['need', 'Needs marks', enriched.length - fully]]} />
        <Pills value={sort} onPick={setSort} options={[['chest', 'By chest no.'], ['top', 'Top scores']]} />
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
      {!list && !err && (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/5" />)}
        </div>
      )}
      {list && list.length === 0 && (
        <p className={`p-6 text-sm text-zinc-400 ${GLASS} ${IDLE}`}>{tn(team)} has not picked any students yet.</p>
      )}
      {list && list.length > 0 && shown.length === 0 && <p className="text-sm text-zinc-500">No student matches.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((s) => {
          const leader = topAvg > 0 && s.avg === topAvg;
          return (
            <div key={s.id} className={`space-y-4 p-5 transition hover:-translate-y-0.5 ${GLASS} ${leader ? ACTIVE : IDLE}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.student_name} team={team} size="h-11 w-11" />
                  <div>
                    <p className="flex items-center gap-2 font-semibold leading-tight">
                      {s.student_name}
                      {leader && <span className="text-amber-400" title="Highest average in this team"><Icon name="crown" className="h-4 w-4" /></span>}
                    </p>
                    <p className="text-xs text-zinc-500">Reg. {s.registration_no || '—'} · {s.category || 'No category'}</p>
                  </div>
                </div>
                <Chip>Chest {s.chest_no}</Chip>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {JUDGES.map((j) => {
                  const m = s.marks.find((x) => x.judge === j);
                  const h = m ? Math.max(6, (Number(m.score) / max) * 100) : 0;
                  return (
                    <div key={j} className="rounded-xl border border-white/10 bg-black/40 px-2 pb-2 pt-2 text-center">
                      <p className={`text-sm font-semibold tabular-nums ${m ? 'text-white' : 'text-zinc-600'}`}>{m ? m.score : '–'}</p>
                      <div className="mx-auto mt-1 flex h-12 w-3 items-end overflow-hidden rounded-full bg-white/10">
                        <div className="w-full rounded-full transition-all duration-700" style={{ height: `${h}%`, background: hex(team) }} />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500">J{j}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-zinc-400">Average <span className="ml-1 text-lg font-bold tabular-nums text-white">{s.avg === null ? '–' : s.avg.toFixed(2)}</span></p>
                <span className={`rounded-full border px-3 py-1 text-xs ${s.judges === JUDGES.length ? 'border-green-500/40 text-green-400' : 'border-white/10 text-zinc-400'}`}>
                  {s.judges}/{JUDGES.length} judges
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}