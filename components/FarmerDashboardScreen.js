import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export default function FarmerDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          navigation.navigate('LoginScreen');
          return;
        }

        setUserId(user.uid);

        // Fetch userType
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          console.warn('User doc not found');
          return;
        }
        const userData = userDoc.data();
        setUserType(userData.userType);

        // Fetch products
        const productsQuery = query(collection(db, 'products'), where('ownerId', '==', user.uid));
        const productsSnapshot = await getDocs(productsQuery);
        setProductCount(productsSnapshot.size);

        // Fetch all orders and filter items belonging to this farmer
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const farmerOrders = [];
        let totalSales = 0;
        let totalRevenue = 0;

        ordersSnapshot.forEach((docSnap) => {
          const orderData = docSnap.data();
          if (Array.isArray(orderData.items)) {
            const itemsForFarmer = orderData.items.filter(item => item?.ownerId === user.uid);
            if (itemsForFarmer.length > 0) {
              farmerOrders.push({ id: docSnap.id, ...orderData });

              // Count sales & revenue only for farmer's items
              itemsForFarmer.forEach(item => {
                totalSales += item.quantity || 0;
                totalRevenue += (item.price || 0) * (item.quantity || 0);
              });
            }
          }
        });

        setOrderCount(farmerOrders.length);
        setSalesCount(totalSales);
        setRevenue(totalRevenue);

      } catch (err) {
        console.log('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  // Stat card component
  const StatCard = ({ number, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Farmer Dashboard</Text>

      <View style={styles.statsContainer}>
        <StatCard number={productCount} label="Products" color="#f1c40f" />
        <StatCard number={orderCount} label="Orders" color="#3498db" />
      </View>

      <View style={styles.statsContainer}>
        <StatCard number={salesCount} label="Items Sold" color="#2ecc71" />
        <StatCard number={`R${revenue.toFixed(2)}`} label="Revenue" color="#e67e22" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
  },
  statNumber: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: '#fff', marginTop: 4 },
});
