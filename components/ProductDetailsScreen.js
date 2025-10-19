import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const isOwner = product.ownerId === currentUser?.uid;

  const handleAddToCart = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to add items to cart.');
      return;
    }

    try {
      const userId = currentUser.uid;

      // Check if product already in cart
      const cartQuery = query(
        collection(db, 'cart'),
        where('userId', '==', userId),
        where('productId', '==', product.id)
      );

      const snapshot = await getDocs(cartQuery);

      if (snapshot.empty) {
        // Add new product to cart
        await addDoc(collection(db, 'cart'), {
          userId,
          productId: product.id,
          name: product.name,
          price: product.price || 0,
          quantity: 1,
          imgPath: product.imgPath || product.imgUrl || '',
          ownerId: product.ownerId || '',
          createdAt: new Date(),
        });
        Alert.alert('Success', `${product.name} added to cart!`);
      } else {
        // Product already in cart → increment quantity
        const existingDoc = snapshot.docs[0];
        const currentQty = existingDoc.data().quantity || 1;
        await updateDoc(doc(db, 'cart', existingDoc.id), { quantity: currentQty + 1 });
        Alert.alert('Updated', `${product.name} quantity increased!`);
      }

      // Navigate to Cart tab (optional)
      navigation.getParent()?.navigate('Cart');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Product Image */}
      <Image
        source={{ uri: product.imgPath || product.imgUrl || 'https://via.placeholder.com/300' }}
        style={styles.image}
      />

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.name || 'Unnamed Product'}</Text>
        <Text style={styles.price}>
          R{product.price !== undefined ? product.price.toFixed(2) : '0.00'}
        </Text>

      </View>

      {/* Action Button */}
      {isOwner ? (
        <TouchableOpacity
          style={styles.buttonEdit}
          onPress={() => navigation.navigate('EditProductScreen', { product })}
        >
          <Text style={styles.buttonText}>Edit Product</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.buttonCart} onPress={handleAddToCart}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 16 },
  image: {
    width: width - 32,
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 24,
  },
  infoContainer: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  price: { fontSize: 20, fontWeight: '600', color: '#28a745', marginBottom: 12 },
  description: { fontSize: 16, color: '#555', lineHeight: 22 },
  buttonEdit: {
    backgroundColor: '#ff7f50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonCart: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
