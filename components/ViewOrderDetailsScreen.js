import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ViewOrderDetails({ route, navigation }) {
  const order = route?.params?.order ?? null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState(order?.status ?? "Pending");

  useEffect(() => {
    console.log("Order received in route:", order);
    if (order?.userId) {
      fetchUser(order.userId);
    } else {
      console.warn("⚠️ No userId found in order:", order);
      setLoading(false);
    }
  }, []);

  const fetchUser = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const userData = snap.data();
        console.log("✅ User data fetched:", userData);
        setUser(userData);
      } else {
        console.warn("⚠️ User document not found for uid:", uid);
      }
    } catch (err) {
      console.error("🔥 Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!order?.id) {
      Alert.alert("Error", "Invalid order reference");
      return;
    }

    Alert.alert("Confirm Delivery", "Mark this order as delivered?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Confirm",
        onPress: async () => {
          try {
            setUpdating(true);
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, { status: "Delivered" });
            setStatus("Delivered");
            Alert.alert("Success", "Order marked as delivered!");
          } catch (err) {
            console.error("Error updating order:", err);
            Alert.alert("Error", "Could not update order status.");
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ No order provided.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="green" />
        <Text>Loading order details...</Text>
      </View>
    );
  }

  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Order Details</Text>

      {/* Buyer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buyer Information</Text>
        {user ? (
          <>
            <Text style={styles.text}>
              Name: {user?.name ?? "N/A"}
            </Text>
            <Text style={styles.text}>
              Email: {user?.email ?? "N/A"}
            </Text>
            <Text style={styles.text}>
              Phone: {user?.phone ?? "N/A"}
            </Text>
            <Text style={styles.text}>
              Location: {user?.Location ?? "N/A"}
            </Text>
          </>
        ) : (
          <Text style={styles.text}>User info not found.</Text>
        )}
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => {
              if (!item) {
                console.warn("⚠️ Found undefined item in order.items");
                return null;
              }
              return (
                <View style={styles.itemRow}>
                  <Text style={styles.text}>
                    {item?.name ?? "Unnamed"} x {item?.quantity ?? 0}
                  </Text>
                  <Text style={styles.text}>
                    R{((item?.price ?? 0) * (item?.quantity ?? 0)).toFixed(2)}
                  </Text>
                </View>
              );
            }}
          />
        ) : (
          <Text style={styles.text}>No items found in this order.</Text>
        )}
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.text}>
          Total: R{order?.totalPrice ?parseFloat(order.totalPrice).toFixed(2) : "0.00"}
        </Text>
        <Text style={styles.text}>
          Ordered at:{" "}
          {order?.createdAt?.toDate?.()?.toLocaleString?.() || "N/A"}
        </Text>
        <Text style={[styles.text, { marginTop: 6 }]}>
          Status:{" "}
          <Text
            style={{
              fontWeight: "bold",
              color: status === "Delivered" ? "green" : "orange",
            }}
          >
            {status}
          </Text>
        </Text>
      </View>

      {/* Mark as Delivered */}
      {status !== "Delivered" && (
        <TouchableOpacity
          style={[styles.button, updating && { opacity: 0.6 }]}
          onPress={handleMarkDelivered}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Mark as Delivered</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#333" },
  text: { fontSize: 14, color: "#333", marginBottom: 4 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  button: {
    backgroundColor: "green",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: { fontSize: 16, color: "red", marginBottom: 10, textAlign: "center" },
});
