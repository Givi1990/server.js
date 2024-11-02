const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const SALEFORSE = process.env.SALEFORSE;

// Middleware
app.use(cors({
  origin: '*', 
}));

app.use(bodyParser.json());


// Логирование входящих запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware для проверки токена
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
      return res.status(403).json({ error: 'Токен отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
          console.error("Ошибка валидации токена:", err); // Логируем ошибку валидации
          return res.status(401).json({ error: 'Неверный токен' });
      }
      req.userId = decoded.id; // Сохраняем ID пользователя из декодированного токена
      next(); // Передаем управление следующему middleware или маршруту
  });
};




// Обработка ошибок
const handleError = (res, error, message) => {
  console.error(error);
  res.status(500).json({ error: message });
};


// Обработка маршрута /callback для авторизации Salesforce
app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code;
  
  if (!authorizationCode) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    // Запрос на обмен кода авторизации на токены
    const tokenResponse = await axios.post(SALEFORSE, null, {
      params: {
        grant_type: 'authorization_code',
        client_id: SALESFORCE_CLIENT_ID,
        client_secret: SALESFORCE_CLIENT_SECRET,
        redirect_uri: SALESFORCE_REDIRECT_URI,
        code: authorizationCode,
      },
    });

    const { access_token, instance_url, id } = tokenResponse.data;

    res.status(200).json({
      message: 'Authorization successful!',
      accessToken: access_token,
      instanceUrl: instance_url,
      userId: id,
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).send('Error during authorization');
  }
});



// Получение всех опросов
app.get('/surveys', async (req, res) => {
  try {
    const surveys = await prisma.survey.findMany({
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    res.status(200).json(surveys);
  } catch (error) {
    console.error('Ошибка базы данных:', error); 
    res.status(500).json({ error: 'Ошибка сервера при получении опросов' });
  }
});





// Получение опроса по ID
app.get('/surveys/:id', async (req, res) => {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: Number(req.params.id) },
      include: { questions: { include: { options: true } } },
    });
    if (!survey) return res.status(404).json({ error: 'Опрос не найден' });
    res.status(200).json(survey);
  } catch (error) {
    handleError(res, error, 'Ошибка сервера при получении опроса');
  }
});



// Получение вопросов опроса по ID опроса
app.get('/surveys/:surveyId/questions', async (req, res) => {
  const surveyId = Number(req.params.surveyId);

  if (isNaN(surveyId)) {
    return res.status(400).json({ error: 'Неверный ID опроса' });
  }

  try {
    // Получаем опрос с вопросами и их опциями
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          include: {
            options: true, // Включаем варианты ответов для вопросов
          },
        },
      },
    });
    // Проверяем, существует ли опрос и есть ли у него вопросы
    if (!survey) {
      return res.status(404).json({ message: 'Опрос не найден' });
    }

    if (!survey.questions || survey.questions.length === 0) {
      return res.status(404).json({ message: 'Вопросы не найдены для данного опроса' });
    }

    // Возвращаем вопросы опроса с вариантами ответов
    res.status(200).json(survey.questions);
  } catch (error) {
    console.error('Ошибка при получении вопросов:', error);
    res.status(500).json({ error: 'Ошибка при получении вопросов опроса' });
  }
});



// Добавление нового опроса
app.post('/surveys', verifyToken, async (req, res) => {
  const { title, description, theme, imageUrl, tags, questions } = req.body;
  if (!title || !description || !theme || !questions || questions.length === 0) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }  
  try {
    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        theme,
        imageUrl,
        tags,
        user: { connect: { id: req.userId } }, // Используйте ID из токена
        questions: {
          create: questions.map(question => ({
            questionText: question.questionText,
            questionType: question.questionType,
            options: {
              create: question.options.map(option => ({
                option: option.option // Убедитесь, что это правильное поле для опции
                // Не передавайте id для вопросов или опций
              })) || [], // Если options пустой, создайте пустой массив
            },
          })),
        },
      },
    });
    res.status(201).json(survey);
  } catch (error) {
    console.error('Ошибка при создании опроса:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании опроса' });
  }
});





