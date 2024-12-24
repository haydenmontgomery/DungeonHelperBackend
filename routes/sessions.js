"use strict";

/** Routes for sessions. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureCorrectUserOrDungeonMaster, ensureLoggedIn, ensureCampaignAdmin, ensureCampaignUserOrCampaignAdmin } = require("../middleware/auth");
const Session = require("../models/session");

const sessionNewSchema = require("../schemas/sessionNew.json");
const sessionUpdateSchema = require("../schemas/sessionUpdate.json");
const sessionPlayersAddSchema = require("../schemas/sessionPlayersAdd.json");

const router = new express.Router();


/** POST / { session } =>  { session }
 *
 * session should be { name, password, description, campaignId, dungeonMasterId }
 *
 * Returns { name, description, createdAt, expiresAt, campaignId, dungeonMasterId }
 *
 * Authorization required: admin, campaignAdmin
 */

router.post("/", ensureLoggedIn, ensureCampaignAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, sessionNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const session = await Session.create(req.body);
    return res.status(201).json({ session });
  } catch (err) {
    return next(err);
  }
});

/** GET /[name]  =>  { session }
 *
 *  Session is { name, description, createdAt, expiresAt, campaignId, dungeonMasterId, characters }
 *   where characters are [{ id, name, className, level }, ...]
 *
 * Authorization required: campaignAdmin or campaignUser
 */

router.get("/:name", ensureCampaignUserOrCampaignAdmin, async function (req, res, next) {
  try {
    const session = await Session.get(req.params.name);
    return res.json({ session });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[name]
 *
 * Patches session data.
 *
 * fields can be: { password, description, expiresAt }
 *
 * Returns { name, description, createdAt, expiresAt, dungeonMasterId }
 *
 * Authorization required: admin, session admin
 */

router.patch("/:name", ensureCampaignAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, sessionUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const session = await Session.update(req.params.name, req.body);
    return res.json({ session });
  } catch (err) {
    return next(err);
  }
});

/** Post /[name]/[characterId]
 *
 * Posts session_players data.
 *
 * fields can be: { password, sessionId }
 *
 * Returns { name, description, createdAt, expiresAt }
 *
 * Authorization required: admin, session admin
 */

router.post("/:name/:id", ensureCampaignAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, sessionPlayersAddSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const session = await Session.addCharacters(req.params.name, req.params.id, req.body);
    return res.json({ session });
  } catch (err) {
    return next(err);
  }
});

/** Post /[name]/[characterId]
 *
 * Posts session_players data.
 *
 * fields can be: { password, sessionId }
 *
 * Returns { name, description, createdAt, expiresAt }
 *
 * Authorization required: admin, session admin
 */

router.delete("/:name/:id", ensureCorrectUserOrDungeonMaster, async function (req, res, next) {
  try {
    await Session.removeCharacters(req.params.name, req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[name]  =>  { deleted: name }
 *
 * Authorization: campaignadmin
 */

router.delete("/:name", ensureCampaignAdmin, async function (req, res, next) {
  try {
    await Session.remove(req.params.name);
    return res.json({ deleted: req.params.name });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
