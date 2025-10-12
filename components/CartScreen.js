import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

export default function CartScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      fetchCart();
    }, [userId])
  );

  const fetchCart = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'cart'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const items = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const productSnap = await getDoc(doc(db, 'products', data.productId));
          const productData = productSnap.exists() ? productSnap.data() : {};
          return {
            id: d.id,
            quantity: data.quantity || 1,
            name: productData.name || 'Product',
            price: productData.price || 0,
            imgPath: productData.imgPath || productData.imgUrl || 'https://via.placeholder.com/150',
          };
        })
      );

      setCartItems(items);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch cart.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item)));
    try {
      const docRef = doc(db, 'cart', itemId);
      await updateDoc(docRef, { quantity: newQty });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const removeItem = async (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    try {
      await deleteDoc(doc(db, 'cart', itemId));
      Alert.alert('Removed', 'Item removed from cart.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigation.navigate('CheckoutScreen', { cartItems, totalPrice });
  };

  // Loading state
  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 10 }}>Loading cart...</Text>
      </View>
    );

  // User not logged in
  if (!userId)
    return (
      <View style={styles.centered}>
        <Text style={{ marginBottom: 12 }}>You need to login to view your cart.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    );

  // Empty cart state
  if (cartItems.length === 0)
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2038/2038854.png' }}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Looks like you haven't added any products yet.</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image source={{ uri: item.imgPath }} style={styles.itemImage} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>R{item.price}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyTextBtn}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyTextBtn}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: R{totalPrice}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBtn: { backgroundColor: 'green', padding: 12, borderRadius: 8 },
  loginText: { color: '#fff', fontWeight: 'bold' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    tintColor: '#ccc',
  },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#333', textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#777', textAlign: 'center', lineHeight: 22 },

  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 18, borderRadius: 10, backgroundColor: '#f9f9f9' },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { fontSize: 14, color: '#555' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { width: 32, height: 32, borderWidth: 1, borderColor: '#007AFF', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyTextBtn: { fontSize: 18, color: '#007AFF', fontWeight: 'bold' },
  qtyValue: { marginHorizontal: 8, fontSize: 16, fontWeight: '600' },
  removeBtn: { marginLeft: 10, backgroundColor: '#ff3b30', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  removeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: '#ddd' },
  totalText: { fontSize: 16, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: 'green', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  checkoutText: { color: '#fff', fontWeight: 'bold' },
});
