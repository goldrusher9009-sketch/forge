import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeCanvas from '../screens/HomeCanvas';
import FeedScreen from '../screens/Feed';
import ChatScreen from '../screens/Chat';
import MarketScreen from '../screens/Market';
import WalletScreen from '../screens/Wallet';

// Auth
import OnboardingScreen from '../screens/Onboarding';
import VerifyScreen from '../screens/Verify';

// Feature screens
import ProfileScreen from '../screens/Profile';
import RoomScreen from '../screens/Room';
import DatingScreen from '../screens/Dating';
import HealthScreen from '../screens/Health';
import TwinScreen from '../screens/Twin';
import PredictionsScreen from '../screens/Predictions';
import ListingScreen from '../screens/Listing';
import ConversationScreen from '../screens/Conversation';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { userId: string };
  Room: { roomId: string };
  Conversation: { userId: string; userName: string };
  Listing: { listingId: string };
  Dating: undefined;
  Health: undefined;
  Twin: undefined;
  Predictions: undefined;
};

export type TabParamList = {
  Home: undefined;
  Feed: undefined;
  Chat: undefined;
  Market: undefined;
  Wallet: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Verify: { phone: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Verify" component={VerifyScreen} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d14',
          borderTopColor: '#1a1a2a',
          borderTopWidth: 1,
          paddingBottom: 20,
          height: 72,
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { fontSize: 10, marginTop: -4 },
      }}
    >
      <Tab.Screen name="Home" component={HomeCanvas} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Room" component={RoomScreen} />
        <Stack.Screen name="Conversation" component={ConversationScreen} />
        <Stack.Screen name="Listing" component={ListingScreen} />
        <Stack.Screen name="Dating" component={DatingScreen} />
        <Stack.Screen name="Health" component={HealthScreen} />
        <Stack.Screen name="Twin" component={TwinScreen} />
        <Stack.Screen name="Predictions" component={PredictionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
