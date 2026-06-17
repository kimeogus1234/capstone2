import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ScrollView, SafeAreaView, ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authapi';

const REASONS = [
    '사용 빈도가 낮아요',
    '다른 서비스로 이동해요',
    '개인정보가 걱정돼요',
    '원하는 상품이 없어요',
    '기타',
];

const STEP = { WARNING: 1, REASON: 2, CONFIRM: 3 };

const DeleteAccountScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();

    const [step, setStep] = useState(STEP.WARNING);
    const [agreed, setAgreed] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // ---------- 핸들러 ----------
    const handleDelete = async () => {
        if (!password.trim()) {
            return Alert.alert('알림', '비밀번호를 입력해 주세요.');
        }
        setLoading(true);
        try {
            await authApi.deleteAccount(user.id, password);
            Alert.alert(
                '탈퇴 완료',
                '그동안 이용해주셔서 감사합니다.',
                [{ 
                    text: '확인', 
                    onPress: async () => {
                        await logout();
                        // 네비게이션 스택을 초기화하고 홈(RootTabs)으로 강제 이동
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'RootTabs' }],
                        });
                    } 
                }]
            );
        } catch (error) {
            const msg = error?.response?.data?.message || '탈퇴 처리 중 오류가 발생했습니다.';
            Alert.alert('오류', msg);
        } finally {
            setLoading(false);
        }
    };

    // ---------- 렌더링 ----------
    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={40} color="#e53935" />
                <Text style={styles.warningTitle}>탈퇴 전 꼭 확인해주세요</Text>
            </View>

            {[
                { icon: 'person-remove-outline', text: '계정 정보(이름, 이메일 등)가 영구 삭제됩니다.' },
                { icon: 'cart-outline', text: '주문 내역 및 배송 정보가 모두 삭제됩니다.' },
                { icon: 'lock-closed-outline', text: '같은 아이디로 재가입이 제한될 수 있습니다.' },
                { icon: 'refresh-outline', text: '탈퇴 후에는 데이터를 복구할 수 없습니다.' },
            ].map((item, i) => (
                <View key={i} style={styles.cautionRow}>
                    <Ionicons name={item.icon} size={20} color="#e53935" style={{ marginRight: 12 }} />
                    <Text style={styles.cautionText}>{item.text}</Text>
                </View>
            ))}

            <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={agreed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={agreed ? '#2e7d32' : '#ccc'}
                />
                <Text style={styles.checkLabel}>위 내용을 모두 확인했습니다.</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.nextBtn, !agreed && styles.disabledBtn]}
                onPress={() => agreed && setStep(STEP.REASON)}
                disabled={!agreed}
            >
                <Text style={styles.nextBtnText}>다음</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>떠나시는 이유를 알려주세요</Text>
            <Text style={styles.stepSubtitle}>더 나은 서비스를 위해 소중한 의견을 참고하겠습니다.</Text>

            {REASONS.map((reason, i) => (
                <TouchableOpacity
                    key={i}
                    style={[styles.reasonItem, selectedReason === i && styles.reasonItemSelected]}
                    onPress={() => setSelectedReason(i)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={selectedReason === i ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={selectedReason === i ? '#2e7d32' : '#bbb'}
                    />
                    <Text style={[styles.reasonText, selectedReason === i && styles.reasonTextSelected]}>
                        {reason}
                    </Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.nextBtn, selectedReason === null && styles.disabledBtn]}
                onPress={() => selectedReason !== null && setStep(STEP.CONFIRM)}
                disabled={selectedReason === null}
            >
                <Text style={styles.nextBtnText}>다음</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>본인 확인</Text>
            <Text style={styles.stepSubtitle}>
                탈퇴를 완료하려면{'\n'}현재 비밀번호를 입력해 주세요.
            </Text>

            <View style={styles.infoBox}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{user?.username}</Text>
            </View>

            <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#bbb" style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.input}
                    placeholder="현재 비밀번호"
                    placeholderTextColor="#bbb"
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                    <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color="#bbb" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.deleteBtn, loading && styles.disabledBtn]}
                onPress={handleDelete}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.deleteBtnText}>회원 탈퇴 완료</Text>
                }
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (step === STEP.WARNING) navigation.goBack();
                    else setStep(step - 1);
                }}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>회원 탈퇴</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* 단계 인디케이터 */}
            <View style={styles.stepIndicatorRow}>
                {[1, 2, 3].map((s) => (
                    <View key={s} style={styles.stepIndicatorItem}>
                        <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                            <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
                        </View>
                        {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
                    </View>
                ))}
            </View>
            <View style={styles.stepLabelRow}>
                {['주의사항', '탈퇴 사유', '본인 확인'].map((label, i) => (
                    <Text key={i} style={[styles.stepLabel, step === i + 1 && styles.stepLabelActive]}>
                        {label}
                    </Text>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
                {step === STEP.WARNING && renderStep1()}
                {step === STEP.REASON && renderStep2()}
                {step === STEP.CONFIRM && renderStep3()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f0f0f0',
    },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },

    // 단계 인디케이터
    stepIndicatorRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', marginTop: 25, paddingHorizontal: 40,
    },
    stepIndicatorItem: { flexDirection: 'row', alignItems: 'center' },
    stepDot: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee',
        justifyContent: 'center', alignItems: 'center',
    },
    stepDotActive: { backgroundColor: '#2e7d32' },
    stepDotText: { fontSize: 13, fontWeight: 'bold', color: '#bbb' },
    stepDotTextActive: { color: '#fff' },
    stepLine: { width: 50, height: 2, backgroundColor: '#eee', marginHorizontal: 4 },
    stepLineActive: { backgroundColor: '#2e7d32' },
    stepLabelRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingHorizontal: 20, marginTop: 8, marginBottom: 10,
    },
    stepLabel: { fontSize: 11, color: '#bbb' },
    stepLabelActive: { color: '#2e7d32', fontWeight: 'bold' },

    // 공통
    stepContainer: { padding: 24 },
    stepTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
    stepSubtitle: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 28 },

    // step1
    warningBox: { alignItems: 'center', marginBottom: 24 },
    warningTitle: { fontSize: 18, fontWeight: 'bold', color: '#e53935', marginTop: 10 },
    cautionRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: '#fff5f5', borderRadius: 10, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#ffcdd2',
    },
    cautionText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
    checkRow: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 20, marginBottom: 30,
    },
    checkLabel: { marginLeft: 10, fontSize: 14, color: '#444' },

    // step2
    reasonItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 18,
        borderRadius: 10, borderWidth: 1, borderColor: '#eee',
        marginBottom: 10, backgroundColor: '#fafafa',
    },
    reasonItemSelected: { borderColor: '#2e7d32', backgroundColor: '#f1f8e9' },
    reasonText: { marginLeft: 12, fontSize: 14, color: '#555' },
    reasonTextSelected: { color: '#2e7d32', fontWeight: 'bold' },

    // step3
    infoBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14,
        marginBottom: 20,
    },
    infoText: { marginLeft: 8, fontSize: 15, color: '#555', fontWeight: 'bold' },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12,
        paddingHorizontal: 15, height: 52, marginBottom: 28,
    },
    input: { flex: 1, fontSize: 15, color: '#333' },

    // 버튼
    nextBtn: {
        backgroundColor: '#2e7d32', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 10,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    deleteBtn: {
        backgroundColor: '#e53935', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 10,
    },
    deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { backgroundColor: '#e0e0e0' },
});

export default DeleteAccountScreen;
