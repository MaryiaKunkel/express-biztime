// invoices.js

const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    const invoices = results.rows.map((row) => ({
      id: row.id,
      comp_code: row.comp_code,
    }));
    return res.json({ invoices });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const invoices = results.rows[0];
    return res.json({ invoices });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
      [comp_code, amt]
    );
    return res.status(201).json(results.rows);
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { amt } = req.body;
    const { id } = req.params;
    const results = await db.query(
      "UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *",
      [amt, id]
    );
    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    return res.json(results.rows[0]);
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query("DELETE FROM invoices WHERE id=$1", [id]);
    if (results.rowCount === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
