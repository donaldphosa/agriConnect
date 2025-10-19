import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ products: 0, sales: 0, wishlist: 0, revenue: 0 });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useFocusEffect(
    React.useCallback(() => {
      fetchUser(); // Re-fetch userData when screen is focused
    }, [])
  );

  const fetchUser = async () => {
    if (!currentUser) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      // Get user info
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data());
      else setError(true);

      // Products
      const productsQuery = query(collection(db, 'products'), where('ownerId', '==', currentUser.uid));
      const productsSnapshot = await getDocs(productsQuery);
      const productCount = productsSnapshot.size;

      // Orders & Sales
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      let totalSales = 0;
      let totalRevenue = 0;
      ordersSnapshot.forEach(orderDoc => {
        const orderData = orderDoc.data();
        if (Array.isArray(orderData.items)) {
          const farmerItems = orderData.items.filter(item => item?.ownerId === currentUser.uid);
          farmerItems.forEach(item => {
            totalSales += item.quantity || 0;
            totalRevenue += (item.price || 0) * (item.quantity || 0);
          });
        }
      });

      // Wishlist
      const wishlistQuery = query(collection(db, 'wishlist'), where('userId', '==', currentUser.uid));
      const wishlistSnapshot = await getDocs(wishlistQuery);

      setStats({
        products: productCount,
        sales: totalSales,
        wishlist: wishlistSnapshot.size,
        revenue: totalRevenue
      });

    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged Out', 'You have successfully logged out.');
    } catch (err) {
      Alert.alert('Error', 'Failed to log out: ' + err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View style={styles.centered}>
        <Text style={{ marginBottom: 12 }}>Failed to load profile.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchUser}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: userData.avatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{userData.name || 'N/A'}</Text>
            <Text style={styles.email}>{userData.email || 'N/A'}</Text>
            <Text style={styles.userType}>{userData.userType?.toUpperCase() || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>{userData.dob || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>{userData.gender || 'N/A'}</Text>
          </View>
        </View>

        {/* Stats for Farmer */}
        {userData.userType === 'farmer' && (
          <View style={styles.statsSection}>
            {[
              { count: stats.products, label: 'My Products', onPress: () => navigation.navigate('FarmerProductsScreen') },
              { count: stats.sales, label: 'My Sales', onPress: () => navigation.navigate('FarmerSalesScreen') },
              { count: `R${stats.revenue.toFixed(2)}`, label: 'Revenue', onPress: null },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.statCard}
                onPress={item.onPress ? item.onPress : () => {}}
              >
                <Text style={styles.statCount}>{item.count}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Wishlist for Consumer */}
        {userData.userType === 'consumer' && (
          <View style={styles.statsSection}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('WishlistScreen')}
            >
              <Text style={styles.statCount}>{stats.wishlist}</Text>
              <Text style={styles.statLabel}>My Wishlist</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile', { userData })}
        >
          <Text style={styles.actionText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: Platform.OS === 'android' ? 20 : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  retryBtn: { backgroundColor: 'green', padding: 12, borderRadius: 8, marginBottom: 8 },
  retryText: { color: 'white', fontWeight: 'bold' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16, backgroundColor: '#ddd' },
  userInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  email: { color: '#555', marginBottom: 2 },
  userType: { fontWeight: '600', color: '#007bff' },

  logoutBtn: {
    position: 'absolute',
    top: 68,
    right: 16,
    backgroundColor: '#ff4d4f',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: '#333' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#555', fontWeight: '600' },
  infoValue: { color: '#333' },

  statsSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  statCount: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#777', marginTop: 4 },

  actionButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
