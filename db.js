require('dotenv').config();
const { Pool } = require('pg');

console.log('Строка подключения:', process.env.DATABASE_URL); // Выводим строку подключения

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Тестирование подключения
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Подключение к базе данных успешно');
        client.release(); // Освобождаем клиента после теста
    } catch (error) {
        console.error('Ошибка подключения к базе данных:', error);
    } finally {
        await pool.end(); // Закрываем пул
    }
}

testConnection();
