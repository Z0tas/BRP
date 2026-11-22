import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    View,
    Text,
    Alert,
    TextInput,
    ScrollView,
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

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState(new Date(2000, 0, 1));
    const [university, setUniversity] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [busy, setBusy] = useState(false);

    async function handleRegister() {
        if (busy) return;

        if (password !== confirmation) {
            Alert.alert('Registration', 'The passwords do not match.');
            return;
        }

        if (!accepted) {
            Alert.alert('Registration', 'Please accept the terms.');
            return;
        }

        setBusy(true);
        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.18:3000';
            const response = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName, email, password,
                    birthDate: birthDate.trim(),
                    university: university.trim(),
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                Alert.alert('Registration', result.message || 'Registration failed.');
                return;
            }

            Alert.alert('Account created', `Registered as ${result.user.email}`, [
                { text: 'Go to login', onPress: () => navigation.navigate('Login') },
            ]);
        } catch {
            Alert.alert(
                'Connection error',
                'Could not reach the server. Check that the backend is running and reachable from your iPhone.'
            );
        } finally {
            setBusy(false);
        }
    }

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) return null;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
        >
            <View style={styles.logoCircle}>
                <View style={styles.ringBlue} />
                <View style={styles.ringCyan} />
                <View style={styles.ringOrange} />
            </View>

            <Text style={styles.title}>FitBloop</Text>
            <Text style={styles.subtitle}>Build healthy habits everyday</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputBox}>
                    <Ionicons name="person-add-outline" size={24} color={colors.cyanPrimary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor={colors.blueTertiary}
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>
                <Text style={styles.label}>Date of birth (optional)</Text>

                <TouchableOpacity
                    style={styles.inputBox}
                    accessibilityRole="button"
                    accessibilityLabel="Choose date of birth"
                    onPress={() => {
                        if (birthDate) {
                            const [year, month, day] = birthDate.split('-').map(Number);
                            setSelectedBirthday(new Date(year, month - 1, day, 12));
                        }
                        setCalendarOpen(true);
                    }}
                >
                    <Text style={styles.input}>
                        {birthDate || 'Select your date of birth'}
                    </Text>
                </TouchableOpacity>

                {calendarOpen && (
                    <View>
                        <DateTimePicker
                            value={selectedBirthday}
                            mode="date"
                            display="inline"
                            locale="en-GB"
                            minimumDate={new Date(1900, 0, 1)}
                            maximumDate={new Date()}
                            onValueChange={(_event, date) => {
                                if (date) setSelectedBirthday(date);
                            }}
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 20 }}>
                            {birthDate !== '' && (
                                <TouchableOpacity onPress={() => {
                                    setBirthDate('');
                                    setCalendarOpen(false);
                                }}>
                                    <Text style={styles.linkText}>Clear</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity onPress={() => setCalendarOpen(false)}>
                                <Text style={styles.linkText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => {
                                const year = selectedBirthday.getFullYear();
                                const month = String(selectedBirthday.getMonth() + 1).padStart(2, '0');
                                const day = String(selectedBirthday.getDate()).padStart(2, '0');

                                setBirthDate(`${year}-${month}-${day}`);
                                setCalendarOpen(false);
                            }}>
                                <Text style={styles.linkText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <Text style={styles.label}>University (optional)</Text>
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        value={university}
                        onChangeText={setUniversity}
                        placeholder="e.g. TU Wien"
                        maxLength={160}
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
                        value={email}
                        onChangeText={setEmail}
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
                        value={password}
                        onChangeText={setPassword}
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
                        value={confirmation}
                        onChangeText={setConfirmation}
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

                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleRegister}
                    disabled={busy}
                >
                    <Text style={styles.mainButtonText}>
                        {busy ? 'Creating account…' : 'Create Account'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                    <Text style={styles.bottomText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 24,
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