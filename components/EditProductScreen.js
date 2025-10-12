import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, ScrollView, Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProductScreen({ navigation, route }) {
  const { product } = route.params;

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [description, setDescription] = useState(product.description);
  const [image, setImage] = useState(product.imgPath);
  const [loading, setLoading] = useState(false);

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library permissions.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log('ImagePicker error:', err);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSave = async () => {
    if (!name || !price || !description || !image) return Alert.alert('Error', 'Fill all fields');
    setLoading(true);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        name,
        price: parseFloat(price),
        description,
        imgPath: image,
      });
      setLoading(false);
      Alert.alert('Success', 'Product updated!');
      navigation.goBack();
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Product</Text>

        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          <Image
            source={{ uri: image || 'https://via.placeholder.com/200x200.png?text=No+Image' }}
            style={styles.productImage}
          />
          <Text style={styles.changeImageText}>Tap to change image</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            placeholder="Enter product name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price (R)</Text>
          <TextInput
            placeholder="Enter price"
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Enter description"
            style={[styles.input, { height: 100 }]}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 20 : 0, // extra padding for bottom nav on Android
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#ddd',
  },
  changeImageText: {
    textAlign: 'center',
    color: '#007bff',
    marginBottom: 16,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
