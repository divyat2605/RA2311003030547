const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Log } = require('../logging_middleware/logger');

const TOKEN = process.env.BEARER_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

async function getDepots() {
    const res = await axios.get("http://20.207.122.201/evaluation-service/depots", { headers });
    return res.data.depots;
}

async function getVehicles() {
    const res = await axios.get("http://20.207.122.201/evaluation-service/vehicles", { headers });
    return res.data.vehicles;
}

function knapsack(tasks, capacity) {
    const n = tasks.length;
    const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const { Duration, Impact } = tasks[i - 1];
        for (let w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i - 1][w];
            if (Duration <= w) {
                dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
            }
        }
    }

    // backtrack to find selected tasks
    let w = capacity;
    const selected = [];
    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            selected.push(tasks[i - 1]);
            w -= tasks[i - 1].Duration;
        }
    }

    return { maxImpact: dp[n][capacity], selected };
}

async function main() {
    await Log("backend", "info", "service", "Starting vehicle maintenance scheduler");

    const depots = await getDepots();
    const vehicles = await getVehicles();

    await Log("backend", "info", "service", `Fetched ${depots.length} depots and ${vehicles.length} vehicles`);

    for (const depot of depots) {
        const capacity = depot.MechanicHours;
        await Log("backend", "info", "service", `Processing depot ${depot.ID} with ${capacity} mechanic hours`);

        const { maxImpact, selected } = knapsack(vehicles, capacity);

        console.log(`\nDepot ${depot.ID} | Mechanic Hours: ${capacity}`);
        console.log(`Max Impact Score: ${maxImpact}`);
        console.log(`Selected ${selected.length} vehicles:`);
        selected.forEach(v => {
            console.log(`  - Task ${v.TaskID} | Duration: ${v.Duration}h | Impact: ${v.Impact}`);
        });

        await Log("backend", "info", "service", `Depot ${depot.ID} done. Max impact: ${maxImpact}`);
    }
}

main();