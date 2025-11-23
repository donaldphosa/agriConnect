import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import ProductCard from './ProductCard';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FarmerProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const fetchProducts = async () => {
    try {
      if (!userId) return;
      const q = query(collection(db, 'products'), where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch products');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [userId])
  );

  const handleEdit = (product) => navigation.navigate('EditProductScreen', { product });
  const handleAddProduct = () => navigation.navigate('AddProductScreen', { onProductAdded: fetchProducts });

  const handleDelete = (productId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'products', productId));
            setProducts(prev => prev.filter(p => p.id !== productId));
            Alert.alert('Deleted', 'Product deleted successfully.');
          } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to delete product.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You have no products yet.</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
              <Text style={styles.addButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                isFarmer
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }} // prevent floating button overlap
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, marginBottom: 20, color: '#555' },
  addButton: { backgroundColor: 'green', padding: 12, borderRadius: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'green',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
  floatingOderButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'green',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
  floatingAddButtonText: { color: '#fff', fontWeight: 'bold' },
  floatingDashboardButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
});
