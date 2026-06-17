import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AdminWrite from './AdminWrite'; 
import DeliveryScreen from './DeliveryScreen';
import UserCart from './UserCart'; 
import Login from './Login';

const App = () => {
  const [auth, setAuth] = useState<any>(null); // { user, token }
  const [mode, setMode] = useState('menu');

  const user = auth?.user;
  const token = auth?.token;

  // --- 로그아웃 처리 ---
  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '확인', 
        onPress: () => {
          setAuth(null);
          setMode('menu');
        } 
      }
    ]);
  };

  // 1. 로그인 전이면 로그인 화면 표시
  if (!auth) {
    return (
      <SafeAreaProvider>
        <Login onLoginSuccess={setAuth} />
      </SafeAreaProvider>
    );
  }

  // 2. 권한별 화면 분기 처리
  
  // (A) 매장 관리 직원용 (STAFF / ADMIN)
  if (user.role === 'STAFF' || user.role === 'ADMIN' || !user.role) {
    if (mode === 'admin') {
      return (
        <SafeAreaProvider>
          <AdminWrite onBack={() => setMode('menu')} token={token} />
        </SafeAreaProvider>
      );
    }
    if (mode === 'verify') {
      return (
        <SafeAreaProvider>
          <UserCart onBack={() => setMode('menu')} token={token} />
        </SafeAreaProvider>
      );
    }

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          
          {/* 상단 통합 헤더 */}
          <View style={styles.header}>
            <View>
              <Text style={styles.roleLabel}>STORE MANAGER</Text>
              <Text style={styles.userName}>{user.name} 매니저님</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.titleSection}>
                <Text style={styles.roleTitle}>🏠 매장 관리 시스템</Text>
                <Text style={styles.subtitle}>스마트 마당 운영에 필요한 도구를 선택하세요</Text>
              </View>

              <View style={styles.buttonGroup}>
                {/* 태그 발행기 */}
                <TouchableOpacity 
                  style={[styles.subButton, { borderLeftColor: '#34C759' }]} 
                  onPress={() => setMode('admin')}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonHeader}>
                    <Text style={styles.subButtonTitle}>태그 발행기 🏷️</Text>
                    <View style={[styles.badge, { backgroundColor: '#E8F8EE' }]}>
                      <Text style={[styles.badgeText, { color: '#1E7E34' }]}>NFC & QR</Text>
                    </View>
                  </View>
                  <Text style={styles.subButtonDesc}>신규 상품의 NFC 태그 및 QR 코드를 즉시 인쇄/발행하고 연동합니다.</Text>
                </TouchableOpacity>

                {/* NFC 상품 확인용 */}
                <TouchableOpacity 
                  style={[styles.subButton, { borderLeftColor: '#3182F6' }]} 
                  onPress={() => setMode('verify')}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonHeader}>
                    <Text style={styles.subButtonTitle}>NFC 상품 확인용 📡</Text>
                    <View style={[styles.badge, { backgroundColor: '#EAF2FF' }]}>
                      <Text style={[styles.badgeText, { color: '#1B64D1' }]}>실시간 감지</Text>
                    </View>
                  </View>
                  <Text style={styles.subButtonDesc}>이미 발행된 태그의 상품명, 가격, 재고 정보를 실시간으로 확인합니다.</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>MadangM Multi-Store Control Panel v1.2</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // (B) 배달 관리 직원용 (DELIVERY)
  if (user.role === 'DELIVERY') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.header}>
            <View>
              <Text style={styles.roleLabel}>DELIVERY PARTNER</Text>
              <Text style={styles.userName}>{user.name} 기사님</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
          <DeliveryScreen 
            onBack={() => Alert.alert('알림', '배달 모드에서는 메인 화면으로 돌아갈 수 없습니다. 계정 전환은 로그아웃을 이용해 주세요.')} 
            token={token} 
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB'
  },
  roleLabel: { fontSize: 10, fontWeight: '800', color: '#8B95A1', letterSpacing: 0.5, marginBottom: 2 },
  userName: { fontSize: 16, fontWeight: '800', color: '#1A1F27' },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { color: '#B91C1C', fontWeight: '800', fontSize: 13 },
  
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 24, paddingVertical: 35 },
  titleSection: { marginBottom: 35 },
  roleTitle: { fontSize: 25, fontWeight: '900', color: '#1A1F27', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7684', textAlign: 'center', fontWeight: '500', lineHeight: 20 },
  
  buttonGroup: { width: '100%' },
  subButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  buttonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subButtonTitle: { fontSize: 18, fontWeight: '800', color: '#1A1F27' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  subButtonDesc: { fontSize: 13, color: '#4E5968', lineHeight: 18, fontWeight: '500' },
  
  footer: { paddingBottom: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#8B95A1', fontWeight: '600' }
});

export default App;