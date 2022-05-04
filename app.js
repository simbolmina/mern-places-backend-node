const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const placesRouter = require('./routes/placesRoutes');
const usersRouter = require('./routes/usersRoutes');
const HttpError = require('./models/http-error');
const { set } = require('express/lib/application');

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//   );
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH,DELETE');
//   next();
// });
app.use(cors());

app.options('*', cors());

app.use('/api/places', placesRouter);
app.use('/api/users', usersRouter);

//error handler for unheldled routes
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route', 404);
  throw error;
});

//global error middleware
app.use((error, req, res, next) => {
  if (req.file) {
    //if there is a file while an error accured, delete the file. this is for deleting unnecessary image upload during signup while user has an error.
    fs.unlink(req.file.path, err => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occured' });
});

mongoose
  // .connect(
  //   'mongodb+srv://simbolmina:Tcsg-134ATLAS@cluster0.d39jk.mongodb.net/Places?retryWrites=true&w=majority'
  // )
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.d39jk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000, () => {
      console.log('db connection successfull, App running on port 5000');
    });
  })
  .catch(err => {
    console.log(err);
  });

//   DB_USER=simbolmina
// DB_PASSWORD=Tcsg-134ATLAS
// DB_NAME=Places
