import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { createClient } from '@supabase/supabase-js';
import './Dashboard.scss';
import {
  fetchTracks,
  fetchArtists,
  fetchGenres,
  fetchMoods,
  fetchSelections,
  Track,
  Artist,
  Genre,
  Mood,
  Selections,
} from '../../services/api';

// ── Config ────────────────────────────────────────────────────────────────────
const DASHBOARD_PASSWORD =
  process.env.REACT_APP_DASHBOARD_PASSWORD || 'mattdigging2025';
const SESSION_KEY = 'md_dashboard_auth';

// Admin Supabase client — uses the service_role key to bypass RLS
// Set REACT_APP_SUPABASE_SERVICE_ROLE_KEY in your .env file
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL as string,
  (process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY) as string,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ── Types ─────────────────────────────────────────────────────────────────────

/** Combined auth user + profile row */
interface DashboardUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  // from user_metadata or profiles table
  username?: string;
  is_member?: boolean;
  subscription_type?: string;
  subscription_expires_at?: string;
  member_since?: string;
}

// Keep Profile as an alias so existing code compiles
type Profile = DashboardUser;

type Tab = 'overview' | 'users' | 'tracks' | 'artists' | 'tags' | 'selections';

interface DashboardData {
  profiles: DashboardUser[];
  tracks: Track[];
  artists: Artist[];
  genres: Genre[];
  moods: Mood[];
  selections: Selections[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] = acc[k] || []).push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── PasswordGate ─────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out' },
      );
    }
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === DASHBOARD_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      // Fade out before unlock
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: onUnlock,
        });
      } else {
        onUnlock();
      }
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setValue('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="db-gate" ref={containerRef}>
      {/* Animated background particles */}
      <div className="db-gate__bg">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`db-gate__particle db-gate__particle--${i}`} />
        ))}
      </div>

      <div className={`db-gate__card ${shaking ? 'db-gate__card--shake' : ''}`}>
        <div className="db-gate__logo">
          <span>M</span>
        </div>
        <h1 className="db-gate__title">Mattdigging</h1>
        <p className="db-gate__subtitle">Dashboard · Enter access password</p>

        <form onSubmit={handleSubmit} className="db-gate__form">
          <div className={`db-gate__input-wrap ${error ? 'db-gate__input-wrap--error' : ''}`}>
            <input
              ref={inputRef}
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              className="db-gate__input"
            />
          </div>
          {error && <p className="db-gate__error">Incorrect password. Try again.</p>}
          <button type="submit" className="db-gate__btn">
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  icon?: string;
}) {
  const numRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.8,
      ease: 'power2.out',
      delay: 0.2,
      onUpdate() {
        if (numRef.current) {
          numRef.current.textContent = Math.round(obj.val).toLocaleString();
        }
      },
    });
  }, [value]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      );
    }
  }, []);

  return (
    <div className="db-stat" ref={cardRef} style={{ '--stat-color': color } as React.CSSProperties}>
      {icon && <span className="db-stat__icon">{icon}</span>}
      <span className="db-stat__num">
        <span ref={numRef}>0</span>
      </span>
      <span className="db-stat__label">{label}</span>
      {sub && <span className="db-stat__sub">{sub}</span>}
      <div className="db-stat__glow" />
    </div>
  );
}

