const Puppeteer = require("../puppeteer");
const DatabaseManager = require("../database");
const Telegram = require("../telegram");

DatabaseManager.getAutoUsers((err, data) => {
    if (err) {
        console.log(err);
    } else {
        const teleID = data.telegramID;
        const netID = data.netID;
        const password = data.password;

        const temperature = (36.1 + Math.floor(Math.random() * 10) / 10)
            .toFixed(1)
            .toString();

        Puppeteer.scrapeData(netID, password, temperature)
            .then((page) => {
                Telegram.sendMessage(
                    teleID,
                    `Your temperature of ${temperature}°C has been set! 😆`
                );
            })
            .catch((err) => {
                Telegram.sendMessage(
                    teleID,
                    "Sorry! An error has occurred while scraping 🤒"
                );
            });
    }
});
