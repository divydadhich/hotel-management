import { Card, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'up',
  color = '#6366f1',
  loading = false,
  prefix,
}) => {
  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white">
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm border border-slate-100 bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase mb-1">{title}</p>
          <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {prefix && <span className="text-lg mr-1 text-slate-500">{prefix}</span>}
            {value ?? '-'}
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center mt-2 text-xs font-semibold ${
                changeType === 'up' ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {changeType === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span className="ml-1">{Math.abs(change)}% vs yesterday</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-md ml-4 flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