// Функция для генерации токена
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin, isBlocked: user.isBlocked },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Регистрация нового пользователя
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).send({ message: 'Пользователь с таким email уже существует.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Генерация токена
    const token = generateToken(user);

    res.status(201).send({ message: 'Пользователь успешно зарегистрирован', token, user });
  } catch (error) {
    handleError(res, error, 'Ошибка сервера при регистрации пользователя');
  }
});




// Эндпоинт для входа пользователя
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Неверный username или пароль' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Неверный username или пароль' });

    // Генерация токена
    const token = generateToken(user);

    res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin, isBlocked: user.isBlocked } });
  } catch (error) {
    handleError(res, error, 'Внутренняя ошибка сервера');
  }
});



// Получение всех пользователей
app.get('/users', async (req, res) => {
  console.log('Incoming Headers:', req.headers); // Логируем заголовки для отладки

  const token = req.headers.authorization?.split(' ')[1]; // Получаем токен из заголовка
  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET); // Используйте тот же секрет
    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'У вас нет прав доступа' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        isBlocked: true,
        registrationDate: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
  }
});


// Обновление статуса пользователя (блокировка/разблокировка)
app.put('/users/:id/:action', async (req, res) => {
  const { id, action } = req.params;

  // Проверка на наличие токена
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    // Проверка токена с использованием секретного ключа
    const payload = jwt.verify(token, JWT_SECRET);

    // Проверка на роль администратора
    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'У вас нет прав доступа' });
    }

    const isBlocked = action === 'block'; // Преобразуем действие в статус блокировки

    // Обновление статуса пользователя
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { isBlocked },
    });

    res.status(200).json(user);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    
    console.error('Ошибка при обновлении статуса пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении статуса пользователя' });
  }
});






// Эндпоинт опросника
app.delete('/surveys/:id', async (req, res) => {
  const surveyId = Number(req.params.id);
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'У вас нет прав доступа' });
    }

    // Проверяем, существует ли опрос
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { questions: true },
    });

    if (!survey) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    // Удаляем все вопросы и их опции
    for (const question of survey.questions) {
      await prisma.option.deleteMany({
        where: { questionId: question.id },
      });
    }

    await prisma.question.deleteMany({
      where: { surveyId: surveyId },
    });

    // Удаляем опрос
    await prisma.survey.delete({
      where: { id: surveyId },
    });

    res.status(200).json({ message: 'Опрос успешно удалён' });
  } catch (error) {
    console.error('Ошибка при удалении опроса:', error);
    return res.status(500).json({ error: 'Ошибка сервера при удалении опроса', details: error.message });
  }
});


// Функция для удаления пользователя
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params; // Извлечение ID из параметров запроса
  const token = req.headers.authorization?.split(' ')[1]; // Получение токена из заголовков

  // Проверка наличия токена
  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    // Проверка токена
    const payload = jwt.verify(token, JWT_SECRET);

    // Проверка на роль администратора
    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'У вас нет прав доступа' });
    }

    // Сначала удаляем все ответы пользователя
    await prisma.answer.deleteMany({
      where: {
        userId: Number(id),
      },
    });

    // Получаем все опросы пользователя
    const surveys = await prisma.survey.findMany({
      where: {
        userId: Number(id),
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Удаляем все опции, связанные с вопросами
    for (const survey of surveys) {
      for (const question of survey.questions) {
        await prisma.option.deleteMany({
          where: {
            questionId: question.id,
          },
        });
      }
    }

    // Удаляем все вопросы, связанные с опросами
    for (const survey of surveys) {
      await prisma.question.deleteMany({
        where: {
          surveyId: survey.id,
        },
      });
    }

    // Удаляем все опросы пользователя
    await prisma.survey.deleteMany({
      where: {
        userId: Number(id),
      },
    });

    // Наконец, удаляем пользователя
    const deletedUser = await prisma.user.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: 'Пользователь и его данные успешно удалены', user: deletedUser });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    return res.status(500).json({ error: 'Ошибка сервера при удалении пользователя', details: error.message });
  }
});







