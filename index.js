const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200'
}));

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'postgres',
    password: 'jhFOP!109',
    port: 5432,
});

const stageNames = ['Master', 'Release', 'Database', 'MSConfig', 'Keycloak', 'Stand-Prod', 'Services', 'Products', 'Finish'];

let selectedYear;
let selectedMonthNumber;
let selectedWeekIndex;

app.post('/api/getReleasesForSelectedWeek', async (req, res) => {
    try {
        const { year, monthNumber, weekIndex } = req.body;

        if (year && monthNumber && weekIndex) {
            selectedYear = year;
            selectedMonthNumber = monthNumber;
            selectedWeekIndex = weekIndex;
        }

        const query = 'SELECT release_number, release_tag FROM releases WHERE year = $1 AND month_number = $2 AND week_index = $3 order by release_number';
        const values = [year, monthNumber, weekIndex];

        const { rows } = await pool.query(query, values);

        const releaseList = rows.map(row => ({
            releaseNumber: row.release_number,
            releaseTag: row.release_tag
        }));

        const result = {
            releaseList: releaseList
        };

        res.json(result);
    } catch (e) {
        console.error('Внутренняя ошибка сервера:', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/addRelease', async (req, res) => {
    try {
        const { releaseNumber, releaseTag} = req.body;
        const engineerId = 1;

        const confirmOfExistQuery = 'SELECT COUNT(*) FROM releases WHERE release_number = $1';
        const addQuery = 'INSERT INTO releases (release_number, release_tag, year, month_number, week_index, engineer_id) VALUES ($1, $2, $3, $4, $5, $6)';
        const values = [releaseNumber, releaseTag, selectedYear, selectedMonthNumber, selectedWeekIndex, engineerId];

        const isExistRelease = await pool.query(confirmOfExistQuery, [releaseNumber]);

        let result;

        if (+isExistRelease.rows[0].count === 0) {
            await pool.query(addQuery, values);

            const searchResult =  await pool.query('SELECT id FROM releases WHERE release_number = $1', [releaseNumber]);

            const releaseId = searchResult.rows[0].id;

            console.log(`Добавили releaseNumber: ${releaseNumber}`);

            // Добавление записей в таблицу stages
            for (const stageName of stageNames) {
                const addStageQuery = 'INSERT INTO stages (release_id, stage_name, stand) VALUES ($1, $2, $3)';
                const prepStagesValues = [releaseId, stageName, 'Prep'];
                const prodStagesValues = [releaseId, stageName, 'Prod'];
                await pool.query(addStageQuery, prepStagesValues);
                await pool.query(addStageQuery, prodStagesValues);
                console.log(`Добавили stage: ${stageName} для релиза ${releaseNumber}`);
            }

            result = {
                message: 'success',
            };
        } else {
            result = {
                message: 'entry exists',
            };
            console.log('По какой-то причине ошибка')
        }

        res.json(result);
    } catch (e) {
        console.error('Внутренняя ошибка сервера:', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/deleteRelease', async (req, res) => {
    try {
        const { releaseNumber } = req.body;
        console.log(`Удалили releaseNumber: ${releaseNumber}`);

        const confirmOfExistQuery = 'SELECT COUNT(*) FROM releases WHERE release_number = $1';
        const searchReleaseIdQuery = 'SELECT id FROM releases WHERE release_number = $1'
        const deleteReleaseQuery = 'DELETE FROM releases WHERE id = $1';
        const deleteStagesQuery = 'DELETE FROM stages WHERE release_id = $1';
        const deleteBuildsQuery = 'DELETE FROM builds WHERE release_id = $1';
        const values = [releaseNumber];

        const isExistRelease = await pool.query(confirmOfExistQuery, values);
        const foundReleaseId = await pool.query(searchReleaseIdQuery, values);

        const releaseId = [foundReleaseId.rows[0].id];

        let result;

        if (+isExistRelease.rows[0].count === 1) {
            await pool.query(deleteStagesQuery, releaseId);
            console.log(`Удалили stages релиза ${releaseNumber}`);

            await pool.query(deleteBuildsQuery, releaseId);
            console.log(`Удалили builds релиза ${releaseNumber}`);

            await pool.query(deleteReleaseQuery, releaseId);
            console.log(`Удалили releases релиза ${releaseNumber}`);

            result = {
                message: 'success',
            };
        } else if (isExistRelease.rows[0].count > 1) {
            result = {
                message: 'too much',
            };
        } else {
            result = {
                message: 'no result',
            };
        }

        res.json(result);
    } catch (e) {
        console.error('Внутренняя ошибка сервера:', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
