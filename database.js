require("dotenv").config();
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
    upsertUser: (data, callback) => {
        const telegramID = data.telegramID;
        const netID = data.netID;
        const password = data.password;
        const isAuto = data.isAuto;

        User.findOne({ telegramID: data.telegramID })
            .then((user) => {
                const key = password === undefined ? user.key : Crypto.getKey();
                const hash =
                    password === undefined
                        ? user.password
                        : Crypto.encrypt(password);
                if (user) {
                    // Update current user if he exists
                    user.netID = netID === undefined ? user.netID : netID;
                    user.password = hash;
                    user.key = key;
                    user.isAuto = isAuto === undefined ? user.isAuto : isAuto;
                    user.save()
                        .then((res) => callback(null))
                        .catch((err) => callback(err));
                } else {
                    // Create new user if he doesn't exist
                    const newUser = new User({
                        telegramID: telegramID,
                        netID: netID,
                        password: hash,
                        key: key,
                    });
                    newUser
                        .save()
                        .then((res) => callback(null))
                        .catch((err) => callback(err));
                }
            })
            .catch((err) => callback(err));
    },
    getUser: (telegramID, callback) => {
        User.findOne({ telegramID: telegramID })
            .then((user) => {
                const data = {
                    netID: user.netID,
                    password: Crypto.decrypt(user.password, user.key),
                };
                callback(null, data);
            })
            .catch((err) => callback(err, null));
    },
    getAutoUsers: (callback) => {
        User.find({ isAuto: true })
            .then((users) => {
                for (var i = 0; i < users.length; i++) {
                    const user = users[i];
                    const data = {
                        telegramID: user.telegramID,
                        netID: user.netID,
                        password: Crypto.decrypt(user.password, user.key),
                    };
                    callback(null, data);
                }
            })
            .catch((err) => callback(err, null));
    },
};

module.exports = DatabaseManager;
