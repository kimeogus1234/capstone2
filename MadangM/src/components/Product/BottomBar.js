import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** 🛍️ 프리미엄 하단 고정 버튼 (장바구니 중심 시스템) */
export const BottomBar = ({ onAddToCart, onWishlist }) => {
  return (
    <View style={styles.footer}>
      <View style={styles.btnRow}>
        {/* 🤍 찜하기 버튼 */}
        <TouchableOpacity style={styles.wishBtn} activeOpacity={0.8} onPress={onWishlist}>
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>

        {/* 🛒 메인 버튼: 장바구니 담기 */}
        <TouchableOpacity style={styles.cartMainBtn} activeOpacity={0.9} onPress={onAddToCart}>
          <Text style={styles.cartMainText}>장바구니 담기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 20, right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
    borderWidth: 1, borderColor: '#f2f2f2'
  },
  btnRow: { flexDirection: 'row', padding: 15, borderRadius: 20 },
  wishBtn: {
    width: 60, height: 60,
    backgroundColor: '#f9f9f9', borderRadius: 15,
    justifyContent: 'center', alignItems: 'center'
  },
  cartMainBtn: {
    flex: 1, height: 60,
    backgroundColor: '#000', borderRadius: 15,
    marginLeft: 15,
    justifyContent: 'center', alignItems: 'center'
  },
  cartMainText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});