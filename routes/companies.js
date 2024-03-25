// companies.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

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

// router.get("/:code", async (req, res, next) => {
//   const code = req.params.code;
//   try {
//     const results = await db.query(
//       `SELECT * FROM companies  LEFT JOIN invoices ON companies.code=invoices.comp_code WHERE code=$1`,
//       [code]
//     );
//     if (results.rows.length === 0) {
//       return res.status(404).json({ error: "Company not found" });
//     }
//     const { companyCode, name, description } = results.rows[0];
//     const invoiceIds = results.rows
//       .map((row) => row.id)
//       .filter((id) => id !== null);
//     const company = {
//       companyCode,
//       name,
//       description,
//       invoices: invoiceIds,
//     };

//     return res.json({ company });
//   } catch (e) {
//     return next(e);
//   }
// });

router.get("/:code", async (req, res, next) => {
  const code = req.params.code;
  try {
    const compPromise = db.query(
      `SELECT * FROM companies 
    LEFT JOIN comp_ind
    ON comp_ind.comp_code=companies.code
    LEFT JOIN industries
    ON industries.code=comp_ind.ind_code
    WHERE companies.code=$1`,
      [code]
    );

    const invPromise = db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [
      code,
    ]);

    const [compResults, invResults] = await Promise.all([
      compPromise,
      invPromise,
    ]);

    if (compResults.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = compResults.rows[0];
    company.invoices = invResults.rows.map((row) => row.id);
    return res.json({ company });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const slugifiedCode = slugify(code);
    const slugifiedName = slugify(name);
    const slugifiedDescription = slugify(description);
    const results = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [slugifiedCode, slugifiedName, slugifiedDescription]
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
