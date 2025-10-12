import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

export default function ProductCartScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cart items whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        Alert.alert('Login required', 'Please login to view your cart');
        navigation.navigate('Login');
        return;
      }
      fetchCartItems();
    }, [user])
  );

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const cartQuery = query(collection(db, 'cart'), where('userId', '==', user.uid));
      const cartSnapshot = await getDocs(cartQuery);

      // Map cart docs
      const items = await Promise.all(
        cartSnapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          // Fetch product details
          const productDoc = await getDoc(doc(db, 'products', data.productId));
          const productData = productDoc.exists() ? productDoc.data() : {};
          return {
            id: docSnap.id,
            quantity: data.quantity,
            name: productData.name || 'Product',
            price: productData.price || 0,
            imgPath: productData.imgPath || productData.imgUrl || 'https://via.placeholder.com/150',
            description: productData.description || '',
          };
        })
      );

      setCartItems(items);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  };

  const increment = useCallback((id) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decrement = useCallback((id) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  }, []);

  const getTotal = () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const CartItem = memo(({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imgPath }} style={styles.image} />
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>R{item.price.toFixed(2)}</Text>
        </View>
        <View style={styles.qtyFloating}>
          <TouchableOpacity onPress={() => decrement(item.id)} style={styles.qtyBtn}>
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.qtyTextFloating}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => increment(item.id)} style={[styles.qtyBtn, { backgroundColor: '#28a745' }]}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
      </View>
    </View>
  ));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text>Loading cart...</Text>
      </View>
    );
  }

  if (!cartItems.length) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <CartItem item={item} />}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: R{getTotal().toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    transform: [{ rotate: '-5deg' }],
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff7f50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priceText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  qtyFloating: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000050',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff7f50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyTextFloating: { color: '#fff', marginHorizontal: 6, fontWeight: 'bold' },

  details: { flex: 1, padding: 12, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  description: { fontSize: 12, color: '#666' },

  footer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  checkoutBtn: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
