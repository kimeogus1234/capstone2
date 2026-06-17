import { useEffect } from 'react';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

const useNfc = () => {
  useEffect(() => {
    // NFC 매니저 초기화
    NfcManager.start();
    return () => {
      // 컴포넌트 언마운트 시 스캔 중단 및 리스너 해제
      stopScan();
    };
  }, []);

  const startScan = async () => {
    try {
      // 1. NDEF 기술(표준 데이터 형식) 사용 요청
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // 2. 태그 정보 가져오기
      const tag = await NfcManager.getTag();
      
      if (tag && tag.ndefMessage) {
        // 3. NDEF 메시지에서 URL 디코딩
        const payload = tag.ndefMessage[0].payload;
        const url = Ndef.uri.decodePayload(payload);
        console.log("스캔된 데이터:", url);
        return url;
      }
    } catch (ex) {
      console.warn("NFC 스캔 중단 또는 에러:", ex);
    } finally {
      // 스캔 완료 후 기술 요청 해제
      NfcManager.cancelTechnologyRequest();
    }
    return null;
  };

  const stopScan = async () => {
    try {
      await NfcManager.cancelTechnologyRequest();
      await NfcManager.unregisterTagEvent();
    } catch (err) {
      // 이미 종료된 경우 무시
    }
  };

  return { startScan, stopScan };
};

export default useNfc;