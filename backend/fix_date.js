require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:bal-masue225@db.qhailwhjtfudanvzcnrp.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connexion réussie !');
    
    // Voir les événements actuels
    const before = await client.query('SELECT id, nom, date_evenement, lieu FROM evenements');
    console.log('Avant mise à jour:', before.rows);
    
    // Mettre à jour la date et le lieu
    await client.query(
      "UPDATE evenements SET date_evenement = '2026-09-04 19:00:00+00', lieu = 'Espace Le Villier, Yopougon Chambéry' WHERE TRUE"
    );
    
    // Vérifier
    const after = await client.query('SELECT id, nom, date_evenement, lieu FROM evenements');
    console.log('Après mise à jour:', after.rows);
    
    console.log('✅ Date mise à jour avec succès !');
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
