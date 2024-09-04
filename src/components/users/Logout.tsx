import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout actions, such as clearing local storage
    // localStorage.clear();
    // Redirect to login page
    navigate('/login');
  }, [navigate]);

  return null;
};

export default Logout;
