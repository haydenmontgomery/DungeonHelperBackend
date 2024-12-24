"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const db = require("../db");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}


/** Middleware to use when they be logged in as an admin user.
 *
 *  If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  username provided as route param.
 *
 *  If not, raises Unauthorized.
 */

function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.username === req.params.username))) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  user id of characters.user_id or admin provided as route param.
 *
 *  If not, raises Unauthorized.
 */

async function ensureCharacterOwnerOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();

    const correctUserRes = await db.query(
      `SELECT user_id
       FROM characters
       WHERE id = $1`,
       [req.params.id]
    );
    const correctUser = correctUserRes.rows[0];
    if (user.id === correctUser.user_id) return next();
    if (res.locals.user.isAdmin) return next();

    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  username or dungeonMaster provided as route param.
 *
 *  If not, raises Unauthorized.
 */

async function ensureCorrectUserOrDungeonMaster(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();
    
    const correctUserRes = await db.query(
      `SELECT user_id
       FROM characters
       WHERE id = $1`,
       [req.params.id]
    );
    const correctUser = correctUserRes.rows[0];
    if (user.id === correctUser) return next();
    
    if (res.locals.user.isAdmin) return next();

    const sessionId = req.params.sessionId;
    const result = await db.query(
      `SELECT dungeon_master_id
      FROM sessions
      WHERE id = $1
      AND dungeon_master_id = $2`,
      [sessionId, user.id]
    );

    const dungeonMasterId = result.rows[0];
    if (!dungeonMasterId) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must provide a valid token & be user matching
 *  an admin of campaign provided as route param.
 *
 *  If not, raises Unauthorized.
 */

async function ensureCampaignAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();

    if (res.locals.user.isAdmin) return next();
    
    const campaignId = req.params.campaignId;
    const result = await db.query(
      `SELECT user_id
      FROM campaign_admins
      WHERE campaign_id = $1
      AND user_id = $2`,
      [campaignId, user.id]
    );

    const adminId = result.rows[0];
    if (!adminId) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
/** Middleware to use when they must provide a valid token & be user matching
 *  campaign_uers or admin of campaign provided as route param.
 *
 *  If not, raises Unauthorized.
 */

async function ensureCampaignUserOrCampaignAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!user) throw new UnauthorizedError();

    if (res.locals.user.isAdmin) return next();

    const campaignId = req.params.campaignId;
    
    const userResult = await db.query(
      `SELECT u.id AS user_id
       FROM campaign_users cu
       JOIN characters ch ON cu.character_id = ch.id
       JOIN users u ON ch.user_id = u.id
       WHERE ch.user_id = $1
       AND cu.campaign_id = $2`,
      [user.id, campaignId]);

    const validUser = userResult.rows[0];

    const adminResult = await db.query(
      `SELECT user_id
      FROM campaign_admins
      WHERE campaign_id = $1
      AND user_id = $2`,
      [campaignId, user.id]
    );

    const adminId = adminResult.rows[0];
    if (!(adminId || validUser)) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}



module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
  ensureCharacterOwnerOrAdmin,
  ensureCorrectUserOrDungeonMaster,
  ensureCampaignAdmin,
  ensureCampaignUserOrCampaignAdmin,
};
