import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Plus,
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "../../components/StatCard";

/* ---------- helpers ---------- */
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const genSeries = (n, base, amp, seed, labelFn, spike) => {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const wave = Math.sin(i / 2.2) * amp * 0.5;
    const cur = base + wave + r() * amp;
    const prev = base * 0.9 + Math.cos(i / 2.6) * amp * 0.5 + r() * amp;
    return {
      day: labelFn(i),
      current: Math.round(i === n - 1 && spike ? spike : cur),
      previous: Math.round(prev),
    };
  });
};

const revenueByRange = {
  "7D": {
    total: "₹46,000",
    change: "+10.4%",
    cur: "Last 7 days",
    prev: "Previous 7 days",
    data: [
      { day: "Mon", current: 4200, previous: 3100 },
      { day: "Tue", current: 6100, previous: 4200 },
      { day: "Wed", current: 4800, previous: 5100 },
      { day: "Thu", current: 7900, previous: 4600 },
      { day: "Fri", current: 6500, previous: 5700 },
      { day: "Sat", current: 9200, previous: 6200 },
      { day: "Sun", current: 7300, previous: 5300 },
    ],
  },
  "30D": {
    total: "₹1,35,400",
    change: "+19.5%",
    cur: "Last 30 days",
    prev: "Previous 30 days",
    data: genSeries(30, 3400, 2600, 7, (i) => `${i + 1}`, 15200),
  },
  "12M": {
    total: "₹21,40,000",
    change: "+24.3%",
    cur: "Last 12 months",
    prev: "Previous 12 months",
    data: genSeries(
      12,
      160000,
      40000,
      11,
      (i) =>
        [
          "Dec",
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
        ][i],
    ),
  },
};

const stages = [
  { name: "Received", value: 12, color: "#b7add8" },
  { name: "Diagnosing", value: 8, color: "#5d8cf1" },
  { name: "Awaiting parts", value: 11, color: "#f3aa39" },
  { name: "In repair", value: 9, color: "#7654f5" },
  { name: "Ready", value: 7, color: "#2dbb87" },
];

const attention = [
  { id: "#1612", name: "Heena Rao", days: 9 },
  { id: "#1625", name: "Sandeep Kumar", days: 8 },
  { id: "#1620", name: "Chetan Jangra", days: 8 },
  { id: "#1617", name: "Sunil Kumar", days: 7 },
  { id: "#1613", name: "Geeta Chhikara", days: 5 },
];

const whatsapp = [
  {
    label: "Sent",
    value: 39,
    max: 39,
    bar: "bg-violet-600",
    track: "bg-violet-100",
  },
  {
    label: "Delivered",
    value: 37,
    max: 39,
    bar: "bg-violet-600",
    track: "bg-violet-100",
  },
  {
    label: "Read",
    value: 30,
    max: 39,
    bar: "bg-violet-600",
    track: "bg-violet-100",
  },
  {
    label: "Failed",
    value: 1,
    max: 39,
    bar: "bg-red-600",
    track: "bg-red-100",
    red: true,
  },
];

/* ---------- map data ---------- */
const MAP_W = 820;
const MAP_H = 765;
// Approximate district outline. Replace this array when a real GeoJSON path is available.
const OUTLINE = [
  [367, 170],
  [372, 145],
  [409, 130],
  [439, 100],
  [504, 80],
  [524, 105],
  [519, 150],
  [559, 160],
  [584, 195],
  [669, 225],
  [694, 240],
  [689, 290],
  [719, 325],
  [749, 415],
  [774, 480],
  [719, 535],
  [709, 583],
  [649, 545],
  [594, 550],
  [569, 535],
  [516, 520],
  [514, 560],
  [469, 585],
  [434, 610],
  [409, 635],
  [369, 650],
  [319, 640],
  [274, 610],
  [244, 585],
  [184, 583],
  [164, 555],
  [129, 535],
  [119, 495],
  [89, 485],
  [89, 435],
  [74, 425],
  [49, 360],
  [59, 335],
  [119, 255],
  [164, 220],
  [269, 195],
];
const OUTLINE_PATH = "M" + OUTLINE.map((p) => p.join(",")).join("L") + "Z";

