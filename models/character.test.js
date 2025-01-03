"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Character = require("./character.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testCharacterIds,
  testCampaignIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCharacter = {
    name: "New",
    className: "New Class",
    bio: "New Bio",
    age: 99,
    height: '6',
    level: 20,
    inventory: [],
    gold: 50,
    hp: 20,
    profileUrl: "/static/images/default_profile.png",
    userId: testUserIds[0],
  };

  test("works", async function () {
    let character = await Character.create(newCharacter);

    expect(character).toEqual(
      {
        id: expect.any(Number),
        name: "New",
        className: "New Class",
        bio: "New Bio",
        age: 99,
        height: '6',
        level: 20,
        gold: 50,
        hp: 20,
        profileUrl: "/static/images/default_profile.png",
        userId: null,
      },
    );
  });
});

/************************************** findOne */

describe("findOne", function () {
  test("works find", async function () {
    let character = await Character.get(testCharacterIds[0]);
    expect(character).toEqual(
      {
        name: "testName1",
        className: "testClass1",
        bio: "testBio1",
        age: 99,
        height: '6',
        level: 20,
        inventory: null,
        gold: 99,
        hp: 10,
        profileUrl: "/static/images/default_profile.png",
        userId: testUserIds[0],
      },
    );
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Character.remove(testCharacterIds[0], "u1");
    const res = await db.query(
        `SELECT id FROM characters WHERE id=${testCharacterIds[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such character", async function () {
    try {
      await Character.remove(0, "u1");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
