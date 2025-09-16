import React, { useMemo, useState, useEffect } from "react";
import {
  Search, TrendingUp, Sparkles, Info, Star, BookOpenCheck, Clock,
  Filter, ChevronRight, CircleHelp, ListFilter, ArrowUpRight, History
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";

// Hero 卡（顯示距離下一級的差距）
import GapHeroCard from "./GapHeroCard";
import runnerSimple from "@/assets/Coffee_Run.json";
import premium from "@/assets/premium.json";


/** =========================================================
 *  StudentRecommendationDashboard（強化版）
 *  - 僅在「有意義的值」時才覆蓋 mock
 *  - level 必須符合 CEFR；"unknown"/"N/A"/"-" 一律不採用
 *  - 30 天完成率只有在「確實有修課資料」時才覆蓋
 *  - 升級差距 Hero 卡（小時制/可 DEMO 直達 100%） 
 * ======================================================== */

const ACCENT = "#12B6C8";
const ACCENT_LIGHT = "#12B6C820";

/* ===== 等級匹配工具 ===== */
const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_SET = new Set(LEVEL_ORDER);
const levelIdx = (lv) => LEVEL_ORDER.indexOf((lv || "").toUpperCase());

function courseRangeIdx(label) {
  if (!label) return [0, LEVEL_ORDER.length - 1];
  const norm = String(label).replace(/[–—-]/g, "~").toUpperCase();
  const parts = norm.split("~").map((s) => s.trim());
  if (parts.length === 1) {
    const i = levelIdx(parts[0]);
    return [i, i];
  }
  return [levelIdx(parts[0]), levelIdx(parts[1])];
}

function userFitsCourse(userLevel, courseLabel) {
  const u = levelIdx(userLevel);
  const [lo, hi] = courseRangeIdx(courseLabel);
  if (u < 0 || lo < 0 || hi < 0) return true; // 解析失敗時不擋
  return u >= lo && u <= hi;
}

/** ===== Mock 資料 ===== */
const mockProfile = {
  studentName: "來自中原大學的小仇",
  level: "B1",
  interests: ["聽力", "旅遊", "口說"],
  progress: 62,             // 0~100
  completionRate: 0.47,      // 0~1
  clickStats: { last7Days: 18, topTags: ["聽力", "看圖說故事", "新聞"] },
  skills: { 聽力: 70, 閱讀: 65, 口說: 58, 寫作: 52, 文法: 60, 字彙: 73 },
};

const mockRecommendations = [
  {
    id: "rec_101",
    title: "實戰聽力：看圖說故事 A2→B1",
    provider: "AI酷英",
    level: "A2~B1",
    duration: 25,
    tags: ["聽力", "敘事", "圖片理解"],
    reason: "你在對話中多次提到『想練聽力』，且目前等級為 B1。",
    relation: "與你近期完成的『日常情境聽力』學習目標相符（提升細節抓取）。",
    progress: 0.2,
    stats: { clicks: 1234, rating: 4.6 },
  },
  {
    id: "rec_102",
    title: "新聞英語精讀：時事聽讀雙修",
    provider: "AI酷英",
    level: "B1~B2",
    duration: 20,
    tags: ["聽力", "閱讀", "時事"],
    reason: "最近 7 天你常點『新聞』相關內容。",
    relation: "可作為『實戰聽力』的延伸單元，補強關鍵字彙。",
    progress: 0.55,
    stats: { clicks: 842, rating: 4.5 },
  },
  {
    id: "rec_103",
    title: "口說訓練：旅行情境（角色扮演）",
    provider: "AI酷英",
    level: "B1",
    duration: 15,
    tags: ["口說", "旅遊", "情境"],
    reason: "你標註興趣包含『旅遊』，且常搜尋口說。",
    relation: "緊接在『時事聽讀』後，轉化輸入為輸出（Output）。",
    progress: 0.05,
    stats: { clicks: 256, rating: 4.3 },
  },
];

const mockSearchIndex = {
  level: ["A1", "A2", "B1", "B2", "C1"],
  topics: ["聽力", "閱讀", "口說", "寫作", "文法", "旅遊", "商務", "考試"],
};

/* ===== 安全合併 & 驗證工具 ===== */
function hasMeaningfulValue(v) {
  const isNumber = typeof v === "number" && !Number.isNaN(v); // 允許 0
  const isBoolean = typeof v === "boolean";                   // 允許 false
  const isNonEmptyString = typeof v === "string" && v.trim() !== "";
  const isNonEmptyArray = Array.isArray(v) && v.length > 0;
  const isNonEmptyObject = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;
  return isNumber || isBoolean || isNonEmptyString || isNonEmptyArray || isNonEmptyObject;
}

function isMeaningfulProfile(p) {
  if (!p || typeof p !== "object") return false;
  const keysToCheck = [
    "level", "progress", "completionRate", "skills", "interests",
    "clickStats", "firstname", "lastname", "studentName", "current_value"
  ];
  return keysToCheck.some((k) => hasMeaningfulValue(p[k]));
}

function isMeaningfulRecommendations(list) {
  return Array.isArray(list) && list.length > 0;
}

function isMeaningfulSearchIndex(idx) {
  if (!idx || typeof idx !== "object") return false;
  return (Array.isArray(idx.level) && idx.level.length > 0) ||
         (Array.isArray(idx.topics) && idx.topics.length > 0);
}

function safeMerge(base, override) {
  if (!override || typeof override !== "object") return { ...base };
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const v = override[key];
    const isNumber = typeof v === "number" && !Number.isNaN(v);
    const isBoolean = typeof v === "boolean";
    const isNonEmptyString = typeof v === "string" && v.trim() !== "";
    const isNonEmptyArray = Array.isArray(v) && v.length > 0;
    const isNonEmptyObject = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;
    if (isNumber || isBoolean || isNonEmptyString || isNonEmptyArray || isNonEmptyObject) {
      out[key] = v;
    }
  }
  return out;
}

