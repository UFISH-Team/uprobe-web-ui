import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../api';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call API logout method to clear tokens and perform proper cleanup
        await ApiService.logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Even if API call fails, still clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        navigate('/auth');
      }
    };

    performLogout();
  }, [navigate]);

  return null;
};

export default Logout;
