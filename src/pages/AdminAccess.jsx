import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
const DEFAULT_CFG = {
  team_names: ['Team Spartans', 'Team Vikings', 'Team Titans', 'Team Gladiators'],
  categories: ['Open Mic', 'Mag Gala', 'Paridhan'],
  max_score: 10,
};

// ---- ALL EVENTS (shown on the Allot screen; edit / add lines here) --------
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
const GROUPS = [...new Set(EVENTS.map((e) => e.group))];
const GROUP_ICON = {
  Lifestyle: '✨', 'Literary & Theatre': '🎭', eSports: '🎮', Management: '🍳', Sports: '🏃',
};
const sizeLabel = (ev) =>
  ev.max === 1 ? 'Solo' : ev.min === ev.max ? `Team of ${ev.max}` : `Team of ${ev.min}–${ev.max}`;
// --------------------------------------------------------------------------

// Everything except Settings opens on laptops / desktops only.
const MOBILE_UA = /Android|iPhone|iPod|Mobile/i;
const isDesk = () => window.innerWidth >= 1024 && !MOBILE_UA.test(navigator.userAgent);

const GLASS = 'rounded-3xl border bg-white/[0.04] backdrop-blur-xl';
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

const downloadCsv = (name, list) => {
  if (!list.length) return;
  const cols = Object.keys(list[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = [cols.join(','), ...list.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

const initials = (n) =>
  String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => (w[0] || '').toUpperCase()).join('') || '?';

// letters + digits only, lower case
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

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
  const load = useCallback(async () => {
    try {
      const d = await rpc('dyc_get_config');
      if (d) setCfg({ ...DEFAULT_CFG, ...d });
    } catch { /* keep defaults */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  return [cfg, load];
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
function summarise(rows) {
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
    .sort((a, b) => b.avg - a.avg);
  return { teamStats, students };
}

/* ---------- small shared pieces ---------- */
const Page = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-black px-4 pb-14 pt-28 text-white">
    <style>{`
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      @keyframes pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
      @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(239,68,68,.45)}100%{box-shadow:0 0 0 14px rgba(239,68,68,0)}}
      .fade-up{animation:fadeUp .4s ease both}
      .pop{animation:pop .35s cubic-bezier(.2,1.4,.4,1) both}
      .ring{animation:pulseRing 1.6s ease-out infinite}
      @media (prefers-reduced-motion:reduce){.fade-up,.pop,.ring{animation:none}}
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

  const [cfg, reloadCfg] = useConfig();
  const tn = (n) => cfg.team_names[n - 1] || `Team ${n}`;

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);

  const current = !desktop && view !== 'settings' ? 'home' : view;

  const tryUnlock = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
      setPwError(false);
    } else setPwError(true);
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setInput('');
    setSettingsOk(false);
    setView('home');
  };

  const goHome = () => { setSettingsOk(false); setView('home'); };
  const open = (id) => { if (desktop || id === 'settings') setView(id); };

  const loadRows = useCallback(async () => {
    const { data } = await supabase.from('judge_scores').select('*').order('created_at', { ascending: false });
    if (data) setRows(data);
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await rpc('dyc_stats')); } catch { /* ignore */ }
  }, []);

  // live scores
  useEffect(() => {
    if (!unlocked) return;
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
  }, [unlocked, loadRows]);

  // participant stats
  useEffect(() => {
    if (!unlocked) return;
    loadStats();
    const t = setInterval(loadStats, POLL_MS);
    return () => clearInterval(t);
  }, [unlocked, loadStats]);

  const sum = useMemo(() => summarise(rows), [rows]);
  const leader = [...sum.teamStats].sort((a, b) => b.total - a.total)[0];

  /* ---------- admin password gate ---------- */
  if (!unlocked)
    return (
      <Page>
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
    { id: 'scores', icon: '✍️', title: 'Score Control', desk: true,
      blurb: 'Enter a mark, or change any judge’s mark for any participant, even after it was given.',
      chips: [`${rows.length} marks`, `${JUDGES.length} judges`] },
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
      blurb: 'Full control: participants, marks, event setup and reset tools. Has its own password.',
      chips: ['Full control', 'Works on phones'] },
  ];

  return (
    <Page>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="bg-linear-to-r from-white to-red-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">{titles[current]}</h1>
        <div className="flex shrink-0 gap-4 text-sm">
          <Link to="/" className="text-zinc-400 hover:text-white">Home</Link>
          <button onClick={lock} className="text-red-400 hover:text-red-300">Lock</button>
        </div>
      </header>

      {current !== 'home' && (
        <button type="button" onClick={goHome} className={`${GHOST} mb-6 rounded-full py-2`}>← All sections</button>
      )}

      {!desktop && current === 'home' && (
        <p className={`mb-6 p-4 text-sm text-zinc-300 ${GLASS} ${ACTIVE}`}>
          Admin tools open on a laptop. On a phone you can use Settings.
        </p>
      )}

      <div key={current} className="fade-up">
        {current === 'home' && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => {
              const off = !desktop && c.desk;
              return (
                <article key={c.id}
                  className={`group relative flex h-85 flex-col justify-end overflow-hidden ${GLASS} ${IDLE} transition duration-300 ${off ? 'opacity-45' : 'hover:-translate-y-1 hover:border-red-500/50'}`}>
                  <div className="absolute inset-0 bg-linear-to-b from-red-600/35 via-red-950/25 to-black" />
                  <div className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-red-500/30 blur-[70px]" />
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

        {current === 'allot' && <AllotPanel tn={tn} stats={stats} onChanged={loadStats} />}
        {current === 'scores' && <ScoresPanel rows={rows} cfg={cfg} tn={tn} sum={sum} />}
        {current === 'board' && <Board sum={sum} cats={cfg.categories} tn={tn} />}
        {current === 'overview' && <OverviewPanel stats={stats} tn={tn} />}
        {current === 'teams' && <TeamsPanel tn={tn} />}

        {current === 'settings' && !settingsOk && <SettingsGate onOpen={() => setSettingsOk(true)} />}
        {current === 'settings' && settingsOk && (
          <SettingsArea cfg={cfg} tn={tn} rows={rows} reloadCfg={reloadCfg} reloadRows={loadRows} onChanged={loadStats} />
        )}
      </div>
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
function AllotPanel({ tn, stats, onChanged }) {
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
    if (picked) return;
    const term = q.trim();
    if (!term) { setResults([]); setSearched(false); return; }
    let live = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = (await rpc('dyc_list', { p_q: term, p_limit: 8 })) || [];
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
  const primaryListed = EVENTS.some(isPrimary);
  const orphans = extras.filter((x) => !EVENTS.some((ev) => matches(x, ev))); // saved earlier, not in the list
  const listedNames = [
    ...(primary && !primaryListed ? [primary] : []),
    ...EVENTS.filter(isOn).map((ev) => ev.name),
  ];
  const eventCount = listedNames.length + orphans.length;

  const evFilter = norm(evQ);
  const shownEvents = EVENTS.filter((ev) => !evFilter || norm(`${ev.name} ${ev.group}`).includes(evFilter));

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
                  placeholder={`Search ${EVENTS.length} events…`} />

                <div className="max-h-110 space-y-5 overflow-y-auto pr-1">
                  {shownEvents.length === 0 && <p className="text-sm text-zinc-500">No event matches that search.</p>}
                  {GROUPS.map((g) => {
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
    if (sel) return;
    const term = q.trim();
    if (!term) { setResults([]); setSearching(false); return; }
    let live = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const list = (await rpc('dyc_list', { p_q: term, p_limit: 8 })) || [];
        if (live) setResults(list);
      } catch (e) { if (live) setMsg({ ok: false, text: e.message }); }
      finally { if (live) setSearching(false); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, sel]);

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
                    <input type="number" step="0.5" min="0" max={max} className={INPUT} placeholder="No mark"
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
          <h2 className="text-xl font-semibold">Ranking <span className="ml-2 text-xs text-green-400">● live</span></h2>
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
        {stats.due_removal} participant{stats.due_removal === 1 ? '' : 's'} arrived more than 5 days ago and were never picked.
        Remove them from Settings → Reset tools.
      </p>
    </div>
  );
}

/* =========================================================================
   05  TEAM SELECTIONS
   ========================================================================= */
function TeamsPanel({ tn }) {
  const [members] = usePoll(() => rpc('dyc_list', { p_q: '', p_limit: 1000 }), []);
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
function SettingsArea({ cfg, tn, rows, reloadCfg, reloadRows, onChanged }) {
  const [tab, setTab] = useState('people');
  const judges = cfg.judge_names || {}; // saved with the other event settings
  const tabs = [['people', '👥 Participants'], ['judges', '🧑‍⚖️ Judges'], ['marks', '📝 Score records'], ['event', '🎛️ Event setup'], ['danger', '⚠️ Reset tools']];
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
        {tab === 'marks' && <MarksPane rows={rows} tn={tn} reloadRows={reloadRows} judges={judges} />}
        {tab === 'event' && <EventPane cfg={cfg} reloadCfg={reloadCfg} />}
        {tab === 'danger' && <DangerPane reloadRows={reloadRows} onChanged={onChanged} />}
      </div>
    </div>
  );
}

const EMPTY = { registration_no: '', student_name: '', phone: '', email: '', category: '', chest_no: '', team_no: '' };

function PeoplePane({ tn, onChanged }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try { setList((await rpc('dyc_list', { p_q: q.trim(), p_limit: 300 })) || []); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  }, [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const set = (k) => (v) => setEdit((e) => ({ ...e, [k]: v }));

  const save = async () => {
    // extra_events is managed from the Allot screen, so it is not sent from here
    // eslint-disable-next-line no-unused-vars
    const { id, extra_events, ...data } = edit;
    try {
      const res = await rpc('dyc_save_participant', { p_id: id ? String(id) : '', p_data: data });
      if (!res?.ok) throw new Error(res?.error || 'Could not save.');
      setMsg({ ok: true, text: id ? 'Changes saved.' : 'Participant added.' });
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
        <h2 className="text-xl font-semibold">All participants</h2>
        <div className="flex gap-2">
          <button className={GHOST}
            onClick={() => downloadCsv('participants.csv', list.map(({ id, extra_events, ...r }) => ({ ...r, extra_events: (extra_events || []).join('; ') })))}>
            Export CSV
          </button>
          <button className={BTN} onClick={() => setEdit({ ...EMPTY })}>+ Add</button>
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

function MarksPane({ rows, tn, reloadRows, judges = {} }) {
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
          onClick={() => downloadCsv('scores.csv', rows.map((r) => ({
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
                    <input type="number" step="0.5" className={`${INPUT} w-24 py-2`} value={drafts[r.id] ?? r.score ?? ''}
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

function DangerPane({ reloadRows, onChanged }) {
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
      <p className="text-sm text-zinc-400">These actions cannot be undone. Export a CSV from the other tabs first if you may need the data.</p>
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