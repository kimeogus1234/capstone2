import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** 🏷️ 상품 정보 (제목, 가격, 로켓배송 배지 등) */
export const ProductInfo = ({ title, price }) => {
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <Text style={styles.rocketText}>PREMIUM DELIVERY</Text>
        <Ionicons name="flash" size={14} color="#000" />
      </View>
      <Text style={styles.titleText}>{title || '상품명이 없습니다'}</Text>
      <View style={styles.priceRow}>
        {/* 할인율이 필요하다면 여기서 추가 가능 (현재는 가격 중심) */}
        <Text style={styles.priceText}>{price || '0원'}</Text>
        <Text style={styles.priceUnit}> (무료배송)</Text>
      </View>

      {/* 🌟 명품 리뷰 포인트 (예시) */}
      <View style={styles.pointDetail}>
        <Ionicons name="star" size={14} color="#000" />
        <Text style={styles.pointText}>4.9 | 100% 구매 만족도</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 25, paddingVertical: 35, backgroundColor: '#fff' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rocketText: { fontSize: 10, fontWeight: '900', color: '#000', marginRight: 5, letterSpacing: 1 },

  titleText: { fontSize: 24, fontWeight: '900', color: '#000', lineHeight: 32, marginBottom: 15, letterSpacing: -0.5 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceText: { fontSize: 28, fontWeight: '900', color: '#B00020' }, // 세일 레드 컬러 (마트 스타일 반영)
  priceUnit: { fontSize: 14, color: '#aaa', fontWeight: 'bold', marginLeft: 5 },

  pointDetail: { marginTop: 25, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#f2f2f2', paddingTop: 20 },
  pointText: { fontSize: 13, color: '#666', marginLeft: 8, fontWeight: '600' },
});