import React from "react";

export default function LevelRibbon({ progress = 0, text = "" }) {
  return (
    <div className="sticky top-0 z-40">
      <div className="backdrop-blur bg-white/80 border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-3">
          <span className="text-sm">{text}</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2" style={{ width: `${progress}%`, backgroundColor: "#12B6C8" }} />
          </div>
          <span className="text-xs text-gray-600 w-10 text-right">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
