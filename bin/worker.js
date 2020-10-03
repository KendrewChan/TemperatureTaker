const Puppeteer = require("./puppeteer");
const DatabaseManager = require("./database");

const temperature = (36.1 + Math.floor(Math.random() * 10) / 10)
    .toFixed(1)
    .toString();

const kenID = 459499373;

DatabaseManager.getUser(kenID, (err, netID, password) => {
    Puppeteer.scrapeData(netID, password, temperature).catch((err) =>
        console.log(err)
    );
});
