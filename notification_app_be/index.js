const axios = require('axios');
require('dotenv').config();
const { Log } = require('../logging_middleware/logger');

const TOKEN = process.env.BEARER_TOKEN;
const headers = { Authorization: `Bearer ${TOKEN}` };

async function sendEmail(studentId, message) {
    // simulating email send
    await Log("backend", "info", "service", `Email sent to student ${studentId}: ${message}`);
}

async function saveToDb(studentId, message) {
    // simulating DB save
    await Log("backend", "info", "db", `Notification saved to DB for student ${studentId}`);
}

async function pushToApp(studentId, message) {
    // simulating push notification
    await Log("backend", "info", "service", `Push notification sent to student ${studentId}`);
}

async function notify_all(student_ids, message) {
    await Log("backend", "info", "service", `Starting bulk notify for ${student_ids.length} students`);
    
    const results = await Promise.allSettled(
        student_ids.map(async (studentId) => {
            try {
                // run in parallel, not sequential
                await Promise.all([
                    sendEmail(studentId, message),
                    saveToDb(studentId, message),
                    pushToApp(studentId, message)
                ]);
                await Log("backend", "info", "service", `Successfully notified student ${studentId}`);
            } catch (err) {
                await Log("backend", "error", "service", `Failed to notify student ${studentId}: ${err.message}`);
            }
        })
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    const succeeded = results.length - failed;
    
    await Log("backend", "info", "service", `Bulk notify complete. Success: ${succeeded}, Failed: ${failed}`);
    console.log(`Done. Success: ${succeeded}, Failed: ${failed}`);
}

// test run
notify_all(["s1", "s2", "s3", "s4", "s5"], "Placement season open!");