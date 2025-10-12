import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

export default function CheckoutScreen({ route, navigation }) {
  const { totalPrice } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  const [cardDetails, setCardDetails] = useState({ number: '', exp: '', cvv: '' });
  const [bankDetails, setBankDetails] = useState({ account: '', reference: '' });

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const handlePayment = async (method) => {
    if (!userId) return;
    setPaymentMethod(method);

    if (method === 'Credit Card') {
      setShowCardModal(true);
      return;
    }
    if (method === 'Bank Transfer') {
      setShowBankModal(true);
      return;
    }

    // Wallet payment
    processOrder('Wallet');
  };

  const processOrder = async (method) => {
    setLoading(true);
    try {
      const cartQuery = query(collection(db, 'cart'), where('userId', '==', userId));
      const snapshot = await getDocs(cartQuery);

      if (snapshot.empty) {
        setLoading(false);
        return;
      }

      const cartItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      await addDoc(collection(db, 'orders'), {
        userId,
        customerName: auth.currentUser.displayName || 'User',
        items: cartItems.map((item) => ({
          productId: item.productId || item.id,
          ownerId: item.ownerId || '',
          name: item.name,
          price: item.price || 0,
          quantity: item.quantity || 1,
        })),
        totalPrice:
          totalPrice || cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        paymentMethod: method,
        paymentStatus: method === 'Bank Transfer' ? 'awaiting confirmation' : 'paid',
        createdAt: serverTimestamp(),
      });

      // Clear cart
      for (const item of cartItems) {
        await deleteDoc(doc(db, 'cart', item.id));
      }

      setLoading(false);
      setPaymentCompleted(true);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 10 }}>Processing Payment...</Text>
      </View>
    );
  }

  if (paymentCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/845/845646.png' }}
          style={styles.successIcon}
        />
        <Text style={styles.completedTitle}>Payment Successful!</Text>
        <Text style={styles.completedText}>
          Your order has been placed successfully via {paymentMethod}.
        </Text>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.continueText}>Back to Cart</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.total}>Total Payable: R{totalPrice}</Text>

      <Text style={{ marginTop: 20, marginBottom: 10 }}>Select Payment Method:</Text>
      {[ 'Credit Card', 'Bank Transfer'].map((method) => (
        <TouchableOpacity key={method} style={styles.btn} onPress={() => handlePayment(method)}>
          <Text style={styles.btnText}>{method}</Text>
        </TouchableOpacity>
      ))}

      {/* Credit Card Modal */}
      <Modal visible={showCardModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Card Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Card Number"
              keyboardType="numeric"
              value={cardDetails.number}
              onChangeText={(text) => setCardDetails({ ...cardDetails, number: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiry (MM/YY)"
              value={cardDetails.exp}
              onChangeText={(text) => setCardDetails({ ...cardDetails, exp: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="CVV"
              secureTextEntry
              keyboardType="numeric"
              value={cardDetails.cvv}
              onChangeText={(text) => setCardDetails({ ...cardDetails, cvv: text })}
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                setShowCardModal(false);
                processOrder('Credit Card');
              }}
            >
              <Text style={styles.btnText}>Pay R{totalPrice}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCardModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bank Transfer Modal */}
      <Modal visible={showBankModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bank Transfer Details</Text>
            <Text>Transfer R{totalPrice} to:</Text>
            <Text style={{ fontWeight: 'bold' }}>AgriConnect Bank - 123456789</Text>
            <Text>Reference: {userId?.slice(0, 6)}</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Reference Used"
              value={bankDetails.reference}
              onChangeText={(text) => setBankDetails({ ...bankDetails, reference: text })}
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                setShowBankModal(false);
                processOrder('Bank Transfer');
              }}
            >
              <Text style={styles.btnText}>Confirm Transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBankModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  total: { fontSize: 18, fontWeight: 'bold' },
  btn: { backgroundColor: 'green', padding: 12, borderRadius: 8, marginVertical: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  cancelBtn: { backgroundColor: '#ddd', padding: 10, borderRadius: 8, marginTop: 5, alignItems: 'center' },
  cancelText: { color: '#333', fontWeight: '600' },
  completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  successIcon: { width: 100, height: 100, marginBottom: 20 },
  completedTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  completedText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  continueBtn: { backgroundColor: 'green', padding: 12, borderRadius: 8 },
  continueText: { color: '#fff', fontWeight: 'bold' },
});
