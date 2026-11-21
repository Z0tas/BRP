const path = require('node:path');
const argon2 = require('argon2');
const crypto = require('node:crypto');
const sharp = require('sharp');
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
    const { fullName, email, password, birthDate, university } = req.body || {};
    const school = typeof university === 'string' ? university.trim() : '';

    if (school.length > 160) {
        return res.status(400).json({ message: 'Der Hochschulname ist zu lang.' });
    }

    if (birthDate) {
        const validFormat = typeof birthDate === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
        const parsed = validFormat ? new Date(`${birthDate}T00:00:00Z`) : null;
        if (!parsed || Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== birthDate ||
            birthDate > new Date().toLocaleDateString('sv-SE') ||
            birthDate < '1900-01-01') {
            return res.status(400).json({ message: 'Bitte ein gültiges Geburtsdatum eingeben.' });
        }
    }

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
            `INSERT INTO public.app_users
            (full_name, email, password_hash, birth_date, university)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, full_name, email`,
            [fullName.trim(), address, hash, birthDate || null, school || null]
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
            `SELECT id, full_name, email, password_hash, avatar_jpeg, to_char(birth_date, 'YYYY-MM-DD') AS birth_date, university
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

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        await db.query(
            `INSERT INTO public.app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
            [tokenHash, user.id]
        );

        return res.json({
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                birthDate: user.birth_date,
                university: user.university,
                email: user.email,
                avatar: user.avatar_jpeg
                    ? `data:image/jpeg;base64,${user.avatar_jpeg.toString('base64')}`
                    : null,
            },
        });
    } catch (error) {
        console.error('Login fehlgeschlagen:', error.code || error.name);
        return res.status(500).json({ message: 'Anmeldung momentan nicht möglich.' });
    }
});
async function requireSession(req, res, next) {
    const header = req.get('authorization') || '';
    const match = /^Bearer ([a-f0-9]{64})$/.exec(header);
    if (!match) {
        return res.status(401).json({ message: 'Bitte erneut anmelden.' });
    }

    try {
        const hash = crypto.createHash('sha256').update(match[1]).digest('hex');
        const result = await db.query(
            `SELECT user_id FROM public.app_sessions
             WHERE token_hash = $1 AND expires_at > now()`,
            [hash]
        );

        if (!result.rowCount) {
            return res.status(401).json({ message: 'Bitte erneut anmelden.' });
        }

        req.userId = result.rows[0].user_id;
        req.sessionHash = hash;
        next();
    } catch (error) {
        next(error);
    }
}

app.put(
    '/me/avatar',
    requireSession,
    express.text({ type: 'text/plain', limit: '12mb' }),
    async (req, res, next) => {
        if (typeof req.body !== 'string' || !req.body.length) {
            return res.status(400).json({ message: 'Bitte ein Foto auswählen.' });
        }

        let jpeg;
        try {
            jpeg = await sharp(Buffer.from(req.body, 'base64'), {
                limitInputPixels: 64_000_000,
            })
                .rotate()
                .resize(320, 320, { fit: 'cover' })
                .jpeg({ quality: 82 })
                .toBuffer();
        } catch {
            return res.status(400).json({ message: 'Dieses Bild konnte nicht gelesen werden.' });
        }

        try {
            await db.query(
                'UPDATE public.app_users SET avatar_jpeg = $1 WHERE id = $2',
                [jpeg, req.userId]
            );
            return res.json({ avatar: `data:image/jpeg;base64,${jpeg.toString('base64')}` });
        } catch (error) {
            next(error);
        }
    }
);

app.post('/auth/logout', requireSession, async (req, res, next) => {
    try {
        await db.query('DELETE FROM public.app_sessions WHERE token_hash = $1', [
            req.sessionHash,
        ]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});
const taskPoints = new Map([
    ['Drink 2 liters of water', 10],
    ['Eat 5 servings of vegetables', 20],
    ['Walk 10,000 steps', 25],
    ['Avoid sugary snacks', 15],
    ['Sleep at least 7 hours', 30],
    ['Do 30 minutes of exercise', 35],
]);

app.get('/me/entries', requireSession, async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT id, to_char(day, 'YYYY-MM-DD') AS day, kind, label, amount
             FROM public.fitness_entries
             WHERE user_id = $1 ORDER BY id`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/me/entries', requireSession, async (req, res, next) => {
    const { day, kind, label, amount, completed } = req.body || {};

    const parsed = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
        ? new Date(`${day}T00:00:00Z`) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== day) {
        return res.status(400).json({ message: 'Ungültiges Datum.' });
    }

    if (!['water', 'distance', 'meal', 'task'].includes(kind) ||
        typeof label !== 'string' || !label.trim() || label.length > 120) {
        return res.status(400).json({ message: 'Ungültiger Eintrag.' });
    }

    const value = kind === 'task' ? taskPoints.get(label) : amount;
    if (!Number.isInteger(value) || value <= 0 || value > 1000000 ||
        (kind === 'task' && typeof completed !== 'boolean')) {
        return res.status(400).json({ message: 'Ungültige Menge oder Aufgabe.' });
    }

    try {
        if (kind === 'task' && !completed) {
            await db.query(
                `DELETE FROM public.fitness_entries
                 WHERE user_id = $1 AND day = $2 AND kind = 'task' AND label = $3`,
                [req.userId, day, label]
            );
        } else {
            await db.query(
                `INSERT INTO public.fitness_entries (user_id, day, kind, label, amount)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING`,
                [req.userId, day, kind, label.trim(), value]
            );
        }
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});
app.delete('/me/entries/:id', requireSession, async (req, res, next) => {
    const id = req.params.id;

    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
        return res.status(400).json({ message: 'Ungültige Eintragsnummer.' });
    }

    try {
        await db.query(
            `DELETE FROM public.fitness_entries
             WHERE id = $1
               AND user_id = $2
               AND kind IN ('meal', 'water')`,
            [id, req.userId]
        );

        return res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend läuft auf Port ${port}`);
});