import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from './config';

const Login = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!username || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        Alert.alert('인증 성공', `${data.user.name}님 환영합니다!`);
        onLoginSuccess({ user: data.user, token: data.token });
      } else {
        Alert.alert('로그인 실패', data.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      Alert.alert('연결 에러', '서버에 연결할 수 없습니다. 네트워크 상태를 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* 상단 로고 및 브랜드 타이틀 */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandEmoji}>🛒</Text>
              <Text style={styles.brandTitle}>MadangM</Text>
              <Text style={styles.brandSubtitle}>스마트 스토어 직원 관제용</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>아이디</Text>
              <TextInput
                placeholder="아이디를 입력해 주세요"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <TextInput
                placeholder="비밀번호를 입력해 주세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>직원 인증하기</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              본 앱은 내부 직원 및 배달 파트너 전용 앱입니다.{"\n"}인가되지 않은 외부인의 사용을 엄격히 제한합니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  brandContainer: { alignItems: 'center', marginBottom: 35 },
  brandEmoji: { fontSize: 44, marginBottom: 12 },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#1A1F27', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 14, color: '#8B95A1', fontWeight: '600', marginTop: 4 },
  
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#4E5968', marginBottom: 8 },
  input: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#1A1F27',
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
  },
  
  mainBtn: {
    backgroundColor: '#3182F6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3182F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    color: '#8B95A1',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 30,
    fontWeight: '500',
  },
});

export default Login;
