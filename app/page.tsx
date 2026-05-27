"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Confetti from "react-confetti";

const Dehumidifier3D = dynamic(() => import("./Dehumidifier3D"), { ssr: false });

const MODES = [
  { id: "eco", label: "好強", power: 1, color: "bg-green-500" },
  { id: "high", label: "大佬", power: 3, color: "bg-blue-500" },
  { id: "dry", label: "電神", power: 5, color: "bg-purple-500" },
];

// ── 圖片彈窗：用 createPortal 掛到 body，fixed 定位，100% 不被遮 ──
function ImageOverlay({
  src,
  caption,
  subtext,
  onClose,
  glowColor = "rgba(255,255,255,0.3)",
}: {
  src: string;
  caption?: string;
  subtext?: string;
  onClose: () => void;
  glowColor?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {/* 防止圖片本身的點擊事件被攔截（點圖片也算關閉） */}
      <img
        src={src}
        alt=""
        onClick={onClose}
        style={{
          maxWidth: "82vw",
          maxHeight: "65vh",
          objectFit: "contain",
          borderRadius: 18,
          boxShadow: `0 0 80px ${glowColor}`,
          border: "1px solid rgba(255,255,255,0.1)",
          display: "block",
          pointerEvents: "none",
        }}
      />
      {caption && (
        <p style={{
          marginTop: 28,
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "0.04em",
          textShadow: `0 2px 20px ${glowColor}`,
          userSelect: "none",
          textAlign: "center",
        }}>
          {caption}
        </p>
      )}
      <p style={{
        marginTop: 14,
        color: "#71717a",
        fontSize: 13,
        userSelect: "none",
      }}>
        點擊任意處關閉
      </p>
    </div>,
    document.body
  );
}

