import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.18:3000';