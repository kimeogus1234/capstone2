import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const ProductCard = ({ name, price, imageUrl, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={imageUrl ? { uri: imageUrl } : require('../assets/images/mackerel1.png')} 
        style={styles.image} 
      />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>{price}원</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, elevation: 2 },
  image: { width: 80, height: 80, borderRadius: 8 },
  info: { marginLeft: 15, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: '#2ecc71', marginTop: 5 }
});

export default ProductCard;