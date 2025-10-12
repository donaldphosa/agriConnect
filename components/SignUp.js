import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView 
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState('consumer');
  const [Location, setLocation] = useState('');
  const [storeName, setStoreName] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !name || !gender || !dob || !role || !Location) {
      return Alert.alert('Error', 'Please fill all required fields');
    }

    if (role === 'farmer' && !storeName) {
      return Alert.alert('Error', 'Please enter your store name');
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save profile to Firestore
      await setDoc(doc(db, 'users', uid), {
        userType: role,
        email,
        name,
        gender,
        dob,
        Location,
        ...(role === 'farmer' && { storeName }),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Account created successfully!');

      // Navigate based on role
      if (role === 'farmer') navigation.replace('FarmerProductsScreen', { uid });
      else navigation.replace('HomeScreen', { uid });

    } catch (err) {
      Alert.alert('SignUp Error', err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY/MM/DD)"
        value={dob}
        onChangeText={setDob}
      />
      <TextInput
        style={styles.input}
        placeholder="Location (City / Town)"
        value={Location}
        onChangeText={setLocation}
      />
   {role === 'farmer' && (
        <TextInput
          style={styles.input}
          placeholder="Store Name"
          value={storeName}
          onChangeText={setStoreName}
        />
      )}
      <Text style={{ marginBottom: 8 }}>Select Role:</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'consumer' && styles.roleSelected]}
          onPress={() => setRole('consumer')}
        >
          <Text>Consumer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'farmer' && styles.roleSelected]}
          onPress={() => setRole('farmer')}
        >
          <Text>Farmer</Text>
        </TouchableOpacity>
      </View>

   

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 16, 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16 
  },
  button: { 
    backgroundColor: 'green', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  link: { 
    color: 'blue', 
    textAlign: 'center', 
    marginTop: 12 
  },
  roleRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  roleButton: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    marginHorizontal: 4 
  },
  roleSelected: { 
    backgroundColor: 'lightgreen' 
  }
});
