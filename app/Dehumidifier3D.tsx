"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

const MODES = [
  { id: "eco", label: "好強", power: 1 },
  { id: "high", label: "大佬", power: 3 },
  { id: "dry", label: "電神", power: 5 },
];

// 共用尺寸常數（Scene 層也要用到補光位置）
const S = 1.1;
const BODY_W = 2.2 * S;
const BODY_H = 3.2 * S;
const BODY_D = 1.6 * S;
const RIGHT_X = BODY_W / 2;
const FAN_Y = 0.3 * S;
const FAN_Z = 0;
const FAN_RADIUS = 0.38 * S;
const SLAT_COUNT = 7;
const SLAT_AREA_H = 0.9 * S;
const SLAT_AREA_D = 0.72 * S;
const SLAT_THICKNESS = 0.04 * S;
const SLAT_GAP = SLAT_AREA_H / (SLAT_COUNT - 1);
const TANK_W = 1.7 * S;
const TANK_H = 1.25 * S;
const TANK_D = BODY_D - 0.1;
const TANK_Y = -0.78 * S;
const TANK_Y_BOTTOM = TANK_Y - TANK_H / 2;
// 機身上半高度（從水箱上緣到機頂）
const TANK_TOP = TANK_Y + TANK_H / 2;
const BODY_TOP = BODY_H / 2;
const UPPER_H = BODY_TOP - TANK_TOP; // 上半段高度
const UPPER_CENTER_Y = TANK_TOP + UPPER_H / 2; // 上半段中心 Y

