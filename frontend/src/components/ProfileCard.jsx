// src/components/ProfileCard.jsx
export default function ProfileCard({
  name,
  username,
  email,
  schoolingStatus,
  accountType,
  avatarUrl,
  onUpgradeTeacher,
  onEditSchool,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* 頭像 */}
      <img
        src={avatarUrl}
        alt={name}
        className="w-32 h-32 rounded-full object-cover border"
      />

      {/* 資料區 */}
      <div className="flex-1 space-y-2">
        <div className="text-lg font-semibold text-slate-800">{name}</div>
        <div className="text-slate-600">帳號：{username}</div>
        <div className="text-slate-600">信箱：{email}</div>
        <div className="text-slate-600">就學狀態：{schoolingStatus}</div>
        <div className="text-slate-600">帳號狀態：{accountType}</div>

        <p className="text-red-600 text-sm mt-2">
          學生若申請教師帳號，將喪失比賽及活動的權利。
        </p>

        {/* 按鈕 */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={onUpgradeTeacher}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-sm text-sm"
          >
            升級成為教師帳號
          </button>
          <button
            onClick={onEditSchool}
            className="px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg shadow-sm text-sm"
          >
            ✎ 修改學校
          </button>
        </div>
      </div>
    </div>
  );
}
