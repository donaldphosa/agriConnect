import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import ProductCard from './ProductCard';

const wishlistData = [
  { id: '1', title: 'Bull', price: 'R19,000', description: 'Good Health', itemNumber: '23243' },
  { id: '2', title: 'Mixed Veg', price: 'R200', description: 'Eat Healthy', itemNumber: '877665' },
  { id: '3', title: 'Fruits Pack', price: 'R300', description: 'Eat Healthy', itemNumber: '56667' },
];

export default function WishlistScreen() {
  const handleRemove = (id) => console.log('Removed:', id);
  const handlePurchase = (id) => console.log('Purchased:', id);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My wishlists</Text>

    <FlatList
        data={wishlistData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            image={{ uri: 'https://media.istockphoto.com/id/517188688/photo/mountain-landscape.jpg?s=1024x1024&w=0&k=20&c=z8_rWaI8x4zApNEEG9DnWlGXyDIXe-OmsAyQ5fGPVV8=' }}
            title={item.title}
            price={item.price}
            description={item.description}
            itemNumber={item.itemNumber}
            onRemove={() => handleRemove(item.id)}
            onPurchase={() => handlePurchase(item.id)}
          />
        )}
      />


      <TouchableOpacity style={styles.addToCart}>
        <Text style={styles.addToCartText}>ADD TO CART</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#1dd1a1',
    paddingVertical: 10,
    color: '#fff'
  },
  addToCart: {
    backgroundColor: '#1dd1a1',
    padding: 15,
    alignItems: 'center'
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
