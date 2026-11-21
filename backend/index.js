const path = require('node:path');
const argon2 = require('argon2');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const { Pool } = require('pg');

const app = express();
const db = new Pool({ connectionTimeoutMillis: 5000 });
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '16kb' }));

app.get('/health', async (_req, res) => {
    try {
        const result = await db.query(`
            SELECT
                current_database() AS database,
                to_regclass('public.app_users')::text AS users_table
        `);

        const { database, users_table } = result.rows[0];
        const ready = database === 'brp' && users_table !== null;

        res.status(ready ? 200 : 503).json({
            status: ready ? 'ok' : 'setup_incomplete',
            database,
            usersTable: users_table,
        });
    } catch (error) {
        console.error('PostgreSQL-Verbindung fehlgeschlagen:', error.message);
        res.status(503).json({ status: 'database_unavailable' });
    }
});
app.post('/auth/register', async (req, res) => {
    const { fullName, email, password } = req.body || {};

    if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 120) {
        return res.status(400).json({ message: 'Bitte einen gültigen Namen eingeben.' });
    }

    const address = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
        return res.status(400).json({ message: 'Bitte eine gültige E-Mail eingeben.' });
    }

    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
        return res.status(400).json({ message: 'Bitte ein Passwort mit 12 bis 128 Zeichen wählen.' });
    }

    try {
        const hash = await argon2.hash(password, { type: argon2.argon2id });
        const result = await db.query(
            `INSERT INTO public.app_users (full_name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, full_name, email`,
            [fullName.trim(), address, hash]
        );
        return res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505' && error.constraint === 'app_users_email_unique') {
            return res.status(409).json({ message: 'Diese E-Mail ist bereits registriert.' });
        }
        console.error('Registrierung fehlgeschlagen:', error.code || error.name);
        return res.status(500).json({ message: 'Das Konto konnte nicht erstellt werden.' });
    }
});
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password || password.length > 128) {
        return res.status(400).json({ message: 'Bitte E-Mail und Passwort eingeben.' });
    }

    try {
        const result = await db.query(
            `SELECT id, full_name, email, password_hash
             FROM public.app_users
             WHERE lower(email) = $1`,
            [email.trim().toLowerCase()]
        );

        const user = result.rows[0];
        const valid = user?.password_hash &&
            await argon2.verify(user.password_hash, password);

        if (!valid) {
            return res.status(401).json({ message: 'E-Mail oder Passwort ist falsch.' });
        }

        return res.json({
            user: { id: user.id, fullName: user.full_name, email: user.email },
        });
    } catch (error) {
        console.error('Login fehlgeschlagen:', error.code || error.name);
        return res.status(500).json({ message: 'Anmeldung momentan nicht möglich.' });
    }
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend läuft auf Port ${port}`);
});