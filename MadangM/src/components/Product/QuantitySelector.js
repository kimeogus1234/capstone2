import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/** 🔢 수량 선택기 (한국어 기반) */
export const QuantitySelector = ({ quantity, setQuantity }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>구매 수량</Text>
      <View style={styles.selector}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => quantity > 1 && setQuantity(quantity - 1)}
        >
          <Ionicons name="remove" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.number}>{quantity}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setQuantity(quantity + 1)}
        >
          <Ionicons name="add" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 25, paddingVertical: 25, borderBottomWidth: 1.5, borderColor: '#f4f4f4'
  },
  label: { fontSize: 16, fontWeight: '900', color: '#111' },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 12 },
  btn: { width: 35, height: 35, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  number: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, width: 25, textAlign: 'center' },
});