import React, { useMemo, useState } from 'react';
import { useFitness, useTodayKey, dayKey, sumEntries } from '../context/FitnessContext';
import { Alert, View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { promptForAmount } from '../logAmount';
import { colors } from '../theme/colors';
import { shadow } from '../theme/shadow';
import { ScrollView } from 'react-native-gesture-handler';
import {
    useFonts,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
} from '@expo-google-fonts/poppins';

const metricTemplates = [
    {
        label: 'Distance',
        value: 0,
        goal: 7,
        unit: 'km',
        icon: <MaterialIcons name="route" size={24} color={colors.bluePrimary} />,
        color: colors.bluePrimary,
        ringSize: 280,
    },
    {
        label: 'Calories',
        value: 0,
        goal: 2000,
        unit: 'kcal',
        icon: <Ionicons name="flame-outline" size={24} color={colors.orangePrimary} />,
        color: colors.orangePrimary,
        ringSize: 220,
    },
    {
        label: 'Hydration',
        value: 0,
        goal: 2,
        unit: 'l',
        icon: <Ionicons name="water-outline" size={24} color={colors.cyanPrimary} />,
        color: colors.cyanPrimary,
        ringSize: 160,
    },
];

const initialTasks = [
    { label: 'Drink 2 liters of water', completed: false, xp: 10 },
    { label: 'Eat 5 servings of vegetables', completed: false, xp: 20 },
    { label: 'Walk 10,000 steps', completed: false, xp: 25 },
    { label: 'Avoid sugary snacks', completed: false, xp: 15 },
    { label: 'Sleep at least 7 hours', completed: false, xp: 30 },
    { label: 'Do 30 minutes of exercise', completed: false, xp: 35 },
];

const XP_GOAL = initialTasks.reduce((total, task) => total + task.xp, 0);

const mealData = [
    {
        label: 'Breakfast',
        icon: 'egg-fried',
        dishes: [
            { name: 'Oatmeal with berries', kcal: 150, protein: 5, carbs: 30, fat: 3 },
            { name: 'Scrambled eggs', kcal: 170, protein: 12, carbs: 2, fat: 12 },
            { name: 'Orange juice', kcal: 100, protein: 2, carbs: 22, fat: 0 },
        ],
    },
    {
        label: 'Snack',
        icon: 'food-croissant',
        dishes: [
            { name: 'Greek yogurt', kcal: 100, protein: 10, carbs: 8, fat: 0 },
            { name: 'Almonds', kcal: 100, protein: 4, carbs: 4, fat: 9 },
        ],
    },
    {
        label: 'Lunch',
        icon: 'hamburger',
        dishes: [
            { name: 'Grilled chicken breast', kcal: 250, protein: 40, carbs: 0, fat: 5 },
            { name: 'Brown rice', kcal: 200, protein: 5, carbs: 45, fat: 2 },
            { name: 'Steamed broccoli', kcal: 150, protein: 5, carbs: 10, fat: 0 },
        ],
    },
    {
        label: 'Dinner',
        icon: 'noodles',
        dishes: [
            { name: 'Pasta with tomato sauce', kcal: 400, protein: 15, carbs: 60, fat: 7 },
            { name: 'Side salad', kcal: 150, protein: 3, carbs: 10, fat: 10 },
        ],
    },
];

export default function HomeScreen() {
    const [showCalendar, setShowCalendar] = useState(false);
    const today = useTodayKey();
    const [calendarDay, setCalendarDay] = useState(null);
    const { entries, record, ready, error, retry } = useFitness();

    const selectedDay = calendarDay || today;
    const selectedDate = useMemo(() => {
        const [year, month, day] = selectedDay.split('-').map(Number);
        return new global.Date(year, month - 1, day, 12);
    }, [selectedDay]);

    function setSelectedDate(date) {
        const key = dayKey(date);
        setCalendarDay(key === today ? null : key);
    }

    const todayEntries = entries.filter(item => item.day === selectedDay);

    const values = {
        Distance: sumEntries(todayEntries, 'distance') / 1000,
        Calories: sumEntries(todayEntries, 'meal'),
        Hydration: sumEntries(todayEntries, 'water') / 1000,
    };

    const metrics = metricTemplates.map(item => ({
        ...item,
        value: values[item.label],
    }));

    const customTasks = todayEntries
        .filter(item => item.kind === 'custom_task')
        .map(item => ({
            label: item.label,
            xp: item.amount,
        }));

    const hiddenTaskNames = new Set(
        todayEntries
            .filter(item => item.kind === 'hidden_task')
            .map(item => item.label)
    );

    const tasks = [...initialTasks, ...customTasks]
        .filter(task => !hiddenTaskNames.has(task.label))
        .map(task => ({
            ...task,
            completed: todayEntries.some(
                item => item.kind === 'task' && item.label === task.label
            ),
        }));

    const dailyXpGoal = tasks.reduce((sum, task) => sum + task.xp, 0);

    function addCustomTask(label, xp) {
        return record({
            day: selectedDay,
            kind: 'custom_task',
            label,
            amount: xp,
        });
    }

    function toggleTask(task) {
        record({
            day: selectedDay,
            kind: 'task',
            label: task.label,
            completed: !task.completed,
        });
    }

    const totalXp = sumEntries(todayEntries, 'task');

    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }
    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>{error || 'Loading fitness data…'}</Text>
                {!!error && (
                    <TouchableOpacity onPress={retry}>
                        <Text>Try again</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <Header onCalendarPress={() => setShowCalendar(true)} />

                <Date
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />

                <RingsMetrics metrics={metrics} />

                <View
                    style={{
                        flexDirection: 'row',
                        gap: 12,
                        paddingHorizontal: 16,
                        marginBottom: 16,
                    }}
                >
                    <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => promptForAmount('water', entry =>
                            record({ ...entry, day: selectedDay })
                        )}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 12,
                            borderRadius: 12,
                            backgroundColor: colors.cyanSecondary,
                        }}
                    >
                        <Ionicons name="water-outline" size={20} color={colors.cyanPrimary} />
                        <Text style={{ color: colors.cyanPrimary, fontWeight: '600' }}>
                            Log water
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => promptForAmount('distance', entry =>
                            record({ ...entry, day: selectedDay })
                        )}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 12,
                            borderRadius: 12,
                            backgroundColor: colors.blueSecondary,
                        }}
                    >
                        <Ionicons name="walk-outline" size={20} color={colors.bluePrimary} />
                        <Text style={{ color: colors.bluePrimary, fontWeight: '600' }}>
                            Log distance
                        </Text>
                    </TouchableOpacity>
                </View>

                <XPSection totalXp={totalXp} goal={dailyXpGoal} />

                <TodayTasks
                    tasks={tasks}
                    toggleTask={toggleTask}
                    deleteTask={task => record({
                        day: selectedDay,
                        kind: 'delete_task',
                        label: task.label,
                    })}
                />

                <CustomTaskForm key={selectedDay} onAdd={addCustomTask} />

                <CaloriesCounter
                    meals={todayEntries.filter(item => item.kind === 'meal')}
                    onAdd={dish => record({
                        day: selectedDay,
                        kind: 'meal',
                        label: dish.name,
                        amount: dish.kcal,
                    })}
                />

                <DailyLog
                    entries={todayEntries}
                    onAddDistance={() => promptForAmount('distance', entry =>
                        record({ ...entry, day: selectedDay })
                    )}
                />
            </ScrollView>

            <CalendarModal
                visible={showCalendar}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onClose={() => setShowCalendar(false)}
            />
        </>
    );
}

