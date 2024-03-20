// companies.js

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    const companies = results.rows.map((row) => ({
      code: row.code,
      name: row.name,
    }));
    return res.json({ companies });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  const code = req.params.code;
  try {
    const results = await db.query(
      `SELECT * FROM companies  LEFT JOIN invoices ON companies.code=invoices.comp_code WHERE code=$1`,
      [code]
    );
    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    const { companyCode, name, description } = results.rows[0];
    const invoiceIds = results.rows
      .map((row) => row.id)
      .filter((id) => id !== null);
    const company = {
      companyCode,
      name,
      description,
      invoices: invoiceIds,
    };

    return res.json({ company });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { code } = req.params;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    return res.json(results.rows[0]);
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query("DELETE FROM companies WHERE code=$1", [
      code,
    ]);
    if (results.rowCount === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
