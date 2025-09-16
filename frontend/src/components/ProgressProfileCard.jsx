// src/components/ProgressProfileCard.jsx
import React, { useEffect, useState } from "react";

const ACCENT = "#12B6C8";

export default function ProgressProfileCard({
  name = "同學仇",
  avatarUrl = "https://placehold.co/160x160",
  stats = [
    { label: "本週學習時數", value: "3.5 小時" },
    { label: "完成課程", value: "12" },
    { label: "連續登入", value: "7 天" },
  ],
  categories = [
    { name: "閱讀", progress: 72 },
    { name: "文法", progress: 45 },
    { name: "字彙", progress: 58 },
    { name: "口說", progress: 36 },
  ],
}) {
  // 依據 categories 生成動畫中的百分比（用來驅動寬度與文字）
  const [animatedPercents, setAnimatedPercents] = useState(
    categories.map(() => 0)
  );

  useEffect(() => {
    // 重置為 0 以便重新播放動畫
    setAnimatedPercents(categories.map(() => 0));

    // 下一個 frame 再把目標值塞進去，觸發 CSS transition
    const id = requestAnimationFrame(() => {
      setAnimatedPercents(categories.map((c) => clampPercent(c.progress)));
    });
    return () => cancelAnimationFrame(id);
  }, [categories]);

  return (
    <section className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-center">
        {/* 左：頭像 + 名稱 */}
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover ring-4"
            style={{ boxShadow: `0 0 0 4px ${ACCENT}20` }}
          />
          <div>
            <div className="text-xl font-bold">{name}</div>
            <div className="text-slate-500 text-sm">學生學習狀況 · 概覽</div>
          </div>
        </div>

        {/* 右：統計＋小型進度 */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* 三個統計卡 */}
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border p-4 bg-slate-50">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-lg font-extrabold mt-1">{s.value}</div>
            </div>
          ))}

          {/* 類別小進度（可左右捲） */}
          <div className="md:col-span-3 overflow-x-auto">
            <div className="min-w-[420px] grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((c, i) => {
                const percent = clampPercent(animatedPercents[i] ?? 0);
                return (
                  <div key={c.name} className="rounded-xl border p-3">
                    <div className="text-sm font-medium">{c.name}</div>

                    {/* 軌道 */}
                    <div className="h-2 rounded bg-slate-100 mt-2 overflow-hidden">
                      {/* 進度條（寬度動畫 + 依序延遲） */}
                      <div
                        className="h-2 rounded"
                        style={{
                          width: `${percent}%`,
                          background: ACCENT,
                          transitionProperty: "width",
                          transitionDuration: "700ms",
                          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                          transitionDelay: `${i * 100}ms`,
                        }}
                      />
                    </div>

                    {/* 百分比數字（同步遞增） */}
                    <div className="text-xs text-slate-500 mt-1">
                      完成 {Math.round(percent)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 保護：避免傳入超過 0~100 的值造成樣式溢出 */
function clampPercent(n) {
  const x = Number.isFinite(n) ? n : 0;
  return Math.max(0, Math.min(100, x));
}
