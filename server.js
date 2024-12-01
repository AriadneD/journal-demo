const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Enable CORS and allow requests from your frontend origin
app.use(
  cors({
    origin: 'http://localhost:8080', // Replace with your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly allow DELETE
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  })
);

// PostgreSQL connection
const pool = new Pool({
    user: 'ari',
    host: 'localhost',
    database: 'mental_wellness',
    password: 'holiday1',
    port: 5432,
});

// Create `mood_logs` table if it doesn't already exist
pool.query(`
    CREATE TABLE IF NOT EXISTS mood_logs (
        id SERIAL PRIMARY KEY,
        mood VARCHAR(50),
        notes TEXT,
        tags VARCHAR(255),
        date DATE DEFAULT CURRENT_DATE
    )
`);

// API routes
app.post('/add-mood', async (req, res) => {
    const { mood, notes, date } = req.body; // Include date
    try {
        const result = await pool.query(
            `INSERT INTO mood_logs (mood, notes, date) VALUES ($1, $2, $3) RETURNING *`,
            [mood, notes, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/moods', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM mood_logs ORDER BY date DESC`);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a mood entry
app.put('/moods/:id', async (req, res) => {
    const { id } = req.params;
    const { mood, notes, date } = req.body;
    try {
        const result = await pool.query(
            `UPDATE mood_logs SET mood = $1, notes = $2, date = $3 WHERE id = $4 RETURNING *`,
            [mood, notes, date, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a mood entry
app.delete('/moods/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM mood_logs WHERE id = $1`, [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Start the server
const PORT = 5050;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));