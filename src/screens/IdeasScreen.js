import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { shadow } from '../theme/shadow';
import { useFavorites } from '../context/FavoritesContext';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const TABS = ['Recipes', 'Activities'];

const bodyFocusOptions = [
    { label: 'Face', image: require('../../assets/IdeasImages/face.jpg') },
    { label: 'Back', image: require('../../assets/IdeasImages/Back.jpg') },
    { label: 'Abs', image: require('../../assets/IdeasImages/abs.jpg') },
    { label: 'Arm', image: require('../../assets/IdeasImages/Arm.jpg') },
    { label: 'Leg', image: require('../../assets/IdeasImages/leg1.jpg') },
];

const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const durationOptions = ['5–10 min', '10–15 min', '15–20 min', '20–30 min'];

const breakfast = [
    { id: 'r1', title: 'Scrambled Egg & Avocado Tacos', subtitle: '400 kcal', image: require('../../assets/IdeasImages/Breakfast_Tortillas.jpg') },
    { id: 'r2', title: 'Apple-Cranberry Oatmeal with Pecans', subtitle: '350 kcal', image: require('../../assets/IdeasImages/Breakfast_Oatmeal.jpg') },
    { id: 'r3', title: 'Cottage Cheese Bowl with Berries', subtitle: '300 kcal', image: require('../../assets/IdeasImages/Breakfast_Cottage_Cheese_Fruit_Bowl.jpg') },
];

const snack = [
    { id: 'n1', title: 'Mango Salsa Dips with Veggis', subtitle: '130 kcal', image: require('../../assets/IdeasImages/Snack_Salsa.jpg') },
    { id: 'n2', title: 'Chia Pudding with Berries', subtitle: '200 kcal', image: require('../../assets/IdeasImages/Chia_Pudding.jpg') },
    { id: 'n3', title: 'Homemade Oat Bars', subtitle: '190 kcal', image: require('../../assets/IdeasImages/Snack_Bars.jpg') },
];

const lunch = [
    { id: 'b1', title: 'Tomato-lentil Soup & Bread', subtitle: '270 kcal', image: require('../../assets/IdeasImages/Lunch_Soup.jpg') },
    { id: 'b2', title: 'Teriyaki Chicken Rice Bowl', subtitle: '470 kcal', image: require('../../assets/IdeasImages/Lunch_Rice_Bowl.jpg') },
    { id: 'b3', title: 'Chickpea Quinoa Salad', subtitle: '350 kcal', image: require('../../assets/IdeasImages/Lunch_Chickpea_Quinoa_Salad_8.jpg') },
];

const dinner = [
    { id: 'c1', title: 'Quiche with Mushrooms', subtitle: '490 kcal', image: require('../../assets/IdeasImages/dinner1.jpg') },
    { id: 'c2', title: 'Lasagna with Beef', subtitle: '510 kcal', image: require('../../assets/IdeasImages/dinner2.jpg') },
    { id: 'c3', title: 'Ceaser Salad with Chicken', subtitle: '370 kcal', image: require('../../assets/IdeasImages/dinner3.jpg') },
];

const activities = {
    pilates: [
        { id: 'a1', title: 'Pilates Ball Workout', subtitle: '20 minutes', level: 'Intermediate', duration: '15–20 min', bodyFocus: ['Leg', 'Arm'], image: require('../../assets/IdeasImages/pilates.jpg') },
        { id: 'a2', title: 'Pilates Sculpt', subtitle: '30 minutes', level: 'Advanced', duration: '20–30 min', bodyFocus: ['Abs'], image: require('../../assets/IdeasImages/pilates_2.jpg') },
        { id: 'a3', title: 'Dynamic Pilates', subtitle: '30 minutes', level: 'Beginner', duration: '20–30 min', bodyFocus: ['Back'], image: require('../../assets/IdeasImages/pilates_3.jpg') },
    ],
    yoga: [
        { id: 'a4', title: 'Sunrise Yoga', subtitle: '25 minutes', level: 'Beginner', duration: '20–30 min', bodyFocus: ['Abs', 'Back'], image: require('../../assets/IdeasImages/Yoga.jpg') },
        { id: 'a5', title: 'Night Meditation', subtitle: '20 minutes', level: 'Expert', duration: '15–20 min', bodyFocus: ['Face'], image: require('../../assets/IdeasImages/yoga2.jpg') },
        { id: 'a6', title: 'Stretch & Flow', subtitle: '20 minutes', level: 'Intermediate', duration: '15–20 min', bodyFocus: ['Leg', 'Back'], image: require('../../assets/IdeasImages/yoga3.jpg') },
    ],
};

