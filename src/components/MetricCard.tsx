import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  subLabel: string;
  subValue: string;
  sensorBadge?: string;
  statusBadge?: {
    text: string;
    bgColor: string;
    textColor: string;
    borderColor?: string;
  };
  min: number;
  max: number;
  delta?: number;
  deltaUnit?: string;
  colorTheme: 'blue' | 'navy' | 'cyan' | 'amber' | 'purple' | 'slate';
  historyValues?: number[];
  decimalPlaces?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  subLabel,
  subValue,
  sensorBadge,
  statusBadge,
  min,
  max,
  delta = 0,
  deltaUnit = '',
  colorTheme = 'blue',
  historyValues = [],
  decimalPlaces = 1,
}) => {
  const themeStyles = {
    navy: {
      border: 'border-slate-200 hover:border-[#002855]/50',
      iconBg: 'bg-[#002855]/10 text-[#002855]',
      accent: 'text-[#002855]',
      sparkColor: '#002855',
    },
    blue: {
      border: 'border-slate-200 hover:border-blue-500/50',
      iconBg: 'bg-blue-50 text-blue-700',
      accent: 'text-blue-700',
      sparkColor: '#1d4ed8',
    },
    cyan: {
      border: 'border-slate-200 hover:border-[#00a896]/50',
      iconBg: 'bg-[#00a896]/10 text-[#00a896]',
      accent: 'text-[#00a896]',
      sparkColor: '#00a896',
    },
    amber: {
      border: 'border-slate-200 hover:border-amber-500/50',
      iconBg: 'bg-amber-50 text-amber-700',
      accent: 'text-amber-700',
      sparkColor: '#d97706',
    },
    purple: {
      border: 'border-slate-200 hover:border-purple-500/50',
      iconBg: 'bg-purple-50 text-purple-700',
      accent: 'text-purple-700',
      sparkColor: '#7c3aed',
    },
    slate: {
      border: 'border-slate-200 hover:border-slate-400',
      iconBg: 'bg-slate-100 text-slate-700',
      accent: 'text-slate-700',
      sparkColor: '#475569',
    },
  }[colorTheme];

  // SVG Sparkline
  const renderSparkline = () => {
    if (historyValues.length < 2) return null;
    const width = 110;
    const height = 26;
    const minVal = Math.min(...historyValues);
    const maxVal = Math.max(...historyValues);
    const range = maxVal - minVal || 1;
    const points = historyValues
      .map((val, idx) => {
        const x = (idx / (historyValues.length - 1)) * width;
        const y = height - ((val - minVal) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-20 h-5 overflow-visible opacity-75"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={themeStyles.sparkColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md relative overflow-hidden flex flex-col justify-between ${themeStyles.border}`}
    >
      <div>
        {/* Top Header: Title & Minimalist Icon */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {title}
              </span>
              {sensorBadge && (
                <span className="text-[10px] px-1.5 py-0.5 font-mono font-medium bg-slate-100 text-slate-600 rounded">
                  {sensorBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span>{subLabel}:</span>
              <span className="font-medium text-slate-700">{subValue}</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-lg shrink-0 ${themeStyles.iconBg}`}>
            <Icon className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>

        {/* Main Metric Value */}
        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={value}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.4, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-slate-900 tabular-nums"
              >
                {typeof value === 'number' ? value.toFixed(decimalPlaces) : value}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm font-semibold text-slate-500 ml-1.5 font-mono">
              {unit}
            </span>
          </div>
          <div className="hidden sm:block">{renderSparkline()}</div>
        </div>

        {/* Status Badge if present */}
        {statusBadge && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor || 'border-transparent'}`}
            >
              {statusBadge.text}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Range & Delta */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 font-mono">
          <span>Min: <strong className="text-slate-700">{min.toFixed(decimalPlaces)}</strong></span>
          <span className="text-slate-300">/</span>
          <span>Max: <strong className="text-slate-700">{max.toFixed(decimalPlaces)}</strong></span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {delta > 0.05 ? (
            <span className="text-emerald-700 flex items-center gap-0.5 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{delta.toFixed(decimalPlaces)}{deltaUnit}
            </span>
          ) : delta < -0.05 ? (
            <span className="text-blue-700 flex items-center gap-0.5 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {delta.toFixed(decimalPlaces)}{deltaUnit}
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-0.5">
              <Minus className="w-3.5 h-3.5" />
              0.0{deltaUnit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
