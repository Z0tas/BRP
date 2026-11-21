import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigation from './TabNavigation';
import { AuthContext } from '../context/AuthContext';
import { FitnessProvider } from '../context/FitnessContext';
import { FavoritesProvider } from '../context/FavoritesContext';

const Stack = createNativeStackNavigator();
function SignedInApp() {
    return (
        <FitnessProvider>
            <FavoritesProvider>
                <TabNavigation />
            </FavoritesProvider>
        </FitnessProvider>
    );
}
export default function AuthNavigation() {
    const [session, setSession] = useState(null);

    function updateAvatar(avatar) {
        setSession(current => current && ({
            ...current,
            user: { ...current.user, avatar },
        }));
    }

    return (
        <AuthContext.Provider value={{ session, setSession, updateAvatar }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    <Stack.Screen name="MainApp" component={SignedInApp} />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </AuthContext.Provider>
    );
}