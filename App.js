
import React, { useEffect, useState } from 'react';
import Splash from './splash';
import Login from './login';
import Register from './register';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  if (currentScreen === 'register') {
    return (
      <Register
        onLogin={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login
        onRegister={() => setCurrentScreen('register')}
      />
    );
  }

  return (
    <Splash
      onStart={() => setCurrentScreen('login')}
    />
  );
}