function DehumidifierModel({
  isPowerOn, activeModeId, waterLevel, isQualifiedKeelunger,
  onTogglePower, onSetMode, onEmptyWater,
}: {
  isPowerOn: boolean;
  activeModeId: string | null;
  waterLevel: number;
  isQualifiedKeelunger: boolean;
  onTogglePower: () => void;
  onSetMode: (id: string) => void;
  onEmptyWater: () => void;
}) {
  const fanRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // 風扇繞 X 軸旋轉；rotation.x 遞減 → 從 +X 方向看逆時鐘
    if (isPowerOn && waterLevel < 100 && fanRef.current && !isQualifiedKeelunger) {
      const speed = activeModeId === "high" ? 15 : activeModeId === "dry" ? 25 : 5;
      fanRef.current.rotation.x -= speed * delta;
    }

    // 水位從底部往上漲
    if (waterRef.current) {
      const targetH = Math.max((waterLevel / 100) * TANK_H * 0.93, 0.001);
      waterRef.current.scale.y = THREE.MathUtils.lerp(
        waterRef.current.scale.y,
        targetH,
        0.1
      );
      waterRef.current.position.y = TANK_Y_BOTTOM + waterRef.current.scale.y / 2;
    }
  });

  const indicatorColor = isQualifiedKeelunger ? "#a78bfa"
    : !isPowerOn ? "#3f3f46"
    : waterLevel >= 100 ? "#ef4444"
    : activeModeId === "high" ? "#3b82f6"
    : activeModeId === "dry" ? "#a855f7"
    : "#22c55e";

  const waterColor = waterLevel > 80 ? "#f87171" : "#60a5fa";
  const bodyColor = isQualifiedKeelunger ? "#e4e4e7" : "#f4f4f5";

  return (
    <group>

      {/* ══════════════════════════════════════
          機身上半（實體，含風扇區）
          ══════════════════════════════════════ */}
      <mesh position={[0, UPPER_CENTER_Y, 0]}>
        <boxGeometry args={[BODY_W, UPPER_H, BODY_D]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* ══════════════════════════════════════
          機身下半（水箱區）— 四面不透明側/背板 + 正面透明窗
          讓水位從正面可見
          ══════════════════════════════════════ */}

      {/* 左側板 */}
      <mesh position={[-BODY_W / 2 + 0.025, TANK_Y, 0]}>
        <boxGeometry args={[0.05, TANK_H + 0.04, BODY_D]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* 右側板 */}
      <mesh position={[BODY_W / 2 - 0.025, TANK_Y, 0]}>
        <boxGeometry args={[0.05, TANK_H + 0.04, BODY_D]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* 背板（Z-） */}
      <mesh position={[0, TANK_Y, -BODY_D / 2 + 0.025]}>
        <boxGeometry args={[BODY_W, TANK_H + 0.04, 0.05]} />
        <meshStandardMaterial color={bodyColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* 底板 */}
      <mesh position={[0, TANK_Y_BOTTOM - 0.025, 0]}>
        <boxGeometry args={[BODY_W, 0.05, BODY_D]} />
        <meshStandardMaterial color="#c4c4c8" roughness={0.3} />
      </mesh>

      {/* 正面透明玻璃窗（Z+ 面） */}
      <mesh position={[0, TANK_Y, BODY_D / 2 - 0.01]}>
        <boxGeometry args={[BODY_W - 0.08, TANK_H + 0.02, 0.035]} />
        <meshStandardMaterial
          color="#93c5fd"
          transparent
          opacity={0.14}
          roughness={0.0}
          metalness={0.0}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 透明窗邊框（4 邊） */}
      <mesh position={[0, TANK_TOP + 0.025, BODY_D / 2]}>
        <boxGeometry args={[BODY_W - 0.02, 0.045, 0.055]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.15} metalness={0.35} />
      </mesh>
      <mesh position={[0, TANK_Y_BOTTOM - 0.025, BODY_D / 2]}>
        <boxGeometry args={[BODY_W - 0.02, 0.045, 0.055]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.15} metalness={0.35} />
      </mesh>
      <mesh position={[-BODY_W / 2 + 0.05, TANK_Y, BODY_D / 2]}>
        <boxGeometry args={[0.045, TANK_H + 0.1, 0.055]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.15} metalness={0.35} />
      </mesh>
      <mesh position={[BODY_W / 2 - 0.05, TANK_Y, BODY_D / 2]}>
        <boxGeometry args={[0.045, TANK_H + 0.1, 0.055]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.15} metalness={0.35} />
      </mesh>

      {/* 水位 mesh（scale.y 動態，從底部上漲） */}
      <mesh ref={waterRef} position={[0, TANK_Y_BOTTOM, 0]}>
        <boxGeometry args={[BODY_W - 0.14, 1, TANK_D]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.78}
          roughness={0.05}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* LED 燈條（正面頂部）*/}
      <mesh position={[0, 1.45 * S, BODY_D / 2 + 0.01]}>
        <boxGeometry args={[1.6 * S, 0.18 * S, 0.04 * S]} />
        <meshStandardMaterial
          emissive={indicatorColor}
          emissiveIntensity={isPowerOn || isQualifiedKeelunger ? 2.0 : 0.15}
          color="#18181b"
        />
      </mesh>

      {/* ══════════════════════════════════════
          右側面：凹槽背板 + 風扇葉片 + 柵欄
          ══════════════════════════════════════ */}

      {/* 凹槽背板 */}
      <mesh position={[RIGHT_X - 0.05, FAN_Y, FAN_Z]}>
        <boxGeometry args={[0.06 * S, 0.95 * S, 0.78 * S]} />
        <meshStandardMaterial color="#27272a" />
      </mesh>

      {/* 風扇葉片群組（繞 X 軸，葉片在 Y-Z 平面延伸，從柵欄面 +X 可見） */}
      <group ref={fanRef} position={[RIGHT_X - 0.06, FAN_Y, FAN_Z]}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 3 / 2].map((rot, i) => (
          <mesh key={i} rotation={[rot, 0, 0]}>
            <boxGeometry args={[0.025 * S, FAN_RADIUS * 2, 0.1 * S]} />
            <meshStandardMaterial color="#71717a" metalness={0.4} roughness={0.3} />
          </mesh>
        ))}
        {/* 中軸（沿 X 方向） */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07 * S, 0.07 * S, 0.08 * S, 16]} />
          <meshStandardMaterial color="#52525b" metalness={0.7} />
        </mesh>
      </group>

      {/* 柵欄百葉 */}
      {Array.from({ length: SLAT_COUNT }).map((_, i) => {
        const y = FAN_Y - SLAT_AREA_H / 2 + i * SLAT_GAP;
        return (
          <mesh key={i} position={[RIGHT_X + 0.01, y, FAN_Z]}>
            <boxGeometry args={[0.05 * S, SLAT_THICKNESS, SLAT_AREA_D]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.3} metalness={0.15} />
          </mesh>
        );
      })}

      {/* 柵欄四邊外框 */}
      <mesh position={[RIGHT_X + 0.01, FAN_Y + SLAT_AREA_H / 2 + 0.02 * S, FAN_Z]}>
        <boxGeometry args={[0.05 * S, 0.04 * S, SLAT_AREA_D + 0.04 * S]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.3} />
      </mesh>
      <mesh position={[RIGHT_X + 0.01, FAN_Y - SLAT_AREA_H / 2 - 0.02 * S, FAN_Z]}>
        <boxGeometry args={[0.05 * S, 0.04 * S, SLAT_AREA_D + 0.04 * S]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.3} />
      </mesh>
      <mesh position={[RIGHT_X + 0.01, FAN_Y, FAN_Z + SLAT_AREA_D / 2 + 0.02 * S]}>
        <boxGeometry args={[0.05 * S, SLAT_AREA_H + 0.08 * S, 0.04 * S]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.3} />
      </mesh>
      <mesh position={[RIGHT_X + 0.01, FAN_Y, FAN_Z - SLAT_AREA_D / 2 - 0.02 * S]}>
        <boxGeometry args={[0.05 * S, SLAT_AREA_H + 0.08 * S, 0.04 * S]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.3} />
      </mesh>

      {/* ══════════════════════════════════════
          HTML 控制面板（機身正面中段，上移）
          ══════════════════════════════════════ */}
      <Html
        position={[0, -0.2 * S, BODY_D / 2 + 0.05]}
        center
        distanceFactor={6}
        zIndexRange={[0, 10]}
        style={{ pointerEvents: isQualifiedKeelunger ? "none" : "auto" }}
      >
        <div style={{
          width: 230,
          background: "rgba(24,24,27,0.93)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "12px 14px",
          userSelect: "none",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {MODES.map((mode) => {
              const active = activeModeId === mode.id && isPowerOn && waterLevel < 100;
              const colors: Record<string, string> = {
                eco: "#22c55e", high: "#3b82f6", dry: "#a855f7",
              };
              return (
                <button
                  key={mode.id}
                  disabled={!isPowerOn || waterLevel >= 100}
                  onClick={() => onSetMode(mode.id)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 10, border: "none",
                    fontSize: 12, fontWeight: 700,
                    cursor: isPowerOn && waterLevel < 100 ? "pointer" : "default",
                    background: active ? colors[mode.id] : "rgba(63,63,70,0.8)",
                    color: active ? "#fff" : "#a1a1aa",
                    opacity: !isPowerOn || waterLevel >= 100 ? 0.35 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onTogglePower}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 12, border: "none",
                fontSize: 13, fontWeight: 900, letterSpacing: "0.08em",
                cursor: "pointer",
                background: isPowerOn ? "#ef4444" : "#2563eb",
                color: "#fff", transition: "all 0.2s",
                boxShadow: isPowerOn
                  ? "0 0 16px rgba(239,68,68,0.4)"
                  : "0 0 16px rgba(37,99,235,0.4)",
              }}
            >
              {isPowerOn ? "OFF" : "START"}
            </button>
            <button
              onClick={onEmptyWater}
              style={{
                padding: "9px 14px", borderRadius: 12, border: "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: "rgba(63,63,70,0.9)", color: "#60a5fa",
              }}
            >
              倒水
            </button>
          </div>
          {waterLevel >= 100 && (
            <div style={{
              marginTop: 8, textAlign: "center", fontSize: 11,
              fontWeight: 700, color: "#f87171",
            }}>
              ⚠️ 該把水往窗戶外倒了
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export default function Dehumidifier3D({
  isPowerOn, activeModeId, waterLevel, isQualifiedKeelunger,
  onTogglePower, onSetMode, onEmptyWater,
}: {
  isPowerOn: boolean;
  activeModeId: string | null;
  waterLevel: number;
  isQualifiedKeelunger: boolean;
  onTogglePower: () => void;
  onSetMode: (id: string) => void;
  onEmptyWater: () => void;
}) {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Canvas
        camera={{ position: [2.5, 0.8, 7], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 8, 6]} intensity={1.0} />
        <pointLight position={[-5, 3, -2]} intensity={0.4} />
        <pointLight position={[0, -4, 3]} intensity={0.35} color="#60a5fa" />
        <pointLight position={[6, 2, 0]} intensity={0.5} color="#ffffff" />
        {/* 水箱區正面補光：讓水體透過透明窗可見 */}
        <pointLight position={[0, TANK_Y, 5]} intensity={1.4} color="#bfdbfe" />

        <DehumidifierModel
          isPowerOn={isPowerOn}
          activeModeId={activeModeId}
          waterLevel={waterLevel}
          isQualifiedKeelunger={isQualifiedKeelunger}
          onTogglePower={onTogglePower}
          onSetMode={onSetMode}
          onEmptyWater={onEmptyWater}
        />

        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}