function mergeSkills(baseSkills = {}, overrideSkills = {}) {
  const out = { ...baseSkills };
  for (const k of Object.keys(overrideSkills || {})) {
    const v = overrideSkills[k];
    if (typeof v === "number" && !Number.isNaN(v)) out[k] = v;
  }
  return out;
}

function numOr(val, fallback) {
  return typeof val === "number" && !Number.isNaN(val) ? val : fallback;
}

function ratio01Or(val, fallback) {
  if (typeof val === "number" && !Number.isNaN(val)) {
    return Math.min(1, Math.max(0, val));
  }
  return fallback;
}

function isValidLevel(lv) {
  if (!lv) return false;
  const s = String(lv).trim().toUpperCase();
  if (s === "UNKNOWN" || s === "N/A" || s === "-" || s === "NULL") return false;
  return CEFR_SET.has(s);
}

function pickCompletionRate(thirtyDayStats, fallback) {
  // 1) 先讀 rate，允許 "47"、"47%"、47、0.47
  let rate = thirtyDayStats?.completion_rate_30days;
  if (typeof rate === "string") {
    const m = rate.match(/[\d.]+/);
    rate = m ? parseFloat(m[0]) : undefined;
  }
  if (typeof rate === "number" && Number.isFinite(rate)) {
    if (rate > 1) rate = rate / 100;            // 0~100 → 0~1
    return Math.min(1, Math.max(0, rate));      // 夾在 0~1
  }

  // 2) 沒有 rate 時，才用 has_data/enrolled/completed 的規則（保底）
  const enrolled  = Number(thirtyDayStats?.enrolled_courses_30days ?? 0);
  const completed = Number(thirtyDayStats?.completed_courses_30days ?? 0);
  const hasData   = Boolean(thirtyDayStats?.has_data) || enrolled > 0 || completed > 0;
  if (hasData) return 0;                         // 有紀錄但沒有比率 → 視為 0

  // 3) 最後回 fallback（通常是 mock）
  return fallback;
}

/* ===== UI 小元件 ===== */
const SearchModeTab = ({ mode, setMode }) => {
  const tabs = [
    { key: "level", label: "程度" },
    { key: "topic", label: "主題" },
    { key: "keyword", label: "關鍵字" },
  ];
  return (
    <div className="relative rounded-2xl bg-gray-100 p-1 grid grid-cols-3">
      <span
        className="absolute top-1 bottom-1 w-1/3 rounded-xl bg-white shadow transition-transform duration-300"
        style={{ transform: `translateX(${{ level: 0, topic: 100, keyword: 200 }[mode]}%)` }}
      />
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setMode(t.key)}
          className={`relative z-10 py-2 text-sm rounded-xl transition ${mode === t.key ? "font-semibold" : "opacity-70"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

const ShowWithFade = ({ dep, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const id = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(id);
  }, [dep]);
  return (
    <div className={`transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      {children}
    </div>
  );
};

