require('dotenv').config();
const { query, pool } = require('./config/db.js');

async function main() {
    try {
        const [rows] = await query("SELECT id, nom, date_evenement FROM evenements;");
        console.log("Current Events:", rows);
        
        await query("UPDATE evenements SET date_evenement = '2026-08-13 20:00:00';");
        
        const [updatedRows] = await query("SELECT id, nom, date_evenement FROM evenements;");
        console.log("Updated Events:", updatedRows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
main();
