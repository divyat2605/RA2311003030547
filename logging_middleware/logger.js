const axios = require('axios');

require('dotenv').config();
const TOKEN = process.env.BEARER_TOKEN;
async function Log(stack, level, package_, message) {
    await axios.post("http://20.207.122.201/evaluation-service/logs", 
        { stack, level, package: package_, message },
        { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
}

module.exports = { Log };