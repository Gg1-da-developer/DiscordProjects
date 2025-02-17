const axios = require("axios");
require("dotenv").config();
const fs = require("fs");

const GRABIFY_API_KEY = process.env.GRABIFY_API_KEY;
const TRACKING_CODE = "YOUR_TRACKING_CODE_HERE";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!GRABIFY_API_KEY || !DISCORD_WEBHOOK_URL) {
    console.error("Missing environment variables!");
    process.exit(1);
}

function getLastTimestamp() {
    if (fs.existsSync("last_log.json")) {
        return JSON.parse(fs.readFileSync("last_log.json")).timestamp;
    }
    return null;
}

function saveLastTimestamp(timestamp) {
    fs.writeFileSync("last_log.json", JSON.stringify({ timestamp }));
}

async function fetchLogs() {
    try {
        const response = await axios.get(
            `http://api.grabify.link/?key=${GRABIFY_API_KEY}&response=logs&track=${TRACKING_CODE}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error.message);
        return null;
    }
}

async function sendToDiscord(log) {
    const embed = {
        title: "New Click Logged!",
        color: 16711680,
        fields: [
            { name: "IP Address", value: log["IP"] || "Unknown", inline: true },
            { name: "Country", value: log["Country"] || "Unknown", inline: true },
            { name: "Device", value: log["Device"] || "Unknown", inline: false },
            { name: "User Agent", value: log["User-Agent"] || "Unknown", inline: false },
            { name: "Timestamp", value: log["Timestamp"] || "Unknown", inline: false }
        ]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] });
        console.log("Log sent to Discord!");
    } catch (error) {
        console.error("Discord send error:", error.message);
    }
}

async function sendToDiscordWithDelay(logs) {
    for (const log of logs) {
        await sendToDiscord(log);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function main() {
    const logs = await fetchLogs();
    if (!logs) return;

    const lastTimestamp = getLastTimestamp();
    const newLogs = logs.filter(log => log["Timestamp"] > lastTimestamp);

    if (newLogs.length > 0) {
        await sendToDiscordWithDelay(newLogs);
        saveLastTimestamp(newLogs[newLogs.length - 1]["Timestamp"]);
    }
}

main();
