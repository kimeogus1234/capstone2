import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** 🏷️ 프리미엄 상품 상세 정보 템플릿 */
export const DetailContent = ({ origin, weight, storage, description }) => {
  const specs = [
    { label: '품명 및 모델명', value: '프리미엄 산지직송 정체' },
    { label: '원산지 / 생산자', value: origin || '국산(상세 설명 참조)' },
    { label: '중량 / 수량', value: weight || '상세 페이지 내용 참조' },
    { label: '보관 방법', value: storage || '냉장/냉동 보관 필수' },
    { label: '유통기한/제조일', value: '배송일로부터 7일 이내 (신선 상품)' },
    { label: '포장 타입', value: '친환경 아이스팩 & 에어캡 합포장' },
    { label: '고객 센터', value: '1588-XXXX (프리미엄 컨시어지)' },
  ];

  return (
    <View style={styles.container}>
      {/* 🏙️ 상품 상세 설명 영역 */}
      <View style={styles.descSection}>
        <Text style={styles.sectionTitle}>상품 상세 설명</Text>
        <Text style={styles.descText}>
          {description || "최고급 산지에서 엄선된 프리미엄 상품입니다. 신선함과 당도를 모두 잡기 위해 산지에서 직접 검수 후 당일 발송됩니다. 백화점 퀄리티 그대로 집에서 즐겨보세요."}
        </Text>
      </View>

      {/* 📊 상품 고시 옵션 / 스펙 표 */}
      <View style={styles.specSection}>
        <Text style={styles.sectionTitle}>상품 필수 정보</Text>
        <View style={styles.table}>
          {specs.map((item, index) => (
            <View key={index} style={[styles.tableRow, index === specs.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.labelCol}>
                <Text style={styles.labelText}>{item.label}</Text>
              </View>
              <View style={styles.valueCol}>
                <Text style={styles.valueText}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ❄️ 신선 보관 가이드 (미니 팁) */}
      <View style={styles.guideBox}>
        <Ionicons name="alert-circle-outline" size={16} color="#aaa" />
        <Text style={styles.guideText}>생물 특성상 크기와 색상이 이미지와 다를 수 있습니다.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 25, paddingVertical: 40, backgroundColor: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 20, letterSpacing: -1 },

  descSection: { marginBottom: 50 },
  descText: { fontSize: 14, color: '#444', lineHeight: 26, letterSpacing: -0.2 },

  specSection: { marginBottom: 30 },
  table: { borderTopWidth: 1.5, borderColor: '#000', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f2f2f2', minHeight: 50, alignItems: 'center' },
  labelCol: { width: 110, paddingVertical: 15, paddingRight: 10 },
  labelText: { fontSize: 13, color: '#888', fontWeight: '800' },
  valueCol: { flex: 1, paddingVertical: 15 },
  valueText: { fontSize: 13, color: '#222', fontWeight: '500', lineHeight: 20 },

  guideBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginTop: 20 },
  guideText: { fontSize: 11, color: '#aaa', marginLeft: 8, fontWeight: '500' },
});