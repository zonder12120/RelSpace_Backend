const { Pool } = require("pg");

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'postgres',
    password: 'jhFOP!109',
    port: 5432,
});

module.exports.home = async (req, res) => {
    try {
        const { year, monthNumber, weekIndex } = req.body;

        const { rows } = await pool.query('SELECT releasenumber FROM releases WHERE year = $1 AND monthnumber = $2 AND weekindex = $3', [year, monthNumber, weekIndex]);

        if (rows.length === 0) {
            res.status(401).json({ error: 'Релизы не найдены' });
            return;
        }

        const releaseList = rows.map((row) => row.releasenumber); // Исправлено здесь

        return res.json({
            message: 'Релизы найдены',
            releaseList: releaseList,
        });
    } catch (e) {
        console.log('Внутренняя ошибка сервера: ', e);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};