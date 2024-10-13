const express = require('express');
const router = express.Router();
const pool = require('../db');

// Получение всех шаблонов
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM templates');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Создание нового шаблона
router.post('/', async (req, res) => {
    const { title, description, theme, image, tags } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO templates (title, description, theme, image, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, theme, image, tags]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
