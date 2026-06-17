import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authapi';
import { BASE_URL, IMAGE_BASE_URL } from '../api/config';
import { launchImageLibrary } from 'react-native-image-picker';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState(''); // ✅ 비밀번호 확인용 상태
  const [editEmail, setEditEmail] = useState(''); // ✅ 이메일 수정 가능하도록 추가
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || ''); // ✅ 이메일 초기값 설정
      setEditName(user.name || user.username || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handlePhoneChange = (text) => {
    // 숫자만 추출
    const cleaned = ('' + text).replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length > 3 && cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    setEditPhone(formatted);
  };

  const getFullUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${IMAGE_BASE_URL}${cleanUrl}`;
  };

  const handleProfileImageChange = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel) return;
      if (result.errorCode) return Alert.alert('오류', '사진을 가져오는 중 문제가 발생했습니다.');

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `profile_${Date.now()}.jpg`,
      });

      setLoading(true);
      const uploadRes = await authApi.uploadProfileImage(formData);
      
      if (uploadRes && uploadRes.url) {
        // 프로필 업데이트 API 호출 시 이메일도 빈 문자열 방지
        const updateData = { 
            name: editName, 
            phone: editPhone, 
            username: editUsername, 
            email: editEmail,
            profileImage: uploadRes.url
        };
        await authApi.updateProfile(user.id, updateData);
        await updateUser({ profileImage: uploadRes.url });
        Alert.alert('성공', '프로필 사진이 변경되었습니다.');
      }
    } catch (error) {
      console.error('Image Upload Error:', error);
      Alert.alert('오류', '이미지 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) return Alert.alert('알림', '아이디를 입력해주세요.');
    if (!editName.trim()) return Alert.alert('알림', '이름을 입력해주세요.');
    if (!user?.id) return Alert.alert('오류', '로그인 정보가 없습니다.');

    // ✅ 비밀번호 변경 시 두 번 입력한 값이 일치하는지 확인
    if (editPassword) {
        if (editPassword.length < 8) return Alert.alert('알림', '비밀번호는 8자 이상이어야 합니다.');
        if (editPassword !== editConfirmPassword) {
            return Alert.alert('오류', '새 비밀번호가 서로 일치하지 않습니다.');
        }
    }

    setLoading(true);
    try {
      const updateData = { name: editName, phone: editPhone, username: editUsername, email: editEmail }; // ✅ 이메일 전송 추가
      if (editPassword) updateData.password = editPassword; // 입력했을 때만 전송

      const res = await authApi.updateProfile(user.id, updateData);
      
      if (res && res.message && res.message.includes('사용 중')) {
         Alert.alert('오류', res.message);
         setLoading(false);
         return;
      }

      if (updateUser) await updateUser({ name: editName, phone: editPhone, username: editUsername, email: editEmail }); // ✅ 전역 상태 업데이트 
      Alert.alert('성공', '개인정보가 성공적으로 변경되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Profile Update Error:', error);
      Alert.alert('오류', '아이디가 이미 존재하거나 정보 수정에 실패했습니다.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>개인정보 변경</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
            {/* 🖼️ 프로필 사진 변경 섹션 */}
            <View style={styles.profileImageSection}>
                <TouchableOpacity onPress={handleProfileImageChange} style={styles.imageContainer}>
                    <Image 
                        source={{ uri: getFullUrl(user?.profileImage) }} 
                        style={styles.profileImage} 
                    />
                    <View style={styles.cameraIconContainer}>
                        <Ionicons name="camera" size={16} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.profileImageText}>사진 변경</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>로그인 정보</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>아이디</Text>
                    <View style={styles.disabledInput}>
                        <Text style={styles.disabledInputText}>{user?.username}</Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>이메일</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 10 }]} 
                        value={editEmail} 
                        onChangeText={setEditEmail} 
                        placeholder="이메일을 입력해주세요"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Text style={styles.helperText}>정보 찾기 및 알림 수신용으로 사용됩니다.</Text>
                </View>

                <Text style={styles.label}>새 비밀번호</Text>
                <TextInput 
                    style={styles.input} 
                    value={editPassword} 
                    onChangeText={setEditPassword} 
                    placeholder="새 비밀번호 (변경 시에만 입력)"
                    secureTextEntry
                />

                {/* ✅ 비밀번호 확인 칸 추가 */}
                <Text style={styles.label}>새 비밀번호 확인</Text>
                <TextInput 
                    style={styles.input} 
                    value={editConfirmPassword} 
                    onChangeText={setEditConfirmPassword} 
                    placeholder="새 비밀번호 한 번 더 입력"
                    secureTextEntry
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>회원 정보</Text>

                <Text style={styles.label}>이름</Text>
                <TextInput 
                    style={styles.input} 
                    value={editName} 
                    onChangeText={setEditName} 
                    placeholder="이름 입력"
                />

                <Text style={styles.label}>휴대폰 번호</Text>
                <TextInput 
                    style={styles.input} 
                    value={editPhone} 
                    onChangeText={handlePhoneChange} 
                    placeholder="예: 010-1234-5678"
                    keyboardType="phone-pad"
                />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={loading}>
                <Text style={styles.saveBtnText}>{loading ? '저장 중...' : '변경사항 저장하기'}</Text>
            </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  container: { padding: 20 },
  profileImageSection: { alignItems: 'center', marginBottom: 25 },
  imageContainer: { position: 'relative', width: 100, height: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', borderWidth: 3, borderColor: '#fff' },
  cameraIconContainer: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#000', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileImageText: { marginTop: 10, fontSize: 14, color: '#444', fontWeight: 'bold' },
  section: { backgroundColor: '#fff', padding: 25, borderRadius: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#777', marginBottom: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', fontSize: 16, color: '#111', paddingVertical: 8, marginBottom: 25 },
  inputGroup: { marginBottom: 20 },
  disabledInput: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  disabledInputText: { color: '#999', fontSize: 16 },
  helperText: { color: '#888', fontSize: 12, marginTop: 4 },
  saveBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 50 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default EditProfileScreen;
