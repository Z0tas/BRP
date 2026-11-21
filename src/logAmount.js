import { Alert } from 'react-native';

const options = {
    water: {
        title: 'Log water',
        question: 'How much water did you drink? Enter milliliters, for example 350.',
        label: 'Water',
        factor: 1,
    },
    distance: {
        title: 'Log distance',
        question: 'How far did you go? Enter kilometers, for example 1.5.',
        label: 'Activity',
        factor: 1000,
    },
    meal: {
        title: 'Log a meal',
        question: 'How many calories did you eat? Enter kcal.',
        label: 'Meal',
        factor: 1,
    },
};

export function promptForAmount(kind, onSave) {
    const option = options[kind];

    Alert.prompt(
        option.title,
        option.question,
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Save',
                onPress: input => {
                    const text = (input || '').trim().replace(',', '.');
                    const format = kind === 'distance'
                        ? /^\d+(?:\.\d{1,3})?$/
                        : /^\d+$/;

                    if (!format.test(text)) {
                        Alert.alert(
                            'Check your entry',
                            kind === 'distance'
                                ? 'Enter kilometers, for example 0.75.'
                                : 'Enter a positive whole number.'
                        );
                        return;
                    }

                    const amount = Math.round(Number(text) * option.factor);

                    if (amount < 1 || amount > 1000000) {
                        Alert.alert('Check your entry', 'Enter an amount within the supported range.');
                        return;
                    }

                    onSave({ kind, label: option.label, amount });
                },
            },
        ],
        'plain-text',
        '',
        kind === 'distance' ? 'decimal-pad' : 'number-pad'
    );
}