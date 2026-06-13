import { useEffect, useMemo, useState } from 'react';
import { WEEKS, PHASES, CERT_PATH, JOB_BOARDS, CV_TIPS } from './roadmapData';

// Standalone SOC roadmap app. Always dark, mobile-first, localStorage only.
// Deliberately imports nothing from the main Reserva app.

const LS_KEY = 'soc_roadmap_done';

const loadDone = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
};

const PHASE_STYLES = {
  sky: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    bar: 'bg-sky-400',
    ring: 'border-sky-500/40',
    dot: 'bg-sky-400',
  },
  violet: {
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    bar: 'bg-violet-400',
    ring: 'border-violet-500/40',
    dot: 'bg-violet-400',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-400',
    ring: 'border-amber-500/40',
    dot: 'bg-amber-400',
  },
};

const TagChip = ({ tag }) =>
  tag === 'audio' ? (
    <span className="flex-shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300" title="Taxi-friendly: audio / mental">
      🎧 taxi
    </span>
  ) : (
    <span className="flex-shrink-0 rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300" title="Desk required">
      💻 desk
    </span>
  );

const TaskRow = ({ task, done, onToggle, suffix }) => (
  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
    <input
      type="checkbox"
      checked={!!done}
      onChange={() => onToggle(task.id)}
      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-slate-600 bg-slate-800 accent-sky-500"
    />
    <span className={`flex-1 text-sm leading-snug ${done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
      {task.text}
      {suffix && <span className="ml-1.5 text-xs text-slate-500">{suffix}</span>}
    </span>
    <TagChip tag={task.tag || 'desk'} />
  </label>
);

const WeekCard = ({ week, done, onToggle, open, onOpen }) => {
  const phase = PHASES[week.month];
  const st = PHASE_STYLES[phase.color];
  const allTasks = [...week.daily, ...week.weekend];
  const doneCount = allTasks.filter((t) => done[t.id]).length;
  const pct = Math.round((doneCount / allTasks.length) * 100);
  const weekNum = Number(week.id.slice(1));

  return (
    <div className={`overflow-hidden rounded-2xl border bg-slate-900/70 ${open ? st.ring : 'border-slate-800'}`}>
      {/* Header */}
      <button onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${pct === 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
          {pct === 100 ? '✓' : `W${weekNum}`}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{week.title}</span>
          <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <span className={`block h-full rounded-full ${st.bar}`} style={{ width: `${pct}%` }} />
          </span>
        </span>
        <span className="flex-shrink-0 text-xs tabular-nums text-slate-500">{doneCount}/{allTasks.length}</span>
        <svg className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3">
          <p className="mb-3 text-sm italic text-slate-400">{week.goal}</p>

          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Daily micro-tasks · 15–30 min</p>
          <div className="mb-3">
            {week.daily.map((t) => (
              <TaskRow key={t.id} task={t} done={done[t.id]} onToggle={onToggle} />
            ))}
          </div>

          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Weekend deep work</p>
          <div className="mb-3">
            {week.weekend.map((t) => (
              <TaskRow key={t.id} task={{ ...t, tag: 'desk' }} done={done[t.id]} onToggle={onToggle} suffix={`~${t.hours}h`} />
            ))}
          </div>

          {week.resources?.length > 0 && (
            <>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Resources</p>
              <div className="flex flex-wrap gap-1.5">
                {week.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-sky-300 transition-colors hover:border-sky-500/50 hover:bg-slate-800"
                  >
                    {r.label} ↗
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => (
  <div className="space-y-4">
    {/* Cert path */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-sm font-bold text-white">🎓 Cert Path</h3>
      <ol className="space-y-2.5">
        {CERT_PATH.map((c, i) => (
          <li key={c.name} className="flex items-center gap-2.5">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                c.status === 'done'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : c.status === 'current'
                    ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50'
                    : 'bg-slate-800 text-slate-500'
              }`}
            >
              {c.status === 'done' ? '✓' : i + 1}
            </span>
            <span className={`text-sm ${c.status === 'next' ? 'text-slate-500' : 'text-slate-200'}`}>
              {c.name}
              {c.note && <span className="ml-1.5 text-xs text-slate-500">({c.note})</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>

    {/* Job boards */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-3 text-sm font-bold text-white">🔎 Job Boards</h3>
      <ul className="space-y-1.5">
        {JOB_BOARDS.map((b) => (
          <li key={b.url}>
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 hover:underline">
              {b.label} ↗
            </a>
            {b.note && <span className="ml-1.5 text-xs text-slate-500">{b.note}</span>}
          </li>
        ))}
      </ul>
    </section>

    {/* CV framing */}
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="mb-1 text-sm font-bold text-white">📝 CV Framing — Your Story</h3>
      <p className="mb-3 text-xs text-slate-500">You already did security work. Name it in their language:</p>
      <ul className="space-y-3">
        {CV_TIPS.map((tip) => (
          <li key={tip.from} className="text-xs leading-relaxed">
            <span className="text-slate-400">{tip.from}</span>
            <span className="mx-1 text-slate-600">→</span>
            <span className="font-medium text-emerald-300">{tip.to}</span>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default function SocRoadmap() {
  const [done, setDone] = useState(loadDone);
  const [openWeek, setOpenWeek] = useState(null);

  // First incomplete week starts expanded
  useEffect(() => {
    const saved = loadDone();
    const firstIncomplete = WEEKS.find((w) => [...w.daily, ...w.weekend].some((t) => !saved[t.id]));
    setOpenWeek((firstIncomplete || WEEKS[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(done));
    } catch {
      /* storage full / private mode — checkboxes still work for the session */
    }
  }, [done]);

  const toggle = (id) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const { totalTasks, totalDone } = useMemo(() => {
    let total = 0;
    let count = 0;
    WEEKS.forEach((w) =>
      [...w.daily, ...w.weekend].forEach((t) => {
        total += 1;
        if (done[t.id]) count += 1;
      })
    );
    return { totalTasks: total, totalDone: count };
  }, [done]);

  const overallPct = Math.round((totalDone / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-5 backdrop-blur sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">
            SOC Analyst <span className="text-sky-400">· 3-Month Roadmap</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            A+ done → Security+ → SOC Tier 1. Audio on shift 🎧, hands-on in the evening 💻.
          </p>

          {/* Overall progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-amber-400 transition-all duration-500" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="text-sm font-bold tabular-nums text-white">{overallPct}%</span>
          </div>

          {/* Phase legend */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(PHASES).map(([m, p]) => (
              <span key={m} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${PHASE_STYLES[p.color].badge}`}>
                {p.emoji} Month {m} · {p.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
        {/* Timeline */}
        <div>
          {[1, 2, 3].map((month) => {
            const phase = PHASES[month];
            const st = PHASE_STYLES[phase.color];
            return (
              <section key={month} className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Month {month} — {phase.name}
                  </h2>
                </div>
                <div className="space-y-3">
                  {WEEKS.filter((w) => w.month === month).map((week) => (
                    <WeekCard
                      key={week.id}
                      week={week}
                      done={done}
                      onToggle={toggle}
                      open={openWeek === week.id}
                      onOpen={() => setOpenWeek((cur) => (cur === week.id ? null : week.id))}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Sidebar — below timeline on mobile, right column on desktop */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Sidebar />
        </aside>
      </main>
    </div>
  );
}
