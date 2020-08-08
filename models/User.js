const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Blueprint of what a message would look like in our DB.
const UserSchema = new Schema({
  telegramID: {
	  type: String
  }, 
  netID: {
	  type: String
  }, 
  password: {
	  type: Object
	  // This is encrypted
  },
  key: {
	  type: Buffer
  }
});

// Makes a model of the above schema.
const User = mongoose.model("User", UserSchema);

// Exporting the model so that it can be used in server.js and/or other files.
module.exports = User;
