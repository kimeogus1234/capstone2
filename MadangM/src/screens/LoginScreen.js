import React, { useState, useEffect } from 'react';
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
    Image,
    ScrollView,
    useWindowDimensions
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authApi from '../api/authapi';
import { useAuth } from '../context/AuthContext';
import { login as kakaoLoginBtn, getProfile } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const LoginScreen = ({ navigation }) => {
    const { height: windowHeight } = useWindowDimensions();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 네이버 SDK 초기화 (앱 시작 시 1회만 실행)
    useEffect(() => {
        try {
            NaverLogin.initialize({
                appName: 'MadangM',
                consumerKey: 'O9VKTE4LjwjB3UXJ1JrS',
                consumerSecret: 'w0TpSyOGUQ',
                disableNaverAppAuthIOS: true,
            });
        } catch (e) {
            console.warn('NaverLogin initialize failed:', e.message);
        }
        // 구글 SDK 초기화
        GoogleSignin.configure({
            webClientId: '273448273158-0d618m71i2t1683a9p88vn9vgqj2p7mb.apps.googleusercontent.com',
        });
    }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.login({ username, password });

            // 전역 상태 업데이트 (토큰 및 유저 정보 저장)
            await login({
                token: response.token,
                ...response.user
            });

            Alert.alert('성공', '로그인에 성공했습니다.');
            navigation.replace('RootTabs');
        } catch (error) {
            console.error('Login Error:', error);
            const errorMessage = error.response?.data?.message || '아이디 또는 비밀번호를 다시 확인해주세요.';
            Alert.alert('에러', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKakaoLogin = async () => {
        try {
            const token = await kakaoLoginBtn();
            const response = await authApi.kakaoLogin({ accessToken: token.accessToken });

            await login({
                token: response.token,
                ...response.user
            });

            Alert.alert('성공', '카카오 로그인에 성공했습니다.');
            navigation.replace('RootTabs');
        } catch (error) {
            console.error('Kakao Login Error Full:', error);
            // 에러 객체 전체를 문자열로 바꿔서 출력 (여기에 해시값이 포함되어 있을 확률이 높음)
            const errorStr = JSON.stringify(error, null, 2);
            Alert.alert('Kakao Login Detailed Error', `Error Message:\n${error.message}\n\nDetails:\n${errorStr}`);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            console.log('Google Login raw result:', JSON.stringify(userInfo));

            // 데이터 구조가 버전마다 다를 수 있어 안전하게 추출
            const user = userInfo?.user || userInfo?.data?.user;
            const idToken = userInfo?.idToken || userInfo?.data?.idToken;

            if (!user) {
                console.error('Google user info is missing');
                return Alert.alert('오류', '구글 사용자 정보를 가져오지 못했습니다.');
            }

            const response = await authApi.googleLogin({
                idToken,
                userInfo: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    photo: user.photo,
                }
            });

            await login({
                token: response.token,
                ...response.user
            });

            Alert.alert('성공', '구글 로그인에 성공했습니다.');
            navigation.replace('RootTabs');
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled Google login');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                Alert.alert('알림', '로그인이 진행 중입니다.');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('오류', 'Play 서비스를 사용할 수 없습니다.');
            } else {
                console.error('Google Login Error Detail:', error);
                Alert.alert('오류', `구글 로그인에 실패했습니다.\n${error.message || '알 수 없는 에러'}`);
            }
        }
    };

    const handleNaverLogin = async () => {
        try {
            // 네이버 로그인 실행
            const result = await NaverLogin.login();
            console.log('Naver Login Result:', JSON.stringify(result));

            if (!result.isSuccess || result.failureResponse) {
                const errMsg = result.failureResponse?.message || '알 수 없는 오류';
                const errCode = result.failureResponse?.lastErrorCodeFromNaverSDK || '';
                const errDesc = result.failureResponse?.lastErrorDescriptionFromNaverSDK || '';
                console.error(`Naver Fail: [${errCode}] ${errMsg} - ${errDesc}`);
                return Alert.alert('네이버 로그인 실패', `${errMsg}\n(${errCode})`);
            }

            if (result.successResponse) {
                // 우리 백엔드 서버로 accessToken 전송
                const response = await authApi.naverLogin({ accessToken: result.successResponse.accessToken });

                await login({
                    token: response.token,
                    ...response.user
                });

                Alert.alert('성공', '네이버 로그인에 성공했습니다.');
                navigation.replace('RootTabs');
            }
        } catch (error) {
            console.error('Naver Login Exception:', error);
            Alert.alert('오류', `네이버 로그인 중 문제가 발생했습니다.\n${error?.message || ''}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 커스텀 헤더 추가 */}
            <View style={styles.navHeader}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('RootTabs')} style={styles.headerIcon}>
                        <Ionicons name="home-outline" size={22} color="#333" />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerIcon}>
                        <Ionicons name="search-outline" size={22} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="menu-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                >
                    <View style={[styles.header, { marginTop: windowHeight * 0.05 }]}>
                        <Text style={styles.logoText}>Madang<Text style={styles.logoAccent}>M</Text></Text>
                        <Text style={styles.subTitle}>반가워요! 다시 오셨네요 👋</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="아이디"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                placeholderTextColor="#aaa"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#aaa"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('FindAccount')}>
                            <Text style={styles.forgotText}>아이디/비밀번호를 잊으셨나요?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>로그인</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>계정이 없으신가요? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerText}>회원가입</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.socialHeader}>
                        <View style={styles.line} />
                        <Text style={styles.socialText}>간편 로그인</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.socialButtons}>
                        <TouchableOpacity
                            style={[styles.socialBtn, { backgroundColor: '#FEE500' }]}
                            onPress={handleKakaoLogin}
                        >
                            <Text style={{ fontWeight: 'bold' }}>K</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.socialBtn, { backgroundColor: '#03C75A' }]}
                            onPress={handleNaverLogin}
                        >
                            <Text style={{ fontWeight: 'bold', color: '#fff' }}>N</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.socialBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' }]}
                            onPress={handleGoogleLogin}
                        >
                            <Ionicons name="logo-google" size={20} color="#EA4335" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 55,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 8,
        marginHorizontal: 2,
    },
    inner: { flex: 1, padding: 30, justifyContent: 'center' },
    header: { marginBottom: 40, alignItems: 'center' },
    logoText: { fontSize: 32, fontWeight: '900', color: '#333', letterSpacing: -1 },
    logoAccent: { color: '#2e7d32' },
    subTitle: { fontSize: 16, color: '#666', marginTop: 10 },
    form: { marginBottom: 20 },
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
    input: { flex: 1, color: '#333', fontSize: 15 },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: 25 },
    forgotText: { color: '#666', fontSize: 13 },
    loginButton: {
        backgroundColor: '#2e7d32',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    footerText: { color: '#999', fontSize: 14 },
    registerText: { color: '#2e7d32', fontSize: 14, fontWeight: 'bold' },
    socialHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
    line: { flex: 1, height: 1, backgroundColor: '#eee' },
    socialText: { marginHorizontal: 10, color: '#aaa', fontSize: 12 },
    socialButtons: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
    socialBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});

export default LoginScreen;