function Header({ onCalendarPress }) {
    return (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Day 1</Text>

            <TouchableOpacity onPress={onCalendarPress}>
                <Ionicons name="calendar-outline" size={24} color={colors.bluePrimary} />
            </TouchableOpacity>
        </View>
    );
}

function Date({ selectedDate, setSelectedDate }) {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formatEUDate = (date) => {
        const weekday = weekdayNames[date.getDay()];
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${weekday}, ${day}.${month}.${year}`;
    };

    const changeDay = (amount) => {
        const newDate = new global.Date(selectedDate);
        newDate.setDate(newDate.getDate() + amount);
        setSelectedDate(newDate);
    };

    return (
        <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => changeDay(-1)}>
                <MaterialCommunityIcons name="chevron-left" size={40} color={colors.bluePrimary} />
            </TouchableOpacity>

            <View style={styles.dateBox}>
                <Text style={styles.dateText}>{formatEUDate(selectedDate)}</Text>
            </View>

            <TouchableOpacity onPress={() => changeDay(1)}>
                <MaterialCommunityIcons name="chevron-right" size={40} color={colors.bluePrimary} />
            </TouchableOpacity>
        </View>
    );
}

function CalendarModal({ visible, selectedDate, setSelectedDate, onClose }) {
    const today = new global.Date();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const [calendarMonth, setCalendarMonth] = useState(
        new global.Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );

    const changeMonth = (amount) => {
        const newDate = new global.Date(calendarMonth);
        newDate.setMonth(newDate.getMonth() + amount);
        setCalendarMonth(newDate);
    };

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();

        const firstDay = new global.Date(year, month, 1);
        const lastDay = new global.Date(year, month + 1, 0);

        const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const days = [];

        for (let i = 0; i < startOffset; i++) {
            days.push(null);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new global.Date(year, month, day));
        }

        return days;
    }, [calendarMonth]);

    const isSameDay = (a, b) => {
        return (
            a &&
            b &&
            a.getDate() === b.getDate() &&
            a.getMonth() === b.getMonth() &&
            a.getFullYear() === b.getFullYear()
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={28} color={colors.bluePrimary} />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>History</Text>

                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={28} color={colors.bluePrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => changeMonth(-1)}>
                            <MaterialCommunityIcons name="chevron-left" size={32} color={colors.bluePrimary} />
                        </TouchableOpacity>

                        <Text style={styles.calendarMonth}>
                            {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                        </Text>

                        <TouchableOpacity onPress={() => changeMonth(1)}>
                            <MaterialCommunityIcons name="chevron-right" size={32} color={colors.bluePrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekRow}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <Text key={day} style={styles.weekDay}>{day}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {calendarDays.map((date, index) => (
                            <TouchableOpacity
                                key={index}
                                disabled={!date}
                                style={[
                                    styles.calendarDay,
                                    date && isSameDay(date, today) && styles.todayCircle,
                                    date && isSameDay(date, selectedDate) && styles.selectedCircle,
                                ]}
                                onPress={() => {
                                    setSelectedDate(date);
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.calendarDayText,
                                        date && isSameDay(date, selectedDate) && styles.selectedDayText,
                                    ]}
                                >
                                    {date ? date.getDate() : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
function DailyLog({ entries, onAddDistance }) {
    const { removeEntry, updateDistance } = useFitness();
    const items = entries
        .filter(item => ['meal', 'water', 'distance'].includes(item.kind))
        .reverse();

    function editDistance(item) {
        Alert.prompt(
            'Edit distance',
            'Enter the corrected distance in kilometers.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: input => {
                        const text = (input || '').trim().replace(',', '.');
                        const meters = Math.round(Number(text) * 1000);

                        if (!/^\d+(?:\.\d{1,3})?$/.test(text) ||
                            meters < 1 || meters > 1000000) {
                            Alert.alert(
                                'Check your distance',
                                'Enter 0.001 to 1000 km, for example 1.5.'
                            );
                            return;
                        }

                        updateDistance(item.id, meters);
                    },
                },
            ],
            'plain-text',
            String(item.amount / 1000),
            'decimal-pad'
        );
    }

    function confirmDelete(item, quantity) {
        Alert.alert(
            'Delete this entry?',
            `${item.label} · ${quantity}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => removeEntry(item.id),
                },
            ]
        );
    }

    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.cyanPrimary }]} />

            <View style={styles.headerContent}>
                <Text style={styles.sectionHeaderText}>Daily log</Text>
            </View>

            <View style={styles.sectionContent}>
                <TouchableOpacity
                    accessibilityRole="button"
                    onPress={onAddDistance}
                    style={styles.sectionRow}
                >
                    <Ionicons name="add-circle-outline" size={24} color={colors.bluePrimary} />
                    <Text style={styles.mealText}>Log distance</Text>
                </TouchableOpacity>

                {items.length === 0 && (
                    <Text style={styles.nutritionText}>
                        No food, water or distance logged for this day.
                    </Text>
                )}

                {items.map(item => {
                    const isDistance = item.kind === 'distance';
                    let quantity = `${item.amount} kcal`;

                    if (isDistance) quantity = `${item.amount / 1000} km`;
                    if (item.kind === 'water') quantity = `${item.amount} ml`;

                    return (
                        <View key={item.id} style={styles.sectionRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mealText}>
                                    {isDistance ? 'Distance' : item.label}
                                </Text>
                                <Text style={styles.nutritionText}>{quantity}</Text>
                            </View>

                            {isDistance && (
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel={`Edit distance, ${quantity}`}
                                    onPress={() => editDistance(item)}
                                    style={{ padding: 10 }}
                                >
                                    <Text style={{ color: colors.bluePrimary }}>Edit</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={`Delete ${isDistance ? 'distance' : item.label}, ${quantity}`}
                                onPress={() => confirmDelete(item, quantity)}
                                style={{ padding: 10 }}
                            >
                                <Ionicons name="trash-outline" size={22} color="#B3261E" />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
function RingsMetrics({ metrics }) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.centerBlock}>
                <View style={styles.ringWrapper}>
                    {metrics.map((m, index) => (
                        <AnimatedCircularProgress
                            key={index}
                            size={m.ringSize}
                            width={24}
                            fill={Math.min(100, (m.value / m.goal) * 100)}
                            tintColor={m.color}
                            backgroundColor={colors.blueSecondary}
                            rotation={0}
                            lineCap="round"
                            style={styles.absolute}
                        />
                    ))}
                </View>

                <View style={styles.metricsRow}>
                    {metrics.map((m, index) => (
                        <View key={index} style={styles.metric}>
                            {m.icon}
                            <Text style={styles.metricLabel}>{m.label}</Text>
                            <Text style={[styles.metricValue, { color: colors.bluePrimary }]}>
                                {m.value}
                                <Text style={[styles.metricValue, { color: colors.blueTertiary }]}>
                                    /{m.goal} {m.unit}
                                </Text>
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

function XPSection({ totalXp, goal }) {
    const percent = goal > 0 ? Math.min(100, (totalXp / goal) * 100) : 0;

    return (
        <View style={styles.todayXpSection}>
            <View style={styles.iconContainer}>
                <Ionicons name="rocket-outline" size={28} color={colors.bluePrimary} />
            </View>

            <View style={styles.todayXpContent}>
                <Text style={styles.todayXpLabel}>Today's XP</Text>

                <View style={styles.todayXpBarBackground}>
                    <View style={styles.todayXpBarInner}>
                        <View style={[styles.todayXpBarFill, { width: `${percent}%` }]} />
                        <Text style={styles.todayXpTextOnBar}>
                            {totalXp} / {goal} xp
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
function CustomTaskForm({ onAdd }) {
    const [name, setName] = useState('');
    const [xpText, setXpText] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function submit() {
        if (submitting) return;

        const label = name.trim();
        const xp = Number(xpText);

        if (!label) {
            setMessage('Enter a name for your task.');
            return;
        }

        if (!/^\d+$/.test(xpText) || !Number.isInteger(xp) || xp < 1 || xp > 50) {
            setMessage('Enter a whole number from 1 to 50.');
            return;
        }

        setMessage('');
        setSubmitting(true);
        try {
            const saved = await onAdd(label, xp);
            if (saved) {
                setName('');
                setXpText('');
                setMessage('Task added.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle = {
        borderWidth: 1,
        borderColor: colors.blueTertiary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 8,
        color: colors.bluePrimary,
    };

    return (
        <View style={[styles.sectionCard, { padding: 16 }]}>
            <Text style={styles.taskText}>Custom daily task</Text>

            <TextInput
                style={inputStyle}
                accessibilityLabel="Task name"
                placeholder="e.g. Walk for 20 minutes"
                value={name}
                onChangeText={setName}
                maxLength={120}
                editable={!submitting}
            />

            <TextInput
                style={inputStyle}
                accessibilityLabel="XP from 1 to 50"
                placeholder="XP from 1 to 50"
                value={xpText}
                onChangeText={setXpText}
                keyboardType="number-pad"
                editable={!submitting}
            />

            <TouchableOpacity
                accessibilityRole="button"
                disabled={submitting}
                onPress={submit}
                style={{
                    backgroundColor: colors.bluePrimary,
                    padding: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginTop: 12,
                }}
            >
                <Text style={{ color: 'white' }}>
                    {submitting ? 'Saving…' : 'Add task'}
                </Text>
            </TouchableOpacity>

            {!!message && <Text style={{ marginTop: 8 }}>{message}</Text>}
        </View>
    );
}
function TodayTasks({ tasks, toggleTask, deleteTask }) {
    function confirmDelete(task) {
        const message = task.completed
            ? `Remove "${task.label}" from this day and subtract ${task.xp} XP?`
            : `Remove "${task.label}" from this day?`;

        Alert.alert('Delete task?', message, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteTask(task),
            },
        ]);
    }

    return (
        <View style={styles.sectionCard}>
            <View
                style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.bluePrimary },
                ]}
            />

            <View style={styles.headerContent}>
                <Text style={styles.sectionHeaderText}>Daily tasks</Text>
            </View>

            <View style={styles.sectionContent}>
                {tasks.length === 0 && (
                    <Text style={styles.nutritionText}>
                        No tasks for this day.
                    </Text>
                )}

                {tasks.map(task => (
                    <View key={task.label} style={styles.sectionRow}>
                        <TouchableOpacity
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: task.completed }}
                            accessibilityLabel={`${task.label}, ${task.xp} XP`}
                            onPress={() => toggleTask(task)}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                minHeight: 44,
                            }}
                        >
                            <Ionicons
                                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                size={28}
                                color={task.completed ? colors.cyanPrimary : colors.blueTertiary}
                            />

                            <Text style={[styles.taskText, { flex: 1 }]}>
                                {task.label}
                            </Text>

                            <Text style={styles.taskXp}>+{task.xp} XP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Delete task: ${task.label}`}
                            onPress={() => confirmDelete(task)}
                            style={{
                                width: 44,
                                minHeight: 44,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="trash-outline" size={21} color="#B3261E" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
}

function CaloriesCounter({ meals, onAdd }) {
    const [openGroup, setOpenGroup] = useState(null);
    const total = meals.reduce((sum, meal) => sum + meal.amount, 0);

    return (
        <View style={[styles.sectionCard, { marginTop: 20, marginBottom: 20 }]}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.orangePrimary }]} />

            <View style={styles.headerContent}>
                <Text style={styles.sectionHeaderText}>Meals · {total} kcal</Text>
            </View>

            <View style={styles.sectionContent}>
                {mealData.map(group => (
                    <View key={group.label}>
                        <TouchableOpacity
                            style={styles.sectionRow}
                            onPress={() => setOpenGroup(
                                openGroup === group.label ? null : group.label
                            )}
                        >
                            <MaterialCommunityIcons
                                name={group.icon}
                                size={28}
                                color={colors.orangePrimary}
                            />
                            <Text style={styles.mealText}>{group.label}</Text>
                            <Ionicons
                                name={openGroup === group.label ? 'chevron-up' : 'chevron-down'}
                                size={22}
                                color={colors.bluePrimary}
                            />
                        </TouchableOpacity>

                        {openGroup === group.label && group.dishes.map(dish => (
                            <TouchableOpacity
                                key={dish.name}
                                style={styles.dishContainer}
                                accessibilityRole="button"
                                accessibilityLabel={`Log ${dish.name}`}
                                onPress={() => onAdd(dish)}
                            >
                                <View style={styles.dishRow}>
                                    <Text style={styles.dishLabel}>+ {dish.name}</Text>
                                    <Text style={styles.dishLabel}>{dish.kcal} kcal</Text>
                                </View>
                                <Text style={styles.nutritionText}>
                                    Protein: {dish.protein} g · Carbs: {dish.carbs} g · Fat: {dish.fat} g
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Text style={styles.dishLabel}>Meals logged for this day</Text>

                {meals.length === 0 ? (
                    <Text style={styles.nutritionText}>No meals logged yet.</Text>
                ) : (
                    meals.map(meal => (
                        <View key={meal.id} style={styles.dishRow}>
                            <Text style={styles.dishLabel}>{meal.label}</Text>
                            <Text style={styles.dishLabel}>{meal.amount} kcal</Text>
                        </View>
                    ))
                )}
            </View>
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
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: colors.bluePrimary,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        marginBottom: 12,
    },
    dateBox: {
        backgroundColor: colors.bluePrimary,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 14,
    },
    dateText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.background,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.blueSecondary,
        paddingHorizontal: 16,
        paddingTop: 60,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 42,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: colors.bluePrimary,
    },
    calendarCard: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 16,
        ...shadow,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    calendarMonth: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.bluePrimary,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDay: {
        width: 38,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.bluePrimary,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: '14.28%',
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    calendarDayText: {
        fontSize: 13,
        fontFamily: 'Poppins_600SemiBold',
        color: colors.bluePrimary,
    },
    todayCircle: {
        borderWidth: 2,
        borderColor: colors.orangePrimary,
        borderRadius: 20,
    },
    selectedCircle: {
        backgroundColor: colors.bluePrimary,
        borderRadius: 20,
    },
    selectedDayText: {
        color: colors.background,
    },
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 64,
        marginBottom: 12,
    },
    centerBlock: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringWrapper: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    absolute: {
        position: 'absolute',
        borderRadius: 6,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 64,
    },
    metric: {
        alignItems: 'center',
        width: 110,
    },
    metricLabel: {
        color: colors.bluePrimary,
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        marginTop: 2,
    },
    metricValue: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        marginTop: 1,
    },
    todayXpSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.blueSecondary,
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: 10,
        padding: 12,
        marginBottom: 20,
        ...shadow,
    },
    iconContainer: {
        marginRight: 12,
        marginLeft: 4,
    },
    todayXpContent: {
        flex: 1,
    },
    todayXpLabel: {
        color: colors.bluePrimary,
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 6,
        ...shadow,
    },
    todayXpBarBackground: {
        backgroundColor: colors.background,
        height: 28,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        ...shadow,
    },
    todayXpBarInner: {
        flex: 1,
        paddingHorizontal: 3,
        paddingVertical: 3,
        justifyContent: 'center',
    },
    todayXpBarFill: {
        backgroundColor: colors.orangePrimary,
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 8,
    },
    todayXpTextOnBar: {
        color: colors.bluePrimary,
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
        position: 'absolute',
        right: 30,
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: colors.background,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        ...shadow,
    },
    sectionHeader: {
        padding: 10,
        paddingBottom: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    headerContent: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 2,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginTop: -11,
    },
    sectionHeaderText: {
        color: colors.bluePrimary,
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    },
    sectionContent: {
        padding: 11,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: colors.blueTertiary,
    },
    taskText: {
        color: colors.bluePrimary,
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        flex: 1,
        marginLeft: 10,
        marginTop: 4,
    },
    taskXp: {
        color: colors.orangePrimary,
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        marginTop: 4,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        backgroundColor: colors.orangeSecondary,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    mealText: {
        color: colors.bluePrimary,
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
        marginTop: 4,
        marginLeft: 8,
    },
    kcalText: {
        color: colors.orangePrimary,
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        marginTop: 4,
        marginRight: 8,
    },
    expandedSectionContent: {
        overflow: 'hidden',
        backgroundColor: colors.blueSecondary,
        paddingHorizontal: 16,
        marginHorizontal: -11,
    },
    dishContainer: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: colors.blueTertiary,
    },
    dishRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dishLabel: {
        color: colors.bluePrimary,
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    nutritionLabel: {
        color: colors.bluePrimary,
        fontSize: 10,
        fontFamily: 'Poppins_500Medium',
        marginTop: 2,
    },
    nutritionText: {
        color: colors.bluePrimary,
        fontSize: 10,
        fontFamily: 'Poppins_400Regular',
        marginTop: 2,
    },
});