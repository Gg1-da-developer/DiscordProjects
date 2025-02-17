const axios = require("axios");
require("dotenv").config();

const GRABIFY_API_KEY = process.env.GRABIFY_API_KEY;
const TRACKING_CODE = "TrackingCodeGoesHere";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function fetchLogs() {
    try {
        const response = await axios.get(`http://api.grabify.link/?key=${GRABIFY_API_KEY}&response=logs&track=${TRACKING_CODE}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error.message);
        return null;
    }
}

async function sendToDiscord(log) {
    const embed = {
        title: " New Click Logged!",
        color: 16711680, // Red Color
        fields: [
            { name: "IP Address", value: log["IP"] || "Unknown", inline: true },
            { name: "Country", value: log["Country"] || "Unknown", inline: true },
            { name: "Device", value: log["Device"] || "Unknown", inline: false },
            { name: "User Agent", value: log["User-Agent"] || "Unknown", inline: false },
            { name: "Timestamp", value: log["Timestamp"] || "Unknown", inline: false }
        ]
    };

    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            embeds: [embed]
        });
        console.log("Log sent to Discord successfully!");
    } catch (error) {
        console.error("Error sending log to Discord:", error.message);
    }
}

async function main() {
    const logs = await fetchLogs();
    if (logs) {
        for (const log of logs) {
            await sendToDiscord(log);
        }
    }
}

main();

