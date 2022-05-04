const { default: mongoose } = require('mongoose');
const mogoose = require('mongoose');

const placesSchema = new mogoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

placesSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

placesSchema.post(/^find/, function (docs, next) {
  console.log(`querry took ${Date.now() - this.start} ms`);
  // console.log(docs);
  next();
});

const Place = mongoose.model('Place', placesSchema);

module.exports = Place;
