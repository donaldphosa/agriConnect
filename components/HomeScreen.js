import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';
import ProductCard from './ProductCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

const categoriesList = ['Fruits', 'Vegetables', 'Grains', 'Dairy', 'Animals', 'Herbs'];
const categoryImages = {
  Fruits: 'https://tse1.mm.bing.net/th/id/OIP.cwT5tj3xC1pEHNOkEvIC2gHaEo?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
  Vegetables: 'https://tse4.mm.bing.net/th/id/OIP.-2QdepLpzF3_krchZtFKpQHaE8?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
  Grains: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMLxMeyldtvjloGJtmy6VEnEGrXLi8L4pPlg&s',
  Dairy: 'https://bcdairy.ca/wp-content/uploads/2021/08/DairyDictionary.jpg',
  Animals: 'https://1.bp.blogspot.com/-N9Q-aC8g_7Y/Xqoil2-kv8I/AAAAAAAAK9I/gPqhBCzXpGMLmmz2ox0hbTg33B_pR_MrwCLcBGAsYHQ/w1200-h630-p-k-no-nu/Animal_1.jpg',
  Herbs: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1FW3yWqNWDeW7jZ-6p4sjKdUAdGVXKCKZdw&s',
};

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  useEffect(() => { setUser(auth.currentUser); }, []);
  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch products');
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    try {
      const q = query(
        collection(db, 'cart'),
        where('userId', '==', user.uid),
        where('productId', '==', product.id)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, 'cart'), {
          userId: user.uid,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imgPath: product.imgPath || product.imgUrl,
          createdAt: new Date(),
          ownerId: product.ownerId
        });
        Alert.alert('Success', `${product.name} added to cart!`);
      } else {
        const existingDoc = snapshot.docs[0];
        const currentQty = existingDoc.data().quantity || 0;
        await updateDoc(doc(db, 'cart', existingDoc.id), { quantity: currentQty + 1 });
        Alert.alert('Updated', `${product.name} quantity increased!`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {/* {categoriesList.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}>
            <ImageBackground
              source={{ uri: categoryImages[cat] }}
              style={[
                styles.categoryButton,
                // selectedCategory === cat && {...styles.categoryButton, borderColor: '#28a745', borderWidth: 2 },
              ]}
              imageStyle={{ borderRadius: 8 }}
            >
              <Text style={styles.categoryText}>{cat}</Text>
            </ImageBackground>
          </TouchableOpacity>
        ))} */}
      </ScrollView>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAddToCart={() => handleAddToCart(item)}
            cardWidth={CARD_WIDTH}
            navigation={navigation}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f7fa' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginTop:20
  },
  searchInput: { flex: 1, fontSize: 16 },
  categoriesContainer: { marginBottom: 20 },
  categoryButton: {
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 10,
    overflow: 'hidden',
  },
  categoryText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 0 },
  emptyText: { fontSize: 16, color: '#888' },
});
