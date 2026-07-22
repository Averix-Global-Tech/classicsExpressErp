import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, CalendarCheck, Package, Activity,
  TrendingUp, Trophy, ClipboardList, Bell,
  UserPlus, PackagePlus, CheckSquare, MessageSquareWarning,
  CalendarDays, ChevronRight, Clock, RefreshCw,
  AlertCircle, Wifi, BarChart3, Mail, Zap,
  Building2, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { Card, CardHeader, CardBody, Badge, Skeleton } from '../components/ui';
import { cn } from '../utils/cn';
import dashboardService from '../services/dashboardService';

// ── Utility helpers ────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatLastLogin(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatBookingTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatActivityTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Rank medal helper ──────────────────────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/40 dark:to-amber-900/20 dark:border-amber-800',
  'from-slate-50 to-slate-100 border-slate-200 dark:from-slate-800/40 dark:to-slate-700/20 dark:border-slate-600',
  'from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/40 dark:to-orange-900/20 dark:border-orange-800',
];

// ── Status badge config ────────────────────────────────────────────────────────
function ShipmentStatusBadge({ status }) {
  const cfg = {
    'Booked':                   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Pickup Scheduled':         'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Picked Up':                'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'At Origin Hub':            'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Export Customs':           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'In Transit':               'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Arrived Destination Country': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    'Import Customs':           'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    'Out For Delivery':         'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Delivered':                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Returned':                 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'Cancelled':                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    'Lost':                     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', cfg[status] || cfg['Booked'])}>
      {status}
    </span>
  );
}

// ── Donut chart custom label ───────────────────────────────────────────────────
function DonutCenterLabel({ cx, cy, value, label }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" fontSize="24" fontWeight="700" fill="currentColor">{value}</tspan>
      <tspan x={cx} dy="1.6em" fontSize="11" fill="#94a3b8">{label}</tspan>
    </text>
  );
}

