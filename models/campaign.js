"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for campaigns. */

class Campaign {
  /** Create a campaign (from data), update db, return new campaign data.
   *
   * data should be { title, description, maxPlayers, publicView }
   *
   * Returns { title, description, startDate, maxPlayers, publicView }
   *
   * Throws BadRequestError if campaign already in database.
   * */

  static async create({ title, description, maxPlayers, publicView, username }) {
    const duplicateCheck = await db.query(
          `SELECT title
           FROM campaigns
           WHERE title = $1`,
        [title]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate campaign: ${title}`);

    const result = await db.query(
          `INSERT INTO campaigns
           (title, description, max_players, public_view)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, description, start_date AS "startDate", max_players AS "maxPlayers", public_view AS "publicView"`,
        [
          title,
          description,
          maxPlayers,
          publicView,
        ],
    );
    const campaign = result.rows[0];

    const preCheck = await db.query(
          `SELECT id
           FROM users
           WHERE username = $1`, [username]);
    const user = preCheck.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);
    
    console.log("****************************************")
    console.log(campaign.id, user.id);
    console.log("****************************************")
    

    await db.query(
      `INSERT INTO campaign_admins
       (campaign_id, user_id)
       VALUES ($1, $2)`,
      [campaign.id, user.id]);

    return campaign;
  }

  /** Find all campaigns (optional filter on searchFilters).
   *
   * searchFilters (all optional):
   * - title
   * - maxPlayersSearch
   *
   * Returns [{ title, description, startDate, maxPlayers }, ...]
   * */

  static async findAll(titleSearch) {
    let query;
    if(titleSearch.titleSearch === undefined) {
      query = `SELECT title,
      description,
      start_date AS "startDate",
      max_players AS "maxPlayers"
      FROM campaigns WHERE public_view IS NOT false ORDER BY title`;
    } else {
      query = `SELECT title,
      description,
      start_date AS "startDate",
      max_players AS "maxPlayers"
      FROM campaigns WHERE public_view IS NOT false AND title ILIKE '%${titleSearch.titleSearch}%' ORDER BY title`;
      }

    const campaigns = await db.query(query);
    return campaigns.rows;
  }

  /** Find all campaigns by user if admin.
   *
   * Returns [{ title, description, startDate, maxPlayers }, ...]
   * */

  static async findAllForUser(userId) {
    const campaignRes = await db.query(
          `SELECT c.title AS "title", c.description AS "description", c.max_players AS "maxPlayers", c.start_date AS "startDate"
            FROM campaign_admins ca
            JOIN campaigns c on ca.campaign_id = c.id
            JOIN users u ON ca.user_id = u.id
            WHERE u.id = $1`,
            [userId]
    )

    return campaignRes.rows;
  }

  /** Given a campaign title, return data about campaign.
   *
   * Returns { title, description, maxPlayers,}
   *
   * Throws NotFoundError if not found.
   **/

  static async get(title) {
    const campaignRes = await db.query(
          `SELECT title,
                  description,
                  max_players AS "maxPlayers",
                  start_date AS "startDate"
           FROM campaigns
           WHERE title = $1
           AND public_view IS NOT false`,
        [title]);

    const campaign = campaignRes.rows[0];

    if (!campaign) throw new NotFoundError(`No campaign: ${title}`);

    const adminRes = await db.query(
          `SELECT u.id AS admin_id, u.username AS username
           FROM campaign_admins ca
           JOIN campaigns c ON ca.campaign_id = c.id
           JOIN users u ON ca.user_id = u.id
           WHERE c.title = $1`,
        [title],
    );

    const charactersRes = await db.query(
          `SELECT ch.id AS id, 
                  ch.name AS name,
                  ch.class_name AS className,
                  ch.bio AS bio,
                  ch.age AS age,
                  ch.height AS height,
                  ch.level AS level,
                  ch.inventory AS inventory,
                  ch.gold AS gold,
                  ch.hp AS hp,
                  ch.profile_url AS profileUrl,
                  ch.user_id AS userId
           FROM campaign_users cu
           JOIN campaigns c ON cu.campaign_id = c.id
           JOIN characters ch ON cu.character_id = ch.id
           WHERE c.title = $1`,
          [title],
    );
    campaign.admins = adminRes.rows;
    campaign.characters = charactersRes.rows;

    return campaign;
  }

  /** Update campaign data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, description, maxPlayers, publicView}
   *
   * Returns {title, description, maxPlayers, publicView}
   *
   * Throws NotFoundError if not found.
   */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          maxPlayers: "max_players"
        });
    const titleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE campaigns 
                      SET ${setCols} 
                      WHERE title = ${titleVarIdx} 
                      RETURNING title, 
                                description, 
                                max_players AS "maxPlayers",
                                public_view AS "publicView"`;
    const result = await db.query(querySql, [...values, title]);
    const campaign = result.rows[0];

    if (!campaign) throw new NotFoundError(`No campaign: ${title}`);

    return campaign;
  }

  /** Add characters to a campaign
   * data should be {campaign_id, character_id}
   * 
   **/
  static async addUsers(campaignTitle, characterId, username) {
    //Make sure a user
    const precheckUser = await db.query(
      `SELECT id
       FROM users
       WHERE username = $1`, [username]);

    const userId = precheckUser.rows[0].id;
    if(!userId) throw new NotFoundError(`No user: ${username}`);

    const precheck2Character = await db.query(
      `SELECT user_id
       FROM characters
       WHERE id = $1
       AND user_id = $2`, [characterId, userId]);

    const correctUser = precheck2Character.rows[0];
    if(!correctUser) throw new UnauthorizedError('Only the owner of the character can add them to campaign');

    const getCampaignId = await db.query(
      `SELECT id
       FROM campaigns
       WHERE title = $1`,
       [campaignTitle]
    );
    
    const campaignId = getCampaignId.rows[0].id;

    const result = await db.query(
          `INSERT INTO campaign_users (campaign_id, character_id)
           VALUES ($1, $2)
           RETURNING campaign_id AS "campaignId",
                     character_id AS "characterId"`,
           [campaignId, characterId]);

    return result;
  }

  /** Add admins to a campaign
   * data should be {campaign_id, user_id}
   * 
   **/
  static async addAdmins(title, username) {
    //Make sure a user
    const precheckUser = await db.query(
      `SELECT id
       FROM users
       WHERE username = $1`, [username]);
    
    //Get campaign id
    const getCampaignId = await db.query(
      `SELECT id
       FROM campaigns
       WHERE title = $1`,
       [title]
    );

    const campaignId = getCampaignId.rows[0];
    if(!campaignId) throw new NotFoundError(`No campaign: ${title}`);
      
    const newAdminId = precheckUser.rows[0];
    if(!newAdminId) throw new NotFoundError(`No user: ${username}`);
    const precheckAdmin = await db.query(
      `SELECT user_id
       FROM campaign_admins
       WHERE user_id = $1
       AND campaign_id = $2`, [userId, campaignId]);

    const adminId = precheckAdmin.rows[0];
    if(!adminId) throw new UnauthorizedError('Only an admin can add admins to the campaign');

    //
    const result = await db.query(
          `INSERT INTO campaign_admins (campaign_id, user_id)
           VALUES ($1, $2)
           RETURNING campaign_id AS "campaignId"
                     user_id AS "userId"`,
           [campaignId, newAdminId]);
    return result;
  }

  /** Delete given campaign from database; returns undefined.
   *
   * Throws NotFoundError if campaign not found.
   **/

  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM campaigns
           WHERE title = $1
           RETURNING title`,
        [title]);
    const campaign = result.rows[0];

    if (!campaign) throw new NotFoundError(`No campaign: ${title}`);
  }
}

module.exports = Campaign;