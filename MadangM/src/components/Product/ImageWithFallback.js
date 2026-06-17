import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';

// 기본 대체 이미지 (이미지 로딩 실패 시 보여줄 로컬 이미지 또는 URL)
const FALLBACK_IMAGE = 'https://via.placeholder.com/300?text=No+Image';

export function ImageWithFallback({ src, style, ...props }) {
  const [didError, setDidError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={didError || !src ? { uri: FALLBACK_IMAGE } : { uri: src }}
        style={styles.image}
        // 로딩 완료 시 실행
        onLoadEnd={() => setIsLoading(false)}
        // 로딩 실패 시 실행
        onError={() => {
          setDidError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      
      {/* 이미지 로딩 중에 보여줄 인디케이터 (선택 사항) */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#0073e9" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loader: {
    ...StyleSheet.absoluteFillObject, // 부모 뷰를 꽉 채움
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});