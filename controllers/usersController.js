const HttpError = require('../models/http-error');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const User = require('../models/usersModel');

exports.getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password'); //"email name"
    // console.log(users);
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

exports.getUserById = async (req, res, next) => {
  const userId = req.params.uid; //( uid: u1)
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(new HttpError('Something went wrong' + err.message, 500));
  }

  if (!user) {
    // return res.status(404).json({ message: 'no user with this id' });
    // const error = new Error('could not find any user with this id');
    // error.code = 404;
    // return next(error);
    return next(new HttpError('could not find a user  with this id', 404));
  }
  res.json({ user });
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError('Invalid inputs passed, check your data', 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError('Signup has failed, try again later', 500));
  }
  // console.log(existingUser);

  if (existingUser) {
    return next(new HttpError('User already exist, login instead', 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError('Could not create user, try again later', 500));
  }

  const createdUser = new User({
    name,
    email,
    // image: `https://localhost:5000${req.file.path}`,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  // console.log(newUser);

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError('signup failed, try again later', 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: '90d' }
    );
  } catch (err) {
    return next(new HttpError('signup failed, try again later', 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(email, password);

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
    // console.log(existingUser);
  } catch (err) {
    return next(new HttpError('Loggin has failed, try again later'));
  }

  // if (!existingUser || existingUser.password !== password) {
  if (!existingUser) {
    return next(new HttpError('invalid credentials', 403));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next('Wrong credentials', 500);
  }

  if (!isValidPassword) {
    return next('Wrong credentials', 500);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
    // console.log(token);
  } catch (err) {
    return next(new HttpError('login failed, try again later', 500));
  }

  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};
