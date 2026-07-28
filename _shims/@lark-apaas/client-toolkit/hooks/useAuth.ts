import { useContext } from 'react';

export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
  };
}
export default useAuth;
