import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';

export default function AddProductScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('');
  const [storeName, setStoreName] = useState(''); // ✅ added
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to add a product.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('LoginScreen') },
      ]);
      return;
    }

    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library permissions.');
      }

      // ✅ Fetch store name from owner profile
      try {
        const ownerRef = doc(db, 'users', user.uid);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          setStoreName(ownerData.storeName || 'Unnamed Store');
        } else {
          setStoreName('Unnamed Store');
        }
      } catch (err) {
        console.log('Error fetching store info:', err);
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
    if (!user) return;
    if (!name || !price || !description || !image || !category)
      return Alert.alert('Error', 'Fill all fields');

    setLoading(true);

    try {
      // ✅ Fetch owner (store) details from Firestore again to get latest data
      const ownerRef = doc(db, 'users', user.uid);
      const ownerSnap = await getDoc(ownerRef);

      if (!ownerSnap.exists()) {
        setLoading(false);
        return Alert.alert('Error', 'Owner details not found. Please complete your store profile.');
      }

      const ownerData = ownerSnap.data();
      const { location, storeName: store } = ownerData;

      // ✅ Save product with location + store name
      await addDoc(collection(db, 'products'), {
        name,
        price: parseFloat(price),
        description,
        imgPath: image,
        ownerId: user.uid,
        category,
        storeName: store || 'Unnamed Store',
        location: location || null,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert('Success', 'Product added!');

      // Reset fields
      setName('');
      setPrice('');
      setDescription('');
      setImage(null);
      setCategory('');
    } catch (err) {
      setLoading(false);
      console.error('Save Error:', err);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Product</Text>

      {/* ✅ Display store name */}
      <Text style={styles.storeText}>Store: {storeName}</Text>

      <TextInput placeholder="Name" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Price" style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput
        placeholder="Description"
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Vegetables" value="vegetables" />
          <Picker.Item label="Fruits" value="fruits" />
          <Picker.Item label="Dairy" value="dairy" />
          <Picker.Item label="Animals" value="animals" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={{ color: '#555' }}>{image ? 'Change Image' : 'Select Image'}</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.previewImage} />}

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading || !user}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Product</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  storeText: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#28a745', textAlign: 'center' }, // ✅ new
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 14, marginBottom: 16, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  imagePicker: { padding: 14, backgroundColor: '#f0f0f0', borderRadius: 4, alignItems: 'center', marginBottom: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 4, marginBottom: 24 },
  button: { backgroundColor: '#28a745', paddingVertical: 16, borderRadius: 4, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
