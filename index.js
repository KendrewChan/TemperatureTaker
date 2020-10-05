require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");

const Telegram = require("./telegram");

const app = express();

const production = true;

if (production) {
    app.use(
        bodyParser.urlencoded({
            extended: false,
        })
    );
    app.use(bodyParser.json());

    app.post("/", (req, res) => {
        const { message } = req.body;
        Telegram.checkCommands(null, message);
        res.sendStatus(200);
    });

    const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
    app.listen(port, () =>
        console.log(`Server up and running on port ${port}!`)
    );
} else {
    Telegram.getUpdates(Telegram.checkCommands);
}
