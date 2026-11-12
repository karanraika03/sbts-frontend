import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Plus,
  Search,
  Bell,
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

import { useToast } from "../../context/ToastContext";

import {
  getDashboardData,
  getOverdueDeliveries,
  getCustomerCityCount,
  getJobRevenue,
} from "../../services/Dashboard";

import { sendJobReminder } from "../../services/JobService";

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

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const toNum = (v) => Number(v) || 0;

const normalizeCityName = (name) =>
  (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/\s+/g, " ");

/* ---------- revenue chart (demo series, totals come from API) ---------- */
const revenueByRange = {
  "7D": {
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
    change: "+19.5%",
    cur: "Last 30 days",
    prev: "Previous 30 days",
    data: genSeries(30, 3400, 2600, 7, (i) => `${i + 1}`, 15200),
  },
  "12M": {
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

// Only coordinates + tehsil. Counts / revenue come from the API.
const villages = [
  { name: "Hisar city", tehsil: "Hisar", x: 335, y: 438, shop: true },
  { name: "Nyoli Kalan", tehsil: "Hisar", x: 300, y: 470 },
  { name: "Dabra", tehsil: "Hisar", x: 361, y: 477 },
  { name: "Kaimri", tehsil: "Hisar", x: 387, y: 453 },
  { name: "Chikanwas", tehsil: "Hisar", x: 420, y: 500 },
  { name: "Dhiranwas", tehsil: "Hisar", x: 246, y: 485 },
  { name: "Mangali Jhara", tehsil: "Hisar", x: 319, y: 517 },
  { name: "Siswal", tehsil: "Hisar", x: 290, y: 395 },
  { name: "Balsamand", tehsil: "Hisar", x: 330, y: 380 },
  { name: "Mayyar", tehsil: "Hisar", x: 240, y: 420 },
  { name: "Sisai", tehsil: "Hisar", x: 450, y: 440 },
  { name: "Pabra", tehsil: "Hisar", x: 470, y: 480 },
  { name: "Kinala", tehsil: "Hisar", x: 380, y: 550 },
  { name: "Rawalwas", tehsil: "Hisar", x: 200, y: 450 },
  { name: "Adampur", tehsil: "Adampur", x: 230, y: 300 },
  { name: "Khanda Kheri", tehsil: "Adampur", x: 190, y: 350 },
  { name: "Hansi", tehsil: "Hansi", x: 560, y: 380 },
  { name: "Satrod Khurd", tehsil: "Hansi", x: 600, y: 330 },
  { name: "Mirkan", tehsil: "Hansi", x: 520, y: 430 },
  { name: "Barwala", tehsil: "Barwala", x: 470, y: 300 },
  { name: "Narnaund", tehsil: "Narnaund", x: 620, y: 450 },
  { name: "Dhansu", tehsil: "Narnaund", x: 650, y: 380 },
  { name: "Uklana", tehsil: "Uklana", x: 330, y: 300 },
  { name: "Bass", tehsil: "Bass", x: 420, y: 250 },
  { name: "Agroha", tehsil: "Hisar", x: 250, y: 365 },
  // Outside Hisar district: plotted by real-world direction from Hisar (approx.)
  { name: "Fatehabad", x: 105, y: 305, outside: true },
  { name: "Tohana", x: 150, y: 262, outside: true },
  { name: "Ratia", x: 160, y: 395, outside: true },
  { name: "Hanumangarh", x: 75, y: 360, outside: true },
  { name: "Churu", x: 110, y: 465, outside: true },
  { name: "Bhiwani", x: 390, y: 608, outside: true },
  { name: "Mahendragarh", x: 340, y: 625, outside: true },
  { name: "Narwana", x: 540, y: 230, outside: true },
  { name: "Karnal", x: 700, y: 350, outside: true },
  { name: "Gurgaon", x: 730, y: 470, outside: true },
  { name: "Azamgarh", x: 690, y: 520, outside: true },
];

const villageLookup = villages.reduce((acc, v) => {
  acc[normalizeCityName(v.name)] = v;
  return acc;
}, {});

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

const METRICS = [{ key: "c", label: "Customers" }];

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
  const showToast = useToast();

  const [range, setRange] = useState("30D");
  const [metric, setMetric] = useState("c");
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");

  const [attention, setAttention] = useState([]);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [reminded, setReminded] = useState({});
  const [remindingId, setRemindingId] = useState(null);

  const [cityCounts, setCityCounts] = useState([]);
  const [cityLoading, setCityLoading] = useState(true);

  const [jobRevenue, setJobRevenue] = useState(null);
  const [jobRevenueLoading, setJobRevenueLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    totalCustomers: 0,
    totalFavouriteCustomers: 0,
    totalPendingJobs: 0,
    totalCompletedJobs: 0,
    totalDeliverdJobs: 0,
    lastSevenDaysAmount: 0,
    lastOneMonthAmount: 0,
    lastOneYearAmount: 0,
    allTimeAmount: 0,
    pending: 0,
    completed: 0,
    delivered: 0,
    return: 0,
    dead: 0,
    readyToShip: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);

  /* ---------- API calls ---------- */
  useEffect(() => {
    const fetchJobRevenue = async () => {
      try {
        const response = await getJobRevenue();
        if (response?.success) setJobRevenue(response.data);
      } catch (error) {
        console.error("Job Revenue API Error:", error);
      } finally {
        setJobRevenueLoading(false);
      }
    };
    fetchJobRevenue();
  }, []);

  useEffect(() => {
    const fetchCustomerCityCount = async () => {
      try {
        const response = await getCustomerCityCount();
        if (response?.success && Array.isArray(response.data)) {
          setCityCounts(response.data);
        }
      } catch (error) {
        console.error("Customer City Count API Error:", error);
      } finally {
        setCityLoading(false);
      }
    };
    fetchCustomerCityCount();
  }, []);

  useEffect(() => {
    const fetchOverdueDeliveries = async () => {
      try {
        const response = await getOverdueDeliveries();
        if (response?.success && Array.isArray(response.data)) {
          setAttention(response.data);
        }
      } catch (error) {
        console.error("Overdue Deliveries API Error:", error);
      } finally {
        setAttentionLoading(false);
      }
    };
    fetchOverdueDeliveries();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getDashboardData();
        if (response?.success && response?.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error("Dashboard API Error:", error);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleSendReminder = async (jobId) => {
    try {
      setRemindingId(jobId);

      const response = await sendJobReminder(jobId);

      if (response?.success) {
        setReminded((prev) => ({ ...prev, [jobId]: true }));
        showToast(response.message || "Reminder sent successfully.");
      } else {
        showToast(response?.message || "Unable to send reminder.");
      }
    } catch (error) {
      console.error("Send Reminder Error:", error);
      showToast(error.response?.data?.message || "Unable to send reminder.");
    } finally {
      setRemindingId(null);
    }
  };

  /* ---------- derived data ---------- */
  const rev = revenueByRange[range];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const cityVillages = useMemo(() => {
    return cityCounts.map((item) => {
      const name = item.cityName?.trim() || "Unknown";
      const existing = villageLookup[normalizeCityName(name)];

      return {
        name,
        tehsil: existing?.tehsil,
        c: Number(item.totalCustomer || 0),
        r: Number(item.revenue || 0),
        x: existing?.x,
        y: existing?.y,
        shop: existing?.shop || false,
        outside: existing?.outside || false,
      };
    });
  }, [cityCounts]);

  const maxVal = useMemo(
    () => Math.max(...cityVillages.map((v) => v[metric]), 1),
    [metric, cityVillages],
  );

  const totalCityCustomers = useMemo(
    () => cityVillages.reduce((a, v) => a + v.c, 0),
    [cityVillages],
  );

  const list = useMemo(() => {
    return cityVillages
      .filter((item) =>
        item.name.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .sort((a, b) => b.c - a.c);
  }, [cityVillages, q]);

  const cityListMax = useMemo(
    () => Math.max(...list.map((v) => v.c), 1),
    [list],
  );

  const active = hovered || selected;
  const activeV = cityVillages.find((v) => v.name === active);

  const stages = [
    { name: "Pending", value: toNum(dashboardData.pending), color: "#b7add8" },
    {
      name: "Completed",
      value: toNum(dashboardData.completed),
      color: "#5d8cf1",
    },
    {
      name: "Delivered",
      value: toNum(dashboardData.delivered),
      color: "#2dbb87",
    },
    { name: "Return", value: toNum(dashboardData.return), color: "#f3aa39" },
    { name: "Dead", value: toNum(dashboardData.dead), color: "#ef4444" },
    {
      name: "Ready To Ship",
      value: toNum(dashboardData.readyToShip),
      color: "#7654f5",
    },
  ];

  const pieTotal = stages.reduce((a, s) => a + s.value, 0);

  const goToStage = (stage) => {
    navigate(`/jobs?status=${encodeURIComponent(stage.name)}`);
  };

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
          <button
            aria-label="Notifications"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white text-slate-600 shadow-sm transition hover:bg-violet-50 lg:h-12 lg:w-12"
          >
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
          label="Pending Jobs"
          value={dashboardLoading ? "..." : dashboardData.totalPendingJobs}
          note="Jobs awaiting completion"
          icon={Wrench}
          tone="violet"
        />

        <StatCard
          label="Completed Jobs"
          value={dashboardLoading ? "..." : dashboardData.totalCompletedJobs}
          note="Successfully completed"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="Delivered Jobs"
          value={dashboardLoading ? "..." : dashboardData.totalDeliverdJobs}
          note="Jobs delivered to customers"
          icon={Clock3}
          tone="red"
        />

        <StatCard
          label="Total Customers"
          value={dashboardLoading ? "..." : dashboardData.totalCustomers}
          note={`${dashboardData.totalFavouriteCustomers} favourite customers`}
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
              {inr(
                range === "7D"
                  ? dashboardData.lastSevenDaysAmount
                  : range === "30D"
                    ? dashboardData.lastOneMonthAmount
                    : dashboardData.lastOneYearAmount,
              )}
            </strong>
            <p className="text-sm text-slate-500">
              All Time Revenue: {inr(dashboardData.allTimeAmount)}
            </p>
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
                    inr(v),
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
              <h3 className="text-lg font-bold text-slate-900">Statistics</h3>
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
                  data={
                    pieTotal > 0
                      ? stages
                      : [{ name: "Empty", value: 1, color: "#e2e8f0" }]
                  }
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={78}
                  outerRadius={106}
                  paddingAngle={pieTotal > 0 ? 6 : 0}
                  cornerRadius={10}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  onClick={(_, index) => {
                    if (pieTotal > 0) goToStage(stages[index]);
                  }}
                  onMouseEnter={(_, index) => {
                    if (pieTotal > 0) setHoveredStage(stages[index].name);
                  }}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {(pieTotal > 0 ? stages : [{ color: "#e2e8f0" }]).map(
                    (s, i) => (
                      <Cell
                        key={i}
                        fill={s.color}
                        style={{
                          cursor: pieTotal > 0 ? "pointer" : "default",
                          outline: "none",
                          opacity:
                            hoveredStage && hoveredStage !== s.name ? 0.35 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                      />
                    ),
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-4xl font-bold text-slate-900">
                {hoveredStage
                  ? stages.find((s) => s.name === hoveredStage)?.value
                  : pieTotal}
              </strong>
              <span className="text-sm text-slate-500">
                {hoveredStage ? hoveredStage : "Open jobs"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {stages.map((s) => (
              <button
                type="button"
                key={s.name}
                onClick={() => goToStage(s)}
                onMouseEnter={() => setHoveredStage(s.name)}
                onMouseLeave={() => setHoveredStage(null)}
                className="flex w-full items-center justify-between text-sm transition-opacity hover:opacity-80"
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
                    {pieTotal > 0 ? Math.round((s.value / pieTotal) * 100) : 0}%
                  </span>
                </span>
              </button>
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
              Hover or tap a city or village to see customers and revenue.
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
              {cityVillages
                .filter((v) => v.c > 0 && v.x != null && v.y != null)
                .map((v) => {
                  const t = Math.min(v.c / maxVal, 1);
                  const r = 5 + Math.sqrt(t) * 10;
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
                        stroke={v.outside ? "#7654f5" : "#fff"}
                        strokeWidth={1.5}
                        strokeDasharray={v.outside ? "3 2" : undefined}
                      />
                      {
                        <text
                          x={v.x + r + 4}
                          y={v.y + 4}
                          fontSize={on || v.shop ? 13 : 11}
                          fontWeight={600}
                          fill="#2a2150"
                          style={{ paintOrder: "stroke" }}
                          stroke="#f7f5fd"
                          strokeWidth={3}
                        >
                          {v.name}
                        </text>
                      }
                    </g>
                  );
                })}
            </svg>

            {/* Tooltip */}
            {activeV && activeV.x != null && activeV.y != null && (
              <div
                className="pointer-events-none absolute z-10 w-[270px] rounded-2xl bg-white p-4 shadow-xl shadow-violet-200/60 ring-1 ring-violet-100"
                style={{
                  left: `${Math.min(Math.max((activeV.x / MAP_W) * 100, 18), 82)}%`,
                  top: `${(activeV.y / MAP_H) * 100}%`,
                  transform:
                    activeV.y / MAP_H < 0.28
                      ? "translate(-50%, 22px)"
                      : "translate(-50%, calc(-100% - 22px))",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {activeV.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {activeV.shop ? "Your shop is here · " : ""}
                      {activeV.outside
                        ? "Outside Hisar district · approx. position"
                        : activeV.tehsil
                          ? `${activeV.tehsil}${activeV.shop ? "" : " tehsil"}`
                          : "Hisar district"}
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    #{list.findIndex((x) => x.name === activeV.name) + 1}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Customers</span>
                    <b className="text-violet-600">
                      {activeV.c.toLocaleString("en-IN")}
                    </b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Revenue</span>
                    <b className="text-emerald-700">
                      {cityLoading ? "..." : inr(activeV.r)}
                    </b>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-slate-500">Avg / customer</span>
                    <b className="text-slate-900">
                      {activeV.c
                        ? inr(Math.round(activeV.r / activeV.c))
                        : "₹0"}
                    </b>
                  </div> */}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Share of all customers</span>
                    <span className="font-bold text-slate-700">
                      {totalCityCustomers
                        ? ((activeV.c / totalCityCustomers) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-violet-100">
                    <div
                      className="h-full rounded-full bg-violet-600"
                      style={{
                        width: `${totalCityCustomers ? Math.max((activeV.c / totalCityCustomers) * 100, 3) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs font-bold text-violet-600">
                  {selected === activeV.name
                    ? "Click to unpin"
                    : "Click to pin"}
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="absolute inset-x-5 bottom-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="ml-3 flex items-center gap-1.5">
                  <i className="h-3 w-3 rounded-full bg-[#1a1033]" /> Shop
                </span>
                <span className="ml-3 flex items-center gap-1.5">
                  <i className="h-3 w-3 rounded-full border border-dashed border-violet-600 bg-violet-200" />{" "}
                  Outside district
                </span>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="dashboard-card flex min-w-0 flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-700">
              Hisar district
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Customer distribution across available cities and villages
            </p>

            <div className="dashboard-stagger mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  l: "Total Customers",
                  v: Number(jobRevenue?.totalCustomer || 0).toLocaleString(
                    "en-IN",
                  ),
                },
                {
                  l: "Pending Customers",
                  v: Number(jobRevenue?.pendingCustomer || 0).toLocaleString(
                    "en-IN",
                  ),
                },
                {
                  l: "Total Revenue",
                  v: inr(jobRevenue?.revenue),
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className="dashboard-card min-w-0 rounded-xl bg-[#f7f5fd] p-4"
                >
                  <p className="text-xs text-slate-500">{s.l}</p>
                  <p className="mt-1 break-words text-lg font-bold text-slate-900 sm:text-xl">
                    {jobRevenueLoading ? "..." : s.v}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                City / Village Customer Count
              </h4>
              <span className="text-xs text-slate-500">
                {cityLoading
                  ? "Loading..."
                  : `${list.length} cities / villages shown`}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex w-full items-center gap-2 rounded-full border border-violet-100 px-4 py-3">
                <Search size={15} className="text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search a village"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-4 max-h-[400px] space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              {cityLoading ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Loading city data...
                </p>
              ) : list.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No city or village found
                </p>
              ) : (
                list.map((v, i) => {
                  const on = active === v.name;
                  const onMap = v.x != null && v.y != null;
                  return (
                    <button
                      type="button"
                      key={v.name}
                      onMouseEnter={() => onMap && setHovered(v.name)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() =>
                        onMap &&
                        setSelected(selected === v.name ? null : v.name)
                      }
                      className={`block w-full rounded-xl px-3 py-2.5 text-left transition ${on ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-[#f7f5fd]"} ${onMap ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-xs font-bold text-slate-400">
                            {i + 1}
                          </span>
                          <b className="truncate text-sm text-slate-900">
                            {v.name}
                          </b>
                          {v.shop && (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              Shop
                            </span>
                          )}
                          {!onMap && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              Not on map
                            </span>
                          )}
                        </span>
                        <b className="text-sm text-violet-700">
                          {v.c.toLocaleString("en-IN")}
                        </b>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 pl-7 text-xs text-slate-500">
                        <span>{v.c.toLocaleString("en-IN")} customers</span>
                        <span>Revenue: {inr(v.r)}</span>
                      </div>
                      <div className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100">
                        <div
                          className="h-full rounded-full bg-violet-600 transition-all duration-500"
                          style={{
                            width: `${Math.max((v.c / cityListMax) * 100, v.c ? 3 : 0)}%`,
                          }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Needs attention */}
      <div className="dashboard-stagger mt-5 grid grid-cols-1 gap-5">
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
          <div className="mt-4 max-h-[420px] space-y-1 overflow-y-auto overflow-x-hidden pr-2">
            {attentionLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading overdue deliveries...
              </p>
            ) : attention.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No overdue deliveries found.
              </p>
            ) : (
              attention.map((a) => (
                <div
                  key={a.id}
                  className="dashboard-list-item grid grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] items-center gap-x-1.5 rounded-2xl px-2 py-3 transition hover:bg-[#f5f3fb] sm:flex sm:gap-4 sm:px-3 sm:py-3.5"
                >
                  <span className="font-mono text-[11px] font-bold text-slate-800 sm:w-14 sm:text-sm">
                    #{a.jobNo}
                  </span>

                  <div className="min-w-0 sm:flex-1">
                    <p className="text-xs font-bold leading-4 text-slate-900 sm:text-sm">
                      {a.customerName}
                    </p>

                    <p className="mt-0.5 text-xs leading-4 text-red-700 sm:text-sm">
                      {a.daysLate === 0
                        ? "Due today"
                        : `Waiting ${a.daysLate} days`}
                    </p>
                  </div>

                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 sm:gap-1.5 sm:px-3 sm:text-xs">
                    <i className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Overdue
                  </span>

                  <button
                    onClick={() => handleSendReminder(a.id)}
                    disabled={reminded[a.id] || remindingId === a.id}
                    className={`min-w-0 whitespace-nowrap rounded-full border px-3 py-2.5 text-xs font-bold transition sm:min-w-[96px] sm:px-5 sm:py-3 sm:text-sm ${
                      reminded[a.id]
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-violet-200 text-violet-700 hover:bg-violet-50"
                    }`}
                  >
                    {remindingId === a.id
                      ? "Sending..."
                      : reminded[a.id]
                        ? "Sent ✓"
                        : "Remind"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <p className="mt-5 text-xs text-slate-500">
        Customer counts are fetched from the live API. Map locations and
        district boundaries use predefined approximate coordinates.
      </p>
    </div>
  );
}