// ── BarChart ──────────────────────────────────────────────────────────────────
function BarChart({
  data,
  title,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      const bars = barRef.current.querySelectorAll<HTMLElement>('.db-bar__fill');
      bars.forEach((bar, i) => {
        const target = parseFloat(bar.dataset.target || '0');
        gsap.fromTo(
          bar,
          { scaleY: 0 },
          { scaleY: target / 100, duration: 1, ease: 'power2.out', delay: i * 0.06 },
        );
      });
    }
  }, [data]);

  return (
    <div className="db-chart-card">
      {title && <h3 className="db-chart-card__title">{title}</h3>}
      <div className="db-bar" ref={barRef}>
        {data.slice(0, 15).map((d, i) => (
          <div key={i} className="db-bar__item">
            <div className="db-bar__track">
              <div
                className="db-bar__fill"
                data-target={String((d.value / max) * 100)}
                style={{
                  background: d.color || 'var(--color-yellow)',
                  transformOrigin: 'bottom',
                  height: '100%',
                }}
              />
            </div>
            <span className="db-bar__val">{d.value}</span>
            <span className="db-bar__lbl">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HBarChart (Horizontal) ────────────────────────────────────────────────────
function HBarChart({
  data,
  title,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const fills = containerRef.current.querySelectorAll<HTMLElement>('.db-hbar__fill');
      fills.forEach((fill, i) => {
        const target = parseFloat(fill.dataset.target || '0');
        gsap.fromTo(
          fill,
          { scaleX: 0 },
          {
            scaleX: target / 100,
            duration: 1,
            ease: 'power2.out',
            delay: i * 0.07,
          },
        );
      });
    }
  }, [data]);

  return (
    <div className="db-chart-card" ref={containerRef}>
      {title && <h3 className="db-chart-card__title">{title}</h3>}
      <div className="db-hbar">
        {data.slice(0, 12).map((d, i) => (
          <div key={i} className="db-hbar__row">
            <span className="db-hbar__label">{d.label}</span>
            <div className="db-hbar__track">
              <div
                className="db-hbar__fill"
                data-target={String((d.value / max) * 100)}
                style={{
                  background: d.color || 'var(--color-yellow)',
                  transformOrigin: 'left',
                  height: '100%',
                }}
              />
            </div>
            <span className="db-hbar__val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({
  segments,
  title,
  size = 160,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  title?: string;
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const svgRef = useRef<SVGSVGElement>(null);

  const r = 56;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const slices = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dashOffset = circumference * (1 - cumulative);
    const dashArray = circumference * fraction;
    cumulative += fraction;
    return { ...seg, fraction, dashOffset, dashArray };
  });

  useEffect(() => {
    if (svgRef.current) {
      const circles = svgRef.current.querySelectorAll<SVGCircleElement>('.db-donut__arc');
      circles.forEach((c, i) => {
        const finalDash = parseFloat(c.dataset.dash || '0');
        const gap = circumference - finalDash;
        gsap.fromTo(
          c,
          { strokeDasharray: `0 ${circumference}` },
          {
            strokeDasharray: `${finalDash} ${gap}`,
            duration: 1.2,
            ease: 'power2.out',
            delay: i * 0.25,
          },
        );
      });
    }
  }, [segments, circumference]);

  if (total === 0) return null;

  return (
    <div className="db-chart-card db-chart-card--donut">
      {title && <h3 className="db-chart-card__title">{title}</h3>}
      <div className="db-donut">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="20"
          />
          {slices.map((s, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray="0"
              strokeDashoffset={s.dashOffset}
              className="db-donut__arc"
              data-dash={String(s.dashArray)}
            />
          ))}
        </svg>
        <div className="db-donut__center">
          <span className="db-donut__total">{total}</span>
          <span className="db-donut__total-label">total</span>
        </div>
      </div>
      <div className="db-donut__legend">
        {segments.map((s, i) => (
          <div key={i} className="db-donut__legend-item">
            <span className="db-donut__dot" style={{ background: s.color }} />
            <span className="db-donut__legend-label">{s.label}</span>
            <span className="db-donut__legend-val">
              {s.value} · {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable({
  columns,
  data,
  emptyMsg = 'No data available',
}: {
  columns: Array<{ key: string; label: string; render?: (row: any) => React.ReactNode }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  emptyMsg?: string;
}) {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (tableRef.current) {
      const rows = tableRef.current.querySelectorAll('tbody tr');
      gsap.fromTo(
        rows,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.03, ease: 'power2.out' },
      );
    }
  }, [data]);

  return (
    <div className="db-table-wrap">
      <table className="db-table" ref={tableRef}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="db-table__empty">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={String(col.key)}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
}) {
  return <span className={`db-badge db-badge--${variant}`}>{children}</span>;
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: DashboardData }) {
  const members = data.profiles.filter((p) => p.is_member).length;
  const freeTracks = data.tracks.filter((t) => t.is_free).length;
  const paidTracks = data.tracks.length - freeTracks;

  const byDecade = Object.entries(
    groupBy(
      data.tracks.filter((t) => t.decade),
      (t) => t.decade || 'Unknown',
    ),
  )
    .map(([label, tracks]) => ({ label, value: tracks.length }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const genreCount = data.genres.map((g) => ({
    label: g.name,
    value: data.tracks.filter(
      (t) => t.track_genres?.some((tg) => tg.genre?.id === g.id),
    ).length,
    color: 'var(--color-blue)',
  })).sort((a, b) => b.value - a.value);

  const moodCount = data.moods.map((m) => ({
    label: m.name,
    value: data.tracks.filter(
      (t) => t.track_moods?.some((tm) => tm.mood?.id === m.id),
    ).length,
    color: 'var(--color-pink)',
  })).sort((a, b) => b.value - a.value);

  const countryCount = Object.entries(
    groupBy(
      data.artists.filter((a) => a.country),
      (a) => a.country || 'Unknown',
    ),
  )
    .map(([label, artists]) => ({
      label,
      value: artists.length,
      color: 'var(--color-green)',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const subTypes = Object.entries(
    groupBy(
      data.profiles.filter((p) => p.is_member && p.subscription_type),
      (p) => p.subscription_type || 'unknown',
    ),
  ).map(([label, profiles]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value: profiles.length,
  }));

  return (
    <div className="db-overview">
      {/* Stat row */}
      <div className="db-stats">
        <StatCard
          label="Total Users"
          value={data.profiles.length}
          icon="👤"
          color="var(--color-yellow)"
        />
        <StatCard
          label="Members"
          value={members}
          sub={`${data.profiles.length ? Math.round((members / data.profiles.length) * 100) : 0}% of users`}
          icon="⭐"
          color="var(--color-yellow)"
        />
        <StatCard
          label="Tracks"
          value={data.tracks.length}
          sub={`${freeTracks} free · ${paidTracks} paid`}
          icon="🎵"
          color="var(--color-blue)"
        />
        <StatCard
          label="Artists"
          value={data.artists.length}
          icon="🎤"
          color="var(--color-green)"
        />
        <StatCard
          label="Genres"
          value={data.genres.length}
          icon="🎼"
          color="var(--color-pink)"
        />
        <StatCard
          label="Moods"
          value={data.moods.length}
          icon="✨"
          color="var(--color-pink)"
        />
        <StatCard
          label="Selections"
          value={data.selections.length}
          icon="📋"
          color="var(--color-blue)"
        />
      </div>

      {/* Charts row 1 */}
      <div className="db-charts-row">
        <DonutChart
          title="Members vs Free Users"
          segments={[
            { label: 'Members', value: members, color: 'var(--color-yellow)' },
            {
              label: 'Free',
              value: data.profiles.length - members,
              color: 'rgba(255,255,255,0.15)',
            },
          ]}
        />
        <DonutChart
          title="Free vs Paid Tracks"
          segments={[
            { label: 'Free', value: freeTracks, color: 'var(--color-green)' },
            { label: 'Paid', value: paidTracks, color: 'var(--color-blue)' },
          ]}
        />
        {subTypes.length > 0 && (
          <DonutChart
            title="Subscription Types"
            segments={subTypes.map((s, i) => ({
              ...s,
              color:
                i === 0
                  ? 'var(--color-yellow)'
                  : i === 1
                    ? 'var(--color-blue)'
                    : 'var(--color-pink)',
            }))}
          />
        )}
      </div>

      {/* Charts row 2 */}
      <div className="db-charts-row db-charts-row--wide">
        {byDecade.length > 0 && (
          <BarChart
            title="Tracks by Decade"
            data={byDecade.map((d) => ({
              ...d,
              color: 'var(--color-yellow)',
            }))}
          />
        )}
        {countryCount.length > 0 && (
          <HBarChart title="Artists by Country" data={countryCount} />
        )}
      </div>

      {/* Charts row 3 */}
      <div className="db-charts-row db-charts-row--wide">
        {genreCount.length > 0 && (
          <HBarChart title="Top Genres (by track count)" data={genreCount} />
        )}
        {moodCount.length > 0 && (
          <HBarChart title="Top Moods (by track count)" data={moodCount} />
        )}
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ profiles }: { profiles: Profile[] }) {
  const [filter, setFilter] = useState<'all' | 'members' | 'free'>('all');
  const [search, setSearch] = useState('');

  const filtered = profiles.filter((p) => {
    if (filter === 'members' && !p.is_member) return false;
    if (filter === 'free' && p.is_member) return false;
    const q = search.toLowerCase();
    if (q && !p.username?.toLowerCase().includes(q) && !p.email?.toLowerCase().includes(q))
      return false;
    return true;
  });

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (r: DashboardUser) => (
        <div className="db-table__user-cell">
          <span className="db-table__name">{r.email}</span>
          {r.username && <span className="db-table__sub">@{r.username}</span>}
        </div>
      ),
    },
    {
      key: 'is_member',
      label: 'Status',
      render: (r: DashboardUser) =>
        r.is_member ? (
          <Badge variant="success">Member</Badge>
        ) : (
          <Badge variant="default">Free</Badge>
        ),
    },
    {
      key: 'subscription_type',
      label: 'Plan',
      render: (r: DashboardUser) =>
        r.subscription_type ? (
          <Badge variant="info">
            {r.subscription_type.charAt(0).toUpperCase() + r.subscription_type.slice(1)}
          </Badge>
        ) : (
          <span className="db-table__muted">—</span>
        ),
    },
    {
      key: 'subscription_expires_at',
      label: 'Subscription',
      render: (r: DashboardUser) => {
        if (!r.subscription_expires_at)
          return <span className="db-table__muted">—</span>;
        const expired = new Date(r.subscription_expires_at) < new Date();
        return (
          <div>
            <Badge variant={expired ? 'danger' : 'success'}>
              {expired ? 'Expired' : 'Active'}
            </Badge>
            <span className="db-table__sub">{formatDate(r.subscription_expires_at)}</span>
          </div>
        );
      },
    },
    {
      key: 'email_confirmed_at',
      label: 'Verified',
      render: (r: DashboardUser) =>
        r.email_confirmed_at ? (
          <Badge variant="success">✓</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        ),
    },
    {
      key: 'last_sign_in_at',
      label: 'Last Login',
      render: (r: DashboardUser) => (
        <span className="db-table__muted">{formatDate(r.last_sign_in_at)}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (r: DashboardUser) => (
        <span className="db-table__muted">{formatDate(r.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="db-tab-content">
      <div className="db-tab-header">
        <h2 className="db-tab-header__title">
          Users <span className="db-tab-header__count">{filtered.length}</span>
        </h2>
        <div className="db-tab-header__controls">
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="db-search"
          />
          <div className="db-filter-group">
            {(['all', 'members', 'free'] as const).map((f) => (
              <button
                key={f}
                className={`db-filter-btn ${filter === f ? 'db-filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        emptyMsg={
          profiles.length === 0
            ? 'No profiles available (check Supabase RLS policies)'
            : 'No users match the current filter'
        }
      />
    </div>
  );
}

// ── Tracks Tab ────────────────────────────────────────────────────────────────
function TracksTab({ tracks }: { tracks: Track[] }) {
  const [search, setSearch] = useState('');
  const [filterFree, setFilterFree] = useState<'all' | 'free' | 'paid'>('all');

  const filtered = tracks.filter((t) => {
    if (filterFree === 'free' && !t.is_free) return false;
    if (filterFree === 'paid' && t.is_free) return false;
    const q = search.toLowerCase();
    if (
      q &&
      !t.title.toLowerCase().includes(q) &&
      !t.artist?.name?.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (r: Track) => <span className="db-table__name">{r.title}</span>,
    },
    {
      key: 'artist',
      label: 'Artist',
      render: (r: Track) => (
        <span className="db-table__muted">{r.artist?.name || '—'}</span>
      ),
    },
    {
      key: 'year',
      label: 'Year',
      render: (r: Track) => (
        <span className="db-table__muted">{r.year || r.decade || '—'}</span>
      ),
    },
    {
      key: 'country',
      label: 'Country',
      render: (r: Track) => (
        <span className="db-table__muted">{r.country || '—'}</span>
      ),
    },
    {
      key: 'is_free',
      label: 'Access',
      render: (r: Track) =>
        r.is_free ? (
          <Badge variant="success">Free</Badge>
        ) : (
          <Badge variant="warning">Members</Badge>
        ),
    },
    {
      key: 'genres',
      label: 'Genres',
      render: (r: Track) => (
        <div className="db-tag-list">
          {(r.track_genres || []).slice(0, 3).map((tg, i) => (
            <span key={i} className="db-tag">
              {tg.genre?.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'moods',
      label: 'Moods',
      render: (r: Track) => (
        <div className="db-tag-list">
          {(r.track_moods || []).slice(0, 3).map((tm, i) => (
            <span key={i} className="db-tag db-tag--mood">
              {tm.mood?.name}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="db-tab-content">
      <div className="db-tab-header">
        <h2 className="db-tab-header__title">
          Tracks <span className="db-tab-header__count">{filtered.length}</span>
        </h2>
        <div className="db-tab-header__controls">
          <input
            type="search"
            placeholder="Search tracks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="db-search"
          />
          <div className="db-filter-group">
            {(['all', 'free', 'paid'] as const).map((f) => (
              <button
                key={f}
                className={`db-filter-btn ${filterFree === f ? 'db-filter-btn--active' : ''}`}
                onClick={() => setFilterFree(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        emptyMsg="No tracks found"
      />
    </div>
  );
}

// ── Artists Tab ───────────────────────────────────────────────────────────────
function ArtistsTab({
  artists,
  tracks,
}: {
  artists: Artist[];
  tracks: Track[];
}) {
  const [search, setSearch] = useState('');

  const enriched = artists
    .map((a) => ({
      ...a,
      trackCount: tracks.filter((t) => t.artist_id === a.id || t.artist?.id === a.id).length,
    }))
    .sort((a, b) => b.trackCount - a.trackCount);

  const filtered = enriched.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (r: Artist & { trackCount: number }) => <span className="db-table__name">{r.name}</span>,
    },
    {
      key: 'country',
      label: 'Country',
      render: (r: Artist & { trackCount: number }) => (
        <span className="db-table__muted">{r.country || '—'}</span>
      ),
    },
    {
      key: 'trackCount',
      label: 'Tracks',
      render: (r: Artist & { trackCount: number }) => (
        <Badge variant={r.trackCount > 0 ? 'info' : 'default'}>{r.trackCount}</Badge>
      ),
    },
    {
      key: 'bio',
      label: 'Bio',
      render: (r: Artist & { trackCount: number }) => (
        <span className="db-table__excerpt">
          {r.bio ? r.bio.slice(0, 80) + (r.bio.length > 80 ? '…' : '') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="db-tab-content">
      <div className="db-tab-header">
        <h2 className="db-tab-header__title">
          Artists <span className="db-tab-header__count">{filtered.length}</span>
        </h2>
        <div className="db-tab-header__controls">
          <input
            type="search"
            placeholder="Search artists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="db-search"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        emptyMsg="No artists found"
      />
    </div>
  );
}

// ── Tags Tab (Genres + Moods) ─────────────────────────────────────────────────
function TagsTab({
  genres,
  moods,
  tracks,
}: {
  genres: Genre[];
  moods: Mood[];
  tracks: Track[];
}) {
  const genresWithCount = genres
    .map((g) => ({
      ...g,
      count: tracks.filter((t) => t.track_genres?.some((tg) => tg.genre?.id === g.id)).length,
    }))
    .sort((a, b) => b.count - a.count);

  const moodsWithCount = moods
    .map((m) => ({
      ...m,
      count: tracks.filter((t) => t.track_moods?.some((tm) => tm.mood?.id === m.id)).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="db-tab-content">
      <div className="db-tab-header">
        <h2 className="db-tab-header__title">Tags</h2>
      </div>
      <div className="db-tags-layout">
        <div className="db-tags-col">
          <h3 className="db-tags-col__title">
            Genres <span className="db-tab-header__count">{genres.length}</span>
          </h3>
          <div className="db-tags-grid">
            {genresWithCount.map((g) => (
              <div key={g.id} className="db-tag-card">
                <span className="db-tag-card__name">{g.name}</span>
                <span className="db-tag-card__count">{g.count} tracks</span>
                <div
                  className="db-tag-card__bar"
                  style={{
                    width: `${genresWithCount[0]?.count ? (g.count / genresWithCount[0].count) * 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="db-tags-col">
          <h3 className="db-tags-col__title">
            Moods <span className="db-tab-header__count">{moods.length}</span>
          </h3>
          <div className="db-tags-grid">
            {moodsWithCount.map((m) => (
              <div key={m.id} className="db-tag-card db-tag-card--mood">
                <span className="db-tag-card__name">{m.name}</span>
                <span className="db-tag-card__count">{m.count} tracks</span>
                <div
                  className="db-tag-card__bar"
                  style={{
                    width: `${moodsWithCount[0]?.count ? (m.count / moodsWithCount[0].count) * 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Selections Tab ────────────────────────────────────────────────────────────
function SelectionsTab({ selections }: { selections: Selections[] }) {
  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (r: Selections) => <span className="db-table__name">{r.title}</span>,
    },
    {
      key: 'week_number',
      label: 'Week',
      render: (r: Selections) => (
        <span className="db-table__muted">
          #{r.week_number} / {r.year}
        </span>
      ),
    },
    {
      key: 'is_published',
      label: 'Status',
      render: (r: Selections) =>
        r.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="warning">Draft</Badge>
        ),
    },
    {
      key: 'track_count',
      label: 'Tracks',
      render: (r: Selections) => (
        <Badge variant="info">{r.selection_tracks?.length ?? 0}</Badge>
      ),
    },
    {
      key: 'published_at',
      label: 'Published At',
      render: (r: Selections) => (
        <span className="db-table__muted">{formatDate(r.published_at)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (r: Selections) => (
        <span className="db-table__excerpt">
          {r.description
            ? r.description.slice(0, 60) + (r.description.length > 60 ? '…' : '')
            : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="db-tab-content">
      <div className="db-tab-header">
        <h2 className="db-tab-header__title">
          Selections{' '}
          <span className="db-tab-header__count">{selections.length}</span>
        </h2>
      </div>
      <DataTable
        columns={columns}
        data={selections}
        emptyMsg="No selections found"
      />
    </div>
  );
}

// ── Dashboard Main ────────────────────────────────────────────────────────────
function DashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [data, setData] = useState<DashboardData>({
    profiles: [],
    tracks: [],
    artists: [],
    genres: [],
    moods: [],
    selections: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tracks, artists, genres, moods, selections] = await Promise.all([
        fetchTracks(),
        fetchArtists(),
        fetchGenres(),
        fetchMoods(),
        fetchSelections(),
      ]);

      // Fetch ALL users via admin API (requires service_role key to bypass RLS)
      let users: DashboardUser[] = [];
      try {
        // Try admin.listUsers() first — returns full auth.users data
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

        if (authError) throw authError;

        // Also fetch profiles table for subscription metadata
        const { data: profileRows } = await supabaseAdmin
          .from('profiles')
          .select('id, username, is_member, subscription_type, subscription_expires_at, member_since');

        const profileMap: Record<string, Record<string, unknown>> = {};
        (profileRows || []).forEach((p: Record<string, unknown>) => {
          if (typeof p.id === 'string') profileMap[p.id] = p;
        });

        users = authData.users.map((u) => {
          const meta = u.user_metadata || {};
          const prof = profileMap[u.id] || {};
          return {
            id: u.id,
            email: u.email || '',
            email_confirmed_at: u.email_confirmed_at ?? undefined,
            last_sign_in_at: u.last_sign_in_at ?? undefined,
            created_at: u.created_at,
            username: (prof.username as string) || (meta.username as string) || undefined,
            is_member:
              (prof.is_member as boolean) ?? (meta.is_member as boolean) ?? false,
            subscription_type:
              (prof.subscription_type as string) ||
              (meta.subscription_type as string) ||
              undefined,
            subscription_expires_at:
              (prof.subscription_expires_at as string) ||
              (meta.subscription_expires_at as string) ||
              undefined,
            member_since:
              (prof.member_since as string) || (meta.member_since as string) || undefined,
          };
        });
      } catch (e) {
        console.warn('Admin user fetch failed — falling back to profiles table:', e);
        // Fallback: query profiles directly (works if RLS allows it)
        const { data: profilesData } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        users = (profilesData as DashboardUser[]) || [];
      }

      setData({
        profiles: users,
        tracks,
        artists,
        genres,
        moods,
        selections,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
      );
    }
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.15 },
      );
    }
  }, []);

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'users', label: 'Users', icon: '◉' },
    { id: 'tracks', label: 'Tracks', icon: '▶' },
    { id: 'artists', label: 'Artists', icon: '♪' },
    { id: 'tags', label: 'Tags', icon: '◇' },
    { id: 'selections', label: 'Selections', icon: '◐' },
  ];

  function renderContent() {
    if (loading) {
      return (
        <div className="db-loading">
          <div className="db-loading__spinner" />
          <p>Loading data…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="db-error">
          <p>⚠ {error}</p>
          <button onClick={loadData} className="db-error__retry">
            Retry
          </button>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={data} />;
      case 'users':
        return <UsersTab profiles={data.profiles} />;
      case 'tracks':
        return <TracksTab tracks={data.tracks} />;
      case 'artists':
        return <ArtistsTab artists={data.artists} tracks={data.tracks} />;
      case 'tags':
        return <TagsTab genres={data.genres} moods={data.moods} tracks={data.tracks} />;
      case 'selections':
        return <SelectionsTab selections={data.selections} />;
    }
  }

  return (
    <div className="db-layout">
      <aside className="db-sidebar" ref={sidebarRef}>
        <div className="db-sidebar__brand">
          <div className="db-sidebar__logo">M</div>
          <div>
            <div className="db-sidebar__title">Mattdigging</div>
            <div className="db-sidebar__subtitle">Dashboard</div>
          </div>
        </div>

        <nav className="db-sidebar__nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`db-nav-btn ${activeTab === tab.id ? 'db-nav-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="db-nav-btn__icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && <span className="db-nav-btn__dot" />}
            </button>
          ))}
        </nav>

        <div className="db-sidebar__footer">
          <div className="db-sidebar__footer-stat">
            <span className="db-sidebar__footer-num">{data.tracks.length}</span>
            <span>tracks</span>
          </div>
          <div className="db-sidebar__footer-stat">
            <span className="db-sidebar__footer-num">{data.artists.length}</span>
            <span>artists</span>
          </div>
          <button
            className="db-sidebar__refresh"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? '…' : '↻'} Refresh
          </button>
          <button
            className="db-sidebar__logout"
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              window.location.reload();
            }}
          >
            ✕ Lock
          </button>
        </div>
      </aside>

      <main className="db-main" ref={mainRef}>
        {renderContent()}
      </main>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true',
  );

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <DashboardContent />;
}
