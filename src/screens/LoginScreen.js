import React, { useState } from 'react';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { colors } from '../theme/colors';
import { shadow } from '../theme/shadow';

export default function LoginScreen({ navigation }) {
    const [showPassword, setShowPassword] = useState(false);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.container}>
            <View style={styles.logoCircle}>
                <View style={styles.ringBlue} />
                <View style={styles.ringCyan} />
                <View style={styles.ringOrange} />
            </View>

            <Text style={styles.title}>BRP_Fitness_App</Text>
            <Text style={styles.subtitle}>Build healthy habits everyday</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="email-outline" size={24} color={colors.cyanPrimary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.blueTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="lock-outline" size={24} color={colors.cyanPrimary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.blueTertiary}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={25} color="#555" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotButton}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.replace('MainApp')}
                >
                    <Text style={styles.skipButtonText}>Continue without Login</Text>
                </TouchableOpacity>

                <View style={styles.orRow}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.googleButton}>
                    <AntDesign name="google" size={22} color="#DB4437" />
                    <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                    <Text style={styles.bottomText}>Don’t have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    logoCircle: {
        width: 170,
        height: 170,
        alignSelf: 'center',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringBlue: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 90,
        borderWidth: 18,
        borderColor: colors.bluePrimary,
        borderRightColor: 'transparent',
        transform: [{ rotate: '35deg' }],
    },
    ringCyan: {
        position: 'absolute',
        width: 112,
        height: 112,
        borderRadius: 70,
        borderWidth: 13,
        borderColor: colors.cyanPrimary,
        borderRightColor: 'transparent',
        transform: [{ rotate: '35deg' }],
    },
    ringOrange: {
        position: 'absolute',
        width: 76,
        height: 76,
        borderRadius: 50,
        borderWidth: 12,
        borderColor: colors.orangePrimary,
        borderTopColor: 'transparent',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Poppins_700Bold',
        color: colors.bluePrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        fontFamily: 'Poppins_500Medium',
        color: colors.bluePrimary,
        textAlign: 'center',
        marginBottom: 28,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: colors.bluePrimary,
        marginBottom: 4,
    },
    inputBox: {
        height: 44,
        borderWidth: 1,
        borderColor: colors.blueTertiary,
        borderRadius: 9,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 10,
        backgroundColor: colors.background,
        ...shadow,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: colors.bluePrimary,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginBottom: 28,
    },
    forgotText: {
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
        color: colors.cyanPrimary,
    },
    mainButton: {
        height: 50,
        backgroundColor: colors.bluePrimary,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    mainButtonText: {
        color: colors.background,
        fontSize: 15,
        fontFamily: 'Poppins_700Bold',
    },
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.blueTertiary,
    },
    orText: {
        marginHorizontal: 12,
        fontSize: 11,
        fontFamily: 'Poppins_500Medium',
        color: colors.bluePrimary,
    },
    googleButton: {
        height: 44,
        borderWidth: 1,
        borderColor: colors.blueTertiary,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        marginBottom: 18,
        ...shadow,
    },
    googleIcon: {
        fontSize: 22,
        fontFamily: 'Poppins_700Bold',
        color: '#4285F4',
        marginRight: 18,
    },
    googleText: {
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        color: colors.bluePrimary,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    bottomText: {
        fontSize: 11,
        fontFamily: 'Poppins_400Regular',
        color: colors.bluePrimary,
    },
    linkText: {
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.cyanPrimary,
    },
    skipButton: {
        marginTop: 12,
        alignItems: 'center',
    },

    skipButtonText: {
        fontSize: 13,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.cyanPrimary,
    },
});