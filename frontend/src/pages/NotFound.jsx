import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Result
        status="404"
        title="404 — Page Not Found"
        subTitle="Sorry, the page or menu link you requested does not exist."
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            className="rounded-xl font-bold"
            style={{ backgroundColor: '#386b58', borderColor: '#386b58' }}
          >
            Go to Platform Home
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
