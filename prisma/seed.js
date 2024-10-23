const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsersSurveysAndAnswers() {
  // Очистка данных в базе
  await prisma.multipleChoiceAnswer.deleteMany();
  console.log('Удалены все множественные ответы');

  await prisma.answer.deleteMany();
  console.log('Удалены все ответы');

  await prisma.option.deleteMany();
  console.log('Удалены все опции');

  await prisma.question.deleteMany();
  console.log('Удалены все вопросы');

  await prisma.survey.deleteMany();
  console.log('Удалены все опросы');

  await prisma.user.deleteMany();
  console.log('Удалены все пользователи');

  // Создание 10 пользователей без хеширования паролей
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password123', // Пароль в открытом виде
      },
    });
    users.push(user);
    console.log(`Создан пользователь: ${user.username}`);
  }

  // Создание 20 опросов (по 2 для каждого пользователя)
  const surveys = [];
  for (let i = 0; i < 20; i++) {
    const survey = await prisma.survey.create({
      data: {
        title: `Survey ${i + 1}`,
        description: `This is a description for Survey ${i + 1}`,
        theme: i % 2 === 0 ? 'Education' : 'Quiz',
        isPublic: true,
        userId: users[i % users.length].id, // Привязка пользователя к опросу
      },
    });
    surveys.push(survey);
    console.log(`Создан опрос: ${survey.title}`);
  }

  // Добавление вопросов к каждому опросу (по 16 уникальных вопросов)
  const questionTypes = ['singleLine', 'multiLine', 'positiveInteger', 'radio', 'checkbox'];
  const optionsList = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  for (const survey of surveys) {
    for (let j = 0; j < 16; j++) {
      const questionType = questionTypes[j % questionTypes.length]; // Используем правильный тип вопроса
      const question = await prisma.question.create({
        data: {
          questionText: `Question ${j + 1} for ${survey.title}`,
          questionType: questionType, // Убедитесь, что используете правильные значения
          surveyId: survey.id,
        },
      });
      console.log(`Создан вопрос: ${question.questionText} для опроса: ${survey.title}`);

      if (questionType === 'checkbox' || questionType === 'radio') {
        // Если тип вопроса — чекбокс или радио, создаем опции для него
        for (const option of optionsList) {
          await prisma.option.create({
            data: {
              option,
              questionId: question.id,
            },
          });
          console.log(`Создана опция: ${option} для вопроса: ${question.questionText}`);
        }
      }
    }
  }

  // Добавление ответов пользователей на пройденные опросы
  for (const user of users) {
    // Пользователь может отвечать на 2 разных опроса
    const availableSurveys = surveys.filter(survey => survey.userId !== user.id);

    // Перемешиваем доступные опросы и выбираем 2 случайных
    const selectedSurveys = availableSurveys.sort(() => 0.5 - Math.random()).slice(0, 2);

    for (const selectedSurvey of selectedSurveys) {
      // Получаем вопросы для выбранного опроса
      const surveyQuestions = await prisma.question.findMany({
        where: { surveyId: selectedSurvey.id },
      });

      for (const question of surveyQuestions) {
        // Создание ответа в зависимости от типа вопроса
        if (question.questionType === 'singleLine' || question.questionType === 'multiLine') {
          // Текстовый ответ
          await prisma.answer.create({
            data: {
              answerText: `This is an answer to ${question.questionText}`,
              userId: user.id,
              surveyId: selectedSurvey.id,
              questionId: question.id,
            },
          });
          console.log(`Пользователь ${user.username} ответил на вопрос: ${question.questionText}`);
        } else if (question.questionType === 'positiveInteger') {
          // Ответ с числом
          await prisma.answer.create({
            data: {
              numericAnswer: Math.floor(Math.random() * 100), // Случайное число от 0 до 100
              userId: user.id,
              surveyId: selectedSurvey.id,
              questionId: question.id,
            },
          });
          console.log(`Пользователь ${user.username} дал числовой ответ на вопрос: ${question.questionText}`);
        } else if (question.questionType === 'checkbox' || question.questionType === 'radio') {
          // Ответ с множественным выбором или радио-кнопками
          const answer = await prisma.answer.create({
            data: {
              isMultipleChoice: question.questionType === 'checkbox',
              userId: user.id,
              surveyId: selectedSurvey.id,
              questionId: question.id,
            },
          });

          // Выбираем случайные опции для множественного выбора или одного выбора
          const questionOptions = await prisma.option.findMany({
            where: { questionId: question.id },
          });

          const selectedOptions = questionOptions
            .sort(() => 0.5 - Math.random()) // Перемешиваем опции
            .slice(0, question.questionType === 'checkbox' ? 2 : 1); // Выбираем 2 случайные опции для чекбоксов и 1 для радио

          for (const option of selectedOptions) {
            await prisma.multipleChoiceAnswer.create({
              data: {
                option: option.option,
                answerId: answer.id,
              },
            });
            console.log(`Пользователь ${user.username} выбрал опцию: ${option.option} для вопроса: ${question.questionText}`);
          }
        }
      }
    }
  }
}

createUsersSurveysAndAnswers()
  .then(() => console.log('Данные успешно созданы!'))
  .catch((e) => console.error('Ошибка:', e))
  .finally(() => prisma.$disconnect());
