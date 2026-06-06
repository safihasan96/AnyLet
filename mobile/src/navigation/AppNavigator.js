import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
    Compass, 
    Search, 
    MessageSquare, 
    User, 
    Plus 
} from 'lucide-react-native';

// Import Placeholder / Real Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import PostPropertyScreen from '../screens/PostPropertyScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import OwnerProfileScreen from '../screens/OwnerProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import EnquiryScreen from '../screens/EnquiryScreen';
import ReportPropertyScreen from '../screens/ReportPropertyScreen';
import ReferralDashboardScreen from '../screens/ReferralDashboardScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Bottom Tab Navigator ---
function BottomTabNavigator() {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const { currentUser, userProfile } = useAuthStore();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3730a3',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
                    height: 80,
                    paddingBottom: 12,
                    paddingTop: 8,
                }
            }}
        >
            <Tab.Screen 
                name="ExploreTab" 
                component={HomeScreen} 
                options={{
                    tabBarLabel: t('explore'),
                    tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
                }}
            />
            <Tab.Screen 
                name="SearchTab" 
                component={SearchScreen} 
                options={{
                    tabBarLabel: t('search'),
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
                }}
            />
            
            {/* Custom Post Ad Button in center */}
            <Tab.Screen 
                name="PostAdTab" 
                component={PostPropertyScreen} 
                options={({ navigation }) => ({
                    tabBarLabel: '',
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            onPress={() => {
                                if (!currentUser) {
                                    navigation.navigate('Login');
                                } else if (!currentUser.emailVerified) {
                                    alert("Please verify your email address to post a property.");
                                    navigation.navigate('VerifyEmail');
                                } else if (userProfile && !userProfile.phone) {
                                    alert("Please add your phone number to your profile before posting a property.");
                                    navigation.navigate('EditProfile');
                                } else {
                                    navigation.navigate('PostAdTab');
                                }
                            }}
                            style={{
                                top: -20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: 70,
                                height: 70,
                            }}
                        >
                            <View style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#3730a3',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#3730a3',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 8,
                                elevation: 5,
                                borderSize: 4,
                                borderColor: isDark ? '#0f172a' : '#f8fafc'
                            }}>
                                <Plus color="#ffffff" size={26} strokeWidth={3.5} />
                            </View>
                        </TouchableOpacity>
                    )
                })}
            />

            <Tab.Screen 
                name="MessagesTab" 
                component={RequestsScreen} 
                options={{
                    tabBarLabel: t('messages'),
                    tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
                }}
            />
            <Tab.Screen 
                name="ProfileTab" 
                component={ProfileScreen} 
                options={{
                    tabBarLabel: t('profile'),
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

// --- Main Root Navigator Stack ---
export default function AppNavigator() {
    const { currentUser } = useAuthStore();
    const { isDark } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc'
                }
            }}
        >
            {/* Main Tabs Shell */}
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

            {/* Nested Screens accessible by any flow */}
            <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
            <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} />

            {/* Auth Screens */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

            {/* Protected Screens (Navigated to only when authenticated, guarded at action point) */}
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="MyListings" component={MyListingsScreen} />
            <Stack.Screen name="Enquiry" component={EnquiryScreen} />
            <Stack.Screen name="ReportProperty" component={ReportPropertyScreen} />
            <Stack.Screen name="ReferralDashboard" component={ReferralDashboardScreen} />
            <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
    );
}
