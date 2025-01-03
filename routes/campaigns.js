"use strict";

/** Routes for campaigns. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureCampaignAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Campaign = require("../models/campaign");

const campaignNewSchema = require("../schemas/campaignNew.json");
const campaignUpdateSchema = require("../schemas/campaignUpdate.json");
const campaignSearchSchema = require("../schemas/campaignSearch.json");

const router = new express.Router();


/** POST / { campaign } =>  { campaign }
 *
 * campaign should be { title, description, max_players, publicView }
 *
 * Returns { title, description, start_date, max_players, publicView }
 *
 * Authorization required: admin, or logged in
 */

router.post("/create", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, campaignNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const campaign = await Campaign.create(req.body);
    return res.status(201).json({ campaign });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { campaigns: [ { title, description, start_date, max_players, publicView }, ...] }
 *
 * Can filter on provided search filters:
 * - maxPlayersSearch
 * - titleLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as ints
  if (q.maxPlayersSearch !== undefined) q.maxPlayersSearch = +q.maxPlayersSearch;

  try {
    const validator = jsonschema.validate(q, campaignSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const campaigns = await Campaign.findAll(q);
    return res.json({ campaigns });
  } catch (err) {
    return next(err);
  }
});

/** GET /[title]  =>  { campaign }
 *
 *  Campaign is { title, description, start_date, max_players, publicView, characters }
 *   where characters are [{ id, name, className, level }, ...]
 *
 * Authorization required: none
 */

router.get("/:title", async function (req, res, next) {
  try {
    const campaign = await Campaign.get(req.params.title);
    return res.json({ campaign });
  } catch (err) {
    return next(err);
  }
});

/** GET /[userId]  =>  { campaigns }
 *
 *  Campaign is { title, description, start_date, max_players, publicView }
 *
 * Authorization required: logged in
 */

router.get("/user/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const campaigns = await Campaign.findAllForUser(req.params.id);
    return res.json({ campaigns });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[title] { fld1, fld2, ... } => { campaign }
 *
 * Patches campaign data.
 *
 * fields can be: { title, description, maxPlayers, publicView }
 *
 * Returns { title, description, maxPlayers, publicView }
 *
 * Authorization required: admin, campaign admin
 */

router.patch("/:title", ensureCampaignAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, campaignUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const campaign = await Campaign.update(req.params.title, req.body);
    return res.json({ campaign });
  } catch (err) {
    return next(err);
  }
});


/** POST /[title]/admins/[username] { campaign }
 *
 * Posts to campaign_admins data.
 *
 * Returns {}
 *
 * Authorization required: admin, campaign admin
 */

router.post("/:title/admins/:username", ensureCampaignAdmin, async function (req, res, next) {
  try {
    const result = await Campaign.addAdmins(req.params.title, req.params.username);
    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});

/** POST /[title] { campaign }
 *
 * Posts to campaign_users, adding character data.
 *
 * Returns {}
 *
 * Authorization required: admin, campaign admin
 */

router.post("/:title/:username/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const result = await Campaign.addUsers(req.params.title, req.params.id, req.params.username);
    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[title]  =>  { deleted: title }
 *
 * Authorization: campaignadmin
 */

router.delete("/:title", ensureCampaignAdmin, async function (req, res, next) {
  try {
    await Campaign.remove(req.params.title);
    return res.json({ deleted: req.params.title });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
