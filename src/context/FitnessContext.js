import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { API_URL, useAuth } from './AuthContext';

const FitnessContext = createContext(null);
export const useFitness = () => useContext(FitnessContext);

export function dayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function useTodayKey() {
    const [today, setToday] = useState(() => dayKey());

    useEffect(() => {
        let timer;

        function refresh() {
            clearTimeout(timer);

            const now = new Date();
            setToday(dayKey(now));

            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 50);
        }

        refresh();

        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') refresh();
        });

        return () => {
            clearTimeout(timer);
            subscription.remove();
        };
    }, []);

    return today;
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
        if (!response.ok) throw new Error('Could not load your fitness data.');
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
        if (!ready || saving.current) return false;
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

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                Alert.alert(
                    'Fitness data',
                    result.message || `Save failed (HTTP ${response.status}).`
                );
                return false;
            }

            setEntries(await load());
            return true;
        } catch (error) {
            Alert.alert('Fitness data', error.message);
            setAttempt(n => n + 1);
            return false;
        } finally {
            saving.current = false;
        }
    }

    async function updateDistance(id, amount) {
        if (!ready || saving.current) {
            Alert.alert('Please wait', 'Your fitness data is updating.');
            return;
        }

        saving.current = true;

        try {
            const response = await fetch(
                `${API_URL}/me/entries/${encodeURIComponent(id)}/distance`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount }),
                }
            );

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.message || `Update failed (HTTP ${response.status}).`);
            }

            setEntries(current => current.map(item =>
                item.kind === 'distance' && item.id === result.id
                    ? { ...item, amount: result.amount }
                    : item
            ));
        } catch (error) {
            Alert.alert('Edit distance', error.message);
            setAttempt(n => n + 1);
        } finally {
            saving.current = false;
        }
    }

    async function removeEntry(id) {
        if (!ready || saving.current) {
            Alert.alert('Please wait', 'Your fitness data is updating.');
            return;
        }

        saving.current = true;

        try {
            const response = await fetch(
                `${API_URL}/me/entries/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Please log in again.'
                        : `Delete failed (HTTP ${response.status}).`
                );
            }

            setEntries(current => current.filter(item =>
                item.kind === 'custom_task' || item.id !== id
            ));
        } catch (error) {
            Alert.alert('Delete entry', error.message);
            setAttempt(n => n + 1);
        } finally {
            saving.current = false;
        }
    }

    return (
        <FitnessContext.Provider value={{
            entries,
            record,
            removeEntry,
            updateDistance,
            ready,
            error,
            retry: () => setAttempt(n => n + 1),
        }}>
            {children}
        </FitnessContext.Provider>
    );
}