export default function IdeasScreen() {
    const [activeTab, setActiveTab] = useState('Recipes');
    const [selectedBodyFocus, setSelectedBodyFocus] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState([]);
    const [selectedDuration, setSelectedDuration] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) return null;

    const filterActivities = (list) => {
        return list.filter(item => {
            const matchesLevel = selectedLevel.length === 0 || selectedLevel.includes(item.level);
            const matchesDuration = selectedDuration.length === 0 || selectedDuration.includes(item.duration);
            const matchesBodyFocus =
                selectedBodyFocus.length === 0 ||
                selectedBodyFocus.some(focus => item.bodyFocus.includes(focus));

            return matchesLevel && matchesDuration && matchesBodyFocus;
        });
    };

    const handleViewAll = (category) => {
        setExpandedCategory(category === expandedCategory ? null : category);
    };

    const handleGoBack = () => {
        setExpandedCategory(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="search-outline" size={24} color={colors.bluePrimary} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Ideas</Text>

                <TouchableOpacity>
                    <Ionicons name="options-outline" size={24} color={colors.bluePrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabsRow}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={styles.tab_button}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {activeTab === 'Recipes' && (
                    <>
                        {expandedCategory === null && (
                            <>
                                <RecipeSection title="Breakfast" data={breakfast} onPress={() => handleViewAll('Breakfast')} />
                                <RecipeSection title="Snack" data={snack} onPress={() => handleViewAll('Snack')} />
                                <RecipeSection title="Lunch" data={lunch} onPress={() => handleViewAll('Lunch')} />
                                <RecipeSection title="Dinner" data={dinner} onPress={() => handleViewAll('Dinner')} />
                            </>
                        )}

                        {expandedCategory === 'Breakfast' && <ExpandedRecipes title="Breakfast" data={breakfast} onBack={handleGoBack} />}
                        {expandedCategory === 'Snack' && <ExpandedRecipes title="Snack" data={snack} onBack={handleGoBack} />}
                        {expandedCategory === 'Lunch' && <ExpandedRecipes title="Lunch" data={lunch} onBack={handleGoBack} />}
                        {expandedCategory === 'Dinner' && <ExpandedRecipes title="Dinner" data={dinner} onBack={handleGoBack} />}
                    </>
                )}

                {activeTab === 'Activities' && (
                    <>
                        <FilterGroup title="Body Focus" options={bodyFocusOptions} selected={selectedBodyFocus} onSelect={setSelectedBodyFocus} />
                        <FilterGroup title="Level" options={levelOptions} selected={selectedLevel} onSelect={setSelectedLevel} />
                        <FilterGroup title="Duration" options={durationOptions} selected={selectedDuration} onSelect={setSelectedDuration} />

                        <SectionHeaderActivities title="Pilates" />
                        <View style={styles.listContainer}>
                            <FlatList
                                data={filterActivities(activities.pilates)}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.contentContainer}
                                renderItem={({ item }) => <IdeasCard item={item} type="activities" />}
                            />
                        </View>

                        <SectionHeaderActivities title="Yoga" />
                        <View style={styles.listContainer}>
                            <FlatList
                                data={filterActivities(activities.yoga)}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.contentContainer}
                                renderItem={({ item }) => <IdeasCard item={item} type="activities" />}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function RecipeSection({ title, data, onPress }) {
    return (
        <>
            <SectionHeaderRecipes title={title} onPress={onPress} />
            <View style={styles.listContainer}>
                <FlatList
                    data={data}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                    renderItem={({ item }) => <IdeasCard item={item} type="recipes" />}
                />
            </View>
        </>
    );
}

function ExpandedRecipes({ data, onBack }) {
    return (
        <>
            <View style={styles.backRow}>
                <TouchableOpacity onPress={onBack} style={{ paddingHorizontal: 8 }}>
                    <Text style={[styles.viewAll, { fontFamily: 'Poppins_600SemiBold' }]}>
                        ‹ Back
                    </Text>
                </TouchableOpacity>
            </View>

            {data.map(item => (
                <ViewAllRecipesCard key={item.id} item={item} type="recipes" />
            ))}
        </>
    );
}

function SectionHeaderRecipes({ title, onPress, back = false }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleRecipes}>{title}</Text>
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.viewAll}>{back ? '‹ Back' : 'View all ›'}</Text>
            </TouchableOpacity>
        </View>
    );
}

function SectionHeaderActivities({ title }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleActivities}>{title}</Text>
        </View>
    );
}

