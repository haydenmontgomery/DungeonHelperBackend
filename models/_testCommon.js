const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testCharacterIds = [];
const testCampaignIds = [];
const testUserIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM campaigns");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query("DELETE FROM characters");

  const testCampaigns = await db.query(`
    INSERT INTO campaigns (title, description, max_players, public_view)
    VALUES ('C1', 'C1Desc', 3, 't'),
           ('C2', 'C2Desc', 3, 't'),
           ('C3', 'C3Desc', 1, 't')
    RETURNING id`);

  testCampaignIds.splice(0, 0, ...testCampaigns.rows.map(ca => ca.id))

  const testUsers = await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING id`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);

  testUserIds.splice(0, 0, ...testUsers.rows.map(u => u.id))

  const testCharacters = await db.query(`
    INSERT INTO characters (name, class_name, bio, age, height, level, gold, hp, user_id)
    VALUES ('testName1', 'testClass1', 'testBio1', 99, '6', 20, 99, 10, $1),
           ('testName2', 'testClass2', 'testBio2', 99, '6', 20, 99, 10, $2),
           ('testName3', 'testClass2', 'testBio3', 99, '6', 20, 99, 10, $2)
    RETURNING id`,
    [testUserIds[0], testUserIds[1]]);
  testCharacterIds.splice(0, 0, ...testCharacters.rows.map(ch => ch.id));

  await db.query(`
        INSERT INTO campaign_admins(campaign_id, user_id)
        VALUES ($1, $2),
               ($3, $4)`,
      [testCampaignIds[0], testUserIds[0], testCampaignIds[1], testUserIds[1]]);
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


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testCharacterIds,
  testCampaignIds
};