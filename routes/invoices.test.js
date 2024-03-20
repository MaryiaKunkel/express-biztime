process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const ExpressError = require("../expressError");

let testCompany;
let testInvoice;

beforeEach(async () => {
  const result_comp = await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test_code', 'test_name', 'test_description') RETURNING *"
  );
  testCompany = result_comp.rows[0];

  const result_inv = await db.query(
    "INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('test_code', '100.00', false, null) RETURNING *"
  );
  testInvoice = result_inv.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM invoices`);
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Get a list of invoices", async () => {
    const res = await request(app).get(`/invoices`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          id: res.body.invoices[0].id,
          comp_code: "test_code",
        },
      ],
    });
  });
});

describe("GET /invoices/:id", () => {
  test("Get a list of 1 invoice", async () => {
    const res = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(res.statusCode).toBe(200);
    console.log(res.body.invoices.add_date);
    expect(res.body).toEqual({
      invoices: {
        id: testInvoice.id,
        comp_code: "test_code",
        amt: 100.0,
        paid: false,
        add_date: res.body.invoices.add_date,
        paid_date: null,
      },
    });
  });
});

describe("POST /invoices", () => {
  test("Create a single invoice", async () => {
    const res = await request(app).post("/invoices").send({
      comp_code: "test_code",
      amt: "150.00",
    });
    expect(res.statusCode).toBe(201);
    console.log(res.body);
    expect(res.body).toEqual([
      {
        id: expect.any(Number),
        comp_code: "test_code",
        amt: 150.0,
        paid: false,
        add_date: "2024-03-20T05:00:00.000Z",
        paid_date: null,
      },
    ]);
  });
});

describe("PUT /invoices/:id", () => {
  test("Update a single invoice", async () => {
    const res = await request(app).put(`/invoices/${testInvoice.id}`).send({
      amt: 200.0,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: testInvoice.id,
      comp_code: "test_code",
      amt: 200.0,
      paid: false,
      add_date: "2024-03-20T05:00:00.000Z",
      paid_date: null,
    });
  });

  test("Responds with 404 for invalid invoice", async () => {
    const res = await request(app).put(`/invoices/0`).send({
      id: 0,
      atm: 200.0,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Delete a single invoice", async () => {
    const res = await request(app).delete(`/invoices/${testInvoice.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });
});