const ActiveBox = ({ active, children }) => (
  <div
    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${active ? "" : "opacity-60"}`}
    style={active ? { borderColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT_LIGHT}` } : {}}
  >
    {children}
  </div>
);

const Pill = ({ children }) => (
  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{children}</span>
);

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm">
    <Icon className="size-4" />
    <span className="opacity-70">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

/* ===== 進度條 ===== */
function ProgressBarSmooth({
  percent = 0, height = 8, accent = ACCENT,
  duration = 800, delay = 0, showLabel = true, decimals = 0,
}) {
  const target = Math.max(0, Math.min(100, Number(percent) || 0));
  const [widthPct, setWidthPct] = React.useState(0);
  const [labelPct, setLabelPct] = React.useState(0);

  React.useEffect(() => {
    let raf1, raf2, start;
    setWidthPct(0);
    setLabelPct(0);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const startAnim = () => {
      setWidthPct(target); // 寬度走 CSS transition
      const tick = (ts) => {
        if (start == null) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        setLabelPct(
          Math.round(target * easeOutCubic(p) * 10 ** decimals) / 10 ** decimals
        );
        if (p < 1) raf2 = requestAnimationFrame(tick);
      };
      raf2 = requestAnimationFrame(tick);
    };
    const tid = setTimeout(() => { raf1 = requestAnimationFrame(startAnim); }, delay);
    return () => {
      clearTimeout(tid);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [target, duration, delay, decimals]);

  return (
    <div>
      <div className="w-full rounded-full overflow-hidden bg-gray-200" style={{ height }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPct}%`,
            background: accent,
            transition: `width ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
          }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-right opacity-70">{labelPct.toFixed(decimals)}%</p>
      )}
    </div>
  );
}

/* ===== 推薦卡 ===== */
const RecommendationCard = ({ item, onOpen, index = 0 }) => {
  const percent = Math.round((item.progress || 0) * 100);
  return (
    <div className="h-full rounded-2xl border p-4 md:p-5 hover:shadow-sm transition flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Sparkles className="size-4" /> {item.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm opacity-80">
            <Pill>{item.level}</Pill>
            <Pill>{item.duration} 分鐘</Pill>
            {item.tags.map((t) => <Pill key={t}>{t}</Pill>)}
          </div>
        </div>
        <button
          onClick={() => onOpen?.(item)}
          className="px-3 py-1.5 rounded-xl text-white text-sm flex items-center gap-1"
          style={{ background: ACCENT }}
        >
          開啟 <ArrowUpRight className="size-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Info className="size-4 mt-0.5" />
          <p><span className="font-medium">推薦原因：</span>{item.reason}</p>
        </div>
        <div className="flex items-start gap-2">
          <CircleHelp className="size-4 mt-0.5" />
          <p><span className="font-medium">學習關聯：</span>{item.relation}</p>
        </div>
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Stat icon={TrendingUp} label="熱門度" value={item.stats.clicks} />
          <Stat icon={Star} label="評分" value={item.stats.rating} />
        </div>
        <div className="w-40">
          <ProgressBarSmooth percent={percent} delay={index * 120} />
        </div>
      </div>
    </div>
  );
};

/* ===== 看更多 ===== */
function ShowMoreRecommendations({ items = [], onOpen, initially = 2 }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [items]);

  const visible = expanded ? items : items.slice(0, initially);
  const hiddenCount = Math.max(0, items.length - initially);

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        {visible.map((item, idx) => (
          <div
            key={item.id}
            className="h-full transition-opacity duration-500"
            style={{ transitionDelay: expanded ? `${idx * 60}ms` : "0ms" }}
          >
            <RecommendationCard item={item} onOpen={onOpen} index={idx} />
          </div>
        ))}
      </div>

      {!expanded && hiddenCount > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setExpanded(true)}
            className="group inline-flex items-center gap-1 px-5 py-2 rounded-full text-white font-medium shadow hover:shadow-lg transition"
            style={{ background: ACCENT }}
          >
            看更多（{hiddenCount}）
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {expanded && items.length > initially && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setExpanded(false)}
            className="px-4 py-2 text-sm rounded-full border hover:bg-gray-50 transition"
          >
            收合
          </button>
        </div>
      )}
    </>
  );
}

