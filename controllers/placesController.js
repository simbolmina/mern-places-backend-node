// const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/placesModel');
const User = require('../models/usersModel');
const mongoose = require('mongoose');
const fs = require('fs');

exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; //( pid: p1)
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    console.log(err.message);
    const error = new HttpError('something went wrong', 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError('could not find a place with this id', 404);
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

exports.getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places; alternative syntax. instead of searching for place, we get user and populated section of places.
  let userWithPlaces;
  try {
    // places = await Place.find({ creator: userId });
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    console.log(err.message);
    const error = new HttpError('something went wrong', 500);
    return next(error);
  }

  // if (!places || places.length === 0) {
  // if (!userWithPlaces || userWithPlaces.places.length === 0) {
  if (!userWithPlaces) {
    return next(new HttpError('could not find a place with this user id', 404));
  }

  res.json({
    places: userWithPlaces.places.map(place =>
      place.toObject({ getters: true })
    ),
  });
  // res.json({ places: places.map(place => place.toObject({ getters: true })) });
};

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors);
    return next(new HttpError('Invalid inputs passed, check your data', 422));
  }
  const { title, description, address } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (err) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError('something went wrong ' + err.message, 500));
  }
  // console.log(user);

  if (!user) {
    return next(new HttpError('no user with this id', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess, validateModifiedOnly: true });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError(`Creating place failed: ${err.message}`, 500));
  }

  res.status(201).json({ place: createdPlace });
};

exports.updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError('Invalid inputs passed, check your data', 422);
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;

  // let updatedPlace;

  // try {
  //   updatedPlace = await Place.findByIdAndUpdate(placeId, req.body, {
  //     new: true,
  //   });
  // } catch (err) {
  //   console.log(err);
  // }

  // if (!updatedPlace) {
  //   return next(new HttpError('could not find a place with this id', 404));
  // }

  // // updatedPlace.title = title;
  // // updatedPlace.description = description;

  // res.status(200).json({
  //   status: 'success',
  //   data: updatedPlace,
  // });
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError('Unauthorized access', 403));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({
    status: 'success',
    data: place,
  });
};

exports.deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.' + err.message,
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError('could not find place for this id', 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new HttpError('Unauthorized access', 403));
  }

  const imagePath = place.image;

  try {
    // await place.remove();
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess, validateModifiedOnly: true });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Something went wrong' + err.message, 500);
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted place.' });

  // let place;
  // try {
  //   place = await Place.findByIdAndDelete(req.params.pid);
  // } catch (err) {
  //   return next(new HttpError('something went wrong: ' + err.message));
  // }

  // if (!place) {
  //   return next(new HttpError('Could not find a place for that id', 404));
  // }

  // res.status(204).json(null);
};
