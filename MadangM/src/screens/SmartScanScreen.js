import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const SmartScanScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            {/* 상단 환영 메시지 */}
            <View style={styles.header}>
                <Text style={styles.welcomeText}>안녕하세요, 승재 님! 👋</Text>
                <Text style={styles.subText}>신선한 농수산물 정보를 확인해보세요.</Text>
            </View>

            {/* 중앙 스캔 안내 영역 */}
            <View style={styles.scanArea}>
                <View style={styles.imageWrapper}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80' }}
                        style={styles.realPhoto}
                    />
                </View>
                <Text style={styles.infoText}>상품의 NFC 및 QR을 스캔해주세요</Text>
                <Text style={styles.subInfoText}>스캔 후 무거운 짐은 저희가 배송해 드릴게요!</Text>
            </View>

            {/* 하단 스캔 시작 버튼 */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.nfcButton}
                    onPress={() => navigation.navigate('NfcScan')}
                >
                    <Text style={styles.buttonText}>NFC 스캔하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.qrButton}
                    onPress={() => navigation.navigate('QrScan')}
                >
                    <Text style={styles.buttonText}>QR 스캔하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        fontSize: 16,
        color: '#777',
        marginTop: 8,
    },
    scanArea: {
        alignItems: 'center',
    },
    imageWrapper: {
        width: 180,
        height: 180,
        borderRadius: 90,
        marginBottom: 25,
        borderWidth: 4,
        borderColor: '#e8f5e9',
        backgroundColor: '#fff',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    realPhoto: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    infoText: {
        fontSize: 18,
        color: '#555',
        fontWeight: '500',
    },
    subInfoText: {
        fontSize: 14,
        color: '#888',
        marginTop: 10,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 15,
    },
    nfcButton: {
        flex: 1,
        backgroundColor: '#2e7d32',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        marginRight: 8,
    },
    qrButton: {
        flex: 1,
        backgroundColor: '#fbc02d',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        marginLeft: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SmartScanScreen;
