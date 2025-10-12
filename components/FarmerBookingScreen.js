import React, { useState, useEffect } from "react";
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView 
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function FarmerBookingScreen({ route, navigation }) {
  const farmerId = route.params?.uid || "";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (farmerId) fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(false);

      const snapshot = await getDocs(collection(db, "orders"));
      const farmerOrders = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.items && data.items.length > 0) {
          const itemsForFarmer = data.items.filter(item => item.ownerId === farmerId);
          if (itemsForFarmer.length > 0) {
            farmerOrders.push({
              id: doc.id,
              customerName: data.customerName,
              items: itemsForFarmer,
              createdAt: data.createdAt,
            });
          }
        }
      });

      setOrders(farmerOrders);
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product) => {
    navigation.navigate("ProductDetailsScreen", { product });
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.customerName}>{item.customerName}</Text>
      {item.items.map((i, idx) => (
        <View key={idx} style={styles.itemRow}>
          <Text style={styles.itemText}>{i.name} x {i.quantity}</Text>
          <Text style={styles.itemText}>R{(i.price * i.quantity).toFixed(2)}</Text>
          <TouchableOpacity onPress={() => handleViewDetails(i)} style={styles.detailsButtonSmall}>
            <Text style={styles.detailsButtonTextSmall}>View Product</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text style={styles.orderDate}>
        Ordered at: {item.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
      </Text>
    </View>
  );

  const showFallback = error || orders.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="green" />
          <Text style={{ marginTop: 8 }}>Loading orders...</Text>
        </View>
      ) : showFallback ? (
        <View style={styles.fallbackContainer}>
          <Image
            source={{ uri: "https://i.ibb.co/WnL1t2D/no-orders.png" }}
            style={styles.fallbackImage}
          />
          <Text style={styles.fallbackTitle}>No Orders Yet</Text>
          <Text style={styles.fallbackText}>
            Looks like none of your products have been purchased yet.
          </Text>
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

  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  fallbackImage: { width: 180, height: 180, marginBottom: 24 },
  fallbackTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  fallbackText: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 24 },

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
  itemRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 8 
  },
  itemText: { fontSize: 14, color: "#333" },
  detailsButtonSmall: { backgroundColor: "green", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  detailsButtonTextSmall: { color: "#fff", fontSize: 12, fontWeight: "bold" },

  orderDate: { fontSize: 12, color: "gray", marginTop: 4 },
  
  footer: { padding: 16, borderTopWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" },
  footerButton: { backgroundColor: "green", padding: 16, borderRadius: 12, alignItems: "center" },
  footerButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
