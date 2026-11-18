import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const antIcon = <LoadingOutlined style={{ fontSize: 36, color: '#6366f1' }} spin />;

export const FullPageSpinner = () => (
  <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <Spin indicator={antIcon} />
    <p className="mt-4 text-slate-600 font-medium text-sm">Preparing workspace...</p>
  </div>
);

export const InlineSpinner = ({ size = 'default', text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-12">
    <Spin size={size} />
    {text && <p className="mt-3 text-slate-400 text-xs">{text}</p>}
  </div>
);

export default FullPageSpinner;
