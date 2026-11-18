import { Empty, Button } from 'antd';

const EmptyState = ({ title = 'No records found', description, action, actionText = 'Create New' }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div className="text-center mt-2">
          <p className="text-slate-700 font-semibold text-base">{title}</p>
          {description && <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">{description}</p>}
        </div>
      }
    >
      {action && (
        <Button
          type="primary"
          onClick={action}
          className="mt-4 rounded-xl font-medium"
          style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
        >
          {actionText}
        </Button>
      )}
    </Empty>
  </div>
);

export default EmptyState;
