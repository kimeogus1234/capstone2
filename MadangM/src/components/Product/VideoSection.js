import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

/** 🎥 프리미엄 산지직송 비디오 인트로 (한국어 디자인) */
export const VideoSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>산지에서 보내는 신선한 이야기</Text>
      <View style={styles.videoBox}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={30} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.hintText}>생산자의 정성이 담긴 영상을 확인해 보세요</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 25, paddingVertical: 40, borderTopWidth: 10, borderColor: '#f9f9f9', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 20 },
  videoBox: {
    width: '100%', height: 210, backgroundColor: '#f4f4f4',
    borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  overlay: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
  playBtn: { marginLeft: 5 },
  hintText: { fontSize: 11, color: '#aaa', marginTop: 30, fontWeight: 'bold' }
});