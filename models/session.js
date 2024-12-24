"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for sessions. */

class Session {
  /** Create a session (from data), update db, return new session data.
   *
   * data should be { name, password, description, campaignId, dungeonMasterId }
   *
   * Returns { name, description, createdAt, expiresAt, campaignId, dungeonMasterId }
   *
   * Throws BadRequestError if session already in database.
   * */

  static async create({ name, password, description, campaignId, dungeonMasterId }) {
    const duplicateCheck = await db.query(
          `SELECT name
           FROM sessions
           WHERE name = $1`,
        [name]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate session: ${name}`);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO session
           (name, password, description, expires_at, campaign_id, dungeon_master_id)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '4 hours' , $4, $5)
           RETURNING name, description, created_at AS "createdAt", expires_at AS "expiresAt", campaign_id AS "campaignId", dungeon_master_id AS "dungeonMasterId"`,
        [
          name,
          hashedPassword,
          description,
          campaignId,
          dungeonMasterId
        ],
    );

    const session = result.rows[0];

    return session;
  }

  /** Given a session name, return data about session.
   *
   * Returns { name, description, createdAt, expires_at, dungeon_master_id }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(name) {
    const sessionRes = await db.query(
          `SELECT name,
                  description,
                  created_at AS "createdAt",
                  expires_at AS "expiresAt",
                  dungeon_master_id AS "dungeonMasterId"
           FROM sessions
           WHERE name = $1`,
        [name]);

    const session = sessionRes.rows[0];

    if (!session) throw new NotFoundError(`No session: ${name}`);

    const dungeonMasterRes = await db.query(
          `SELECT u.username
           FROM users As u
           WHERE u.id = $1`,
        [session.dungeonMasterId],
    );

    session.dm = dungeonMasterRes.rows[0];

    return session;
  }

  /** Update session data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {description, expires_at}
   *
   * Returns { name, description, createdAt, expires_at, dungeon_master_id }
   *
   * Throws NotFoundError if not found.
   */

  static async update(name, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          expiresAt: "expires_at"
        });
    const nameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE sessions 
                      SET ${setCols} 
                      WHERE name = ${nameVarIdx} 
                      RETURNING name, 
                                description,
                                created_at AS "createdAt",
                                expires_at AS "expiresAt",
                                dungeon_master_id AS "dungeonMasterId"`;
    const result = await db.query(querySql, [...values, name]);
    const session = result.rows[0];

    if (!session) throw new NotFoundError(`No session: ${name}`);

    return session;
  }

  /** Add characters to a session
   * data should be {name, password, session_id, character_id}
   * 
   **/
  static async addCharacters(name, characterId, data) {
    //get sessionId from name
    const sessionIdRes = await db.query(
      `SELECT id
       FROM sessions
       WHERE name = $1`,
       [name]
    );
    const sessionId = sessionIdRes.rows[0];
    
    //Make sure a character is not already in the session.
    const precheckCharacter = await db.query(
          `SELECT ch.id AS char_id
           FROM session_players sp
           JOIN sessions s ON sp.session_id = s.id
           JOIN characters ch ON sp.character_id = ch.id
           WHERE ch.id = $1
           AND s.id = $2`, [characterId, sessionId]);

    const charId = precheckCharacter.rows[0];
    if(charId) throw new NotFoundError(`Character already in session`);

    const result = await db.query(
          `SELECT name,
                  password,
                  description,
                  created_at AS "createdAt",
                  expires_at AS "expiresAt",
           FROM sessions
           WHERE name = $1`,
          [name]);

    const session = result.rows[0];

    if (session) {
      const isValid = await bcrypt.compare(data.password, session.password);
      if (isValid === true) {
        await db.query(
          `INSERT INTO session_players (session_id, character_id)
           VALUES ($1, $2)`,
           [sessionId, charId]);
        delete session.password;
        return session;    
      }
    }

    throw new UnauthorizedError("Invalid session name/password");
    /* const precheck2Character = await db.query(
      `SELECT user_id
       FROM characters
       WHERE id = $1
       AND user_id = $2`, [characterId, charId]);

    const correctUser = precheck2Character.rows[0];
    if(!correctUser) throw new UnauthorizedError('Only the owner of the character can add them to session'); */
  }

  /**
   * Remove a character from the session.
   * data should be {name, character_id}
   * 
   */
  static async removeCharacters(name, characterId) {
    //get sessionId from name
    const sessionIdRes = await db.query(
          `SELECT id
           FROM sessions
           WHERE name = $1`,
           [name]
    );
    const sessionId = sessionIdRes.rows[0];

    //Make sure a character is in the session
    const precheckCharacter = await db.query(
          `SELECT ch.id AS char_id
           FROM session_players sp
           JOIN sessions s ON sp.session_id = s.id
           JOIN characters ch ON sp.character_id = ch.id
           WHERE ch.id = $1
           AND s.id = $2`, [characterId, sessionId]);

    const charId = precheckCharacter.rows[0];
    if(!charId) throw new NotFoundError(`No character like that in session`);

    const result = await db.query(
          `SELECT name,
                  password,
                  description,
                  created_at AS "createdAt",
                  expires_at AS "expiresAt",
           FROM sessions
           WHERE name = $1`,
          [name]);

    const session = result.rows[0];

    if (session) {
      const isValid = await bcrypt.compare(password, session.password);
      if (isValid === true) {
        await db.query(
          `DELETE
           FROM session_players
           WHERE session_id = $1
           AND character_id = $2`,
           [sessionId, charId]);
        delete session.password;
        return session;    
      }
    }

    throw new UnauthorizedError("Invalid session name/password");
  }

  /** Delete given session from database; returns undefined.
   *
   * Throws NotFoundError if session not found.
   **/

  static async remove(name) {
    const result = await db.query(
          `DELETE
           FROM sessions
           WHERE name = $1
           RETURNING name`,
        [name]);
    const session = result.rows[0];

    if (!session) throw new NotFoundError(`No session: ${name}`);
  }
}

module.exports = Session;