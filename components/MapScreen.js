import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function MapScreen({ route, navigation }) {
  const { product } = route.params || {};
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        // ✅ Ask for permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "We need location permission to load the map."
          );
          setLoading(false);
          return;
        }

        // ✅ Use lowercase key (product.location) — consistent with your Firestore
        const locationText = product.location || product.Location;
        if (!locationText) {
          Alert.alert("No Location Info", "This product has no location data.");
          setLoading(false);
          return;
        }

        // ✅ Convert text address → coordinates
        const geocode = await Location.geocodeAsync(locationText);

        if (geocode.length > 0) {
          const { latitude, longitude } = geocode[0];
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        } else {
          Alert.alert("Error", "Could not find coordinates for this address.");
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        Alert.alert("Error", "Failed to locate product on map.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, [product]);

  // ✅ Open Google Maps or native map
  const openInGoogleMaps = async () => {
    if (!region) {
      Alert.alert("Error", "No location available yet.");
      return;
    }

    const { latitude, longitude } = region;
    const label = encodeURIComponent(product?.name || "Product location");

    // Try native map first, fallback to Google Maps
    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(scheme);
      if (supported) await Linking.openURL(scheme);
      else await Linking.openURL(url);
    } catch (err) {
      console.log("Error opening map:", err);
      Alert.alert("Error", "Could not open map.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 10 }}>Locating product...</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>No map data available for this product.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Visible Map */}
      <MapView style={styles.map} region={region}>
        <Marker
          coordinate={region}
          title={product.name}
          description={product.location || product.Location}
        />
      </MapView>

      {/* ✅ Info + buttons */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.text}>Owner: {product.ownerName || "Unknown"}</Text>
        <Text style={styles.text}>
          Location: {product.location || product.Location || "N/A"}
        </Text>

        <TouchableOpacity style={styles.button} onPress={openInGoogleMaps}>
          <Ionicons
            name="navigate-circle"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>Open in Google Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  text: { fontSize: 14, color: "#333" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  backButton: { marginTop: 8, alignItems: "center", padding: 10 },
  backText: { color: "green", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
