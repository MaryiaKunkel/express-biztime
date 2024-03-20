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

    const invoicesArr = insertedInvoices.rows.map((row) => row.id);
    console.log(invoicesArr);

    console.log("res.body:", res.body);

    expect(res.body).toEqual({
      company: {
        name: "test_name",
        description: "test_description",
        invoices: invoicesArr,
      },
    });
  });

  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /companies", () => {
  test("Create a single company", async () => {
    const res = await request(app).post("/companies").send({
      code: "test_code2",
      name: "test_name2",
      description: "test_description2",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual([
      {
        code: "test_code2",
        name: "test_name2",
        description: "test_description2",
      },
    ]);
  });
});

describe("PUT /companies/:code", () => {
  test("Update a single company", async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({
      code: "test_code",
      name: "test_name_updated",
      description: "test_description_updated",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      code: "test_code",
      name: "test_name_updated",
      description: "test_description_updated",
    });
  });

  test("Responds with 404 for invalid company", async () => {
    const res = await request(app).put(`/companies/0`).send({
      code: "test_code_invalid",
      name: "test_name_updated",
      description: "test_description_updated",
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Delete a single company", async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });
});
