import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NfcManager, { NfcEvents, Ndef } from 'react-native-nfc-manager';

const UserCart = ({ onBack }: any) => {
  const [nfcState, setNfcState] = useState<'supported' | 'unsupported' | 'disabled'>('supported');
  const [tagData, setTagData] = useState<{
    url?: string;
    name?: string;
    price?: string;
    quantity?: string;
    id?: string;
  } | null>(null);

  useEffect(() => {
    // 1. NFC 매니저 시작
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (!supported) {
          setNfcState('unsupported');
          return;
        }
        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();
        if (!enabled) {
          setNfcState('disabled');
          return;
        }
        setNfcState('supported');
        startNfcListener();
      } catch (err) {
        setNfcState('unsupported');
      }
    };
    initNfc();
    
    // 2. 태그 발견 이벤트 리스너 등록
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
      try {
        console.log('검색된 태그 전체 정보:', JSON.stringify(tag, null, 2));
        let result: any = { id: tag.id || 'N/A' };

        if (tag.ndefMessage && tag.ndefMessage.length > 0) {
          tag.ndefMessage.forEach((record: any, index: number) => {
            console.log(`레코드 [${index}] 타입:`, record.type);

            // [해독 1] URI(URL) 데이터 처리
            if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
              result.url = Ndef.uri.decodePayload(record.payload);
            }
            // [해독 2] 텍스트 데이터 처리 (이름:가격:수량)
            else if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
              const text = Ndef.text.decodePayload(record.payload);
              console.log('추출된 텍스트:', text);

              // [중요] ':' 구분자로 데이터 분리
              const parts = text.split(':');
              if (parts.length >= 2) {
                result.name = parts[0];
                result.price = parts[1];
                result.quantity = parts[2] || '1';
              } else {
                result.name = text;
              }
            }
          });
          
          setTagData(result);
          Alert.alert("스캔 완료", `[${result.name || '태그'}] 상품 정보 감지 성공!`);
        } else {
          Alert.alert("알림", "태그에 기록된 NDEF 메시지가 없습니다.");
        }
      } catch (err) {
        console.error('데이터 해독 중 오류 발생:', err);
        Alert.alert("오류", "태그 데이터를 읽는 중 문제가 발생했습니다.");
      }
    });

    // 리스너 활성화
    startNfcListener();

    return () => {
      // 컴포넌트 언마운트 시 리스너 해제
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => 0);
    };
  }, []);

  const startNfcListener = async () => {
    try {
      await NfcManager.registerTagEvent();
    } catch (ex) {
      console.warn('NFC 리스너 등록 실패:', ex);
    }
  };

  const resetData = () => {
    setTagData(null);
    if (Platform.OS === 'android') {
        NfcManager.unregisterTagEvent().catch(() => 0);
        startNfcListener();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← 메뉴</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NFC 태그 검증</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {!tagData ? (
          <View style={styles.emptyCard}>
            {nfcState === 'unsupported' && (
              <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginBottom: 15, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#B91C1C', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>⚠️ 이 기기는 NFC 기능을 지원하지 않습니다. (에뮬레이터 환경)</Text>
              </View>
            )}
            {nfcState === 'disabled' && (
              <TouchableOpacity 
                style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginBottom: 15, width: '100%', alignItems: 'center' }}
                onPress={() => NfcManager.goToNfcSetting().catch(() => 0)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#D97706', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>⚠️ NFC 설정이 꺼져 있습니다. [여기를 눌러 활성화]</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.emptyTitle}>NFC 스캔 대기 중...</Text>
            <Text style={styles.emptyDesc}>확인할 상품의 NFC 태그를{"\n"}스마트폰 뒷면에 대주세요.</Text>
            <View style={styles.radarContainer}>
              <View style={styles.radarPulse}>
                <Text style={styles.radarEmoji}>📡</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.resultHeaderTitle}>NFC TAG DECODED</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>태그 고유 식별자 (UID)</Text>
              <Text style={styles.valueUid}>{tagData.id}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>상 품 명</Text>
              <Text style={styles.valueName}>{tagData.name || '정보 없음'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>가 격</Text>
              <Text style={styles.valuePrice}>
                {tagData.price ? Number(tagData.price).toLocaleString() : '0'}원
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>등록된 수량</Text>
              <Text style={styles.valueQty}>{tagData.quantity || '1'}개</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>연동된 딥링크 URL</Text>
              <Text style={styles.valueUrl} numberOfLines={2}>
                {tagData.url || 'URL 데이터가 없습니다.'}
              </Text>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={resetData} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>새로운 태그 스캔하기 🔄</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB'
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  backText: { color: '#4E5968', fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A1F27' },
  
  scrollContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },

  emptyCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 35, 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 1
  },
  emptyTitle: { fontSize: 19, fontWeight: '900', color: '#1A1F27', marginBottom: 8 },
  emptyDesc: { textAlign: 'center', fontSize: 14, color: '#6B7684', lineHeight: 22, fontWeight: '500' },
  radarContainer: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  radarPulse: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: '#EAF2FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E4FF'
  },
  radarEmoji: { fontSize: 44 },

  resultCard: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E5E8EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D166', marginRight: 8 },
  resultHeaderTitle: { fontSize: 10, fontWeight: '900', color: '#8B95A1', letterSpacing: 0.8 },

  infoRow: { marginBottom: 16 },
  label: { fontSize: 11, color: '#8B95A1', fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  valueUid: { fontSize: 16, color: '#1A1F27', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  valueName: { fontSize: 19, color: '#1A1F27', fontWeight: '900' },
  valuePrice: { fontSize: 20, color: '#F04452', fontWeight: '900' },
  valueQty: { fontSize: 16, color: '#3182F6', fontWeight: '800' },
  valueUrl: { fontSize: 13, color: '#4E5968', textDecorationLine: 'underline', lineHeight: 18, fontWeight: '600' },

  divider: { height: 1.5, backgroundColor: '#F2F4F6', marginVertical: 18 },
  resetBtn: { 
    backgroundColor: '#1A1F27', 
    paddingVertical: 16, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 10,
  },
  resetBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});

export default UserCart;