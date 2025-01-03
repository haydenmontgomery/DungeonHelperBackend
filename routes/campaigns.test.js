"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /campaigns */

describe("POST /campaigns/create", function () {
  const newCampaign = {
    title: "New",
    description: "New Description",
    maxPlayers: 3,
    publicView: false,
    username: 'u1',
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/campaigns/create")
        .send(newCampaign)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      campaign: {
      title: "New",
      id: expect.any(Number),
      description: "New Description",
      maxPlayers: 3,
      publicView: false,
      startDate: expect.any(String),
    }});
  });

  test("works for non-admin", async function () {
    const resp = await request(app)
        .post("/campaigns/create")
        .send(newCampaign)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/campaigns/create")
        .send({
          description: "new description",
          maxPlayers: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/campaigns/create")
        .send({
          ...newCampaign,
          maxPlayers: "not-a-number",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /campaigns */

describe("GET /campaigns", function () {
  test("ok for anon", async function () {
    const titleSearch = ""
    const resp = await request(app).get("/campaigns").query({titleSearch});
    expect(resp.body).toEqual({
      campaigns:
          [
            {
              title: "C1",
              description: "C1Desc",
              maxPlayers: 3,
              startDate: expect.any(String),
            },
            {
              title: "C2",
              description: "C2Desc",
              maxPlayers: 3,
              startDate: expect.any(String),
            },
            {
              title: "C3",
              description: "C3Desc",
              maxPlayers: 1,
              startDate: expect.any(String),
            },
          ],
    });
  });

  test("works: filtering", async function () {
    const titleSearch = "C3"
    const resp = await request(app)
        .get("/campaigns")
        .query({titleSearch: "C3"});
    expect(resp.body).toEqual({
      campaigns: [
        {
          title: "C3",
          description: "C3Desc",
          maxPlayers: 1,
          startDate: expect.any(String),
        },
      ],
    });
  });
});

/************************************** GET /campaigns/:handle */

describe("GET /campaigns/:title", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/campaigns/C1`);
    expect(resp.body).toEqual({ 
      campaign: {
        admins: [
            {
              admin_id: testUserIds[0],
              username: "u1",
            },
          ],
      characters: [],
      title: "C1",
      description: "C1Desc",
      maxPlayers: 3,
      startDate: expect.any(String),
      },
    });
  });

  test("not found for no such campaign", async function () {
    const resp = await request(app).get(`/campaigns/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});