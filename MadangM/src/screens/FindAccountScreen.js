import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authApi from '../api/authapi';

const FindAccountScreen = ({ navigation }) => {
    const [tab, setTab] = useState('ID'); // 'ID' or 'PW'
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 아이디 찾기 실행
    const handleFindId = async () => {
        if (!email) {
            Alert.alert('알림', '이메일을 입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            const data = await authApi.findId(email);
            Alert.alert('아이디 확인', `고객님의 아이디는 [${data.username}] 입니다.`);
        } catch (error) {
            Alert.alert('오류', '해당 이메일로 등록된 정보가 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 비밀번호 재설정 실행
    const handleFindPw = async () => {
        if (!username || !email || !newPassword || !confirmPassword) {
            Alert.alert('알림', '모든 정보를 입력해주세요.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
            return;
        }
        setLoading(true);
        try {
            const data = await authApi.resetPassword({ username, email, newPassword });
            Alert.alert('성공', data.message || '비밀번호가 성공적으로 재설정되었습니다.', [
                { text: '로그인하기', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '해당 정보와 일치하는 계정이 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>아이디/비밀번호 찾기</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'ID' && styles.activeTab]}
                        onPress={() => setTab('ID')}
                    >
                        <Text style={[styles.tabText, tab === 'ID' && styles.activeTabText]}>아이디 찾기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'PW' && styles.activeTab]}
                        onPress={() => setTab('PW')}
                    >
                        <Text style={[styles.tabText, tab === 'PW' && styles.activeTabText]}>비밀번호 찾기</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.infoText}>
                        {tab === 'ID'
                            ? '가입 시 등록하신 이메일 주소를 입력해 주세요.'
                            : '아이디와 가입 시 등록하신 이메일을 입력해 주세요.'}
                    </Text>

                    {tab === 'PW' && (
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="아이디"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="가입한 이메일 주소"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {tab === 'PW' && (
                        <>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="새 비밀번호 입력"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="새 비밀번호 확인"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={tab === 'ID' ? handleFindId : handleFindPw}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>확인</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#2e7d32' },
    tabText: { fontSize: 15, color: '#999' },
    activeTabText: { color: '#2e7d32', fontWeight: 'bold' },
    content: { padding: 30 },
    infoText: { fontSize: 14, color: '#666', marginBottom: 30, lineHeight: 22 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#333' },
    submitButton: {
        backgroundColor: '#2e7d32',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default FindAccountScreen;