const inside = (x, y) => {
  let c = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      c = !c;
  }
  return c;
};

const villages = [
  {
    name: "Hisar city",
    tehsil: "Hisar",
    c: 296,
    s: 323,
    r: 8.2,
    x: 335,
    y: 438,
    shop: true,
  },
  {
    name: "Nyoli Kalan",
    tehsil: "Hisar",
    c: 45,
    s: 54,
    r: 1.4,
    x: 300,
    y: 470,
  },
  { name: "Dabra", tehsil: "Hisar", c: 33, s: 33, r: 0.9, x: 361, y: 477 },
  { name: "Kaimri", tehsil: "Hisar", c: 30, s: 41, r: 1.1, x: 387, y: 453 },
  { name: "Chikanwas", tehsil: "Hisar", c: 27, s: 31, r: 0.8, x: 420, y: 500 },
  { name: "Dhiranwas", tehsil: "Hisar", c: 24, s: 28, r: 0.7, x: 246, y: 485 },
  {
    name: "Mangali Jhara",
    tehsil: "Hisar",
    c: 22,
    s: 26,
    r: 0.6,
    x: 319,
    y: 517,
  },
  { name: "Siswal", tehsil: "Hisar", c: 19, s: 22, r: 0.5, x: 290, y: 395 },
  { name: "Balsamand", tehsil: "Hisar", c: 17, s: 19, r: 0.5, x: 330, y: 380 },
  { name: "Mayyar", tehsil: "Hisar", c: 15, s: 17, r: 0.4, x: 240, y: 420 },
  { name: "Sisai", tehsil: "Hisar", c: 13, s: 15, r: 0.4, x: 450, y: 440 },
  { name: "Pabra", tehsil: "Hisar", c: 11, s: 12, r: 0.3, x: 470, y: 480 },
  { name: "Kinala", tehsil: "Hisar", c: 9, s: 10, r: 0.3, x: 380, y: 550 },
  { name: "Adampur", tehsil: "Adampur", c: 26, s: 30, r: 0.9, x: 230, y: 300 },
  {
    name: "Khanda Kheri",
    tehsil: "Adampur",
    c: 12,
    s: 14,
    r: 0.3,
    x: 190,
    y: 350,
  },
  { name: "Hansi", tehsil: "Hansi", c: 20, s: 25, r: 0.7, x: 560, y: 380 },
  {
    name: "Satrod Khurd",
    tehsil: "Hansi",
    c: 14,
    s: 16,
    r: 0.4,
    x: 600,
    y: 330,
  },
  { name: "Barwala", tehsil: "Barwala", c: 16, s: 18, r: 0.5, x: 470, y: 300 },
  {
    name: "Narnaund",
    tehsil: "Narnaund",
    c: 10,
    s: 11,
    r: 0.3,
    x: 620,
    y: 450,
  },
  { name: "Uklana", tehsil: "Uklana", c: 8, s: 9, r: 0.2, x: 330, y: 300 },
  { name: "Bass", tehsil: "Bass", c: 7, s: 8, r: 0.2, x: 420, y: 250 },
  { name: "Rawalwas", tehsil: "Hisar", c: 0, s: 0, r: 0, x: 200, y: 450 },
  { name: "Mirkan", tehsil: "Hansi", c: 0, s: 0, r: 0, x: 520, y: 430 },
  { name: "Dhansu", tehsil: "Narnaund", c: 0, s: 0, r: 0, x: 650, y: 380 },
];

const emptyDots = (() => {
  const r = rng(42);
  const pts = [];
  while (pts.length < 170) {
    const x = 50 + r() * 725;
    const y = 80 + r() * 570;
    if (inside(x, y)) pts.push([x, y]);
  }
  return pts;
})();

