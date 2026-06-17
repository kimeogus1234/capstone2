import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView,
  Platform
} from 'react-native';

const { width } = Dimensions.get('window');

const MainDesign = ({ route, navigation }) => {
  
  // 데이터 상태 관리
  const nfcId = route?.params?.nfcId || 'k2302'; 
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProductData = async (id) => {
    try {
      // 안드로이드/iOS 환경에 따른 서버 주소 설정
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/products/${id}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("서버 통신 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProductData(nfcId);
  }, [nfcId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0073e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageBox}>
          <Image 
            source={{ uri: product?.imageUrl || 'https://via.placeholder.com/400' }} 
            style={styles.mainImage} 
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.brandBadge}>신선마켓 🚀</Text>
          <Text style={styles.productName}>{product?.name || '정보 없음'}</Text>
          
          <View style={styles.priceArea}>
            <Text style={styles.priceText}>{product?.price?.toLocaleString()}원</Text>
            <View style={styles.rocketLabel}><Text style={styles.rocketText}>로켓프레시</Text></View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailCard}>
            <Text style={styles.cardHeader}>상품 정보</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>📍 원산지</Text>
              <Text style={styles.value}>{product?.details?.origin}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>📅 유통기한</Text>
              <Text style={styles.value}>{product?.details?.expiry_date}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartButton}><Text style={styles.cartButtonText}>장바구니</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}><Text style={styles.buyButtonText}>바로구매</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageBox: { width: width, height: 350 },
  mainImage: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20 },
  backText: { color: '#fff', fontSize: 20 },
  content: { padding: 20 },
  brandBadge: { color: '#0073e9', fontWeight: 'bold' },
  productName: { fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  priceArea: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  priceText: { fontSize: 26, fontWeight: 'bold', color: '#ae0000', marginRight: 10 },
  rocketLabel: { backgroundColor: '#00a1ff', padding: 3, borderRadius: 4 },
  rocketText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  detailCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
  cardHeader: { fontWeight: 'bold', marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { color: '#666' },
  value: { fontWeight: 'bold' },
  bottomBar: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#eee' },
  cartButton: { flex: 1, height: 50, borderWidth: 1, borderColor: '#0073e9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cartButtonText: { color: '#0073e9', fontWeight: 'bold' },
  buyButton: { flex: 2, height: 50, backgroundColor: '#0073e9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buyBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default MainDesign;