import { useSelector } from 'react-redux';

const useTenant = () => {
  const { currentTenant, tenants, isLoading, error, pagination } = useSelector((state) => state.tenant);
  return { currentTenant, tenants, isLoading, error, pagination };
};

export default useTenant;
