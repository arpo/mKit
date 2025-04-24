import { create } from 'zustand';

export interface LoginState {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useLoginStore = create<LoginState>(() => ({
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
  isLoading: false,
  error: null,
}));

export const login = (password: string) => {
  useLoginStore.setState({ isLoading: true, error: null });

  if (password.toLowerCase() === 'elvis'.toLowerCase()) {
    localStorage.setItem('isLoggedIn', 'true');
    useLoginStore.setState({ isLoggedIn: true, isLoading: false, error: null });
    return true;
  } else {
    useLoginStore.setState({
      isLoading: false,
      error: 'Incorrect password',
      isLoggedIn: false,
    });
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('isLoggedIn');
  useLoginStore.setState({ isLoggedIn: false, error: null });
};
