import 'dotenv/config'
import fs from 'node:fs'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
await pool.query('create table if not exists migrations (name text primary key, run_at timestamptz default now())')
const done = new Set((await pool.query('select name from migrations')).rows.map(r => r.name))

for (const file of fs.readdirSync('migrations').sort()) {
    if (done.has(file)) continue
    await pool.query(fs.readFileSync(`migrations/${file}`, 'utf8'))
    await pool.query('insert into migrations (name) values ($1)', [file])
    console.log('ran', file)
}
await pool.end()