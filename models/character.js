"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for characters. */

class Character {
  /** Create a character (from data), update db, return new character data.
   *
   * data should be { name, className, bio, age, height, level, gold, hp, profileUrl }
   *
   * Returns { id, name, className, bio, age, height, level, gold, hp, profileUrl, userId }
   *
   * Throws BadRequestError if character already created from same user.
   * */

  static async create({ name, className, bio, age, height, level, gold, hp, profileUrl, userId }, creatorId) {
    const duplicateCheck = await db.query(
          `SELECT name
           FROM characters
           WHERE name = $1
           AND user_id = $2`,
        [name, creatorId]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate character: ${name}`);

    const result = await db.query(
          `INSERT INTO characters
           (name, class_name, bio, age, height, level, gold, hp, profile_url, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, name, class_name AS "className", bio, age, height, level, gold, hp, profile_url AS "profileUrl", user_id AS "userId"`,
        [
          name,
          className,
          bio,
          age,
          height,
          level,
          gold,
          hp,
          profileUrl,
          userId
        ],
    );
    const character = result.rows[0];

    return character;
  }

  static async get(id) {
    const characterRes = await db.query(
          `SELECT name, class_name AS "className", bio, age, height, level, inventory, gold, hp, profile_url AS "profileUrl", user_id AS "userId"
           FROM characters
           WHERE id = $1`,
        [id]);

    const character = characterRes.rows[0];

    if (!character) throw new NotFoundError(`No character with that id`);

    return character;
  }

  static async getAll(userId) {
    const characterRes = await db.query(
          `SELECT id, name, class_name AS "className", bio, age, height, level, inventory, gold, hp, profile_url AS "profileUrl", user_id AS "userId"
           FROM characters
           WHERE user_id = $1`,
        [userId]);

    const characters = characterRes.rows;

    if (!characters) throw new NotFoundError(`No characters found`);

    return characters;
  }

  /** Update character data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, className, bio, age, height, level, gold, hp, profileUrl, userId }
   *
   * Returns {id, name, className, bio, age, height, level, inventory, gold, hp, profileUrl, userId}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, name, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          className: "class_name",
          profileUrl: "profile_url", 
          userId: "user_id"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE characters 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, name, class_name AS "className", bio, age, height, level, inventory, gold, hp, profile_url AS "profileUrl", userId AS "user_id"`;
    const result = await db.query(querySql, [...values, id]);
    const character = result.rows[0];

    if (!character) throw new NotFoundError(`No character: ${name}`);

    return character;
  }

    /** Update character inventory with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {inventory}
   * Inventory is an array of items.
   *
   * Returns {id, name, className, bio, age, height, level, inventory, gold, hp, profileUrl, userId }
   *
   * Throws NotFoundError if not found.
   */

    static async updateInventory(id, data) {
      console.log("*******************")
      console.log(data);
      console.log("*******************")

      const result = await db.query(`UPDATE characters 
                        SET inventory = $1
                        WHERE id = $2
                        RETURNING id, name, class_name AS "className", bio, age, height, level, inventory, gold, hp, profile_url AS "profileUrl", user_id AS "userId"`,
                        [data, id]);

      const character = result.rows[0];
  
      if (!character) throw new NotFoundError(`No character with that id`);
  
      return character;
    }


  /** Delete given character from database; returns undefined.
   *
   * Throws NotFoundError if character not found.
   **/

  static async remove(id, name) {
    const result = await db.query(
          `DELETE
           FROM characters
           WHERE id = $1
           RETURNING name`,
        [id]);
    const character = result.rows[0];

    if (!character) throw new NotFoundError(`No character: ${name}`);
  }
}

module.exports = Character;