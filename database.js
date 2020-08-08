require('dotenv').config();
const mongoose = require("mongoose");
const Crypto = require("./crypto");

const db = process.env.MONGO_URI;
// Connect to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB successfully connected"))
  .catch((err) => console.log(err));

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

const User = require("./models/User");

const DatabaseManager = {
	upsertUser: (telegramID, netID, password, callback) => {
		User.findOne({telegramID: telegramID})
			.then(user => {
				const key = Crypto.getKey();
				const hash = Crypto.encrypt(password); 
				if (user) {
					// Update current user if he exists
					user.netID = netID;
					user.password = hash;
					user.key = key;
					user.save()
						.then(res => callback(null))
						.catch(err => callback(err));
				} else {
					// Create new user if he doesn't exist
					const newUser = new User({
						telegramID: telegramID,
						netID: netID,
						password: hash,
						key: key,
					})
					newUser.save()
						.then(res => callback(null))
						.catch(err => callback(err));
				}
			})
			.catch(err => callback(err));
	},
	getUser: (telegramID, callback) => {
		User.findOne({telegramID: telegramID})
			.then(user => {
				callback(null, user.netID, Crypto.decrypt(user.password, user.key));
			})
			.catch(err => callback(err, null, null));
	}
}

module.exports = DatabaseManager;