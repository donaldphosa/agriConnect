import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ProductCard({ product, navigation, onAddToCart, onEdit, onDelete, cardWidth }) {
  const [userType, setUserType] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const docRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(docRef);
          if (userSnap.exists()) {
            setUserType(userSnap.data().userType);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user type:', err);
      }
    };

    fetchUserType();
  }, []);

  const handlePress = () => {
    navigation.navigate('ProductDetailsScreen', { product });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={[styles.card, { width: cardWidth || '100%' }]}>
        <Image
          source={{ uri: product.imgPath || product.imgUrl }}
          style={styles.image}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>R {product.price?.toFixed(2)}</Text>

          {/* 🌿 Farmer View (Edit + Delete) */}
          {userType === 'farmer' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
                onPress={() => onEdit && onEdit(product)}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  Alert.alert('Confirm Delete', 'Delete this product?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(product.id) },
                  ]);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            // 🛒 Consumer View (Add to Cart)
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => onAddToCart && onAddToCart(product)}
            >
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 140,
  },
  info: {
    padding: 10,
    position: 'relative',
  },
  name: { fontSize: 15, fontWeight: 'bold', marginBottom: 4, color: '#222' },
  price: { fontSize: 14, color: '#444', marginBottom: 8 },
  cartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 6,
    right: 8,
  },
  actionButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
