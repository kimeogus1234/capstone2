import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal,
    TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authApi from '../api/authapi';
import AuthInput from '../components/Auth/AuthInput';

// 표준 약관 내용
const TERMS_CONTENT = {
    terms: {
        title: '이용약관',
        content: `제1조 (목적)\n본 약관은 MadangM(이하 "회사")이 제공하는 제반 서비스의 이용과 관련하여 회사와 회원과 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.\n\n제2조 (용어의 정의)\n1. "서비스"라 함은 회사가 제공하는 재화의 판매 및 배송 서비스를 의미합니다.\n2. "회원"이라 함은 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.`
    },
    privacy: {
        title: '개인정보 처리방침',
        content: `1. 수집하는 개인정보 항목\n- 필수항목: 아이디, 이메일, 비밀번호\n\n2. 개인정보의 수집 및 이용 목적\n- 회원 가입 의사 확인, 본인 식별, 서비스 제공 및 관리`
    },
    marketing: {
        title: '마케팅 정보 수신 동의',
        content: `1. 수집 및 이용 목적\n- 신규 서비스 안내, 이벤트 정보 및 광고성 정보 제공`
    }
};

const RegisterScreen = ({ navigation }) => {
    // 상태 관리
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [emailUser, setEmailUser] = useState(''); 
    const [emailDomain, setEmailDomain] = useState(''); 
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationInput, setVerificationInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isUsernameChecked, setIsUsernameChecked] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isDomainModalVisible, setIsDomainModalVisible] = useState(false);

    const [agreements, setAgreements] = useState({ all: false, terms: false, privacy: false, marketing: false });
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState(null);

    const isPasswordMatch = password.length > 0 && password === confirmPassword;
    const usernameRegex = /^.{7,}$/; 
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>₩]).{8,}$/;

    const toggleAgreement = (key) => {
        if (key === 'all') {
            const newValue = !agreements.all;
            setAgreements({ all: newValue, terms: newValue, privacy: newValue, marketing: newValue });
        } else {
            const nextAgreements = { ...agreements, [key]: !agreements[key] };
            nextAgreements.all = nextAgreements.terms && nextAgreements.privacy && nextAgreements.marketing;
            setAgreements(nextAgreements);
        }
    };

    const handleCheckUsername = async () => {
        if (!username) return Alert.alert('알림', '아이디를 입력해주세요.');
        setLoading(true);
        try {
            const response = await authApi.checkUsername(username);
            if (response.available) {
                Alert.alert('확인', '사용 가능한 아이디입니다.');
                setIsUsernameChecked(true);
            } else {
                Alert.alert('중복', '이미 사용 중인 아이디입니다.');
                setIsUsernameChecked(false);
            }
        } catch (error) {
            console.error('Check Username Error:', error);
            Alert.alert('에러', '아이디 중복 확인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async () => {
        const fullEmail = `${emailUser}@${emailDomain}`;
        if (!emailUser || !emailDomain) return Alert.alert('알림', '이메일을 완성해주세요.');
        setLoading(true);
        try {
            await authApi.sendCode(fullEmail);
            setIsEmailSent(true);
            Alert.alert('발송 완료', '인증번호가 발송되었습니다.');
        } catch (error) {
            Alert.alert('오류', '인증번호 발송 실패');
        } finally { setLoading(false); }
    };

    const handleVerifyCode = async () => {
        const fullEmail = `${emailUser}@${emailDomain}`;
        try {
            const res = await authApi.verifyEmailCode(fullEmail, verificationInput);
            if (res.success) {
                setIsEmailVerified(true);
                Alert.alert('성공', '이메일 인증 완료!');
            }
        } catch (error) {
            Alert.alert('오류', '인증번호가 일치하지 않습니다.');
        }
    };

    const handleRegister = async () => {
        if (!isUsernameChecked || !isEmailVerified || !isPasswordMatch || !agreements.terms || !agreements.privacy) {
            return Alert.alert('알림', '모든 필수 항목을 완료해주세요.');
        }
        const fullEmail = `${emailUser}@${emailDomain}`;
        setLoading(true);
        try {
            await authApi.signup({ username, name, email: fullEmail, password });
            Alert.alert('성공', '가입을 환영합니다!', [{ text: '확인', onPress: () => navigation.navigate('Login') }]);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '가입 실패');
        } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>회원가입</Text>
                        <Text style={styles.subTitle}>MadangM의 새로운 가족이 되어주세요!</Text>
                    </View>

                    <View style={styles.form}>
                        <AuthInput
                            label="아이디" icon="person-outline" placeholder="7자 이상 입력"
                            value={username} onChangeText={(t) => { setUsername(t); setIsUsernameChecked(false); }}
                            rightButton={{ text: isUsernameChecked ? '확인됨' : '중복확인', onPress: handleCheckUsername, checked: isUsernameChecked }}
                        />

                        <AuthInput label="이름" icon="person-outline" placeholder="홍길동" value={name} onChangeText={setName} />

                        <Text style={styles.inputLabel}>이메일</Text>
                        <View style={styles.emailRow}>
                            <TextInput
                                style={[styles.emailInput, { flex: 1.2 }]} placeholder="아이디"
                                value={emailUser} onChangeText={(t) => { setEmailUser(t); setIsEmailVerified(false); }}
                                autoCapitalize="none" placeholderTextColor="#999"
                            />
                            <Text style={styles.atSymbol}>@</Text>
                            <TextInput
                                style={[styles.emailInput, { flex: 1.5 }]} placeholder="도메인 입력"
                                value={emailDomain} onChangeText={(t) => { setEmailDomain(t); setIsEmailVerified(false); }}
                                autoCapitalize="none" placeholderTextColor="#999"
                            />
                            <TouchableOpacity style={styles.domainPickerBtn} onPress={() => setIsDomainModalVisible(true)}>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.verifyRequestBtn, isEmailVerified && styles.verifiedBtn]} 
                            onPress={handleSendCode} disabled={isEmailVerified || loading}
                        >
                            <Text style={styles.verifyRequestBtnText}>{isEmailVerified ? '인증 완료' : '인증번호 받기'}</Text>
                        </TouchableOpacity>

                        {isEmailSent && !isEmailVerified && (
                            <AuthInput
                                placeholder="인증번호 6자리 입력" value={verificationInput} onChangeText={setVerificationInput}
                                keyboardType="number-pad" rightButton={{ text: '인증하기', onPress: handleVerifyCode }}
                            />
                        )}

                        <AuthInput
                            label="비밀번호" icon="lock-closed-outline" placeholder="8자 이상, 영문+숫자+특수문자 조합"
                            value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                            onToggleShowPassword={() => setShowPassword(!showPassword)}
                        />

                        <AuthInput
                            label="비밀번호 확인" icon="checkmark-circle-outline" placeholder="한 번 더 입력"
                            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword}
                        />

                        <View style={styles.agreementSection}>
                            <TouchableOpacity style={styles.allAgreement} onPress={() => toggleAgreement('all')}>
                                <Ionicons name={agreements.all ? "checkbox" : "square-outline"} size={24} color={agreements.all ? "#2e7d32" : "#ccc"} />
                                <Text style={styles.allAgreementText}>전체 동의하기</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                            {['terms', 'privacy', 'marketing'].map((key) => (
                                <View key={key} style={styles.agreementItemContainer}>
                                    <TouchableOpacity style={styles.agreementItem} onPress={() => toggleAgreement(key)}>
                                        <Ionicons name={agreements[key] ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={agreements[key] ? "#2e7d32" : "#ccc"} />
                                        <Text style={styles.agreementText}>{TERMS_CONTENT[key]?.title} {key === 'marketing' ? '(선택)' : '(필수)'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setSelectedTerm(TERMS_CONTENT[key]); setModalVisible(true); }}>
                                        <Text style={styles.viewMoreText}>더보기</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.registerButton, (!isUsernameChecked || !isEmailVerified || !isPasswordMatch || !agreements.terms || !agreements.privacy) && styles.disabledButton]}
                            onPress={handleRegister} disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>가입하기</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 도메인 선택 모달 */}
            <Modal animationType="slide" transparent={true} visible={isDomainModalVisible} onRequestClose={() => setIsDomainModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsDomainModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>이메일 주소 선택</Text>
                            <TouchableOpacity onPress={() => setIsDomainModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>
                        {['naver.com', 'gmail.com', 'kakao.com', 'daum.net', 'nate.com', '직접 입력'].map((item) => (
                            <TouchableOpacity key={item} style={styles.modalItem} onPress={() => { if (item !== '직접 입력') setEmailDomain(item); setIsDomainModalVisible(false); }}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 약관 모달 */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedTerm?.title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 300 }}><Text style={styles.modalBodyText}>{selectedTerm?.content}</Text></ScrollView>
                        <TouchableOpacity style={styles.confirmButton} onPress={() => setModalVisible(false)}><Text style={styles.confirmButtonText}>확인</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    inner: { padding: 25 },
    backButton: { marginBottom: 20 },
    header: { marginBottom: 30 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
    subTitle: { fontSize: 14, color: '#777', marginTop: 8 },
    form: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 15 },
    emailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    emailInput: { height: 52, backgroundColor: '#f8f9fa', borderRadius: 10, paddingHorizontal: 15, fontSize: 15, borderWidth: 1, borderColor: '#eee', color: '#333' },
    atSymbol: { marginHorizontal: 8, fontSize: 16, color: '#999', fontWeight: 'bold' },
    domainPickerBtn: { padding: 10, marginLeft: 5, backgroundColor: '#f8f9fa', borderRadius: 10, height: 52, justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
    verifyRequestBtn: { backgroundColor: '#333', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    verifiedBtn: { backgroundColor: '#2e7d32' },
    verifyRequestBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    agreementSection: { marginTop: 20, marginBottom: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12 },
    allAgreement: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    allAgreementText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 12 },
    agreementItemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    agreementItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    agreementText: { fontSize: 14, color: '#666', marginLeft: 10 },
    viewMoreText: { fontSize: 12, color: '#999', textDecorationLine: 'underline' },
    registerButton: { backgroundColor: '#2e7d32', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    disabledButton: { backgroundColor: '#ccc' },
    registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    modalItemText: { fontSize: 16, color: '#333' },
    modalBodyText: { fontSize: 14, color: '#666', lineHeight: 22 },
    confirmButton: { backgroundColor: '#2e7d32', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default RegisterScreen;
