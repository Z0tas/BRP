import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';

import AuthNavigation from './src/navigation/AuthNavigation';
import { FavoritesProvider } from './src/context/FavoritesContext';

enableScreens();

export default function App() {
    return (
        <FavoritesProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationContainer>
                    <AuthNavigation />
                </NavigationContainer>
            </GestureHandlerRootView>
        </FavoritesProvider>
    );
}