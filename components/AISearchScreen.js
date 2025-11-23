import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Fuse from "fuse.js";
import { Modal, Portal, Button, PaperProvider, Divider } from 'react-native-paper';
import { ScrollView } from "react-native";
import { generateText } from "../services/OpenAIService";
import GeminiChat, { runGemini } from "../services/GeminiChat";
import FlashMessage from "react-native-flash-message";


export default function AISearchScreen({ navigation }) {
  const [text, setText] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');


  const handleSend = async () => {
    try {
      if (!prompt || prompt.trim() == "") return;
    //console.log(prompt);
    const output = await runGemini(prompt);
    setResult(output || "No response");
    } catch (error) {
      console.log(error);
    }
  };

  // const handleGenerateText = async () => {
  //   if (!prompt || prompt.trim() == "") return;
  //   console.log(prompt);
  //   try {
  //     const text = await generateText(prompt);
  //     setResult(text);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };
  const showModal = () => setVisible(true);
  const hideModal = () => {
    setPrompt("");
    setResult("");
    setVisible(false);
  }
  const containerStyle = { backgroundColor: 'white', padding: 20 };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [owners, setOwners] = useState({});
  const [popularProducts, setPopularProducts] = useState([]);
  const [smartText, setSmartText] = useState(
    "Search for fresh products from local farmers!"
  );

  // Fetch all users (owners) from Firestore
  const fetchOwners = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const ownerData = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        ownerData[doc.id] = data.name || "Unknown";
      });
      setOwners(ownerData);
    } catch (err) {
      console.log("Error fetching owners:", err);
    }
  };

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, ownerName: owners[data.ownerId] || "Unknown" };
      });
      setProducts(items);
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  // Fetch popular products from orders
  const fetchPopularProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      const orderCounts = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        data.items.forEach(item => {
          orderCounts[item.productId] = (orderCounts[item.productId] || 0) + item.quantity;
        });
      });
      const popular = Object.entries(orderCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([productId]) => products.find(p => p.id === productId))
        .filter(Boolean);
      setPopularProducts(popular);
    } catch (err) {
      console.log("Error fetching popular products:", err);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    if (Object.keys(owners).length > 0) fetchProducts();
  }, [owners]);

  useEffect(() => {
    if (products.length > 0) fetchPopularProducts();
  }, [products]);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      setSmartText("Showing popular products based on your area and orders!");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const fuse = new Fuse(products, {
        keys: ["name", "description", "location", "ownerName"],
        threshold: 0.4,
      });
      const searchResults = fuse.search(query).map(res => res.item);
      setResults(searchResults);
      setSmartText(
        searchResults.length
          ? `Found ${searchResults.length} products matching "${query}"`
          : `No products matched "${query}". Try another keyword!`
      );
      setLoading(false);
    }, 500);
  };


  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardPrice}>R{item.price?.toFixed(2)}</Text>
      <Text style={styles.cardMeta}>Owner: {item.ownerName}</Text>
      <Text style={styles.cardMeta}>Location: {item.Location || "N/A"}</Text>
      <Text style={styles.cardMeta}>Store: {item.store || "N/A"}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("MapScreen", { product: item })}
      >
        <Text style={styles.addText}>View / Buy</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PaperProvider>

      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="sparkles-outline" size={22} color="green" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Ask AI: Find fresh tomatoes in Limpopo..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="arrow-forward-circle" size={28} color="green" />
          </TouchableOpacity>
        </View>

        <Text style={styles.smartText}>{smartText}</Text>


        {loading ? (
          <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          />
        ) : (
          <FlatList
            data={popularProducts}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          />
        )}

        <Button buttonColor="green" icon={() => (<Ionicons name="sparkles-outline" size={24} color="white" />)} mode="contained"
          onPress={() => showModal()}>
          Ask AI
        </Button>
      </View>
      <Portal>
        <Modal visible={visible} onDismiss={()=>{
          setPrompt("");
          setResult("");
          hideModal();
          }} contentContainerStyle={containerStyle}>
          <EvilIcons onPress={() => hideModal()} name="close-o" size={24} color="black" />
          <Text style={{ color: 'green', fontWeight: "600" }}>Ask me any general question about our products.</Text>
          <Divider />
          <View style={{maxHeight:200}}>
            <ScrollView>
              {result && <Text style={styles.result}>{result}</Text>}
            </ScrollView>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="sparkles-outline" size={22} color="green" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Ask our AI general questions..."
              placeholderTextColor="#888"
              value={prompt}
              onChangeText={setPrompt}
            />
            <TouchableOpacity onPress={handleSend}>
              <Ionicons name="arrow-forward-circle" size={28} color="green" />
            </TouchableOpacity>
          </View>
           {/* <View style={styles.fl}>
            <GeminiChat />
            <FlashMessage position={"top"} />
        </View> */}
        </Modal>
      </Portal>
    </PaperProvider>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  fl:{flex: 1},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    marginTop: 20
  },
  result: {
    marginTop: 10,
    fontSize: 16,
  },
  input: { flex: 1, fontSize: 16, color: "#000" },
  smartText: { marginTop: 12, fontSize: 16, color: "#555", fontStyle: "italic" },
  card: {
    backgroundColor: "#fdfdfd",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardPrice: { fontSize: 16, color: "green", fontWeight: "600", marginTop: 4 },
  cardMeta: { fontSize: 14, color: "#444", marginTop: 2 },
  addButton: {
    marginTop: 10,
    backgroundColor: "#28a745",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  addText: { color: "#fff", fontWeight: "bold" },
});