const TEHSILS = [
  "All tehsils",
  ...Array.from(new Set(villages.map((v) => v.tehsil))),
];
const METRICS = [
  { key: "c", label: "Customers", fmt: (v) => v },
  { key: "s", label: "Sales", fmt: (v) => `${v} jobs` },
  { key: "r", label: "Revenue", fmt: (v) => `₹${v} L` },
];

const dotColor = (t) => {
  // light violet -> deep violet
  const a = [196, 181, 253];
  const b = [91, 53, 214];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c.join(",")})`;
};

/* ---------- component ---------- */
export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30D");
  const [metric, setMetric] = useState("c");
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [tehsil, setTehsil] = useState("All tehsils");
  const [onlyWith, setOnlyWith] = useState(false);
  const [reminded, setReminded] = useState({});

  const rev = revenueByRange[range];
  const m = METRICS.find((x) => x.key === metric);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const maxVal = useMemo(
    () => Math.max(...villages.map((v) => v[metric])),
    [metric],
  );
  const maxNoShop = useMemo(
    () => Math.max(...villages.filter((v) => !v.shop).map((v) => v[metric])),
    [metric],
  );

  const list = useMemo(
    () =>
      villages
        .filter((v) => v.name.toLowerCase().includes(q.toLowerCase()))
        .filter((v) => tehsil === "All tehsils" || v.tehsil === tehsil)
        .filter((v) => !onlyWith || v.c > 0)
        .sort((a, b) => b[metric] - a[metric]),
    [q, tehsil, onlyWith, metric],
  );

  const active = hovered || selected;
  const activeV = villages.find((v) => v.name === active);

  const pieTotal = stages.reduce((a, s) => a + s.value, 0);

  return (
    <div className="dashboard-motion">
      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-3 lg:mb-6 lg:flex-row lg:items-start lg:gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[32px]">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {today}. Here is how the shop is doing.
          </p>
        </div>
        <div className="flex w-full flex-nowrap items-center gap-2 lg:w-auto lg:gap-3">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-violet-100 bg-white px-4 shadow-sm lg:h-auto lg:w-[300px] lg:flex-none lg:px-5 lg:py-3">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate("/jobs")}
              placeholder="Search job, name or phone"
              className="min-w-0 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <button aria-label="Notifications" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-slate-600 shadow-sm transition hover:bg-violet-50 lg:h-12 lg:w-12">
            <Bell size={18} />
          </button>
          <button
            onClick={() => navigate("/jobs")}
            className="hidden h-10 items-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 lg:flex"
          >
            <Plus size={18} /> New job
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard-stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Open Jobs"
          value="47"
          note="more than last week"
          change="+6"
          icon={Wrench}
          tone="violet"
        />
        <StatCard
          label="Ready for Pickup"
          value="9"
          note="waiting over 7 days"
          change="3"
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Overdue Jobs"
          value="6"
          note="fewer than last week"
          change="-2"
          icon={Clock3}
          tone="red"
        />
        <StatCard
          label="Collected Today"
          value="₹14,800"
          note="vs yesterday"
          change="+18%"
          icon={IndianRupee}
          tone="violet"
        />
      </div>

      {/* Revenue + Statistics */}
      <div className="dashboard-stagger mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_0.9fr]">
        <section className="dashboard-card rounded-[20px] border border-violet-100/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Revenue overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Money collected from customers
              </p>
            </div>
            <div className="flex rounded-full bg-[#f5f3fb] p-1">
              {["7D", "30D", "12M"].map((v) => (
                <button
                  key={v}
                  onClick={() => setRange(v)}
                  className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${range === v ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "text-slate-500 hover:text-violet-600"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <strong className="text-4xl font-bold tracking-tight text-slate-900">
              {rev.total}
            </strong>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {rev.change} vs previous{" "}
              {range === "30D"
                ? "30 days"
                : range === "7D"
                  ? "7 days"
                  : "12 months"}
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <i className="h-0.5 w-5 rounded bg-violet-600" /> {rev.cur}
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <i className="h-0 w-5 border-t-2 border-dashed border-slate-300" />{" "}
              {rev.prev}
            </span>
          </div>
          <div className="mt-4 h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={rev.data}
                margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7654f5" stopOpacity={0.2} />
                    <stop
                      offset="100%"
                      stopColor="#7654f5"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#eeeaf7"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#9994ae", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#9994ae", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 100000
                      ? `₹${(v / 100000).toFixed(1)}L`
                      : `₹${v / 1000}k`
                  }
                />
                <Tooltip
                  formatter={(v, n) => [
                    `₹${Number(v).toLocaleString("en-IN")}`,
                    n === "current" ? "Current" : "Previous",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #eeeaf7",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="previous"
                  stroke="#b9b2d2"
                  strokeDasharray="5 5"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#7654f5"
                  fill="url(#revFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-card rounded-[20px] border border-violet-100/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Statistics
              </h3>
              <p className="mt-1 text-sm text-slate-500">Open jobs by stage</p>
            </div>
            <button
              onClick={() => navigate("/jobs")}
              className="whitespace-nowrap text-xs font-bold text-violet-600 hover:text-violet-800 sm:text-sm"
            >
              View jobs
            </button>
          </div>
          <div className="relative mx-auto mt-6 h-[260px] max-w-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stages}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={106}
                  paddingAngle={6}
                  cornerRadius={10}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {stages.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-4xl font-bold text-slate-900">
                {pieTotal}
              </strong>
              <span className="text-sm text-slate-500">Open jobs</span>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {stages.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-3 text-slate-600">
                  <i
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.name}
                </span>
                <span className="font-bold text-slate-800">
                  {s.value}
                  <span className="ml-4 inline-block w-10 text-right font-normal text-slate-400">
                    {Math.round((s.value / pieTotal) * 100)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Hisar district map */}
      <section className="dashboard-card mt-5 rounded-[20px] border border-violet-100/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Customers across Hisar district
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Hover a village to see who is there. Click it to open the details.
            </p>
          </div>
          <div className="flex rounded-full bg-[#f5f3fb] p-1">
            {METRICS.map((t) => (
              <button
                key={t.key}
                onClick={() => setMetric(t.key)}
                className={`rounded-full px-5 py-2.5 text-xs font-bold transition ${metric === t.key ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "text-slate-500 hover:text-violet-600"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-stagger mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Map */}
          <div className="dashboard-card relative overflow-hidden rounded-xl border border-violet-100 bg-[#f7f5fd]">
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full">
              <path
                d={OUTLINE_PATH}
                fill="#efeafc"
                stroke="#7654f5"
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              {emptyDots.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.2} fill="#cfc8e6" />
              ))}
              {villages
                .filter((v) => v.c === 0)
                .map((v) => (
                  <circle
                    key={v.name}
                    cx={v.x}
                    cy={v.y}
                    r={2.6}
                    fill="#cfc8e6"
                  />
                ))}
              {villages
                .filter((v) => v.c > 0)
                .map((v) => {
                  const val = v[metric];
                  const t = v.shop ? 1 : Math.min(val / maxNoShop, 1);
                  const r = v.shop ? 13 : 6 + Math.sqrt(t) * 9;
                  const on = active === v.name;
                  return (
                    <g
                      key={v.name}
                      className="cursor-pointer"
                      onMouseEnter={() => setHovered(v.name)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() =>
                        setSelected(selected === v.name ? null : v.name)
                      }
                    >
                      {on && (
                        <circle
                          cx={v.x}
                          cy={v.y}
                          r={r + 7}
                          fill="none"
                          stroke="#7654f5"
                          strokeOpacity={0.35}
                          strokeWidth={3}
                        />
                      )}
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r={r}
                        fill={v.shop ? "#1a1033" : dotColor(t)}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                      {(v.shop || t > 0.45) && (
                        <text
                          x={v.x + r + 4}
                          y={v.y + 4}
                          fontSize={13}
                          fontWeight={600}
                          fill="#2a2150"
                          style={{ paintOrder: "stroke" }}
                          stroke="#f7f5fd"
                          strokeWidth={3}
                        >
                          {v.name}
                        </text>
                      )}
                    </g>
                  );
                })}
            </svg>

            {/* Tooltip */}
            {activeV && (
              <div
                className="pointer-events-none absolute z-10 w-[270px] rounded-2xl bg-white p-4 shadow-xl shadow-violet-200/60 ring-1 ring-violet-100"
                style={{
                  left: `${Math.min(Math.max((activeV.x / MAP_W) * 100, 18), 82)}%`,
                  top: `${(activeV.y / MAP_H) * 100}%`,
                  transform: "translate(-50%, calc(-100% - 22px))",
                }}
              >
                <p className="text-base font-bold text-slate-900">
                  {activeV.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeV.shop ? "Your shop is here · " : ""}
                  {activeV.tehsil} {activeV.shop ? "" : "tehsil"}
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    Customers <b className="text-violet-600">{activeV.c}</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    Sales <b className="text-slate-900">{activeV.s} jobs</b>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    Revenue <b className="text-slate-900">₹{activeV.r} L</b>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-violet-600">
                  Click for details
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="absolute inset-x-5 bottom-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                Fewer
                <span className="flex h-2.5 w-36 overflow-hidden rounded-full">
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                    <i
                      key={t}
                      className="flex-1"
                      style={{ background: dotColor(t) }}
                    />
                  ))}
                </span>
                More
                <span className="ml-3 flex items-center gap-1.5">
                  <i className="h-3 w-3 rounded-full bg-[#cfc8e6]" /> No
                  customers yet
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <i className="h-3.5 w-3.5 rounded-full border-[3px] border-slate-900 bg-white" />{" "}
                Your shop
              </span>
            </div>
          </div>

          {/* Right panel */}
          <div className="dashboard-card flex min-w-0 flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-700">
              Hisar district
            </p>
            <p className="mt-1 text-sm text-slate-500">
              97 of 267 villages have customers, plus Hisar city
            </p>

            <div className="dashboard-stagger mt-4 grid grid-cols-3 gap-3">
              {[
                { l: "Customers", v: "1,129" },
                { l: "Sales", v: "1,329" },
                { l: "Revenue", v: "₹29.7 L" },
              ].map((s) => (
                <div key={s.l} className="dashboard-card rounded-xl bg-[#f7f5fd] p-4">
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>

            <div className="dashboard-card mt-4 rounded-xl bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
              Hisar city brings 26% of your customers. 170 villages have no
              customers yet.
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                All villages
              </h4>
              <span className="text-xs text-slate-500">
                {list.length} shown, by {m.label.toLowerCase()}
              </span>
            </div>

            <div className="mt-3 flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-violet-100 px-4 py-2.5">
                <Search size={15} className="text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search a village"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="relative">
                <select
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  className="h-full cursor-pointer appearance-none rounded-full border border-violet-100 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 outline-none"
                >
                  {TEHSILS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <button
                type="button"
                onClick={() => setOnlyWith(!onlyWith)}
                className={`relative h-6 w-11 rounded-full transition ${onlyWith ? "bg-violet-600" : "bg-slate-300"}`}
              >
                <i
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${onlyWith ? "left-[22px]" : "left-0.5"}`}
                />
              </button>
              Only villages with customers
            </label>

            <div className="mt-4 max-h-[330px] space-y-4 overflow-y-auto pr-2">
              {list.map((v) => {
                const val = v[metric];
                const on = active === v.name;
                return (
                  <button
                    key={v.name}
                    onMouseEnter={() => setHovered(v.name)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() =>
                      setSelected(selected === v.name ? null : v.name)
                    }
                    className={`block w-full rounded-xl px-2 py-1.5 text-left transition ${on ? "bg-violet-50" : "hover:bg-violet-50/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-sm text-slate-900">{v.name}</b>
                      <b className="text-sm text-slate-900">{val}</b>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {v.shop
                        ? "Your shop · walk-in customers"
                        : `${v.tehsil} tehsil · ${v.c} customers · ${v.s} sales`}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full rounded-full bg-violet-600 transition-all duration-500"
                        style={{
                          width: `${Math.max((val / maxVal) * 100, val ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
              {list.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No village found
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Needs attention + WhatsApp */}
      <div className="dashboard-stagger mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_0.9fr]">
        <section className="dashboard-card rounded-[20px] border border-violet-100/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Needs attention
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Jobs that are late or waiting for the customer
              </p>
            </div>
            <button
              onClick={() => navigate("/jobs")}
              className="text-sm font-bold text-violet-600 hover:text-violet-800"
            >
              All jobs
            </button>
          </div>
          <div className="mt-4 space-y-1">
            {attention.map((a) => (
              <div
                key={a.id}
                className="dashboard-list-item grid grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] items-center gap-x-1.5 rounded-2xl px-2 py-3 transition hover:bg-[#f5f3fb] sm:flex sm:gap-4 sm:px-3 sm:py-3.5"
              >
                <span className="font-mono text-[11px] font-bold text-slate-800 sm:w-14 sm:text-sm">
                  {a.id}
                </span>
                <div className="min-w-0 sm:flex-1">
                  <p className="text-xs font-bold leading-4 text-slate-900 sm:text-sm">{a.name}</p>
                  <p className="mt-0.5 text-xs leading-4 text-red-700 sm:text-sm">
                    Waiting {a.days} days
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 sm:gap-1.5 sm:px-3 sm:text-xs">
                  <i className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{" "}
                  Ready
                </span>
                <button
                  onClick={() => setReminded((p) => ({ ...p, [a.id]: true }))}
                  disabled={reminded[a.id]}
                  className={`min-w-0 whitespace-nowrap rounded-full border px-3 py-2.5 text-xs font-bold transition sm:min-w-[96px] sm:px-5 sm:py-3 sm:text-sm ${reminded[a.id] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 text-violet-700 hover:bg-violet-50"}`}
                >
                  {reminded[a.id] ? "Sent ✓" : "Remind"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card rounded-[20px] border border-violet-100/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                WhatsApp today
              </h3>
              <p className="text-sm text-slate-500">
                Messages sent from the shop number
              </p>
            </div>
          </div>
          <div className="dashboard-stagger mt-5 space-y-4">
            {whatsapp.map((w) => (
              <div key={w.label} className="dashboard-list-item">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{w.label}</span>
                  <b className={w.red ? "text-red-700" : "text-slate-900"}>
                    {w.value}
                  </b>
                </div>
                <div
                  className={`mt-1.5 h-2 overflow-hidden rounded-full ${w.track}`}
                >
                  <div
                    className={`h-full rounded-full ${w.bar} transition-all duration-500`}
                    style={{ width: `${(w.value / w.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-[#f5f3fb] px-4 py-3.5 text-sm text-slate-600">
            Pickup OTP is generated fresh for every Ready message and checked at
            the counter.
          </div>
          <button
            onClick={() => navigate("/whatsapp")}
            className="mt-4 w-full rounded-full border border-violet-200 py-3.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
          >
            Open WhatsApp Center
          </button>
        </section>
      </div>

      <p className="mt-5 text-xs text-slate-500">
        Sample data for demonstration. The map uses an approximate Hisar
        district outline and village positions; customer and sales numbers are
        made up.
      </p>
    </div>
  );
}
