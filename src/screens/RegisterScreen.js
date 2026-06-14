import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
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

export default function RegisterScreen({ navigation }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [accepted, setAccepted] = useState(false);

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
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="person-add-outline" size={24} color={colors.cyanPrimary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor={colors.blueTertiary}
                    />
                </View>

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
                        placeholder="Create your password"
                        placeholderTextColor={colors.blueTertiary}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={25} color="#555" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="lock-outline" size={24} color={colors.cyanPrimary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={colors.blueTertiary}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={25} color="#555" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted(!accepted)}>
                    <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                        {accepted && <Ionicons name="checkmark" size={12} color={colors.background} />}
                    </View>
                    <Text style={styles.termsText}>
                        I agree to the <Text style={styles.linkText}>Terms of Use</Text> and{' '}
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainButton}>
                    <Text style={styles.mainButtonText}>Create Account</Text>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                    <Text style={styles.bottomText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Log In</Text>
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
        marginBottom: 18,
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
        marginBottom: 18,
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
        marginBottom: 8,
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
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 22,
    },
    checkbox: {
        width: 13,
        height: 13,
        borderWidth: 1.5,
        borderColor: colors.cyanPrimary,
        borderRadius: 2,
        marginRight: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: colors.cyanPrimary,
    },
    termsText: {
        flex: 1,
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        color: colors.bluePrimary,
    },
    mainButton: {
        height: 50,
        backgroundColor: colors.bluePrimary,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 22,
    },
    mainButtonText: {
        color: colors.background,
        fontSize: 15,
        fontFamily: 'Poppins_700Bold',
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
});