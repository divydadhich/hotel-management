import { Card, Skeleton } from 'antd';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'up',
  color = '#386b58',
  loading = false,
  prefix,
  subtitle,
}) => {
  if (loading) {
    return (
      <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white p-2">
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  const isPositive = changeType === 'up';

  return (
    <Card className="rounded-xl shadow-xs border border-slate-200/70 bg-white hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 text-[11px] font-semibold tracking-wider uppercase mb-1.5 truncate">
            {title}
          </p>
          <div className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight leading-none font-mono">
            {prefix && <span className="text-[17px] mr-1 text-slate-400 font-sans font-normal">{prefix}</span>}
            {value ?? '-'}
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            {change !== undefined ? (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold tracking-tight ${
                  isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isPositive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                <span>{Math.abs(change)}%</span>
              </span>
            ) : null}
            <span className="text-[11px] text-slate-400 truncate">
              {subtitle || (change !== undefined ? 'vs previous day' : '')}
            </span>
          </div>
        </div>

        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-700 bg-slate-50 border border-slate-100 flex-shrink-0"
            style={{ color }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