// Получение опросов, созданных пользователем по его ID
app.get('/surveys/created/:userId', verifyToken, async (req, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: 'Неверный ID пользователя' });

  try {
    const surveys = await prisma.survey.findMany({
      where: { userId: userId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!surveys.length) return res.status(404).json({ message: 'Опросы не найдены' });
    res.status(200).json(surveys);
  } catch (error) {
    handleError(res, error, 'Ошибка при получении опросов пользователя');
  }
});





//////////////////
app.get('/surveys/completed/:userId', verifyToken, async (req, res) => {
  const userId = Number(req.params.userId);
  console.log('Получен запрос на получение завершенных опросов для пользователя с ID:', userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }

  try {
    // Получаем ответы пользователя и связанные с ними вопросы и опросы
    const answersWithQuestionsAndSurveys = await prisma.answer.findMany({
      where: {
        userId: userId,
      },
      include: {
        question: {
          include: {
            options: true,  // Варианты ответов
            survey: true,   // Информация о опросе
          },
        },
      },
    });

    // Извлекаем уникальные опросы на основе ответов
    const uniqueSurveys = Array.from(new Set(answersWithQuestionsAndSurveys.map(answer => answer.question.survey.id)))
      .map(surveyId => {
        const survey = answersWithQuestionsAndSurveys.find(answer => answer.question.survey.id === surveyId).question.survey;
        return {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          theme: survey.theme,
          imageUrl: survey.imageUrl,
          // Добавьте любые другие нужные поля опроса
        };
      });

    // Логируем информацию о уникальных опросах
    console.log(`Пользователь с ID: ${userId} имеет ${uniqueSurveys.length} уникальных опросов:`);

    uniqueSurveys.forEach(survey => {
      console.log(`Опрос: ${survey.title}`); // Логируем название опроса
    });

    // Отправляем массив уникальных опросов в ответе без дополнительного объекта
    res.status(200).json(uniqueSurveys);
  } catch (error) {
    console.error('Ошибка при получении завершенных опросов:', error);
    res.status(500).json({ error: 'Ошибка при получении завершенных опросов' });
  }
});









// Обработка POST-запроса для отправки ответов на опрос
app.post('/submit-answers', async (req, res) => {
  const { responses, surveyId } = req.body; // Получаем surveyId и responses

  // Проверяем, что responses не пустой и surveyId не undefined
  if (!responses || responses.length === 0) {
    return res.status(400).json({ error: 'responses не предоставлены' });
  }

  if (surveyId === undefined) { // Проверяем, действительно ли surveyId определен
    return res.status(400).json({ error: 'surveyId не предоставлен' });
  }

  try {
    const answerPromises = responses.map(async (response) => {
      const answerData = {
        isMultipleChoice: Array.isArray(response.answerText), // Проверка на множественный выбор
      };

      if (typeof response.answerText === 'string') {
        answerData.answerText = response.answerText; // Текстовый ответ
      } else if (typeof response.answerText === 'number') {
        answerData.numericAnswer = response.answerText; // Числовой ответ
      } else if (typeof response.answerText === 'boolean') {
        answerData.booleanAnswer = response.answerText; // Логический ответ
      }

      // Создаем ответ
      const answer = await prisma.answer.create({
        data: {
          ...answerData,
          question: {
            connect: { id: response.questionId }, // Соединяем с вопросом
          },
          user: {
            connect: { id: response.userId }, // Соединяем с пользователем
          },
          survey: {
            connect: { id: surveyId }, // Убедитесь, что surveyId определен
          },
        },
      });

      // Добавление вариантов ответов для множественного выбора
      if (Array.isArray(response.answerText)) {
        const multipleChoicePromises = response.answerText.map(option => {
          return prisma.multipleChoiceAnswer.create({
            data: {
              answerId: answer.id,
              option: option,
            },
          });
        });
        await Promise.all(multipleChoicePromises);
      }

      return answer;
    });

    const savedAnswers = await Promise.all(answerPromises);

    // Обновляем статус опроса
    await prisma.survey.update({
      where: { id: surveyId },
      data: { completed: true },
    });

    res.json(savedAnswers);
  } catch (error) {
    console.error('Ошибка при сохранении ответов:', error);
    res.status(500).json({ error: 'Ошибка при сохранении ответов' });
  }
});



