const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Log } = require('../logging_middleware/logger');

const TOKEN = process.env.BEARER_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

async function getTopNotifications(n = 10) {
    await Log("backend", "info", "service", `Fetching top ${n} priority notifications`);
    
    const res = await axios.get(
        "http://20.207.122.201/evaluation-service/notifications",
        { headers }
    );

    const notifications = res.data.notifications;
    await Log("backend", "info", "service", `Fetched ${notifications.length} total notifications`);

    // score = type weight + recency score
    const scored = notifications.map(n => {
        const ageMs = Date.now() - new Date(n.Timestamp).getTime();
        const recencyScore = 1 / (1 + ageMs / 60000); // decays over time
        const typeScore = TYPE_WEIGHT[n.Type] || 0;
        return { ...n, score: typeScore + recencyScore };
    });

    // sort descending by score
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, n);
    
    await Log("backend", "info", "service", `Returning top ${n} prioritized notifications`);
    
    console.log(`\nTop ${n} Priority Notifications:`);
    top.forEach((n, i) => {
        console.log(`${i+1}. [${n.Type}] ${n.Message} | Score: ${n.score.toFixed(3)} | Time: ${n.Timestamp}`);
    });

    return top;
}

getTopNotifications(10);