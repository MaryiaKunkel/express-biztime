process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const ExpressError = require("../expressError");

let testCompany;

beforeEach(async () => {
  const result = await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test_code', 'test_name', 'test_description') RETURNING *"
  );
  testCompany = result.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Get a list of 1 company", async () => {
    const res = await request(app).get(`/companies`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [
        {
          code: "test_code",
          name: "test_name",
        },
      ],
    });
  });
});

describe("GET /companies/:code", () => {
  test("Get a single company", async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    console.log("testCompany.code is ", testCompany.code);
    const insertedInvoices = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ('${testCompany.code}', 100.00), ('${testCompany.code}', 150.00), ('${testCompany.code}', 200.00) RETURNING *`
    );
    expect(res.statusCode).toBe(200);

    console.log(
      "insertedInvoices:",
      insertedInvoices.rows.map((row) => row.id)
    );

    console.log("res.body:", res.body);

    expect(res.body).toEqual({
      company: {
        name: "test_name",
        description: "test_description",
        invoices: insertedInvoices.rows.map((row) => row.id),
      },
    });
  });

  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /", () => {
  test("Post a company", async () => {});
});
