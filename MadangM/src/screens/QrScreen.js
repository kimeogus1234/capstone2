import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PermissionsAndroid, Platform, Alert, Animated } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const QrScreen = ({ navigation }) => {
    const [scannedData, setScannedData] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null); // 타이머 관리를 위한 ref
    const isProcessingRef = useRef(null); // 중복 스캔 방지용 ref
    const isFocused = useIsFocused();

    useEffect(() => {
        (async () => {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: '카메라 권한 요청',
                        message: 'QR 코드를 스캔하기 위해 카메라 접근 권한이 필요합니다.',
                        buttonPositive: '허용',
                        buttonNegative: '거부',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setHasPermission(true);
                } else {
                    Alert.alert("권한 거부", "카메라 권한이 없으면 QR스캔을 할 수 없습니다.");
                }
            } else {
                setHasPermission(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (scannedData) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
        
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [scannedData]);

    const handleReadCode = (event) => {
        const value = event?.nativeEvent?.codeStringValue;
        if (!value || isProcessingRef.current === value) return; // 동일한 코드거나 처리 중이면 무시
        
        isProcessingRef.current = value;
        setScannedData(value);
        
        // 기존 타이머 취소
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // 5초 후에 스캔된 데이터 초기화
        timeoutRef.current = setTimeout(() => {
            isProcessingRef.current = null;
            setScannedData(null);
        }, 5000);
    };

    const handleLinkPress = () => {
        if (!scannedData) return;
        
        let productId = scannedData;
        if (scannedData.includes('/product/')) productId = scannedData.split('/product/').pop();
        else if (scannedData.includes('/')) productId = scannedData.split('/').pop();
        
        navigation.navigate('ProductDetail', { nfcId: productId });
        
        // 이동 후 바로 초기화하여 다음 스캔을 준비
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTimeout(() => {
            isProcessingRef.current = null;
            setScannedData(null);
        }, 300);
    };

    const handleDismiss = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        isProcessingRef.current = null;
        setScannedData(null);
    };

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.permissionContainer}>
                    <Text style={styles.guide}>카메라 권한을 허용해주세요.</Text>
                </View>
            </View>
        );
    }

    if (!isFocused) {
        return <View style={styles.container} />;
    }

    return (
        <View style={styles.container}>
            {/* 스캐너가 비활성화되지 않도록 계속 유지 */}
            <Camera
                style={StyleSheet.absoluteFill}
                cameraType={CameraType.Back}
                scanBarcode={true}
                showFrame={false}
                onReadCode={handleReadCode}
            />
            
            {/* 상단 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={30} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* 스캔 가이드 영역 (중앙 포커스용) */}
            <View style={styles.focusFrameContainer}>
                <View style={styles.focusFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
            </View>

            {/* 스캔된 결과 팝업 링크 */}
            {scannedData && (
                <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
                    <View style={styles.resultWrapper}>
                        <TouchableOpacity style={styles.resultButton} onPress={handleLinkPress} activeOpacity={0.8}>
                            <View style={styles.resultIcon}>
                                <Ionicons name="link-outline" size={20} color="#fff" />
                            </View>
                            <View style={styles.resultTextContainer}>
                                <Text style={styles.resultTitle}>상품 열기</Text>
                                <Text style={styles.resultLink} numberOfLines={1} ellipsizeMode="tail">
                                    {scannedData}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                        
                        {/* 닫기 (취소) 버튼 */}
                        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* 하단 안내 텍스트 */}
            <View style={styles.footer}>
                <Text style={styles.guide}>QR코드를 화면 중앙에 맞춰주세요</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, zIndex: 10 },
    backBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    
    focusFrameContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    focusFrame: {
        width: width * 0.65,
        height: width * 0.65,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#3182F6',
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },

    resultContainer: {
        position: 'absolute',
        bottom: 120,
        width: '100%',
        alignItems: 'center',
        zIndex: 20,
    },
    resultWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        justifyContent: 'center',
    },
    resultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 30,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    resultIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3182F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    resultLink: {
        fontSize: 12,
        color: '#666',
    },
    dismissButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },

    footer: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
    guide: { color: '#fff', fontSize: 14, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
});

export default QrScreen;

