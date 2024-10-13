// prisma/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    for (let i = 1; i <= 10; i++) {
        await prisma.survey.create({
            data: {
                title: `Опрос №${i}`,
                description: `Описание опроса №${i}`,
                theme: 'Образование',
                imageUrl: null,
                tags: ['тег1', 'тег2'],
                isPublic: true,
                questions: {
                    create: [
                        {
                            questionText: `Вопрос 1 для опроса №${i}`,
                            questionType: 'singleLine',
                            options: {
                                create: [
                                    { option: 'Ответ 1' },
                                    { option: 'Ответ 2' }
                                ]
                            }
                        },
                        {
                            questionText: `Вопрос 2 для опроса №${i}`,
                            questionType: 'multiLine',
                            options: {
                                create: [
                                    { option: 'Ответ 1' },
                                    { option: 'Ответ 2' }
                                ]
                            }
                        },
                        {
                            questionText: `Вопрос 3 для опроса №${i}`,
                            questionType: 'positiveInteger',
                            options: {
                                create: [
                                    { option: 'Ответ 1' },
                                    { option: 'Ответ 2' }
                                ]
                            }
                        },
                        {
                            questionText: `Вопрос 4 для опроса №${i}`,
                            questionType: 'radio',
                            options: {
                                create: [
                                    { option: 'Ответ 1' },
                                    { option: 'Ответ 2' }
                                ]
                            }
                        },
                        {
                            questionText: `Вопрос 5 для опроса №${i}`,
                            questionType: 'checkbox',
                            options: {
                                create: [
                                    { option: 'Ответ 1' },
                                    { option: 'Ответ 2' }
                                ]
                            }
                        }
                    ]
                }
            }
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
