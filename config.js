const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const config = {
    telegram: {
        botToken: '',
        chatIds: []
    },
    server: {
        port: process.env.PORT || 3000
    },
    features: {
        telegramNotifications: true
    }
};

function load() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (saved.telegram) {
                config.telegram.botToken = saved.telegram.botToken || '';
                config.telegram.chatIds = Array.isArray(saved.telegram.chatIds) ? saved.telegram.chatIds : [];
            }
            if (saved.server?.port) config.server.port = saved.server.port;
            if (typeof saved.features?.telegramNotifications === 'boolean') {
                config.features.telegramNotifications = saved.features.telegramNotifications;
            }
        } catch (e) {
            console.error('Failed to load config.json:', e.message);
        }
    } else {
        save(); // create default file
    }
}

function save() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('Failed to save config.json:', e.message);
    }
}

load();
config.save = save;
config.load = load;
module.exports = config;