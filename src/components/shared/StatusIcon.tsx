import type { CSSProperties } from 'react';
import { Check, Minus, X } from 'lucide-react';

export type StatusValue =
  | 'yes'
  | 'some'
  | 'no'
  | 'good'
  | 'okay'
  | 'missed';

type Tone = 'green' | 'amber' | 'red';

const TONE: Record<Tone, { color: string; bg: string; border: string }> = {
  green: {
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: 'rgba(52, 211, 153, 0.3)',
  },
  amber: {
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  red: {
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.3)',
  },
};

function meta(status: StatusValue): { tone: Tone; Icon: typeof Check } {
  switch (status) {
    case 'yes':
    case 'good':
      return { tone: 'green', Icon: Check };
    case 'some':
    case 'okay':
      return { tone: 'amber', Icon: Minus };
    case 'no':
    case 'missed':
    default:
      return { tone: 'red', Icon: X };
  }
}

interface StatusIconProps {
  status: StatusValue;
  size?: 'sm' | 'md' | 'lg';
  style?: CSSProperties;
}

const SIZE: Record<NonNullable<StatusIconProps['size']>, { box: number; icon: number }> = {
  sm: { box: 22, icon: 12 },
  md: { box: 32, icon: 16 },
  lg: { box: 52, icon: 24 },
};

export default function StatusIcon({ status, size = 'md', style }: StatusIconProps) {
  const { tone, Icon } = meta(status);
  const palette = TONE[tone];
  const dims = SIZE[size];
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dims.box,
        height: dims.box,
        borderRadius: '50%',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon size={dims.icon} color={palette.color} strokeWidth={2.5} />
    </span>
  );
}

export function statusToneColor(status: StatusValue): string {
  return TONE[meta(status).tone].color;
}
