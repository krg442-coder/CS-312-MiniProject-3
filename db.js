const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "BlogDB",
    password: "KaidenDB_Pass",
    port: 5432
});

module.exports = pool;