/* ===== 升級差距（給 Hero 卡） ===== */
const CEFR_BOUNDS = { A1:[0,20], A2:[20,40], B1:[40,60], B2:[60,80], C1:[80,100], C2:[100,100] };
const CEFR_NAME  = { A1:"入門", A2:"初級", B1:"中級", B2:"中高", C1:"高級", C2:"精熟" };
function bandFromLevel(lv) {
  const order = ["A1","A2","B1","B2","C1","C2"];
  const i = order.indexOf(String(lv || "").toUpperCase());
  if (i < 0) return null;
  const cur = order[i];
  const nextIdx = Math.min(i + 1, order.length - 1);
  const nextCode = order[nextIdx];
  const [lower, next] = CEFR_BOUNDS[cur] || [0, 100];
  return { code: nextCode, name: CEFR_NAME[nextCode], lower, next };
}

/* ===== 主元件 ===== */
export default function StudentRecommendationDashboard({
  profile: propProfile = {},
  thirtyDayStats = {},
  userDegree = "",
  recommendations ,
  searchIndex ,
  onOpenCourse,
  onSearch,
  categoryProgress = [],
  onTriggerIntent,
}) {
  // 由 categoryProgress 轉成 skills
  const skillsFromCategory = categoryProgress.reduce((acc, item) => {
    acc[item.category_group] = Number(item.completion_percent);
    return acc;
  }, {});

  // 可能父層塞進來的是 {profile: {...}} 或 {data: {profile: {...}}}
  const rawProfile =
   (propProfile && propProfile.profile) ||
   (propProfile && propProfile.data && propProfile.data.profile) ||
   propProfile;


  const firstName = rawProfile.firstname || "";
  const lastName  = rawProfile.lastname  || "";
  // 先吃後端顯示名稱，再用姓+名，最後才回退到 mock
  const studentName =
   [rawProfile.studentName, rawProfile.display_name, rawProfile.name]
     .map(v => (typeof v === "string" ? v.trim() : ""))
     .find(v => v) ||
   (lastName + firstName).trim() ||
   (rawProfile.username ? String(rawProfile.username).trim() : "") ||
   mockProfile.studentName;

  // === Gate：忽略空資料 ===
  const propProfileEffective = isMeaningfulProfile(rawProfile) ? rawProfile : undefined;
  const mergedBase = safeMerge(mockProfile, propProfileEffective); // 只在有效時才合併

  
  const finalLevel =
    (isValidLevel(userDegree) && String(userDegree).toUpperCase()) ||
    (isValidLevel(mergedBase.level) ? String(mergedBase.level).toUpperCase() : "UNKNOWN");
    
  // completionRate：只有「有修課資料」才覆蓋
  const finalCompletionRate = pickCompletionRate(
    thirtyDayStats,
    ratio01Or(mergedBase.completionRate, mockProfile.completionRate)
  );

  // skills：鍵級合併；categoryProgress > propProfile.skills > mock
  const baseSkills = mergeSkills(mockProfile.skills || {}, mergedBase.skills || {});
  const finalSkills = Object.keys(skillsFromCategory).length > 0
    ? mergeSkills(baseSkills, skillsFromCategory)
    : baseSkills;

  const finalClickStats =
    mergedBase.clickStats && Array.isArray(mergedBase.clickStats.topTags)
      ? mergedBase.clickStats
      : (mockProfile.clickStats || { last7Days: 0, topTags: [] });

  const finalInterests =
    Array.isArray(mergedBase.interests) && mergedBase.interests.length > 0
      ? mergedBase.interests
      : (mockProfile.interests || []);


  // 最終 profile
  const profile = {
    ...mergedBase,
    level: finalLevel,
    completionRate: finalCompletionRate,
    skills: finalSkills,
    interests: finalInterests,
    clickStats: finalClickStats,
    studentName,
  };
  profile.skills = profile.skills || {};
  if (profile.skills["其他"] != null) delete profile.skills["其他"];
  profile.interests = Array.isArray(profile.interests) ? profile.interests : [];
  profile.clickStats = profile.clickStats ?? { last7Days: 0, topTags: [] };

  const band = bandFromLevel(profile.level);

  // 衝刺 → 滾到推薦
  const scrollToRecommendations = () => {
    const el = document.getElementById("rec-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // // 最終考驗條件   
  // const currentValueForExam = Number(propProfile?.current_value ?? 0);
  // const requiredForExam   = Number(propProfile?.required_value ?? band?.next ?? 100);


  // === DEMO：先看到 100% 與獎盃（要關掉就把 on 改成 false）
  const DEMO = {
    on: false,       // true：強制展示 100%；false：走真實資料
    goalHours: 60,  // 目標小時（例如 60 小時）
    earnedHours: 60 // 已上小時（= 60 → 100%）
  };

  
  // 真實資料（若有）：把後端累積分鐘換成「小時」
  const learnedMinutes   = Number(rawProfile?.learn_minutes_total ?? 0);
  const learnedHoursReal = learnedMinutes / 60;

  // 真實門檻（若後端有提供 required_hours 就用它；否則給 60 當預設）
  const requiredHoursReal = Number(rawProfile?.required_hours ?? 60);

  // 要丟給卡片的值（單位：小時）
  const pointsGoal   = DEMO.on ? DEMO.goalHours   : requiredHoursReal;
  const pointsEarned = DEMO.on ? DEMO.earnedHours : learnedHoursReal;

  // 是否解鎖（達到門檻）
  const isUnlocked = pointsEarned >= pointsGoal;


  const handleGoExam = () => {
    if (!isUnlocked) return;
    alert("最終考驗即將開放！");
  };


  // 安全 fallback
  const recommendationsSafe = isMeaningfulRecommendations(recommendations) ? recommendations : mockRecommendations;
  const searchIndexSafe = isMeaningfulSearchIndex(searchIndex) ? searchIndex : mockSearchIndex;

  const [mode, setMode] = useState("level");
  const [query, setQuery] = useState("");
  const [topicSel, setTopicSel] = useState(profile?.interests?.[0] || "聽力");

  // 雷達 & Donut
  const skillKeys = Object.keys(profile.skills || {});
  const baseRadar = skillKeys.map((k) => ({ subject: k, A: profile.skills[k] || 0 }));
  const [radarData, setRadarData] = useState(baseRadar);

  const donutTarget = Math.round((profile.completionRate || 0) * 100);
  const [donutValue, setDonutValue] = useState(donutTarget);

  useEffect(() => {
    let raf; let current = 0;
    const animate = () => {
      current += Math.max(1, Math.ceil((donutTarget - current) / 12));
      setDonutValue(Math.min(current, donutTarget));
      if (current < donutTarget) raf = requestAnimationFrame(animate);
    };
    animate();
    return () => raf && cancelAnimationFrame(raf);
  }, [donutTarget]);

  useEffect(() => {
    const id = setInterval(() => {
      setRadarData((prev) => prev.map((d) => {
        const jitter = Math.random() * 6 - 3;
        let next = Math.min(95, (profile.skills[d.subject] || 0) + jitter);
        next = Math.max(0, next);
        return { ...d, A: Math.round(next) };
      }));
    }, 1500);
    return () => clearInterval(id);
  }, [profile.skills]);

  // 過濾
  const filtered = useMemo(() => {
    const source = recommendationsSafe;
    if (mode === "keyword" && query.trim()) {
      const q = query.trim().toLowerCase();
      return source.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.reason || "").toLowerCase().includes(q)
      );
    }
    if (mode === "level") return source.filter((r) => userFitsCourse(profile.level, r.level));
    if (mode === "topic") return source.filter((r) => r.tags.includes(topicSel));
    return source;
  }, [mode, query, topicSel, profile.level, recommendationsSafe]);

  // 回報搜尋行為（可選）
  useEffect(() => {
    onSearch?.({ mode, query, level: profile.level, topic: topicSel });
  }, [mode, query, topicSel, profile.level, onSearch]);

  
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      {/* 頂部：個人摘要 */}
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">嗨，{profile.studentName} </h1>
          <p className="opacity-70 mt-1">為你整理可解釋的學習推薦清單</p>
        </div>
      </div>

      {/* 升級差距 Hero 卡（固定 75%） */}
      {band?.code !== "C2" && (
        <GapHeroCard
          band={band}                    // 顯示 B1→B2 等等
          // ✅ 用「積分制」驅動進度與文案
          pointsEarned={pointsEarned}    // 已累積分
          pointsGoal={pointsGoal}        // 升級門檻分（多半可用 band.next）
          pointsUnit="小時"       // 單位顯示用小時
          displayDecimals={1}     // 顯示到 1 位小數

          characterType="lottie"
          characterJson={runnerSimple}
          characterSize={125}
          characterAnchorX={0.48}
          characterFootPx={12}
          characterOffsetY={3}

          onActionClick={scrollToRecommendations}
          isUnlocked={isUnlocked}
          onGoExam={handleGoExam}
          trophyLottieJson={premium}
          trophySize={250}
        />
      )}

      {/* 歷程總覽卡 */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">目前程度</p>
              <p className="text-xl font-semibold">{profile.level}</p>
            </div>
            <BookOpenCheck className="size-6" />
          </div>
          <div className="mt-4">
            <p className="text-sm opacity-70 mb-2">本級掌握度</p>
            <ProgressBarSmooth percent={Number(profile.progress) || 0} delay={0} />
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">近 30 天完成率</p>
              <p className="text-xl font-semibold">{Math.round((profile.completionRate || 0) * 100)}%</p>
            </div>
            <Clock className="size-6" />
          </div>
          <div className="mt-4">
            <p className="text-sm opacity-70">偏好主題</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.interests ?? []).map((i) => <Pill key={i}>{i}</Pill>)}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">近 7 天點擊</p>
              <p className="text-xl font-semibold">{profile.clickStats?.last7Days ?? 0}</p>
            </div>
            <History className="size-6" />
          </div>
          <div className="mt-4">
            <p className="text-sm opacity-70">熱門標籤</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.clickStats?.topTags ?? []).map((t) => <Pill key={t}>{t}</Pill>)}
            </div>
          </div>
        </div>
      </section>

      {/* 學習力圖表（雷達 + Donut） */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">能力雷達圖</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={90}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar name="你" dataKey="A" stroke={ACCENT} fill={ACCENT} fillOpacity={0.25} isAnimationActive />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs opacity-70">* 圖表每 1.5 秒依據最新學習紀錄微幅更新（示範）。</p>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">近 30 天完成率</h3>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ name: "完成", value: donutValue }, { name: "未完成", value: 100 - donutValue }]}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={95}
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive
                >
                  <Cell fill={ACCENT} />
                  <Cell fill="#E5E7EB" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: ACCENT }}>{donutValue}%</div>
                <div className="text-xs opacity-70">完成率</div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs opacity-70">* 初次載入時以平滑動畫遞增至目前值。</p>
        </div>
      </section>

      {/* 搜尋控制列 */}
      <section className="rounded-2xl border p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SearchModeTab mode={mode} setMode={setMode} />
          <div className="flex items-center gap-2 text-sm" style={{ color: ACCENT }}>
            <Filter className="size-4" />
            <span>{mode === "level" ? `依照你的目前程度（${profile.level}）推薦課程` : "選擇一種模式開始搜尋"}</span>
          </div>
        </div>

        {mode === "topic" && (
          <ShowWithFade dep={mode}>
            <ActiveBox active>
              <ListFilter className="size-4" />
              <select
                className="flex-1 bg-transparent outline-none"
                value={topicSel}
                onChange={(e) => setTopicSel(e.target.value)}
              >
                {(searchIndexSafe.topics).map((tp) => (
                  <option key={tp} value={tp}>{tp}</option>
                ))}
              </select>
            </ActiveBox>
          </ShowWithFade>
        )}

        {mode === "keyword" && (
          <ShowWithFade dep={mode}>
            <ActiveBox active>
              <Search className="size-4" />
              <input
                className="flex-1 bg-transparent outline-none"
                value={query}
                placeholder="輸入關鍵字（例：旅行、看圖說故事）"
                onChange={(e) => setQuery(e.target.value)}
              />
            </ActiveBox>
          </ShowWithFade>
        )}
      </section>

      {/* 推薦清單 */}
      <section id="rec-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Sparkles className="size-5" /> 為你推薦
          </h2>
          <button className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1">
            檢視推薦邏輯說明 <ChevronRight className="size-4" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-center opacity-70">
            找不到符合條件的結果，試試其他模式或換個關鍵字。
          </div>
        ) : (
          <ShowMoreRecommendations items={filtered} onOpen={onOpenCourse} initially={2} />
        )}
      </section>
    </div>
  );
}
