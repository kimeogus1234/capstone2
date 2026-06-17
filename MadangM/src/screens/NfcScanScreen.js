import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert } from 'react-native';
import useNfc from '../hooks/useNfc'; // 방금 만든 훅 임포트

const NfcScanScreen = ({ navigation }) => {
  const scaleValue = new Animated.Value(1);
  const { startScan, stopScan } = useNfc();

  useEffect(() => {
    // 애니메이션 실행
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 1.2, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();

    // 실제 스캔 시작 로직 (범용성 강화)
    const handleScan = async () => {
      const url = await startScan(); // 태그가 읽힐 때까지 여기서 기다림

      if (url) {
        console.log("📡 [NFC 읽기 성공]:", url);

        // 1. 📍 위치/공간 태그 스캔인 경우 (/location/ 이나 /marker/ 경로가 있는 경우)
        if (url.includes('/location/') || url.includes('/marker/')) {
          const markerId = url.split('/location/')[1]?.split('?')[0] || url.split('/marker/')[1]?.split('?')[0];
          if (markerId) {
            console.log("✅ [NFC 위치 인식 성공] 마커 ID:", markerId);
            navigation.replace('RootTabs', {
              screen: '맵탭',
              params: { targetMarkerId: markerId }
            });
            return;
          }
        }

        // 2. 📦 일반 상품 태그 스캔인 경우 (기존 방식 유지)
        const objectIdMatch = url.match(/[a-f0-9]{24}/i);
        const productId = objectIdMatch
          ? objectIdMatch[0]
          : (url.includes('id=') ? url.split('id=')[1] : url.split('/').pop());

        if (productId) {
          console.log("✅ [NFC 상품 인식 성공] 상품 ID:", productId);
          navigation.replace('ProductDetail', { nfcId: productId });
        } else {
          Alert.alert("알림", "유효하지 않은 태그입니다.");
        }
      }
    };

    handleScan();

    return () => stopScan(); // 화면 나갈 때 취소
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NFC 스캔 준비</Text>
      <Text style={styles.subTitle}>휴대폰 뒷면을 태그에 가까이 대주세요</Text>
      <Animated.View style={[styles.circle, { transform: [{ scale: scaleValue }] }]}>
        <Text style={{ fontSize: 60 }}>📡</Text>
      </Animated.View>
      <Text style={styles.statusText}>태그를 찾는 중...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subTitle: { fontSize: 16, color: '#666', marginBottom: 50 },
  circle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#f0f7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  statusText: { fontSize: 16, color: '#0073e9', fontWeight: 'bold' }
});

export default NfcScanScreen;