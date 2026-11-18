import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, accessToken } = useSelector((state) => state.auth);
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    role: user?.role,
    tenantId: user?.tenantId,
  };
};

export default useAuth;