function IdeasCard({ item, type = 'recipes' }) {
    const {
        favoriteRecipes,
        favoriteActivities,
        toggleFavoriteRecipe,
        toggleFavoriteActivity,
    } = useFavorites();

    const isRecipe = type === 'recipes';

    const isLiked = isRecipe
        ? favoriteRecipes.some(fav => fav.id === item.id)
        : favoriteActivities.some(fav => fav.id === item.id);

    const heartColor = isRecipe ? colors.orangePrimary : colors.bluePrimary;

    const toggleLike = () => {
        if (isRecipe) {
            toggleFavoriteRecipe(item);
        } else {
            toggleFavoriteActivity(item);
        }
    };

    return (
        <View style={[styles.card, styles.ideasCard]}>
            <View style={styles.imageWrapper}>
                <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>

                <TouchableOpacity style={styles.heartIconContainer} onPress={toggleLike}>
                    <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={heartColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ViewAllRecipesCard({ item, type = 'recipes' }) {
    const {
        favoriteRecipes,
        toggleFavoriteRecipe,
    } = useFavorites();

    const isLiked = favoriteRecipes.some(fav => fav.id === item.id);
    const heartColor = colors.orangePrimary;

    return (
        <View style={styles.card}>
            <View style={styles.imageWrapper}>
                <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>

                <TouchableOpacity
                    style={styles.heartIconContainer}
                    onPress={() => toggleFavoriteRecipe(item)}
                >
                    <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={heartColor}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function FilterGroup({ title, options, selected, onSelect }) {
    const isIconGroup = typeof options[0] === 'object';
    const isMultiSelect = Array.isArray(selected);

    const renderItem = ({ item }) => {
        const value = isIconGroup ? item.label : item;
        const isSelected = isMultiSelect
            ? Array.isArray(selected) && selected.includes(value)
            : selected === value;

        const handleSelect = () => {
            if (isMultiSelect) {
                if (Array.isArray(selected) && selected.includes(value)) {
                    onSelect(selected.filter(v => v !== value));
                } else {
                    onSelect([...(selected || []), value]);
                }
            } else {
                onSelect(selected === value ? null : value);
            }
        };

        return (
            <TouchableOpacity
                onPress={handleSelect}
                style={
                    isIconGroup
                        ? {
                            width: 64,
                            height: 64,
                            borderRadius: 30,
                            overflow: 'hidden',
                            marginRight: 8,
                            backgroundColor: colors.background,
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: isSelected ? 'white' : 'transparent',
                        }
                        : {
                            paddingVertical: 6,
                            paddingHorizontal: 14,
                            backgroundColor: isSelected ? colors.bluePrimary : colors.blueSecondary,
                            borderRadius: 20,
                            marginRight: 8,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }
                }
            >
                {isIconGroup ? (
                    <>
                        <Image
                            source={item.image}
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                            }}
                            resizeMode="cover"
                        />

                        <View
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                backgroundColor: isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: 'white',
                                    fontSize: 10,
                                    fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_600SemiBold',
                                }}
                            >
                                {item.label}
                            </Text>
                        </View>
                    </>
                ) : (
                    <Text
                        style={{
                            color: isSelected ? 'white' : colors.bluePrimary,
                            fontFamily: isSelected ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                        }}
                    >
                        {item}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ marginVertical: 10 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.bluePrimary, marginBottom: 6 }}>
                {title}
            </Text>

            <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => (typeof item === 'string' ? item : item.label)}
                horizontal
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        marginTop: 45,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: colors.bluePrimary,
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderColor: '#ECECEC',
        marginTop: 16,
    },
    tabText: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.blueTertiary,
    },
    activeTab: {
        color: colors.bluePrimary,
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 16,
    },
    list: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 16,
    },
    sectionTitleActivities: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.bluePrimary,
    },
    sectionTitleRecipes: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.orangePrimary,
    },
    viewAll: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.orangePrimary,
    },
    card: {
        backgroundColor: colors.background,
        borderRadius: 12,
        marginBottom: 16,
        ...shadow,
    },
    ideasCard: {
        width: 200,
        marginRight: 12,
    },
    imageWrapper: {
        height: 140,
        overflow: 'hidden',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.bluePrimary,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: colors.blueTertiary,
        marginTop: 4,
    },
    heartIconContainer: {
        position: 'absolute',
        top: 25,
        right: 3,
        width: 32,
        height: 32,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    tab_button: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    listContainer: {
        marginLeft: -6,
    },
    contentContainer: {
        marginLeft: 6,
    },
});