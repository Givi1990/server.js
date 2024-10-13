const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSurvey() {
    try {
        // Шаг 1: Создание опроса
        const survey = await prisma.survey.create({
            data: {
                title: 'Пример опроса', // Название опроса
                description: 'Это описание примера опроса.', // Описание
                questions: { create: [] }, // Можно оставить пустым или добавить вопросы сразу
            },
        });
        console.log('Опрос успешно добавлен:', survey);

        // Шаг 2: Добавление вопросов
        const questions = [
            {
                questionText: 'На какую должность вы претендуете?',
                questionType: 'short_answer', // Тип вопроса: "однострочный ответ"
                description: 'Введите название должности',
                displayInTable: true,
                options: [], // Опции, если есть
            },
            {
                questionText: 'Работа на коммерческих проектах или фрилансе (в годах)',
                questionType: 'positive_integer', // Тип вопроса: "положительное целое число"
                description: 'Введите количество лет опыта',
                displayInTable: true,
                options: [],
            },
            {
                questionText: 'Номер телефона или Skype',
                questionType: 'short_answer', // Тип вопроса: "однострочный ответ"
                description: 'Введите ваш контактный номер или Skype',
                displayInTable: true,
                options: [],
            },
            {
                questionText: 'Напишите что-нибудь в поле ниже.',
                questionType: 'long_text', // Тип вопроса: "многострочный текст"
                description: 'Введите дополнительную информацию',
                displayInTable: true,
                options: [],
            },
        ];

        // Добавляем вопросы в опрос
        for (const question of questions) {
            const { questionText, questionType, description, displayInTable } = question;
            await prisma.question.create({
                data: {
                    survey_id: survey.id, // Используем ID созданного опроса
                    question_text: questionText,
                    question_type: questionType,
                    options: {
                        create: question.options.map(option => ({
                            option_text: option,
                        })),
                    },
                    // Если требуется, можно добавить описание и настройку отображения в таблице
                },
            });
        }

        console.log('Вопросы успешно добавлены к опросу!');
    } catch (error) {
        console.error('Ошибка при создании опроса или добавлении вопросов:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Вызов функции
setupSurvey();
