const request = require("supertest");

jest.mock("../src/modules/posts/post.service", () => ({
  getAllPosts: jest.fn(async () => [{ id: "1", title: "A", content: "B", author: "C" }]),
  getPostById: jest.fn(async (id) =>
    id === "404" ? null : { id, title: "T", content: "C", author: "A" }
  ),
  createPost: jest.fn(async (data) => ({ id: "new", ...data })),
  updatePost: jest.fn(async (id, data) => ({ id, ...data })),
  deletePost: jest.fn(async (id) => id !== "999999"),
  searchPosts: jest.fn(async (term) => [{ id: "s1", title: `match ${term}`, content: "x", author: "y" }]),
}));

const app = require("../src/app");

describe("Posts API - access control + validations", () => {
  it("GET /health should return ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /posts should return 200 with list", async () => {
    const res = await request(app).get("/posts");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /posts/:id should return 200 when found", async () => {
    const res = await request(app).get("/posts/123");
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe("123");
  });

  it("GET /posts/:id should return 404 when not found", async () => {
    const res = await request(app).get("/posts/404");
    expect(res.statusCode).toBe(404);
  });

  it("GET /posts/search without term should return 400", async () => {
    const res = await request(app).get("/posts/search");
    expect(res.statusCode).toBe(400);
  });

  it("GET /posts/search with term should return 200 and list", async () => {
    const res = await request(app).get("/posts/search?term=match");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /posts without teacher header should return 403", async () => {
    const res = await request(app).post("/posts").send({
      title: "t",
      content: "c",
      author: "a",
    });
    expect(res.statusCode).toBe(403);
  });

  it("POST /posts with teacher header but invalid body should return 400", async () => {
    const res = await request(app)
      .post("/posts")
      .set("x-user-type", "teacher")
      .send({}); // inválido
    expect(res.statusCode).toBe(400);
  });

  it("POST /posts with teacher header should return 201", async () => {
    const res = await request(app)
      .post("/posts")
      .set("x-user-type", "teacher")
      .send({ title: "Ok", content: "Body", author: "Prof" });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe("new");
  });

  it("PUT /posts/:id without teacher header should return 403", async () => {
    const res = await request(app).put("/posts/1").send({ title: "x" });
    expect(res.statusCode).toBe(403);
  });

  it("PUT /posts/:id with teacher header should return 200", async () => {
    const res = await request(app)
      .put("/posts/1")
      .set("x-user-type", "teacher")
      .send({ title: "Updated" });

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe("1");
  });

  it("DELETE /posts/:id without teacher header should return 403", async () => {
    const res = await request(app).delete("/posts/1");
    expect(res.statusCode).toBe(403);
  });

  it("DELETE /posts/:id with teacher header and non-existing id should return 404", async () => {
  const res = await request(app)
    .delete("/posts/999999")
    .set("x-user-type", "teacher");

  expect(res.statusCode).toBe(404);
  });
});

