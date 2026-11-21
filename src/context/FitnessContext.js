import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { API_URL, useAuth } from './AuthContext';

const FitnessContext = createContext(null);
export const useFitness = () => useContext(FitnessContext);

export function dayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function sumEntries(entries, kind) {
    return entries.reduce((sum, item) => sum + (item.kind === kind ? item.amount : 0), 0);
}

export function FitnessProvider({ children }) {
    const { session } = useAuth();
    const [entries, setEntries] = useState([]);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const saving = useRef(false);
    const token = session.token;

    async function load() {
        const response = await fetch(`${API_URL}/me/entries`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Fitnessdaten konnten nicht geladen werden.');
        return response.json();
    }

    useEffect(() => {
        let active = true;
        setError('');
        setReady(false);
        load().then(rows => {
            if (active) {
                setEntries(rows);
                setReady(true);
            }
        }).catch(e => {
            if (active) setError(e.message);
        });
        return () => { active = false; };
    }, [token, attempt]);

    async function record(entry) {
        if (!ready || saving.current) return;
        saving.current = true;
        try {
            const response = await fetch(`${API_URL}/me/entries`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ day: dayKey(), ...entry }),
            });
            if (!response.ok) throw new Error('Eintrag konnte nicht gespeichert werden.');
            setEntries(await load());
        } catch (e) {
            Alert.alert('Fitnessdaten', e.message);
            setAttempt(n => n + 1);
        } finally {
            saving.current = false;
        }
    }

    return (
        <FitnessContext.Provider value={{
            entries, record, ready, error, retry: () => setAttempt(n => n + 1),
        }}>
            {children}
        </FitnessContext.Provider>
    );
}