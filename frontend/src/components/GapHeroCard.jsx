// src/components/GapHeroCard.jsx
import React from "react";
import Lottie from "lottie-react";
import { Lock } from "lucide-react";
import flameJson from "@/assets/Fire.json";


const ACCENT = "#12B6C8";
const ACCENT_LIGHT = "#12B6C820";
const ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

// ---------- utils ----------
const clamp0100 = (n) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));
const num = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

// ---------- 小元件：資訊 Pill ----------
const Pill = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border bg-white/90 text-gray-800 text-sm font-medium">
    {children}
  </span>
);

// ---------- 進度條 + 角色（腳踩在線、不跳動） ----------
function RunnerProgress({
  value = 0,
  widthClass = "w-full",
  accent = ACCENT,

  // 角色：'emoji' | 'lottie' | 'img'
  characterType = "emoji",
  characterJson,
  characterSrc,

  // 尺寸/對齊
  characterSize = 56,
  characterAnchorX = 0.48, // 0=左、0.5=中、1=右
  characterOffsetX = 0,
  characterOffsetY = 0,
  characterFootPx = 16,

  showPercent = true,
}) {
  const target = clamp0100(value);
  const [pos, setPos] = React.useState(0);

  // 平滑移動
  React.useEffect(() => {
    let raf;
    const from = pos;
    const to = target;
    const dur = 900;
    let start;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setPos(from + (to - from) * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // 角色只初始化一次，避免重播/閃爍
  const CharacterEl = React.useMemo(() => {
    const style = { width: characterSize, height: characterSize };
    if (characterType === "lottie" && characterJson) {
      return <Lottie animationData={characterJson} loop autoplay style={style} />;
    }
    if (characterType === "img" && characterSrc) {
      return <img src={characterSrc} alt="runner" style={style} />;
    }
    return (
      <div className="text-3xl leading-none" style={{ lineHeight: 1 }}>
        🏃‍♂️
      </div>
    );
  }, [characterType, characterJson, characterSrc, characterSize]);

  // 幾何：讓腳踩在線
  const trackHeight = 14;
  const containerH = Math.max(64, characterSize + 16);
  const trackTopY = trackHeight; // 以容器底為 0
  const runnerBottom = trackTopY - characterFootPx + characterOffsetY;

  return (
    <div className={widthClass}>
      <div className="relative select-none" style={{ height: containerH }}>
        {/* 跑道 */}
        <div
          className="absolute left-0 right-0 rounded-full bg-gray-200 overflow-hidden"
          style={{ bottom: 0, height: trackHeight }}
        >
          <div className="h-full" style={{ width: `${pos}%`, background: accent }} />
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0 12px, rgba(0,0,0,.08) 12px 16px)",
            }}
          />
        </div>

        {/* 角色（腳踩在線） */}
        <div
          className="absolute"
          style={{
            left: `${pos}%`,
            bottom: runnerBottom,
            transform: `translateX(calc(-${characterAnchorX * 100}% + ${characterOffsetX}px))`,
            willChange: "transform",
          }}
        >
          {CharacterEl}
        </div>
      </div>

      {showPercent && (
        <div className="text-right text-sm md:text-base mt-1 font-semibold text-gray-800">
          {Math.round(pos)}%
        </div>
      )}
    </div>
  );
}

