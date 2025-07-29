import pkg from 'pg';

const { Pool } = pkg;

const poolConfig = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default poolConfig;