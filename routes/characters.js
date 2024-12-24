"use strict";

/** Routes for characters. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureCharacterOwnerOrAdmin } = require("../middleware/auth");
const Character = require("../models/character");

const characterNewSchema = require("../schemas/characterNew.json");
const characterUpdateSchema = require("../schemas/characterUpdate.json");

const router = new express.Router();


/** POST / { character } =>  { character }
 *
 * character should be { name, className, bio, age, height, level, gold, hp, profileUrl }
 *
 * Returns { id,  name, className, bio, age, height, level, inventory, gold, hp, profileUrl }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, characterNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const character = await Character.create(req.body);
    return res.status(201).json({ character });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { character }
 *
 *  Character is { id, name, className, bio, age, height, level, gold, hp, profileUrl }
 *
 * Authorization required: owner of character or admin.
 */

router.get("/:id", ensureCharacterOwnerOrAdmin, async function (req, res, next) {
  try {
    const character = await Character.get(req.params.id);
    return res.json({ character });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>  { characters }
 *
 *  Character is { id, name, className, bio, age, height, level, gold, hp, profileUrl }
 *
 * Authorization required: owner of character or admin.
 */

router.get("/user/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const characters = await Character.getAll(req.params.id);
    return res.json({ characters });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { character }
 *
 * Patches character data.
 *
 * fields can be: { name, className, bio, age, height, level, gold, hp, profileUrl, userId }
 *
 * Returns { id, name, className, bio, age, height, level, inventory, gold, hp, profileUrl, userId }
 *
 * Authorization required: admin, character admin
 */

router.patch("/:id", ensureCharacterOwnerOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, characterUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const character = await Character.update(req.params.id, req.body);
    return res.json({ character });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { character }
 *
 * Patches character data.
 *
 * fields can be: { inventory }
 *  inventory is an array of "items" each with a name, quantity, type and value.
 * Returns { id, name, className, bio, age, height, level, inventory, gold, hp, profileUrl, userId }
 *
 * Authorization required: admin, character admin
 */

router.patch("/:id/inventory", ensureCharacterOwnerOrAdmin, async function (req, res, next) {
  try {
    /* const validator = jsonschema.validate(req.body, characterUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    } */

    const character = await Character.updateInventory(req.params.id, req.body);
    return res.json({ character });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: correct user or admin
 */

router.delete("/:id", ensureCharacterOwnerOrAdmin, async function (req, res, next) {
  try {
    console.log("********************************")
    console.log("HERE WE ARE")
    console.log("********************************")
    await Character.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
