import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Share, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** 🏷️ 상품 상세 헤더 (뒤로가기, 공유, 찜하기) */
export const ProductHeader = ({ onBack }) => {
  const onShare = async () => {
    try {
      await Share.share({ message: '당신을 위한 프리미엄 산지직송 상품을 구경해보세요!' });
    } catch (error) {
      Alert.alert('오류', '공유하기 기능을 사용할 수 없습니다.');
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={onShare} style={styles.iconBtn}>
          <Ionicons name="share-social-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('WISH', '찜 목록에 추가되었습니다.')}>
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60, paddingHorizontal: 15, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#f2f2f2'
  },
  rightIcons: { flexDirection: 'row' },
  iconBtn: { padding: 10, marginLeft: 5 },
});