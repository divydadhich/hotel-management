import { Inbox, Plus } from 'lucide-react';
import { Button } from 'antd';

const EmptyState = ({
  title = 'No records found',
  description = 'Get started by creating your first record in this view.',
  action,
  actionText = 'Create New',
  icon: CustomIcon,
}) => {
  const IconComponent = CustomIcon || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3.5 shadow-2xs">
        <IconComponent size={22} strokeWidth={1.75} />
      </div>
      <h3 className="text-slate-800 font-semibold text-sm mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-xs leading-relaxed mb-4">{description}</p>}
      {action && (
        <Button
          type="primary"
          onClick={action}
          icon={<Plus size={14} strokeWidth={2.5} />}
          className="rounded-lg font-medium text-xs h-9 px-4 shadow-xs"
          style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
