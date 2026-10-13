require('dotenv').config();
const { query, pool } = require('./config/db.js');

async function main() {
    try {
        const [rows] = await query("SELECT id, nom, date_evenement, lieu FROM evenements;");
        console.log("Current Events:", rows);
        
        await query(
            "UPDATE evenements SET date_evenement = '2026-09-04 19:00:00+00', lieu = 'Espace Le Villier, Yopougon Chambéry';"
        );
        
        const [updatedRows] = await query("SELECT id, nom, date_evenement, lieu FROM evenements;");
        console.log("Updated Events:", updatedRows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
