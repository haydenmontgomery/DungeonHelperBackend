"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Campaign = require("../models/campaign");
const Character = require("../models/character");
const { createToken } = require("../helpers/tokens");

const testUserIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM characters");

  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM campaigns");


  testUserIds[0] = (await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  })).id;

  testUserIds[1] = (await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  })).id;

  testUserIds[2] = (await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  })).id;

  await Campaign.create(
      {
        title: "C1",
        description: "C1Desc",
        maxPlayers: 3,
        publicView: true,
        username: 'u1',
      });

  await Campaign.create(
      {
        title: "C2",
        description: "C2Desc",
        maxPlayers: 3,
        publicView: true,
        username: 'u1',
      });
  await Campaign.create(
      {
        title: "C3",
        description: "C3Desc",
        maxPlayers: 1,
        publicView: true,
        username: 'u2',
      });

  await Character.create(
      {
        name: "testName1",
        className: "testClass1",
        bio: "testBio1",
        age: 99,
        height: '6',
        level: 20,
        inventory: [],
        gold: 50,
        hp: 20,
        profileUrl: "/static/images/default_profile.png",
        userId: testUserIds[0],
      }
  )

  await Character.create(
      {
        name: "testName2",
        className: "testClass2",
        bio: "testBio2",
        age: 99,
        height: '6',
        level: 20,
        inventory: [],
        gold: 50,
        hp: 20,
        profileUrl: "/static/images/default_profile.png",
        userId: testUserIds[1],
      }
  )   
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false, id: testUserIds[0] });
const u2Token = createToken({ username: "u2", isAdmin: false, id: testUserIds[1] });
const adminToken = createToken({ username: "admin", isAdmin: true, id: testUserIds[2] });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  u1Token,
  u2Token,
  adminToken,
};