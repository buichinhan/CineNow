import React, { useEffect, useState } from 'react';
import {
  Alert,
} from 'react-native';

import Splash from './splash';
import Login from './login';
import Register from './register';
import HomeScreen from './home';
import MovieDetailScreen from './movieDetail';
import ShowtimeScreen from './showtime';
import SeatSelectionScreen from './seatSelection';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            setUser(null);
            setSelectedMovie(null);
            setSelectedBooking(null);
            setCurrentScreen('login');
          },
        },
      ],
    );
  };

  if (currentScreen === 'register') {
    return (
      <Register
        onLogin={() => setCurrentScreen('login')}
        onRegisterSuccess={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login
        onRegister={() => setCurrentScreen('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        user={user}
        onSelectMovie={(movie) => {
          setSelectedMovie(movie);
          setCurrentScreen('movieDetail');
        }}
        onQuickBooking={(movie) => {
          setSelectedMovie(movie);
          setCurrentScreen('showtime');
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === 'movieDetail') {
    return (
      <MovieDetailScreen
        movie={selectedMovie}
        onBack={() => setCurrentScreen('home')}
        onBookTicket={(movie) => {
          setSelectedMovie(movie);
          setCurrentScreen('showtime'); // Bỏ chọn rạp, chuyển thẳng sang chọn suất chiếu
        }}
      />
    );
  }

  if (currentScreen === 'showtime') {
    return (
      <ShowtimeScreen
        movie={selectedMovie}
        onBack={() => setCurrentScreen('movieDetail')}
        onSelectMovie={() => setCurrentScreen('home')}
        onContinue={(bookingData) => {
          setSelectedBooking(bookingData);
          setCurrentScreen('seatSelection');
        }}
      />
    );
  }

  if (currentScreen === 'seatSelection') {
    return (
      <SeatSelectionScreen
        movie={selectedMovie}
        bookingData={selectedBooking}
        onBack={() => setCurrentScreen('showtime')}
        onComplete={() => setCurrentScreen('home')}
      />
    );
  }

  return (
    <Splash
      onStart={() => setCurrentScreen('login')}
    />
  );
}
