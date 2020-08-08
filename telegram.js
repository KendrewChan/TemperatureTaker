require('dotenv').config();
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
			parse_mode: "Markdown"
		}
		axios.post(`${TELE_URL}/sendMessage`, data)
			.catch(err => console.log(err));
	},
	checkCommands: (err, message) => {
		if (err) {
			console.log(err);
		} else {
			if (message.entities != undefined && message.entities[0].type === 'bot_command') {
				// Check whether command exists && if it's a command
				const textMsg = message.text;
				const chatID = message.chat.id; 
				// chatid and userid is the same if user directly interacts with bot (not through a group)
				const commandArr = textMsg.split(" ");
				const command = commandArr[0];
				switch (command) {
					case "/help":
						Telegram.sendMessage(chatID, "Welcome! Type `/register NETID PASS` to login and `/setTemp your_temp` to set ur temperature!");
						break;
					case "/register":
						if (commandArr.length != 3) {
							Telegram.isInvalidCommand(chatID);
						} else {
							const [command, netid, pass] = commandArr;
							DatabaseManager.upsertUser(chatID, netid, pass, (err) => {
								if (err) {
									console.log(err);
									Telegram.sendMessage(chatID, "Sorry! An error has occurred on the database :(");
								} else {
									Telegram.sendMessage(chatID, "Your details have been encrypted and saved! :)");
								}
							});
						}
						break;
					case "/setTemp":
						if (commandArr.length != 2) {
							Telegram.isInvalidCommand(chatID);
						} else {
							const [command, temperature] = commandArr;
							DatabaseManager.getUser(chatID, (err, netID, password) => {
								Puppeteer.scrapeData(netID, password, temperature)
									.then(page => {
										Telegram.sendMessage(chatID, "Your temperature has been set! :)");
									})
									.catch(err => {
										Telegram.sendMessage(chatID, "Sorry! An error has occurred while scraping :(");
									})
							})
						}
						break;
					default:
						Telegram.isInvalidCommand(chatID);
						break;
				}
			}
		}
	},
	getUpdates: (callback) => {
		// This function is used for non-webhooks
		axios.get(`${TELE_URL}/getUpdates`)
			.then(res => {
				const data = res.data.result;
				if (data.length > 0) {
					data.forEach(msg => {
						const message = msg.message != undefined ? msg.message : msg.edited_message;
						callback(null, message);
					})
					const offset = data[data.length-1].update_id + 1
					axios.get(`${TELE_URL}/getUpdates?offset=${offset}`)
						.catch(err => console.log(err));
				}
			})
			.catch(err => callback(err, null));
	},
	isInvalidCommand: (chatID) => {
		Telegram.sendMessage(chatID, "Sorry! That's an invalid command :(");
	}
}

// getUpdates(checkCommands);
// Sends updates based upon commands by user
// Get TelegramID: https://t.me/userinfobot
module.exports = Telegram;
