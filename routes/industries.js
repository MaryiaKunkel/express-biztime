// industries.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const slugifiedCode = slugify(code);
    const slugifiedIndustry = slugify(industry);
    const results = await db.query(
      "INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry",
      [slugifiedCode, slugifiedIndustry]
    );
    return res.status(201).json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`
    SELECT * FROM industries 
    LEFT JOIN comp_ind
    ON comp_ind.ind_code=industries.code
    LEFT JOIN companies
    ON comp_ind.comp_code=companies.code
    `);
    const industries = results.rows.map((row) => ({
      code: row.comp_code,
      industry: row.industry,
    }));
    return res.json({ industries });
  } catch (e) {
    return next(e);
  }
});

router.post("/:comp_ind", async (req, res, next) => {
  try {
    const { comp_code, ind_code } = req.body;
    const [compResults, indResults] = await Promise.all([
      db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code]),
      db.query(`SELECT * FROM industries WHERE code=$1`, [ind_code]),
    ]);
    const compCode = compResults.rows[0].code;
    const indCode = indResults.rows[0].code;
    const results = await db.query(
      "INSERT INTO comp_ind (comp_code, ind_code) VALUES ($1, $2) RETURNING *",
      [compCode, indCode]
    );
    return res.status(201).json(results.rows);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
