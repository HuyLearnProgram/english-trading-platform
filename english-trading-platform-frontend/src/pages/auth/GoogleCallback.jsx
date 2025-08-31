import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@contexts/AuthContext';

export default function GoogleCallback() {
  const { /* hàm mới ở dưới */ acceptExternalToken } = useContext(AuthContext);
  const nav = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(search).get('token');
    if (token) {
      acceptExternalToken?.(token);
      nav('/', { replace: true });
    } else {
      nav('/login', { replace: true });
    }
  }, [search]); // eslint-disable-line

  return null;
}
