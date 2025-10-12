import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

const LocationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Location</Text>

      {/* Map */}
      <Image
        source={{ uri: "https://i.ibb.co/k3DzGmW/map.png" }}
        style={styles.map}
      />

      {/* Location buttons */}
      <View style={styles.optionRow}>
        <TouchableOpacity style={styles.optionButton}>
          <Text>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text>OFFICE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton}>
          <Text>OTHER</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm */}
      <TouchableOpacity style={styles.confirmButton}>
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  map: { width: "100%", height: 250, borderRadius: 10, marginBottom: 20 },
  optionRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  optionButton: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 10,
    width: "25%",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "green",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: { color: "white", fontWeight: "bold" },
});

export default LocationScreen;
