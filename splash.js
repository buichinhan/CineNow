import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  StatusBar,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';

const THEATER_IMAGE =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=85';

export default function SplashScreen({ onStart }) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0B0B"
        translucent={false}
      />

      {/* LOGO */}
      <View style={[styles.header, { paddingTop: height * 0.065 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▷</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>
      </View>

      {/* SLOGAN */}
      <View style={styles.sloganContainer}>
        <Text style={styles.slogan}>
          Đặt vé nhanh – Trải nghiệm điện ảnh
        </Text>

        <Text style={styles.slogan}>
          trọn vẹn
        </Text>
      </View>

      {/* CINEMA IMAGE */}
      <View
        style={[
          styles.imageContainer,
          {
            width: width * 0.94,
            height: height * 0.56,
          },
        ]}
      >
        <ImageBackground
          source={{ uri: THEATER_IMAGE }}
          style={styles.theaterImage}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          <View style={styles.imageOverlay} />
        </ImageBackground>
      </View>

      {/* BUTTON AND LOADING */}
      <View style={styles.loadingContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            BẮT ĐẦU NGAY
          </Text>
        </TouchableOpacity>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.loadingText}>
          Chào mừng bạn đến với CineNow
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
  },

  header: {
    alignItems: 'center',
    width: '100%',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: '#E51B23',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    marginLeft: 2,
    marginTop: -2,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  logoRed: {
    color: '#E51B23',
  },

  sloganContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 25,
    paddingHorizontal: 18,
  },

  slogan: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
  },

  imageContainer: {
    overflow: 'hidden',
    backgroundColor: '#171717',
  },

  theaterImage: {
    flex: 1,
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },

  loadingContainer: {
    position: 'absolute',
    bottom: '10%',
    alignItems: 'center',
    width: '100%',
  },

  startButton: {
    backgroundColor: '#E51B23',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  progressTrack: {
    width: 90,
    height: 2,
    backgroundColor: '#333333',
    marginBottom: 9,
    overflow: 'hidden',
  },

  progressFill: {
    width: '38%',
    height: '100%',
    backgroundColor: '#E51B23',
  },

  loadingText: {
    color: '#777777',
    fontSize: 10,
  },
});