import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'orders'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const ordersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds); // newest first

      setOrders(ordersData);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="green" />
      <Text style={{ marginTop: 10 }}>Loading orders...</Text>
    </View>
  );

  if (!userId) return (
    <View style={styles.centered}>
      <Text style={{ marginBottom: 12 }}>You need to login to view your orders.</Text>
    </View>
  );

  if (orders.length === 0) return (
    <View style={styles.centered}>
      <Text style={{ fontSize: 16, color: '#777' }}>You have no orders yet.</Text>
    </View>
  );

  const renderOrderItem = ({ item }) => {
  // calculate total dynamically
  const total = (item.items || []).reduce(
    (sum, prod) => sum + (Number(prod.price || 0) * Number(prod.quantity || 0)),
    0
  );

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order ID: {item.id.slice(0, 6)}...</Text>
        <Text
          style={[styles.status, item.paymentStatus === 'paid' ? styles.paid : styles.pending]}
        >
          {item.paymentStatus || 'pending'}
        </Text>
      </View>
      <Text style={styles.paymentMethod}>Payment: {item.paymentMethod || 'Unknown'}</Text>

      <FlatList
        data={item.items || []}
        keyExtractor={(prod) => prod.productId || Math.random().toString()}
        renderItem={({ item: prod }) => (
          <View style={styles.productRow}>
            <Text style={styles.prodName}>{prod.name || 'Product'}</Text>
            <Text style={styles.prodQty}>x{prod.quantity || 0}</Text>
            <Text style={styles.prodPrice}>
              R{(Number(prod.price || 0) * Number(prod.quantity || 0)).toFixed(2)}
            </Text>
          </View>
        )}
      />

      <Text style={styles.totalPrice}>Total: R{total.toFixed(2)}</Text>
    </View>
  );
};


  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  orderCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 10, marginTop:26 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: 'bold', textTransform: 'capitalize' },
  paid: { color: 'green' },
  pending: { color: 'orange' },
  paymentMethod: { fontSize: 14, color: '#555', marginBottom: 8 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  prodName: { flex: 1, fontSize: 14 },
  prodQty: { width: 40, textAlign: 'center' },
  prodPrice: { width: 70, textAlign: 'right', fontWeight: '600' },
  totalPrice: { fontSize: 16, fontWeight: 'bold', marginTop: 8, textAlign: 'right' },
});
