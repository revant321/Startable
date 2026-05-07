import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

export type TimerWheelState = 'pre-start' | 'running' | 'paused' | 'completed';

interface TimerWheelProps {
  state: TimerWheelState;
  /** Pre-start: minutes drag-selected (0-60 reference). */
  selectedMinutes: number;
  /** Running/paused/completed: seconds remaining. */
  remainingSeconds: number;
  /** Locked-in total session duration in seconds. Used as arc reference once running. */
  totalSessionSeconds: number;
  onMinutesChange: (m: number) => void;
  locked?: boolean;
  size?: number;
}

const VIEWBOX = 200;
const CENTER = VIEWBOX / 2;
const RADIUS = 84;
const STROKE = 12;
const VIOLET = '#7C5CFC';
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PRE_START_REFERENCE_MINUTES = 60;

export default function TimerWheel({
  state,
  selectedMinutes,
  remainingSeconds,
  totalSessionSeconds,
  onMinutesChange,
  locked = false,
  size = 280,
}: TimerWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const lastMinutesRef = useRef(selectedMinutes);
  const [isDragging, setIsDragging] = useState(false);

  const isInteractable = state === 'pre-start' && !locked;

  useEffect(() => {
    lastMinutesRef.current = selectedMinutes;
  }, [selectedMinutes]);

  const computeMinutes = (clientX: number, clientY: number): number => {
    const svg = svgRef.current;
    if (!svg) return selectedMinutes;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angleDeg < 0) angleDeg += 360;
    let minutes = Math.round(angleDeg / 6);
    if (minutes === 0) minutes = 60;

    const last = lastMinutesRef.current;
    const delta = minutes - last;
    if (delta > 30) minutes = 5;
    else if (delta < -30) minutes = 60;

    return Math.max(5, Math.min(60, minutes));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractable) return;
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const next = computeMinutes(e.clientX, e.clientY);
    lastMinutesRef.current = next;
    onMinutesChange(next);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !isInteractable) return;
    const next = computeMinutes(e.clientX, e.clientY);
    if (next !== lastMinutesRef.current) {
      lastMinutesRef.current = next;
      onMinutesChange(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  // Arc fraction (0..1):
  //  - pre-start: selectedMinutes / 60  (full circle = 60 min reference)
  //  - running/paused/completed: remainingSeconds / totalSessionSeconds  (full circle = locked-in duration)
  const arcFraction =
    state === 'pre-start'
      ? Math.max(0, Math.min(1, selectedMinutes / PRE_START_REFERENCE_MINUTES))
      : totalSessionSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / totalSessionSeconds))
      : 0;

  // Drag handle: positioned at the end of the pre-start arc.
  const handleAngleDeg = selectedMinutes * 6;
  const handleAngleRad = (handleAngleDeg * Math.PI) / 180;
  const handleX = CENTER + RADIUS * Math.sin(handleAngleRad);
  const handleY = CENTER - RADIUS * Math.cos(handleAngleRad);

  // Center display
  const totalSeconds =
    state === 'pre-start' ? selectedMinutes * 60 : remainingSeconds;
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const timeText = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  const arcOpacity = state === 'paused' ? 0.55 : 1;
  const isCompleted = state === 'completed';
  const dashOffset = CIRCUMFERENCE * (1 - arcFraction);

  // Smooth transitions:
  //  - During drag: instant (no transition) for responsive feel
  //  - Otherwise: short ease for smooth countdown ticks and the start-fill animation
  const arcTransition = isDragging
    ? 'none'
    : 'stroke-dashoffset 0.4s ease, opacity 0.2s ease';

  return (
    <motion.div
      style={{
        ...styles.wrap,
        width: size,
        height: size,
        touchAction: 'none',
        userSelect: 'none',
      }}
      animate={isCompleted ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        width={size}
        height={size}
        style={styles.svg}
      >
        <defs>
          <radialGradient id="completionPulse" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={VIOLET} stopOpacity="0" />
            <stop offset="80%" stopColor={VIOLET} stopOpacity="0.4" />
            <stop offset="100%" stopColor={VIOLET} stopOpacity="0" />
          </radialGradient>
        </defs>

        {isCompleted && (
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="url(#completionPulse)"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [0.9, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.2, repeat: 2 }}
          />
        )}

        {/* Background ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />

        {/* Progress arc — drawn as a circle with stroke-dasharray for smooth fraction animation. */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={VIOLET}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          opacity={arcOpacity}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          style={{
            transition: arcTransition,
            filter: 'drop-shadow(0 0 8px rgba(124,92,252,0.55))',
          }}
        />

        {/* Drag handle — only in pre-start */}
        {state === 'pre-start' && !locked && selectedMinutes > 0 && (
          <motion.circle
            cx={handleX}
            cy={handleY}
            r={isDragging ? 11 : 9}
            fill="#fff"
            stroke={VIOLET}
            strokeWidth={2.5}
            style={{
              filter: isDragging
                ? 'drop-shadow(0 0 12px rgba(124,92,252,0.9))'
                : 'drop-shadow(0 0 4px rgba(124,92,252,0.6))',
              cursor: 'grab',
            }}
          />
        )}

        {/* Capture surface — bigger hit area near the handle */}
        {isInteractable && (
          <circle
            cx={handleX}
            cy={handleY}
            r={22}
            fill="transparent"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}
      </svg>

      <div style={styles.centerOverlay}>
        <div
          style={{
            ...styles.timeText,
            fontSize: size > 300 ? 56 : 48,
          }}
        >
          {timeText}
        </div>
        {state === 'pre-start' && <div style={styles.label}>minutes</div>}
      </div>
    </motion.div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'visible',
    display: 'block',
  },
  centerOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  timeText: {
    color: '#fff',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: -1,
    textShadow: '0 0 20px rgba(124,92,252,0.4)',
    lineHeight: 1,
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    marginTop: 6,
    letterSpacing: 1,
  },
};
