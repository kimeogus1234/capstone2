import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

// 1. 이미지를 여기서 먼저 정확한 경로로 불러옵니다. (상대경로 주의!)
const IMAGES = {
  mackerel: require('../assets/images/mackerel1.jpg'),
  ramen: require('../assets/images/cuplamen.jpg'),
};

const CartItem = ({ item, onUpdateQuantity }) => {
  
  // 2. 몽고디비의 imageurl 텍스트와 위 IMAGES 변수를 매칭
 const getLocalImage = () => {
    // 1. imageurl 대신 nfc_id(p2001)로 판단하면 훨씬 정확합니다!
    const productId = item.nfc_id; 

    if (productId === "p2001") {
      return IMAGES.ramen; // 컵라면 사진
    } 
    if (productId === "k2302") {
      return IMAGES.mackerel; // 고등어 사진
    }

    // 2. 만약 id로도 안 되면, imageurl에 "cuplamen" 글자가 포함되어 있는지 체크
    const imageName = item.details?.imageurl || "";
    if (imageName.includes("cuplamen")) {
      return IMAGES.ramen;
    }

    return IMAGES.mackerel; // 최종 기본값
  };
  return (
    <View style={styles.cartItem}>
      <Image source={getLocalImage()} style={styles.itemImage} />
      
      <View style={styles.itemInfo}>
        <View style={styles.tagContainer}>
          <Text style={styles.categoryTag}>{item.category === 'fresh' ? '신선식품' : '가공식품'}</Text>
          {item.category === 'fresh' && <Text style={styles.rocketTag}>🚀 로켓프레시</Text>}
        </View>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemDetail}>{item.unit} | {item.description}</Text>
        <Text style={styles.itemPrice}>{(item.price * item.qty).toLocaleString()}원</Text>
      </View>

      <View style={styles.qtyContainer}>
        <View style={styles.qtyBox}>
          <TouchableOpacity onPress={() => onUpdateQuantity(item.id, 'minus')} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.qty}</Text>
          <TouchableOpacity onPress={() => onUpdateQuantity(item.id, 'plus')} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ... 스타일은 이전과 동일 ...
const styles = StyleSheet.create({
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2 },
  itemImage: { width: 90, height: 90, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 15 },
  tagContainer: { flexDirection: 'row', marginBottom: 4 },
  categoryTag: { fontSize: 11, color: '#0073e9', fontWeight: 'bold', marginRight: 5 },
  rocketTag: { fontSize: 11, color: '#00a1ff', fontWeight: 'bold' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  itemDetail: { fontSize: 12, color: '#888', marginVertical: 3 },
  itemPrice: { fontSize: 17, color: '#ae0000', fontWeight: 'bold' },
  qtyContainer: { justifyContent: 'center', marginLeft: 10 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 5, height: 30 },
  qtyBtn: { paddingHorizontal: 8, backgroundColor: '#f8f8f8', height: '100%', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold' },
  qtyText: { paddingHorizontal: 10, fontSize: 14, fontWeight: 'bold', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#ddd' },
});

export default CartItem;