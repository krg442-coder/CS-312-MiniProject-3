const pool = require("./db");

async function testConnection() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("Database connected successfully!");
        console.log(result.rows[0]);
    } catch (error) {
        console.log("Database connection failed:", error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
