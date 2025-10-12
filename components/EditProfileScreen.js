import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen({ navigation, route }) {
  const { userData } = route.params;
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [name, setName] = useState(userData.name || '');
  const [dob, setDob] = useState(userData.dob || '');
  const [gender, setGender] = useState(userData.gender || '');
  const [avatar, setAvatar] = useState(userData.avatar || null);
  const [loading, setLoading] = useState(false);

  // Request permission for image picker
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow media library access to change your profile picture.');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.log('ImagePicker Error:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSave = async () => {
    if (!name || !dob || !gender) return Alert.alert('Error', 'Please fill all fields');

    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        dob,
        gender,
        avatar,
      });

      // Optionally update Firebase Auth displayName and photoURL
      await updateProfile(currentUser, {
        displayName: name,
        photoURL: avatar,
      });

      setLoading(false);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
          <Image
            source={{ uri: avatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.changeText}>Change Photo</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={setDob}
        />
        <TextInput
          style={styles.input}
          placeholder="Gender"
          value={gender}
          onChangeText={setGender}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: Platform.OS === 'android' ? 20 : 0 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  avatarWrapper: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
  changeText: { color: '#007bff', marginTop: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