// ── Activity icon map ─────────────────────────────────────────────────────────
function activityIcon(module) {
  const map = {
    auth: { icon: '🔐', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    employee: { icon: '👤', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    shipment: { icon: '📦', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
    attendance: { icon: '📋', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
    leave: { icon: '🏖️', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' },
    grievance: { icon: '⚠️', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300' },
    productivity: { icon: '⚡', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' },
    task: { icon: '✅', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300' },
  };
  return map[module] || { icon: '🔔', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };
}

// ── Skeleton shimmer card ──────────────────────────────────────────────────────
function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('card p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-3/4" />
      ))}
    </div>
  );
}

// ── Framer stagger container ───────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Component
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth();
  const { refreshNotifications } = useOutletContext();
  const now = useLiveClock();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendRange, setTrendRange] = useState(30); // 7 | 30 | 90 — 90 uses 30d data sliced differently

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardService.getSummary();
      setData(summary);
      refreshNotifications?.();
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => { load(); }, [load]);

  // Filtered trend data by range
  const trendData = data?.trend
    ? trendRange === 7
      ? data.trend.slice(-7)
      : trendRange === 90
      ? data.trend // only 30 days available; show all with label
      : data.trend
    : [];

  const stats = data?.stats;
  const totalAttended = (stats?.attendance?.present ?? 0) + (stats?.attendance?.late ?? 0);
  const attendancePct = stats?.attendance?.pct ?? 0;

  const donutData = [
    { name: 'Present', value: stats?.attendance?.present ?? 0, color: '#10b981' },
    { name: 'Late',    value: stats?.attendance?.late    ?? 0, color: '#f59e0b' },
    { name: 'Leave',   value: stats?.attendance?.leave   ?? 0, color: '#6366f1' },
    { name: 'Absent',  value: stats?.attendance?.absent  ?? 0, color: '#f43f5e' },
  ];

  // ── Error state ─────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="text-rose-500" size={48} />
        <div>
          <p className="text-lg font-semibold text-[var(--fg)]">Could not load dashboard</p>
          <p className="text-sm text-[var(--fg-muted)] mt-1">{error}</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — Welcome Header
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-7 md:px-8 md:py-8 shadow-lg"
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-40 w-40 rounded-full bg-orange-500/20" />
        <div className="pointer-events-none absolute bottom-4 right-8 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left — Greeting */}
          <div>
            <p className="text-sm font-medium text-blue-200 uppercase tracking-widest mb-1">
              {getGreeting()} 👋
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {user?.name || 'System Administrator'}
            </h1>
            <p className="mt-2 text-blue-200 text-sm max-w-md">
              Here's what's happening across <span className="font-semibold text-white">Classic Express ERP</span> today.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Online
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-200">
                System Administrator
              </span>
            </div>
          </div>

          {/* Right — Date / Time / Last Login */}
          <div className="flex flex-col gap-3 sm:items-end shrink-0">
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-white tabular-nums">
                {formatTime(now)}
              </p>
              <p className="text-sm text-blue-200 mt-0.5">{formatDate(now)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-300">
              <Clock size={12} />
              <span>Last login: {formatLastLogin(user?.lastLoginAt)}</span>
            </div>
            <button
              onClick={load}
              title="Refresh dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 text-xs font-medium text-white"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — Quick Stats Cards
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* Card 1 — Total Employees */}
        <motion.div variants={item}>
          {loading ? <SkeletonCard lines={4} /> : (
            <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)]">Employees</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--fg)]">{stats?.employees?.total ?? 0}</p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Total headcount</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Users size={22} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {stats?.employees?.active ?? 0} Active
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {stats?.employees?.inactive ?? 0} Inactive
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 2 — Today's Attendance */}
        <motion.div variants={item}>
          {loading ? <SkeletonCard lines={4} /> : (
            <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)]">Today's Attendance</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--fg)]">{attendancePct}%</p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">{totalAttended} of {stats?.attendance?.total ?? 0} marked</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CalendarCheck size={22} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Present', val: stats?.attendance?.present, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Late',    val: stats?.attendance?.late,    color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Absent',  val: stats?.attendance?.absent,  color: 'text-rose-600 dark:text-rose-400' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center rounded-lg bg-[var(--surface)] p-2">
                    <p className={cn('text-lg font-bold', color)}>{val ?? 0}</p>
                    <p className="text-[10px] text-[var(--fg-subtle)] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 3 — Today's Shipments */}
        <motion.div variants={item}>
          {loading ? <SkeletonCard lines={4} /> : (
            <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)]">Today's Shipments</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--fg)]">{stats?.shipments?.booked ?? 0}</p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Booked today</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  <Package size={22} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <TrendingUp size={10} />
                  {stats?.shipments?.inTransit ?? 0} In-Transit
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  ✓ {stats?.shipments?.delivered ?? 0} Delivered
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 4 — Today's Productivity */}
        <motion.div variants={item}>
          {loading ? <SkeletonCard lines={4} /> : (
            <div className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)]">Today's Productivity</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--fg)]">
                    {(stats?.productivity?.awbs ?? 0) + (stats?.productivity?.emails ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Total tasks completed</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                  <Activity size={22} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'AWBs',   val: stats?.productivity?.awbs,   icon: '📦' },
                  { label: 'Emails', val: stats?.productivity?.emails, icon: '✉️' },
                ].map(({ label, val, icon }) => (
                  <div key={label} className="rounded-lg bg-[var(--surface)] p-2 text-center">
                    <p className="text-lg font-bold text-[var(--fg)]">{icon} {val ?? 0}</p>
                    <p className="text-[10px] text-[var(--fg-subtle)] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — Shipment Analytics (Line Chart)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="overflow-visible" style={{ padding: 0 }}>
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
                  <BarChart3 size={18} className="text-orange-500" />
                  Shipment Analytics
                </h2>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">Daily booking &amp; delivery trend</p>
              </div>
              {/* Period toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-[var(--surface)] p-1">
                {[7, 30].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                      trendRange === r
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 px-2 pt-4 pb-2 sm:h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--fg-subtle)] gap-2">
                <Package size={32} className="opacity-30" />
                <p className="text-sm">No shipment data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--fg-subtle)' }}
                    tickLine={false}
                    axisLine={false}
                    interval={trendRange === 7 ? 0 : Math.floor(trendData.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--fg-subtle)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'var(--fg)', fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="booked"
                    name="Booked"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    name="Delivered"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 pb-4">
            {[{ color: '#3b82f6', label: 'Booked' }, { color: '#10b981', label: 'Delivered' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-[var(--fg-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTIONS 4 + 5 — Top Employees + Attendance Donut (side by side)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Section 4 — Top 5 Employees (2/3 width) */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <Card style={{ padding: 0 }}>
            <div className="p-5 sm:p-6 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  Top 5 Employees — Today
                </h2>
                <Link to="/productivity/admin" className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors">
                  View all <ChevronRight size={13} />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 px-5 pb-5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : !data?.topEmployees?.length ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-[var(--fg-subtle)] gap-2">
                <Trophy size={32} className="opacity-20" />
                <p className="text-sm">No productivity data recorded today yet</p>
              </div>
            ) : (
              <div className="px-4 pb-5 space-y-2">
                {data.topEmployees.map((emp, idx) => (
                  <div
                    key={emp._id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 transition-shadow hover:shadow-sm',
                      idx < 3 ? RANK_COLORS[idx] : 'from-[var(--surface)] to-[var(--surface)] border-[var(--border)]'
                    )}
                  >
                    {/* Rank */}
                    <span className="text-xl shrink-0 w-7 text-center">
                      {idx < 3 ? MEDALS[idx] : <span className="text-sm font-bold text-[var(--fg-subtle)]">#{idx + 1}</span>}
                    </span>

                    {/* Avatar */}
                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + dept */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--fg)] truncate">{emp.name}</p>
                      <p className="text-xs text-[var(--fg-subtle)] truncate">{emp.department}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{emp.awbs}</p>
                        <p className="text-[10px] text-[var(--fg-subtle)]">AWBs</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{emp.emails}</p>
                        <p className="text-[10px] text-[var(--fg-subtle)]">Emails</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{emp.score}%</p>
                        <p className="text-[10px] text-[var(--fg-subtle)]">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Section 5 — Attendance Overview Donut (1/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          <Card style={{ padding: 0 }} className="h-full">
            <div className="p-5 sm:p-6 pb-0">
              <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
                <CalendarCheck size={18} className="text-emerald-500" />
                Attendance Overview
              </h2>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">Today's breakdown</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 px-5">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : (
              <>
                {/* Donut */}
                <div className="relative h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--fg)]">{attendancePct}%</span>
                    <span className="text-[10px] text-[var(--fg-subtle)]">Attendance</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 px-5 pb-5">
                  {donutData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] p-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg)] truncate">{value}</p>
                        <p className="text-[10px] text-[var(--fg-subtle)]">{name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — Top 5 Shipments Today
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
        <Card style={{ padding: 0 }}>
          <div className="p-5 sm:p-6 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
              <Package size={18} className="text-orange-500" />
              Today's Latest Shipments
            </h2>
            <Link to="/shipment" className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2 px-5 pb-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : !data?.recentShipments?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--fg-subtle)] gap-2">
              <Package size={32} className="opacity-20" />
              <p className="text-sm">No shipments booked today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    {['AWB Number', 'Party Name', 'Destination', 'Status', 'Employee', 'Time'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.recentShipments.map((s) => (
                    <tr
                      key={s._id}
                      onClick={() => navigate(`/shipment/${s._id}`)}
                      className="group cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 whitespace-nowrap">
                        {s.awbNumber}
                      </td>
                      <td className="px-5 py-3 text-[var(--fg)] truncate max-w-[120px]">
                        {s.sender?.name || '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--fg-muted)] whitespace-nowrap">
                        {s.destinationCountry || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <ShipmentStatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3 text-[var(--fg-muted)] whitespace-nowrap">
                        {s.bookedBy?.name || '—'}
                      </td>
                      <td className="px-5 py-3 text-[var(--fg-subtle)] whitespace-nowrap text-xs">
                        {formatBookingTime(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTIONS 7 + 8 — Activity Feed + Quick Actions (side by side)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Section 7 — Employee Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card style={{ padding: 0 }} className="h-full">
            <div className="p-5 sm:p-6 pb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
                <Zap size={18} className="text-violet-500" />
                Activity Feed
              </h2>
              <span className="text-xs text-[var(--fg-subtle)] bg-[var(--surface)] rounded-full px-2.5 py-1">Live</span>
            </div>

            <div className="px-5 pb-5 space-y-1 max-h-72 overflow-y-auto">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : !data?.activityFeed?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--fg-subtle)] gap-2">
                  <Bell size={28} className="opacity-20" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                data.activityFeed.map((entry, idx) => {
                  const { icon, color } = activityIcon(entry.module);
                  return (
                    <div key={entry._id || idx} className="flex items-start gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                      <div className={cn('h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm', color)}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--fg)] truncate">{entry.summary || entry.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-[var(--fg-subtle)]">{entry.userEmail}</p>
                          <span className="text-[var(--fg-subtle)]">·</span>
                          <p className="text-xs text-[var(--fg-subtle)]">{formatActivityTime(entry.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Section 8 — Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }}>
          <Card style={{ padding: 0 }} className="h-full">
            <div className="p-5 sm:p-6 pb-3">
              <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
                <ClipboardList size={18} className="text-blue-500" />
                Quick Actions
              </h2>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">One-click navigation</p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {[
                { label: 'Create Employee',    icon: UserPlus,            to: '/employees',          color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
                { label: 'Book Shipment',      icon: PackagePlus,         to: '/shipment',           color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400' },
                { label: 'Approve Attendance', icon: CheckSquare,         to: '/attendance',         color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
                { label: 'View Grievances',    icon: MessageSquareWarning, to: '/grievance',          color: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' },
                { label: 'Leave Requests',     icon: CalendarDays,        to: '/leave',              color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400' },
                { label: 'Productivity',       icon: Star,                to: '/productivity/admin', color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
              ].map(({ label, icon: Icon, to, color }) => (
                <Link
                  key={label}
                  to={to}
                  className="group flex flex-col items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200 dark:hover:border-orange-800"
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110', color)}>
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--fg)] leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 9 — Business Insights
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Business Insights
          </h2>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Today's Revenue",
              value: '— (Soon)',
              icon: '💰',
              color: 'border-l-emerald-400',
              sub: 'Finance module',
              muted: true,
            },
            {
              label: 'Pending Shipments',
              value: stats?.shipments?.inTransit ?? 0,
              icon: '🚚',
              color: 'border-l-amber-400',
              sub: 'In transit now',
            },
            {
              label: 'Pending Attendance',
              value: data?.pendingCounts?.attendanceApprovals ?? 0,
              icon: '📋',
              color: 'border-l-blue-400',
              sub: 'Awaiting approval',
            },
            {
              label: 'Pending Leaves',
              value: data?.pendingCounts?.leaveRequests ?? 0,
              icon: '🏖️',
              color: 'border-l-violet-400',
              sub: 'Requires action',
            },
            {
              label: 'Open Grievances',
              value: data?.pendingCounts?.grievances ?? 0,
              icon: '⚠️',
              color: 'border-l-rose-400',
              sub: 'Not resolved',
            },
            {
              label: 'Employees Online',
              value: data?.pendingCounts?.employeesOnline ?? 0,
              icon: '🟢',
              color: 'border-l-teal-400',
              sub: 'Last 8 hours',
            },
          ].map(({ label, value, icon, color, sub, muted }) => (
            <div
              key={label}
              className={cn(
                'card p-4 border-l-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
                color
              )}
            >
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <p className={cn('text-xl font-bold', muted ? 'text-[var(--fg-muted)] text-sm' : 'text-[var(--fg)]')}>
                      {value}
                    </p>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[var(--fg)] leading-tight">{label}</p>
                  <p className="text-[10px] text-[var(--fg-subtle)] mt-0.5">{sub}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 10 — Recent Notifications
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card style={{ padding: 0 }}>
          <div className="p-5 sm:p-6 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fg)] flex items-center gap-2">
              <Bell size={18} className="text-blue-500" />
              Recent Notifications
              {data?.notifications?.unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {data.notifications.unreadCount}
                </span>
              )}
            </h2>
          </div>

          <div className="px-5 pb-5 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-16 shrink-0" />
                </div>
              ))
            ) : !data?.notifications?.items?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--fg-subtle)] gap-2">
                <Bell size={28} className="opacity-20" />
                <p className="text-sm">No recent notifications</p>
              </div>
            ) : (
              data.notifications.items.map((n, idx) => {
                const { icon } = activityIcon(n.type?.toLowerCase());
                return (
                  <div
                    key={n._id || idx}
                    className={cn(
                      'flex items-start gap-3 rounded-xl p-3 transition-colors',
                      !n.read ? 'bg-orange-50/60 dark:bg-orange-950/20' : 'hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <div className={cn(
                      'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm',
                      !n.read ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-[var(--surface)] border border-[var(--border)]'
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm truncate', !n.read ? 'font-semibold text-[var(--fg)]' : 'text-[var(--fg)]')}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-[var(--fg-muted)] mt-0.5 truncate">{n.body}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] text-[var(--fg-subtle)] whitespace-nowrap">
                        {formatActivityTime(n.createdAt)}
                      </span>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

    </div>
  );
}
