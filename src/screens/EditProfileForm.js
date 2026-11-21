import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL, useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calendarDate(value) {
    if (!value) return new Date(2000, 0, 1, 12);
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
}

export default function EditProfileForm({ onClose }) {
    const { session, setSession } = useAuth();
    const [name, setName] = useState(session.user.fullName || '');
    const [university, setUniversity] = useState(session.user.university || '');
    const [birthday, setBirthday] = useState(session.user.birthDate || '');
    const [draftDate, setDraftDate] = useState(calendarDate(birthday));
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    async function saveProfile() {
        if (saving) return;

        if (!name.trim()) {
            Alert.alert('Edit profile', 'Enter your name.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            const response = await fetch(`${API_URL}/me/profile`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${session.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: name.trim(),
                    university: university.trim(),
                    birthDate: birthday,
                }),
            });

            if (response.status === 401) {
                Alert.alert('Session expired', 'Please log in again.');
                setSession(null);
                return;
            }

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || `Could not save profile (${response.status}).`);
            }

            setSession(current => {
                if (!current || current.token !== session.token) return current;
                return {
                    ...current,
                    user: { ...current.user, ...result },
                };
            });
            onClose();
        } catch (error) {
            Alert.alert('Edit profile', error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Edit profile</Text>

            <Text style={styles.label}>Full name</Text>
            <TextInput
                style={styles.input}
                accessibilityLabel="Full name"
                value={name}
                onChangeText={setName}
                maxLength={120}
                editable={!saving}
            />

            <Text style={styles.label}>University (optional)</Text>
            <TextInput
                style={styles.input}
                accessibilityLabel="University"
                value={university}
                onChangeText={setUniversity}
                placeholder="University name"
                maxLength={160}
                editable={!saving}
            />

            <Text style={styles.label}>Date of birth (optional)</Text>
            <TouchableOpacity
                style={styles.input}
                accessibilityRole="button"
                disabled={saving}
                onPress={() => {
                    Keyboard.dismiss();
                    setDraftDate(calendarDate(birthday));
                    setCalendarOpen(true);
                }}
            >
                <Text>{birthday || 'Choose a date'}</Text>
            </TouchableOpacity>

            {calendarOpen && (
                <View>
                    <DateTimePicker
                        value={draftDate}
                        mode="date"
                        display="inline"
                        locale="en-GB"
                        minimumDate={new Date(1900, 0, 1)}
                        maximumDate={new Date()}
                        onValueChange={(_event, date) => {
                            if (date) setDraftDate(date);
                        }}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={() => {
                                setBirthday('');
                                setCalendarOpen(false);
                            }}
                        >
                            <Text style={styles.link}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setCalendarOpen(false)}>
                            <Text style={styles.link}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setBirthday(localDateString(draftDate));
                                setCalendarOpen(false);
                            }}
                        >
                            <Text style={styles.link}>Use date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!calendarOpen && (
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onClose} disabled={saving}>
                        <Text style={styles.link}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={saveProfile} disabled={saving}>
                        <Text style={styles.link}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.blueTertiary,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.bluePrimary,
    },
    label: {
        marginTop: 12,
        marginBottom: 5,
        fontWeight: '600',
        color: colors.bluePrimary,
    },
    input: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.blueTertiary,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 16,
        marginTop: 12,
    },
    link: {
        paddingVertical: 8,
        color: colors.bluePrimary,
        fontWeight: '600',
    },
});