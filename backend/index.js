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
        return res.status(400).json({ message: 'The university name is too long.' });
    }

    if (birthDate) {
        const validFormat = typeof birthDate === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
        const parsed = validFormat ? new Date(`${birthDate}T00:00:00Z`) : null;
        if (!parsed || Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== birthDate ||
            birthDate > new Date().toLocaleDateString('sv-SE') ||
            birthDate < '1900-01-01') {
            return res.status(400).json({ message: 'Enter a valid date of birth.' });
        }
    }

    if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 120) {
        return res.status(400).json({ message: 'Enter a valid name.' });
    }

    const address = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
        return res.status(400).json({ message: 'Use a password with 12 to 128 characters.' });
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
            return res.status(409).json({ message: 'This email address is already registered.' });
        }
        console.error('Registration fehlgeschlagen:', error.code || error.name);
        return res.status(500).json({ message: 'Could not create the account.' });
    }
});
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password || password.length > 128) {
        return res.status(400).json({ message: 'Enter your email and password.' });
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
            return res.status(401).json({ message: 'Incorrect email or password.' });
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
        return res.status(500).json({ message: 'Login is temporarily unavailable.' });
    }
});
async function requireSession(req, res, next) {
    const header = req.get('authorization') || '';
    const match = /^Bearer ([a-f0-9]{64})$/.exec(header);
    if (!match) {
        return res.status(401).json({ message: 'Please log in again.' });
    }

    try {
        const hash = crypto.createHash('sha256').update(match[1]).digest('hex');
        const result = await db.query(
            `SELECT user_id FROM public.app_sessions
             WHERE token_hash = $1 AND expires_at > now()`,
            [hash]
        );

        if (!result.rowCount) {
            return res.status(401).json({ message: 'Please log in again.' });
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
            return res.status(400).json({ message: 'Choose a photo.' });
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
            return res.status(400).json({ message: 'Could not read this image.' });
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
            `SELECT id, to_char(day, 'YYYY-MM-DD') AS day, kind, CASE WHEN kind='water' AND label='Wasser' THEN 'Water' WHEN kind='meal' AND label='Mahlzeit' THEN 'Meal' WHEN kind='distance' AND label='Aktivität' THEN 'Activity' ELSE label END AS label, amount
             FROM public.fitness_entries
             WHERE user_id = $1

             UNION ALL

             SELECT id, to_char(day, 'YYYY-MM-DD') AS day,
                    'custom_task' AS kind, label, xp AS amount
             FROM public.custom_daily_tasks
             WHERE user_id = $1

            UNION ALL

             SELECT NULL::bigint AS id, to_char(day, 'YYYY-MM-DD') AS day,
                    'hidden_task' AS kind, label, 0 AS amount
             FROM public.hidden_daily_tasks
             WHERE user_id = $1

             ORDER BY day, id, kind`,
            [req.userId]
        );

        return res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

app.post('/me/entries', requireSession, async (req, res, next) => {
    const { day, kind, label, amount, completed } = req.body || {};

    const parsedDay = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
        ? new Date(`${day}T00:00:00Z`)
        : null;

    if (!parsedDay || Number.isNaN(parsedDay.getTime()) ||
        parsedDay.toISOString().slice(0, 10) !== day) {
        return res.status(400).json({ message: 'Invalid date.' });
    }

    const name = typeof label === 'string' ? label.trim() : '';
    if (!name || name.length > 120) {
        return res.status(400).json({ message: 'Enter a name with 1 to 120 characters.' });
    }

    try {
        if (kind === 'custom_task') {
            if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
                return res.status(400).json({ message: 'Choose a whole number from 1 to 50 XP.' });
            }

            const isStandardTask = [...taskPoints.keys()].some(
                taskName => taskName.toLowerCase() === name.toLowerCase()
            );

            if (isStandardTask) {
                return res.status(409).json({ message: 'This default task already exists.' });
            }

            const result = await db.query(
                `INSERT INTO public.custom_daily_tasks (user_id, day, label, xp)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [req.userId, day, name, amount]
            );

            if (!result.rowCount) {
                return res.status(409).json({ message: 'This task already exists for this day.' });
            }

            return res.sendStatus(201);
        }

        if (kind === 'task' || kind === 'delete_task') {
            if (kind === 'task' && typeof completed !== 'boolean') {
                return res.status(400).json({ message: 'The task status is missing.' });
            }

            const client = await db.connect();

            try {
                await client.query('BEGIN');

                // Keep simultaneous task changes for this account in order.
                await client.query(
                    'SELECT id FROM public.app_users WHERE id = $1 FOR UPDATE',
                    [req.userId]
                );

                const params = [req.userId, day, name];
                const isDefault = taskPoints.has(name);

                if (kind === 'delete_task') {
                    if (isDefault) {
                        await client.query(
                            `INSERT INTO public.hidden_daily_tasks (user_id, day, label)
                     VALUES ($1, $2, $3)
                     ON CONFLICT DO NOTHING`,
                            params
                        );
                    } else {
                        await client.query(
                            `DELETE FROM public.custom_daily_tasks
                     WHERE user_id = $1 AND day = $2 AND label = $3`,
                            params
                        );
                    }

                    await client.query(
                        `DELETE FROM public.fitness_entries
                 WHERE user_id = $1 AND day = $2 AND label = $3 AND kind = 'task'`,
                        params
                    );
                } else {
                    let points = taskPoints.get(name);

                    if (isDefault) {
                        const hidden = await client.query(
                            `SELECT 1 FROM public.hidden_daily_tasks
                     WHERE user_id = $1 AND day = $2 AND label = $3`,
                            params
                        );
                        if (hidden.rowCount) points = undefined;
                    } else {
                        const custom = await client.query(
                            `SELECT xp FROM public.custom_daily_tasks
                     WHERE user_id = $1 AND day = $2 AND label = $3`,
                            params
                        );
                        points = custom.rows[0]?.xp;
                    }

                    if (points === undefined) {
                        await client.query('ROLLBACK');
                        return res.status(404).json({ message: 'Task not found for this day.' });
                    }

                    if (completed) {
                        await client.query(
                            `INSERT INTO public.fitness_entries (user_id, day, label, kind, amount)
                     VALUES ($1, $2, $3, 'task', $4)
                     ON CONFLICT DO NOTHING`,
                            [...params, points]
                        );
                    } else {
                        await client.query(
                            `DELETE FROM public.fitness_entries
                     WHERE user_id = $1 AND day = $2 AND label = $3 AND kind = 'task'`,
                            params
                        );
                    }
                }

                await client.query('COMMIT');
                return res.sendStatus(204);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        if (!['water', 'distance', 'meal'].includes(kind) ||
            !Number.isInteger(amount) || amount <= 0 || amount > 1000000) {
            return res.status(400).json({ message: 'Invalid entry or amount.' });
        }

        await db.query(
            `INSERT INTO public.fitness_entries (user_id, day, kind, label, amount)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.userId, day, kind, name, amount]
        );

        return res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});
app.patch('/me/entries/:id/distance', requireSession, async (req, res, next) => {
    const { id } = req.params;
    const { amount } = req.body || {};

    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
        return res.status(400).json({ message: 'Invalid entry ID.' });
    }

    // Distance is stored in whole meters.
    if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) {
        return res.status(400).json({
            message: 'Enter a distance between 0.001 and 1000 km.',
        });
    }

    try {
        const result = await db.query(
            `UPDATE public.fitness_entries
             SET amount = $1
             WHERE id = $2 AND user_id = $3 AND kind = 'distance'
             RETURNING id, amount`,
            [amount, id, req.userId]
        );

        if (!result.rowCount) {
            return res.status(404).json({ message: 'Distance entry not found.' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});
app.delete('/me/entries/:id', requireSession, async (req, res, next) => {
    const id = req.params.id;

    if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
        return res.status(400).json({ message: 'Invalid entry ID.' });
    }

    try {
        await db.query(
            `DELETE FROM public.fitness_entries
             WHERE id = $1
               AND user_id = $2
               AND kind IN ('meal', 'water', 'distance')`,
            [id, req.userId]
        );

        return res.sendStatus(204);
    } catch (error) {
        next(error);
    }
});
app.patch('/me/profile', requireSession, async (req, res, next) => {
    const { fullName, university, birthDate } = req.body || {};

    if (typeof fullName !== 'string' ||
        !fullName.trim() ||
        fullName.trim().length > 120) {
        return res.status(400).json({
            message: 'Enter a name with 1 to 120 characters.',
        });
    }

    if (typeof university !== 'string' || university.trim().length > 160) {
        return res.status(400).json({
            message: 'Use up to 160 characters for your university.',
        });
    }

    if (typeof birthDate !== 'string') {
        return res.status(400).json({ message: 'Enter a valid date of birth.' });
    }

    if (birthDate !== '') {
        const parsed = /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
            ? new Date(`${birthDate}T00:00:00Z`)
            : null;

        const today = new Date().toLocaleDateString('sv-SE');

        if (!parsed || Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== birthDate ||
            birthDate < '1900-01-01' || birthDate > today) {
            return res.status(400).json({ message: 'Enter a valid date of birth.' });
        }
    }

    try {
        const result = await db.query(
            `UPDATE public.app_users
             SET full_name = $1, university = $2, birth_date = $3
             WHERE id = $4
             RETURNING full_name AS "fullName",
                       university,
                       to_char(birth_date, 'YYYY-MM-DD') AS "birthDate"`,
            [
                fullName.trim(),
                university.trim() || null,
                birthDate || null,
                req.userId,
            ]
        );

        if (!result.rowCount) {
            return res.status(404).json({ message: 'Account not found.' });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening on port ${port}`);
});