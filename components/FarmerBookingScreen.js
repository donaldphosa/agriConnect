import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";

export default function FarmerBookingScreen({ navigation }) {
  const [farmerId, setFarmerId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setFarmerId(user.uid);
      fetchOrders(user.uid);
    } else {
      setError(true);
    }
  }, []);

  const fetchOrders = async (uid) => {
    try {
      setLoading(true);
      setError(false);

      const snapshot = await getDocs(collection(db, "orders"));
      const farmerOrders = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.items && data.items.length > 0) {
          const itemsForFarmer = data.items.filter(item => item.ownerId === uid);
          if (itemsForFarmer.length > 0) {
            farmerOrders.push({
              id: docSnap.id,
              userId: data.userId,
              customerName: data.customerName,
              items: itemsForFarmer,
              createdAt: data.createdAt,
              totalPrice: data.totalPrice,
            });
          }
        }
      });

      setOrders(farmerOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    navigation.navigate("ViewOrderDetailsScreen", { order });
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.customerName}>{item.customerName}</Text>
      {item.items.map((i, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Text style={styles.itemText}>{i.name} x {i.quantity}</Text>
          <Text style={styles.itemText}>R{(i.price * i.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <Text style={styles.orderDate}>
        Ordered at: {item.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
      </Text>

      <TouchableOpacity
        onPress={() => handleViewDetails(item)}
        style={styles.detailsButton}
      >
        <Text style={styles.detailsButtonText}>View Order Details</Text>
      </TouchableOpacity>
    </View>
  );

  const showFallback = error || orders.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="green" />
          <Text>Loading orders...</Text>
        </View>
      ) : showFallback ? (
        <View style={styles.fallbackContainer}>
          <Image
            source={{ uri: "https://i.ibb.co/WnL1t2D/no-orders.png" }}
            style={styles.fallbackImage}
          />
          <Text style={styles.fallbackTitle}>No Orders Yet</Text>
          <Text style={styles.fallbackText}>No purchases for your products yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  fallbackContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  fallbackImage: { width: 180, height: 180, marginBottom: 24 },
  fallbackTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  fallbackText: { fontSize: 16, color: "#555", textAlign: "center" },
  orderCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  customerName: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  itemText: { fontSize: 14, color: "#333" },
  orderDate: { fontSize: 12, color: "gray", marginTop: 4 },
  detailsButton: { backgroundColor: "green", padding: 10, borderRadius: 8, marginTop: 10 },
  detailsButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
