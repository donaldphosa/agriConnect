import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export default function FarmerOrderDetailsScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const farmerId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!farmerId) return;
        setLoading(true);

        // 🔍 Get all orders that belong to this farmer
        const q = query(collection(db, 'orders'), where('farmerId', '==', farmerId));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch farmer orders:', err);
        Alert.alert('Error', 'Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [farmerId]);

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productQty}>Quantity: {item.quantity}</Text>
      <Text style={styles.productPrice}>Price: R{item.price?.toFixed(2) || '0.00'}</Text>
      <Text style={styles.subtotal}>
        Subtotal: R{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </Text>
    </View>
  );

  const renderOrder = ({ item: order }) => {
    const totalPrice = order.items?.reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
      0
    );

    return (
      <View style={styles.orderContainer}>
        <Text style={styles.title}>Order #{order.id}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{order.customerName || 'N/A'}</Text>

          <Text style={styles.label}>Order Date:</Text>
          <Text style={styles.value}>
            {order.createdAt?.toDate?.()?.toLocaleString?.() || 'N/A'}
          </Text>

          {order.deliveryAddress && (
            <>
              <Text style={styles.label}>Delivery Address:</Text>
              <Text style={styles.value}>{order.deliveryAddress}</Text>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Products</Text>
        <FlatList
          data={order.items || []}
          keyExtractor={(item, idx) => `${order.id}_${idx}`}
          renderItem={renderProduct}
          scrollEnabled={false}
        />

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Price:</Text>
          <Text style={styles.totalValue}>R{totalPrice?.toFixed(2) || '0.00'}</Text>
        </View>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => Alert.alert('Marked as Completed', `Order #${order.id} completed.`)}
        >
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert('Contact', `Contact ${order.customerName}`)}
        >
          <Text style={styles.contactButtonText}>Contact Customer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="green" />
        <Text>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No orders found yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {orders.map(order => (
            <View key={order.id}>{renderOrder({ item: order })}</View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },

  orderContainer: { marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', margin: 16, textAlign: 'center', color: '#333' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
  },
  label: { fontWeight: '600', color: '#555', marginTop: 8 },
  value: { fontSize: 16, color: '#000', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 8, color: '#333' },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  productName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  productQty: { fontSize: 14, color: '#555' },
  productPrice: { fontSize: 14, color: '#555' },
  subtotal: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  totalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: 'green' },

  completeButton: {
    backgroundColor: 'green',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  contactButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
