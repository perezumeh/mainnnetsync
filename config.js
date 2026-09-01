module.exports = {
    // Telegram Bot Configuration
    telegram: {
        botToken: '5172433451:AAE3Hf1rffHBJN532T0O84r9OoMSsoDRkK4',
        // Array of chat IDs to broadcast submissions to
        chatIds: [
            '5219819186',
             //'5219819186',
            // '5219819186',
        ]
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000
    },
    
    features: {
        telegramNotifications: true
    }
};