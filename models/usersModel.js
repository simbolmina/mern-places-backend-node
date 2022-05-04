const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: [true, 'Enter a password'],
    minlength: 6,
  },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, ref: 'Place', required: true }],
});

userSchema.plugin(uniqueValidator);

userSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

userSchema.post(/^find/, function (docs, next) {
  console.log(`querry took ${Date.now() - this.start} ms`);
  // console.log(docs);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