export default function KeelungDehumidifier() {
  const [humidity, setHumidity] = useState(80);
  const [activeModeId, setActiveModeId] = useState<string | null>(null);
  const [waterLevel, setWaterLevel] = useState(0);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isQualifiedKeelunger, setIsQualifiedKeelunger] = useState(false);

  const [showDeerImg, setShowDeerImg] = useState(false);
  const [showYdhbdImg, setShowYdhbdImg] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 800, height: 600 };
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMode = MODES.find((m) => m.id === activeModeId);
      if (isPowerOn && currentMode && waterLevel < 100 && humidity > 0) {
        setHumidity((prev) => Math.max(prev - 0.5 * currentMode.power, 0));
        setWaterLevel((prev) => Math.min(prev + 0.2 * currentMode.power, 100));
      } else if (!isPowerOn && humidity < 85 && !isQualifiedKeelunger) {
        setHumidity((prev) => prev + 0.5);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPowerOn, activeModeId, waterLevel, humidity, isQualifiedKeelunger]);

  // 濕度歸零：先顯示 DEER 圖，關閉後才跳成就彈窗
  useEffect(() => {
    if (humidity <= 0 && !isQualifiedKeelunger) {
      setIsQualifiedKeelunger(true);
      setIsPowerOn(false);
      setShowConfetti(true);
      setShowDeerImg(true);
    }
  }, [humidity, isQualifiedKeelunger]);

  const handleCloseDeer = () => {
    setShowDeerImg(false);
    setShowAchievement(true);
  };

  const togglePower = () => {
    if (isQualifiedKeelunger) return;
    setIsPowerOn((prev) => {
      if (!prev && !activeModeId) setActiveModeId("eco");
      return !prev;
    });
  };

  const handleEmptyWater = () => {
    setWaterLevel(0);
    setShowYdhbdImg(true);
  };

  const resetChallenge = () => {
    setHumidity(80);
    setIsQualifiedKeelunger(false);
    setWaterLevel(0);
    setActiveModeId(null);
    setIsPowerOn(false);
    setShowAchievement(false);
    setShowConfetti(false);
  };

  return (
    <main className="relative w-full h-screen bg-zinc-950 overflow-hidden font-sans">

      {/* 彩帶（Confetti 本身已是 fixed，不受 overflow 影響） */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={400}
          gravity={0.05}
          colors={["#A78BFA", "#60A5FA", "#34D399", "#FBBF24", "#F87171"]}
        />
      )}

      {/* ── DEER 圖片彈窗（portal → body，fixed） ── */}
      {showDeerImg && (
        <ImageOverlay
          src="/picture/DEER.jpg"
          caption="祝你明年能跟這隻鹿一樣好好休息!"
          glowColor="rgba(167,139,250,0.5)"
          onClose={handleCloseDeer}
        />
      )}

      {/* ── YDHBD 圖片彈窗（portal → body，fixed） ── */}
      {showYdhbdImg && (
        <ImageOverlay
          src="/picture/YDHBD.jpg"
          glowColor="rgba(96,165,250,0.5)"
          onClose={() => setShowYdhbdImg(false)}
        />
      )}

      {/* 成就達成彈窗（DEER 關閉後出現） */}
      {showAchievement && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
        >
          <div className="bg-zinc-100 rounded-3xl p-10 text-center shadow-2xl shadow-purple-500/50 border-4 border-purple-400 max-w-lg scale-in-center">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-5xl font-black text-zinc-900 leading-tight mb-4 tracking-tighter">
              恭喜你除溼成功了！
            </h2>
            <p className="text-2xl text-purple-700 font-bold mb-8 leading-relaxed">
              你現在是個合格的
              <span className="bg-purple-200 px-2 py-1 rounded-lg">基隆人了</span>了。
            </p>
            <p className="text-zinc-600 mb-10 text-lg">
              在基隆能把濕度降到 0%，你拯救了海大學生！衣服終於不用烘乾了。
            </p>
            <button
              onClick={resetChallenge}
              className="bg-zinc-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-700 transition-all"
            >
              再次偷用宿舍的電
            </button>
          </div>
        </div>
      )}

      {/* 左上角 HUD：濕度顯示 */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className={`rounded-2xl px-5 py-4 text-white backdrop-blur-sm border transition-colors duration-500 ${
          isQualifiedKeelunger
            ? "bg-purple-600/80 border-purple-400/40"
            : "bg-zinc-900/80 border-zinc-700/40"
        }`}>
          <div className="text-[9px] uppercase tracking-widest opacity-60 mb-0.5">
            Rainy Port Humidity
          </div>
          <div className="text-4xl font-black italic tracking-tighter leading-none">
            {Math.round(humidity)}<span className="text-xl font-normal">%</span>
          </div>
          <div className="text-[9px] font-bold tracking-wider mt-1 opacity-80">
            {isQualifiedKeelunger
              ? "🏆 ACCOMPLISHED"
              : isPowerOn && waterLevel < 100
              ? "● FIGHTING MOISTURE"
              : "○ STANDBY"}
          </div>
        </div>
      </div>

      {/* 右上角 HUD：水箱水位 */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none">
        <div className="rounded-2xl px-5 py-4 text-white bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/40">
          <div className="text-[9px] uppercase tracking-widest opacity-60 mb-1">水箱水位</div>
          <div className="w-28 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                waterLevel > 90 ? "bg-red-500" : "bg-blue-400"
              }`}
              style={{ width: `${waterLevel}%` }}
            />
          </div>
          <div className="text-xs font-bold mt-1 text-right">
            {waterLevel > 90 ? (
              <span className="text-red-400 animate-pulse">⚠ 要滿出來了</span>
            ) : (
              <span className="text-zinc-400">{Math.round(waterLevel)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* 底部品牌文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <p className="text-[10px] font-bold tracking-wide text-zinc-600">
          除濕機v1.2(YD生日快樂)
        </p>
        <p className="text-[9px] opacity-40 text-zinc-500 mt-0.5">
          拖曳旋轉 · 點擊按鈕操作
        </p>
      </div>

      <Dehumidifier3D
        isPowerOn={isPowerOn}
        activeModeId={activeModeId}
        waterLevel={waterLevel}
        isQualifiedKeelunger={isQualifiedKeelunger}
        onTogglePower={togglePower}
        onSetMode={setActiveModeId}
        onEmptyWater={handleEmptyWater}
      />

      <style jsx global>{`
        @keyframes scale-in-center {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scale-in-center 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </main>
  );
}
