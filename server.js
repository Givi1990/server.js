const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Получение всех опросов
app.get('/surveys', async (req, res) => {
  try {
    const surveys = await prisma.survey.findMany({
      include: {
        questions: {
          include: {
            options: true, // Включаем связанные опции для каждого вопроса
          },
        },
      },
    });
    res.status(200).json(surveys);
  } catch (error) {
    console.error('Ошибка при получении опросов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении опросов' });
  }
});

// Получение опроса по ID
app.get('/surveys/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Полученный ID опроса:', id); // Логирование ID

  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: { questions: true }
    });

    if (!survey) {
      console.log('Опрос не найден'); // Логирование отсутствующего опроса
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    res.status(200).json(survey);
  } catch (error) {
    console.error('Ошибка при получении опроса:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении опроса' });
  }
});

// Получение вопросов опроса по ID опроса
app.get('/surveys/:id/questions', async (req, res) => {
  const { id } = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: { surveyId: Number(id) }, // Найти все вопросы, связанные с опросом
      include: { options: true } // Включаем связанные опции, если они есть
    });

    if (!questions.length) {
      return res.status(404).json({ error: 'Вопросы не найдены' });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error('Ошибка при получении вопросов:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении вопросов' });
  }
});



// Добавление нового опроса с вопросами и опциями
app.post('/surveys', async (req, res) => {
  const { title, description, theme, imageUrl, tags, questions } = req.body;
  
  try {
    console.log('Данные для создания опроса:', { title, description, theme, imageUrl, tags, questions });

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        theme,
        imageUrl,
        tags,
        questions: {
          create: questions.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? {
              create: q.options.map(o => ({ option: o }))
            } : undefined
          }))
        }
      }
    });

    res.status(201).json(survey);
  } catch (error) {
    console.error('Ошибка при создании опроса:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка сервера при создании опроса' });
  }
});





// Добавление ответов на опросы
app.post('/surveys/:id/responses', async (req, res) => {
  const { responses } = req.body; // Извлекаем массив из объекта

  // Логирование входящих данных
  console.log('Полученные данные для ответов:', responses);

  // Проверьте, что данные получены корректно
  if (!responses || !Array.isArray(responses)) {
    console.error('Неверный формат данных:', req.body); // Логирование ошибки формата
    return res.status(400).send('Неверный формат данных');
  }

  const validatedResponses = [];
  for (const response of responses) {
    console.log('Обрабатываем ответ:', response); // Логирование каждого ответа

    if (!response.questionId || !response.userId) {
      console.error('Ошибка: отсутствует questionId или userId в ответе:', response); // Логирование ошибки отсутствующих полей
      return res.status(400).send('questionId и userId обязательны');
    }
    
    validatedResponses.push({
      question_id: response.questionId,
      answer_text: response.answerText || null,
      user_id: response.userId,
      created_at: new Date()
    });
  }

  // Логирование проверенных ответов перед сохранением
  console.log('Проверенные ответы для сохранения:', validatedResponses);

  // Сохраните validatedResponses в базе данных
  try {
    await prisma.answer.createMany({
      data: validatedResponses,
    });
    res.status(201).send('Ответы успешно сохранены');
  } catch (error) {
    console.error('Ошибка при сохранении ответов:', error);
    res.status(500).send('Ошибка при сохранении ответов');
  }
});

// Важно: отключаем клиент Prisma в конце работы приложения
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client отключен.');
  process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