// ---------- 主卡片（更均衡排版） ----------
export default function GapHeroCard({
  currentValue,                 // 0–100（在本級距中的分數）
  band,                         // { code, lower, next }
  onActionClick,
  percentOverride,              // 直接指定 0–100 的百分比


   //若達到100%時顯示Lottie獎盃
  trophyLottieJson,
  trophySize = 140,
  trophyLoop = true,

  // 角色設定（透傳）
  characterType = "emoji",
  characterJson,
  characterSrc,
  characterSize = 56,
  characterAnchorX,
  characterOffsetX,
  characterOffsetY,
  characterFootPx,

  pointsEarned,                 // 已累積分數（由上課時數換算）
  pointsGoal,                   // 升級門檻分數
  pointsUnit = "分",
  displayDecimals = 0,   

  hideIfNoScore = true,
  isUnlocked = false,
  onGoExam,

}) {
  if (!band || !band.code) return null;

    const hasPointsMode = Number.isFinite(pointsEarned) && Number.isFinite(pointsGoal);
    const hasCurrent = Number.isFinite(currentValue);
    const hasOverride = Number.isFinite(percentOverride);
    if (!hasPointsMode && !hasCurrent && !hasOverride && hideIfNoScore) return null;

    let percent, shownPoints, remain, goalPoints;

    const fmt = (v) => {
      const f = Number(v) || 0;
      if (displayDecimals <= 0 ) 
        return String(Math.round(f));
      const p = 10 ** displayDecimals;
      return String(Math.round(f * p) / p);
    };

    if (hasPointsMode) {
      goalPoints  = Math.max(1, num(pointsGoal, 1));
      shownPoints = Math.max(0, num(pointsEarned, 0));
      percent     = clamp0100((shownPoints / goalPoints) * 100);
      remain      = Math.max(0, Math.ceil(goalPoints - shownPoints));
    } else {
      // 舊：以 CEFR_BOUNDS 區間計算
      const lower = num(band.lower, 0);
      const next  = num(band.next, 100);
      const cur   = clamp0100(num(currentValue, 0));
      const autoPercent =
        next - lower > 0 ? clamp0100(((cur - lower) / (next - lower)) * 100) : 100;
      percent =
        percentOverride != null ? clamp0100(num(percentOverride, 0)) : autoPercent;
      shownPoints = lower + (next - lower) * (percent / 100);
      goalPoints  = next;
      remain      = Math.max(0, goalPoints - shownPoints);
  }

  const reached = percent >= 100;

  const nextIdx = ORDER.indexOf(String(band.code || "").toUpperCase());
  const currentCode = nextIdx > 0 ? ORDER[nextIdx - 1] : ORDER[0];
  const ladderText = `${currentCode}→${band.code}`;

  const isComplete = isUnlocked || percent >= 100; // 滿100%就視為完成

  return (
    <section
      className="rounded-[28px] border-4 md:border-[5px] border-black p-6 md:p-8"
    style={{ background: "#FFFBEB" }}
    >
      <div className="grid gap-8 md:grid-cols-12 items-center">
        {/* 左側：標題 + 主訊息 + 數值 Pill + CTA */}
        <div className="md:col-span-7 lg:col-span-7 text-gray-900">
          <p className="text-sm md:text-base font-semibold text-gray-700">
            {isComplete ? <>升級完成（達 {band.code}）</> : <>升級進度（往 {band.code}）</>}
          </p>

          <h2 className="mt-1 text-3xl md:text-4xl font-black tracking-tight">
            {isComplete ? <>目標達成 {band.code}</> : <>目標 {band.code}</>}
          </h2>
          
          {isComplete ? (
            <p className="mt-3 text-lg md:text-xl leading-relaxed">
              <span className="font-extrabold" style={{ color: ACCENT }}>恭喜你達成時數！</span>{" "}
              接下來就用「最終考驗」來測試你的真正實力吧！
            </p>
          ) : (
            <p className="mt-3 text-lg md:text-xl leading-relaxed">
                你已累積 <span className="font-extrabold" style={{ color: ACCENT }}>
                  {fmt(shownPoints)}
                </span>{pointsUnit} / 目標{" "}
                <span className="font-extrabold" style={{ color: ACCENT }}>
                  {fmt(goalPoints)}
                </span>{pointsUnit}（{Math.round(percent)}%），再累積{" "}
                <span className="font-extrabold" style={{ color: ACCENT }}>
                  {fmt(remain)}
                </span>{pointsUnit} 就能準備升級！
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>已累積 <strong>{fmt(shownPoints)}</strong> / <strong>{fmt(goalPoints)}</strong> {pointsUnit}</Pill>
            {!isComplete && <Pill>差距 <strong>{fmt(remain)}</strong> {pointsUnit}</Pill>}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            {/* 立即衝刺 */}
            {!isComplete && (
            <button
              onClick={onActionClick}
              className="px-6 py-3 rounded-2xl font-extrabold text-white shadow-md hover:shadow-lg transition"
              style={{ background: ACCENT, boxShadow: `0 6px 0 ${ACCENT_LIGHT}` }}
            >
              立刻衝刺！！
            </button>
            )}
            {/* 進入最終考驗 */}
            <button
              onClick={isUnlocked ? onGoExam : undefined}
              disabled={!isUnlocked}
              className={`px-6 py-3 rounded-2xl font-extrabold transition inline-flex items-center gap-2 ${
                isUnlocked
                  ? "text-white shadow-md hover:shadow-lg"
                  : "opacity-60 cursor-not-allowed bg-gray-100 text-gray-600 border-gray-200"
              }`}
              style={isUnlocked ? { background: "linear-gradient(135deg, #F97316 0%, #FDBA74 100%)", boxShadow: `0 6px 0 ${ACCENT_LIGHT}` } : {}}
            >
              {isUnlocked ? (
              // 用 Lottie 的火焰圖
              <span className="inline-flex items-center justify-center pointer-events-none"
                    style={{ width: 24, height: 24, filter: "drop-shadow(0 0 6px rgba(255,160,0,.75))" }}>
                <Lottie
                  animationData={flameJson}
                  loop
                  autoplay
                  style={{ width: 24, height: 24 }}
                />
              </span>
            ) : (
              <Lock className="size-5" />
            )}
            進入最終考驗！
            </button>

          </div>

        </div>

        {/* 右側：進度條 + 角色 */}
        <div className="md:col-span-5 lg:col-span-5">
          {isComplete ? (
            // ✅ 完成：只顯示獎盃 Lottie
            <div className="h-[120px] flex items-center justify-end">
              {trophyLottieJson && (
                <Lottie
                  animationData={trophyLottieJson}
                  loop={trophyLoop}
                  autoplay
                  style={{ width: trophySize, height: trophySize }}
                />
              )}
            </div>
          ) : (
          <RunnerProgress
            value={percent}
            accent={ACCENT}
            characterType={characterType}
            characterJson={characterJson}
            characterSrc={characterSrc}
            characterSize={characterSize}
            characterAnchorX={characterAnchorX}
            characterOffsetX={characterOffsetX}
            characterOffsetY={characterOffsetY}
            characterFootPx={characterFootPx}
            showPercent
          />
          )}
        </div>
      </div>
    </section>
  );
}
