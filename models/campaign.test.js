"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Campaign = require("./campaign.js");
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
  const newCampaign = {
    title: "New",
    description: "New Description",
    maxPlayers: 3,
    publicView: false,
    username: 'u1',
  };

  test("works", async function () {
    let campaign = await Campaign.create(newCampaign);

    expect(campaign).toEqual(
      {
        id: campaign.id,
        title: "New",
        description: "New Description",
        startDate: expect.any(Object),
        maxPlayers: 3,
        publicView: false,
      },
    );

    const result = await db.query(
          `SELECT title, description, max_players, public_view
           FROM campaigns
           WHERE title = 'New'`);
    expect(result.rows).toEqual([
      {
        title: "New",
        description: "New Description",
        max_players: 3,
        public_view: false,
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Campaign.create(newCampaign);
      await Campaign.create(newCampaign);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  const titleSearch = ""
  test("works: all", async function () {
    let campaigns = await Campaign.findAll({titleSearch});
    expect(campaigns).toEqual([
      {
        title: "C1",
        description: "C1Desc",
        maxPlayers: 3,
        startDate: expect.any(Object),
      },
      {
        title: "C2",
        description: "C2Desc",
        maxPlayers: 3,
        startDate: expect.any(Object),
      },
      {
        title: "C3",
        description: "C3Desc",
        maxPlayers: 1,
        startDate: expect.any(Object),
      },
    ]);
  });

  test("works: by title search", async function () {
    const titleSearch = "C1"
    let campaigns = await Campaign.findAll({titleSearch});
    expect(campaigns).toEqual([
      {
        title: "C1",
        description: "C1Desc",
        maxPlayers: 3,
        startDate: expect.any(Object),
      },
    ]);
  });

  test("works: empty list on nothing found", async function () {
    const titleSearch = "nope"
    let campaigns = await Campaign.findAll({titleSearch});
    expect(campaigns).toEqual([]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let campaign = await Campaign.get("C1");
    expect(campaign.title).toEqual("C1");
  });

  test("not found if no such campaign", async function () {
    try {
      await Campaign.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

/* describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let campaign = await Campaign.update("c1", updateData);
    expect(campaign).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM campaigns
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let campaign = await Campaign.update("c1", updateDataSetNulls);
    expect(campaign).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM campaigns
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such campaign", async function () {
    try {
      await Campaign.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Campaign.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
}); */

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Campaign.remove("C1");
    const res = await db.query(
        "SELECT title FROM campaigns WHERE title='C1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such campaign", async function () {
    try {
      await Campaign.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
