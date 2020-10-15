const Puppeteer = require("../puppeteer");
const DatabaseManager = require("../database");
const Telegram = require("../telegram");

const puppetScrape = (teleID, netID, password, morning, callback) => {
    const temp = (36.1 + Math.floor(Math.random() * 10) / 10)
        .toFixed(1)
        .toString();

    Puppeteer.scrapeTempTime(netID, password, temp, morning)
        .then((page) => {
            Telegram.sendMessage(
                teleID,
                `Your temperature of ${temp}°C has been set! ` +
                    (morning ? `(AM)` : `(PM)`) +
                    `😆`
            );
            callback(null, page);
        })
        .catch((err) => {
            Telegram.sendMessage(
                teleID,
                `Sorry! An error has occurred while scraping ` +
                    (morning ? `(AM)` : `(PM)`) +
                    `🤒`
            );
            callback(err, null);
        });
};

DatabaseManager.getAutoUsers((err, data) => {
    if (err) {
        console.log(err);
    } else {
        const teleID = data.telegramID;
        const netID = data.netID;
        const password = data.password;

        puppetScrape(teleID, netID, password, true, (err, page) => {
            if (err) {
                console.log(err);
            } else {
                puppetScrape(teleID, netID, password, false, (err, page) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
    }
});
