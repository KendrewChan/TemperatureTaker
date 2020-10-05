require("dotenv").config();
const axios = require("axios");

const Puppeteer = require("./puppeteer");
const DatabaseManager = require("./database");

// Setting up hooks: https://medium.com/@xabaras/setting-your-telegram-bot-webhook-the-easy-way-c7577b2d6f72

const TELE_URL = `https://api.telegram.org/bot${process.env.API_SECRET}`;

const Telegram = {
    sendMessage: (userid, message) => {
        const data = {
            chat_id: userid,
            text: message,
            parse_mode: "Markdown",
        };
        axios
            .post(`${TELE_URL}/sendMessage`, data)
            .catch((err) => console.log(err));
    },
    sendCallback: (data) => {
        const teleData = {
            chat_id: data.userid,
            text: data.message,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [data.callbacks],
            },
        };
        axios
            .post(`${TELE_URL}/sendMessage`, teleData)
            .catch((err) => console.log(err));
    },
    sendSticker: (userid, stickerid) => {
        const data = {
            chat_id: userid,
            sticker: stickerid,
        };
        axios
            .post(`${TELE_URL}/sendSticker`, data)
            .catch((err) => console.log(err));
    },
    checkCommands: (err, teleData) => {
        // TODO: Convert each command into a method in another file
        // Right now it's too chunky!!
        if (err) {
            console.log(err);
        } else {
            const callbackQuery = teleData.callback_query;
            if (teleData.message != undefined) {
                const message = teleData.message;
                if (
                    message != undefined &&
                    message.entities != undefined &&
                    message.entities[0].type === "bot_command"
                ) {
                    // Check whether command exists && if it's a command
                    const textMsg = message.text;
                    const chatID = message.chat.id;
                    // chatid and userid is the same if user directly interacts with bot (not through a group)
                    const commandArr = textMsg.split(" ");
                    const command = commandArr[0];
                    switch (command) {
                        case "/start":
                            Telegram.sendMessage(
                                chatID,
                                "Welcome! Type `/register nusstu\\NETID PASS` to login and `/settemp your_temp` to set ur temperature!"
                            );
                            break;
                        case "/register":
                            if (commandArr.length != 3) {
                                Telegram.isInvalidCommand(chatID);
                            } else {
                                const [command, netid, pass] = commandArr;
                                DatabaseManager.upsertUser(
                                    {
                                        telegramID: chatID,
                                        netID: netid,
                                        password: pass,
                                    },
                                    (err) => {
                                        if (err) {
                                            Telegram.sendMessage(
                                                chatID,
                                                "Sorry! An error has occurred on the database 😰"
                                            );
                                        } else {
                                            Telegram.sendMessage(
                                                chatID,
                                                "Your details have been encrypted and saved! 😆"
                                            );
                                        }
                                    }
                                );
                            }
                            break;
                        case "/settemp":
                            if (commandArr.length != 2) {
                                Telegram.isInvalidCommand(chatID);
                            } else {
                                const [command, temperature] = commandArr;
                                DatabaseManager.getUser(chatID, (err, data) => {
                                    if (err) {
                                        Telegram.sendMessage(
                                            chatID,
                                            "Registered user cannot be found, please register with /register NETID PASS"
                                        );
                                    } else {
                                        Puppeteer.scrapeData(
                                            data.netID,
                                            data.password,
                                            temperature
                                        )
                                            .then((page) => {
                                                Telegram.sendMessage(
                                                    chatID,
                                                    `Your temperature of ${temperature}°C has been set 😆 `
                                                );
                                            })
                                            .catch((err) => {
                                                Telegram.sendMessage(
                                                    chatID,
                                                    "Sorry! An error has occurred while scraping 🤒"
                                                );
                                            });
                                    }
                                });
                            }
                            break;
                        case "/help":
                            Telegram.sendMessage(
                                chatID,
                                "E.g. `/register nusstu\\E1234567A Password123` and `/settemp 36.5`"
                            );
                            break;
                        default:
                            Telegram.isInvalidCommand(chatID);
                            break;
                    }
                } else if (
                    message.sticker != undefined &&
                    (message.sticker.file_unique_id === "AgADRgADOtAdJw" ||
                        message.sticker.file_unique_id === "AgADLQADbWdjGw")
                ) {
                    const chatID = message.chat.id;

                    Telegram.sendCallback({
                        userid: chatID,
                        message: "Automate your temperature?",
                        callbacks: [
                            {
                                text: "Yes",
                                callback_data: 1,
                                // Send these data as enums later on
                            },
                            {
                                text: "No",
                                callback_data: 0,
                            },
                        ],
                    });
                }
            }
            if (callbackQuery != undefined) {
                // Currently only used for Automating temperatures
                const teleID = callbackQuery.from.id;
                const callbackText = callbackQuery.message.text;
                if (callbackText === "Automate your temperature?") {
                    const callbackData = callbackQuery.data;
                    switch (callbackData) {
                        case "0":
                            Telegram.sendMessage("Alright! Have a nice day!");
                            break;
                        case "1":
                            console.log(teleID);
                            DatabaseManager.upsertUser(
                                {
                                    telegramID: teleID,
                                    isAuto: true,
                                },
                                (err) => {
                                    if (err) {
                                        Telegram.sendMessage(
                                            teleID,
                                            "Sorry! An error has occurred on the database 😰"
                                        );
                                    } else {
                                        Telegram.sendSticker(
                                            chatID,
                                            "CAACAgIAAxkBAAIBcF8tUnMXejvZ1MNPchnlA2SMCoyRAAIFAAN1UIETZmBnin0s48QaBA"
                                        );
                                        Telegram.sendMessage(
                                            teleID,
                                            "Your temperature will now be taken automatically :)"
                                        );
                                    }
                                }
                            );
                            break;
                        default:
                            // Shouldn't come here
                            Telegram.sendMessage(
                                teleID,
                                "Sorry! An error has occurred 😰"
                            );
                            break;
                    }
                }
            }
        }
    },
    getUpdates: (callback) => {
        // This function is used for non-webhooks
        axios
            .get(`${TELE_URL}/getUpdates`)
            .then((res) => {
                const data = res.data.result;
                if (data.length > 0) {
                    data.forEach((teleData) => {
                        callback(null, teleData);
                    });
                    const offset = data[data.length - 1].update_id + 1;
                    axios
                        .get(`${TELE_URL}/getUpdates?offset=${offset}`)
                        .catch((err) => console.log(err));
                }
            })
            .catch((err) => callback(err, null));
    },
    isInvalidCommand: (chatID) => {
        Telegram.sendMessage(chatID, "Sorry! That's an invalid command :(");
    },
};

module.exports = Telegram;
