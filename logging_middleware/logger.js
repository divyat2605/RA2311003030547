const axios = require('axios');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const TOKEN = process.env.BEARER_TOKEN;
//adding try catch block to handle any errors
async function Log(stack, level, package_, message) {
    try {
        await axios.post("http://20.207.122.201/evaluation-service/logs", 
            { stack, level, package: package_, message },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
        );
    } catch (err) {
        console.error("Logging failed:", err.message);
    }
}

module.exports = { Log };