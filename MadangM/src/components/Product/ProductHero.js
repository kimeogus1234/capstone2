import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/** 🎬 프리미엄 상품 히어로 이미지 슬라이더 */
export const ProductHero = ({ images = [] }) => {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: images[currentImage] || 'https://via.placeholder.com/600x450' }}
        style={styles.image}
        resizeMode="cover"
      />
      {images.length > 1 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currentImage + 1} / {images.length}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: width, height: width * 0.75, backgroundColor: '#f9f9f9' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});