// Удаление опроса
app.delete('/surveys/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSurvey = await prisma.survey.delete({
      where: { id: parseInt(id) },
    });
    res.json(deletedSurvey);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления опроса' });
  }
});

// Удаление вопроса
app.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedQuestion = await prisma.question.delete({
      where: { id: parseInt(id) },
    });
    res.json(deletedQuestion);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления вопроса' });
  }
});

// Удаление ответа
app.delete('/answers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedAnswer = await prisma.answer.delete({
      where: { id: parseInt(id) },
    });
    res.json(deletedAnswer);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления ответа' });
  }
});



// Обновление опроса
app.put('/surveys/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, theme, imageUrl, tags, questions } = req.body;

  try {
    // Получаем существующий опрос для удаления связанных вопросов и их вариантов
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: Number(id) },
      include: { questions: { include: { options: true } } }, // Включаем вопросы и их варианты
    });

    if (!existingSurvey) {
      return res.status(404).json({ error: 'Опрос не найден' });
    }

    // Удаляем все варианты ответов, связанные с существующими вопросами
    await prisma.option.deleteMany({
      where: {
        questionId: {
          in: existingSurvey.questions.map(question => question.id),
        },
      },
    });

    // Затем удаляем существующие вопросы
    await prisma.question.deleteMany({
      where: {
        id: {
          in: existingSurvey.questions.map(question => question.id),
        },
      },
    });

    // Обновляем опрос
    const updatedSurvey = await prisma.survey.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        theme,
        imageUrl,
        tags,
        questions: {
          create: questions?.map(question => ({
            questionText: question.questionText,
            questionType: question.questionType,
            options: {
              create: question.options.map(option => ({
                option: option.option,
              })),
            },
          })) || [], // Если вопросов нет, создаем пустой массив
        },
      },
    });

    res.status(200).json(updatedSurvey);
  } catch (error) {
    console.error('Ошибка при обновлении опроса:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении опроса' });
  }
});


// Получение ответов пользователя на конкретный опрос
app.get('/surveys/:surveyId/responses/:userId', verifyToken, async (req, res) => {
  const { surveyId, userId } = req.params;

  try {
    // Найти ответы для указанного пользователя и опроса
    const responses = await prisma.answer.findMany({
      where: {
        surveyId: Number(surveyId),
        userId: Number(userId),
      },
      include: {
        question: { // Включить информацию о вопросах, связанных с ответами
          include: {
            options: true, // Включить варианты ответа, если они есть
          },
        },
      },
    });

    if (responses.length === 0) {
      return res.status(404).json({ message: 'Ответы не найдены' });
    }

    res.status(200).json(responses);
  } catch (error) {
    console.error('Ошибка при получении ответов:', error);
    handleError(res, error, 'Ошибка при получении ответов пользователя');
  }
});






// Поиск опросов по термину
app.get('/surveys/search', async (req, res) => {
  const { term } = req.query;
  if (!term) return res.status(400).json({ error: 'Термин для поиска обязателен' });

  try {
    const surveys = await prisma.survey.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: { questions: { include: { options: true } } },
    });
    res.json(surveys);
  } catch (error) {
    handleError(res, error, 'Ошибка при получении опросов');
  }
});

// Отключение клиента Prisma при завершении работы приложения
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma Client отключен.');
  process.exit(0);
});


// Обработайте ошибки подключения
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

app.get('/x', (req, res) => {
  res.send('Сервер работает!');
});

// Обработка других маршрутов
app.all('*', (req, res) => {
  res.status(404).send('Страница не найдена');
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});


