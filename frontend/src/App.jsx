// src/App.jsx
import { useState, useEffect } from "react";
import Header from "./Header";
import ProgressProfileCard from "./components/ProgressProfileCard";
import ProfileCard from "./components/ProfileCard";
import StudentRecommendationDashboard from "./components/StudentRecommendationDashboard";

export default function App() {
  const [tab, setTab] = useState("overview"); // overview = 學生學習狀況, profile = 個人檔案
  const [studentData, setStudentData] = useState(null); // 後端資料
  const userId = 124; // 範例 user_id，可改成動態 2274978  124 4

  // 從後端抓資料
  useEffect(() => {
    fetch(`/api/chat/mdl_user/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("後端回傳原始資料:", data);
        if (data.success) {
          setStudentData(data.data);
        } else {
          console.warn("取得學生資料失敗:", data.message);
        }
})

      .catch(err => {
        console.error("取得學生資料時發生錯誤:", err);
      });
  }, [userId]);

  // 安全取得後端回傳的欄位
const profile = studentData?.profile || {};
const thirtyDayStats = studentData?.thirty_day_stats || {};
const categoryProgress = studentData?.category_progress || [];
const courseCompletedCount = studentData?.course_completed_count || 0;
const userDegree = studentData?.user_degree || "";


  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full bg-gradient-to-b from-[#F7F7F7] to-[#ECECEC]">
        <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
          {/* 頂部分頁 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("overview")}
              className={`px-4 py-2 rounded-2xl border-2 ${
                tab === "overview"
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-white border-slate-200"
              }`}
            >
              學生學習狀況
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`px-4 py-2 rounded-2xl border-2 ${
                tab === "profile"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                  : "bg-white border-slate-200"
              }`}
            >
              個人檔案
            </button>
          </div>

          {tab === "overview" ? (
            <>
              {/* 儀表板抬頭：個人＋進度摘要 */}
              <ProgressProfileCard
                name={
                  studentData?.profile
                    ? `${studentData.profile.lastname || ""}${studentData.profile.firstname || ""}`
                    : "學生"
                }
                avatarUrl="https://placehold.co/160x160"
                stats={[
                  {
                    label: "本週學習時數",
                    value: `${thirtyDayStats?.weekly_hours || 0} 小時`,
                  },
                  {
                    label: "完成課程",
                     value: courseCompletedCount,
                  },
                  {
                    label: "連續7天登入",
                    value: `${profile?.loginday || 0} 天`,
                  },
                ]}
                categories={categoryProgress.length
                  ? categoryProgress.map(c => ({
                      name: c.category_group,
                      progress: Number(c.completion_percent),
                    }))
                  : [
                      { name: "閱讀", progress: 0 },
                      { name: "文法", progress: 0 },
                      { name: "字彙", progress: 0 },
                      { name: "口說", progress: 0 },
                    ]}
              />

              {/* 儀表板（雷達、甜甜圈、推薦） */}
            <section className="bg-white border rounded-2xl shadow-sm">
              <StudentRecommendationDashboard
                // 把後端的 profile 展開進來，再覆蓋學習時數欄位
                profile={{
                  ...(studentData?.profile ?? {}),     // 這裡會帶到 username / firstname / lastname ...
                  learn_minutes_total: 30 * 60,
                  required_hours: 60,
                }}
                thirtyDayStats={studentData?.thirty_day_stats ?? {}}
                categoryProgress={studentData?.category_progress ?? []}
                courseCompletedCount={studentData?.course_completed_count ?? 0}
                userDegree={studentData?.user_degree ?? ""}
              />
          </section>


            </>
          ) : (
            <>
              {/* 個人檔案頁（舊的 ProfileCard） */}
              <ProfileCard
                name={
                  studentData?.profile
                    ? `${studentData.profile.lastname || ""}${studentData.profile.firstname || ""}`
                    : "學生"
                }
                username={studentData?.profile?.username || "tim1357929"}
                email={studentData?.profile?.email || "tim1357929@gmail.com"}
                schoolingStatus="其他"
                accountType="學生帳號"
                avatarUrl="https://via.placeholder.com/300"
                onUpgradeTeacher={() => alert("升級為教師帳號（示意）")}
                onEditSchool={() => alert("修改學校（示意）")}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
