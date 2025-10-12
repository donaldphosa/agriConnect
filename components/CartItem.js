import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CartItem({ item, onQuantityChange }) {
  return (
    <View style={styles.itemBox}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>R{item.price}</Text>
      <View style={styles.quantityRow}>
        <TouchableOpacity style={styles.btn} onPress={() => onQuantityChange(Math.max(item.quantity - 1, 1))}>
          <Text>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => onQuantityChange(item.quantity + 1)}>
          <Text>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtotal}>Subtotal: R{item.price * item.quantity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  itemBox: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { fontSize: 14, marginBottom: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  btn: { borderWidth: 1, borderColor: '#ccc', padding: 4, borderRadius: 4 },
  quantity: { marginHorizontal: 10, fontSize: 16 },
  subtotal: { fontWeight: 'bold', fontSize: 14 }
});
