"use strict";

/** Express app for dungeonHelper. */

const express = require("express");
const cors = require("cors");
const path = require('path');

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const campaignsRoutes = require("./routes/campaigns");
const usersRoutes = require("./routes/users");
const charactersRoutes = require("./routes/characters");
const sessionsRoutes = require("./routes/sessions");

const morgan = require("morgan");

const app = express();

//Middleware for serving static files
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/campaigns", campaignsRoutes);
app.use("/users", usersRoutes);
app.use("/characters", charactersRoutes);
app.use("/sessions", sessionsRoutes);


/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
