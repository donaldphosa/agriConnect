// App.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Screens
import LoginScreen from './components/Login';
import SignUpScreen from './components/SignUp';
import HomeScreen from './components/HomeScreen';
import ProductDetailsScreen from './components/ProductDetailsScreen';
import CartScreen from './components/CartScreen';
import CheckoutScreen from './components/CheckoutScreen';
import ProfileScreen from './components/Profile';
import WishlistScreen from './components/WishlistScreen';
import AISearchScreen from './components/AISearchScreen';
import FarmerDashboardScreen from './components/FarmerDashboardScreen';
import FarmerProductsScreen from './components/FarmerProductsScreen';
import AddProductScreen from './components/AddProductScreen';
import FarmerBookingScreen from './components/FarmerBookingScreen';
import FarmerOrderDetailsScreen from './components/FarmerOrderDetailsScreen';
import EditProductScreen from './components/EditProductScreen';
import EditProfileScreen from './components/EditProfileScreen';
import OrdersScreen from './components/OrdersScreen';
import MapScreen from './components/MapScreen';
import ChatBotScreen from './components/ChatBotScreen';

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- Auth Hook: keeps user + userType in sync ---------- */
const useAuthState = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const auth = getAuth();

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setUserType(null);
          setInitializing(false);
          return;
        }

        setUser(currentUser);

        // Fetch userType from Firestore document
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          setUserType(snap.data().userType || null);
        } else {
          saveData(currentUser.uid || "no user");
          console.warn(`⚠️ No user doc found for UID: ${currentUser.uid}`);
          setUserType(null);
        }
      } catch (err) {
        console.error('Error fetching userType:', err);
        setUserType(null);
      } finally {
        setInitializing(false);
      }
    });

     const saveData = async (text) => {
    try {
      await AsyncStorage.setItem('@my_text', text);
      
    } catch (e) {
      console.log('Failed to save data', e);
    }
  };

    return () => unsubscribe();
  }, []);

  return { initializing, user, userType };
};

/* ---------- Custom Bottom Tab Bar ---------- */
function CustomTabBar({ state, descriptors, navigation }) {
  const animatedScales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    animatedScales.forEach((anim, idx) => {
      Animated.spring(anim, {
        toValue: state.index === idx ? 1.15 : 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  }, [state.index]);

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'green' }}>
      <View style={styles.tabInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? route.name;
          const iconName = options.tabBarIconName || 'ellipse-outline';
          const isFocused = state.index === index;

          const onPress = () => {
            const requiresAuth = options.requiresAuth || false;
            const currentUser = getAuth().currentUser;

            if (requiresAuth && !currentUser) {
              Alert.alert(
                'Login Required',
                'Please login to access this feature.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Login', onPress: () => navigation.navigate('AuthFlow', { screen: 'Login' }) },
                ]
              );
              return;
            }

            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.9}
            >
              <Animated.View style={{ transform: [{ scale: animatedScales[index] }] }}>
                <Ionicons name={iconName} size={24} color={isFocused ? '#fff' : 'rgba(255,255,255,0.8)'} />
              </Animated.View>
              <Text style={[styles.tabLabel, { opacity: isFocused ? 1 : 0.8 }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/* ---------- Consumer Tabs ---------- */
function ConsumerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home', tabBarIconName: 'home-outline' }} />
      <Tab.Screen name="AI Search" component={AISearchScreen} options={{ tabBarLabel: 'AI Search', tabBarIconName: 'sparkles-outline' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Cart', tabBarIconName: 'cart-outline', requiresAuth: true }} />
      <Tab.Screen name="OrdersScreen" component={OrdersScreen} options={{ tabBarLabel: 'Orders', tabBarIconName: 'calendar-outline', requiresAuth: true }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIconName: 'person-outline', requiresAuth: true }} />
    </Tab.Navigator>
  );
}

/* ---------- Farmer Tabs ---------- */
function FarmerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={FarmerDashboardScreen} options={{ tabBarLabel: 'Dashboard', tabBarIconName: 'stats-chart-outline' }} />
      <Tab.Screen name="Products" component={FarmerProductsScreen} options={{ tabBarLabel: 'Products', tabBarIconName: 'leaf-outline' }} />
      <Tab.Screen name="Add Product" component={AddProductScreen} options={{ tabBarLabel: 'Add', tabBarIconName: 'add-circle-outline' }} />
      <Tab.Screen name="Bookings" component={FarmerBookingScreen} options={{ tabBarLabel: 'Bookings', tabBarIconName: 'calendar-outline' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIconName: 'person-outline' }} />
    </Tab.Navigator>
  );
}

/* ---------- Auth Navigator ---------- */
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

/* ---------- Consumer Flow ---------- */
const ConsumerStack = createStackNavigator();
function ConsumerFlow() {
  return (
    <ConsumerStack.Navigator screenOptions={{ headerShown: false }}>
      <ConsumerStack.Screen name="ConsumerTabs" component={ConsumerTabs} />
      <ConsumerStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <ConsumerStack.Screen name="Checkout" component={CheckoutScreen} />
    </ConsumerStack.Navigator>
  );
}

/* ---------- Farmer Flow ---------- */
const FarmerStack = createStackNavigator();
function FarmerFlow() {
  return (
    <FarmerStack.Navigator screenOptions={{ headerShown: false }}>
      <FarmerStack.Screen name="FarmerTabs" component={FarmerTabs} />
    </FarmerStack.Navigator>
  );
}

/* ---------- Main App ---------- */
export default function App() {
  const { initializing, user, userType } = useAuthState();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#43a047" />
      </View>
    );
  }

  return (
     <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <RootStack.Screen name="AuthFlow" component={AuthNavigator} />
          ) : userType === 'farmer' ? (
            <RootStack.Screen name="FarmerFlow" component={FarmerFlow} />
          ) : (
            <RootStack.Screen name="ConsumerFlow" component={ConsumerFlow} />
          )}

          <RootStack.Screen
            name="ProductDetailsScreen"
            component={ProductDetailsScreen}
            options={{ headerShown: true, title: 'Product Details' }}
          />
          <RootStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: false, title: 'Product Details' }}
          />
          <RootStack.Screen
            name="OrderDetailsScreen"
            component={FarmerOrderDetailsScreen}
            options={{ headerShown: true, title: 'Order Details' }}
          />
          <RootStack.Screen
            name="EditProductScreen"
            component={EditProductScreen}
            options={{ headerShown: true, title: 'Edit Product' }}
          />
          <RootStack.Screen
            name="CheckoutScreen"
            component={CheckoutScreen}
            options={{ headerShown: true, title: 'Checkout' }}
          />
          <RootStack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{ headerShown: true, title: 'MapScreen' }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  tabInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  tabButton: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabLabel: { marginTop: 4, fontSize: 11, color: '#fff', textAlign: 'center' },
});
