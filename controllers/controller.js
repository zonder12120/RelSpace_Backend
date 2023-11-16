const { Pool } = require("pg");
const {DB_USER, DB_HOST, DB_NAME, DB_PASS, DB_PORT} = require("../_constants/constants");

const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: DB_PORT,
});

module.exports.home = async (req, res) => {
    try {
        const { year, monthNumber, weekIndex } = req.body;

        const { rows } = await pool.query('SELECT releasenumber FROM releases WHERE year = $1 AND monthnumber = $2 AND weekindex = $3', [year, monthNumber, weekIndex]);

        if (rows.length === 0) {
            res.status(401).json({ error: 'Релизы не найдены' });
            return;
        }

        const releaseList = rows.map((row) => row.releasenumber);

        return res.json({
            message: 'Релизы найдены',
            releaseList: releaseList,
        });
    } catch (e) {
        console.log('Внутренняя ошибка сервера: ', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};