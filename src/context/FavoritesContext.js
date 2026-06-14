import React, { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const [favoriteActivities, setFavoriteActivities] = useState([]);

    const toggleFavoriteRecipe = (item) => {
        setFavoriteRecipes(prev =>
            prev.some(x => x.id === item.id)
                ? prev.filter(x => x.id !== item.id)
                : [...prev, item]
        );
    };

    const toggleFavoriteActivity = (item) => {
        setFavoriteActivities(prev =>
            prev.some(x => x.id === item.id)
                ? prev.filter(x => x.id !== item.id)
                : [...prev, item]
        );
    };

    return (
        <FavoritesContext.Provider value={{
            favoriteRecipes,
            favoriteActivities,
            toggleFavoriteRecipe,
            toggleFavoriteActivity,
        }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    return useContext(FavoritesContext);
}