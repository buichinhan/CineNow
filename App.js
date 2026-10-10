import React, { useEffect, useState } from 'react';
import Splash from './splash';
import Login from './login';

export default function App() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogin(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (showLogin) {
    return <Login />;
  }

  return <Splash onStart={() => setShowLogin(true)} />;
}