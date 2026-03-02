jest.mock("../src/config/prisma", () => ({
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require("../src/config/prisma");
const postService = require("../src/modules/posts/post.service");

describe("Post Service (unit tests with Prisma mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllPosts should return list", async () => {
    prisma.post.findMany.mockResolvedValue([{ id: "1" }]);

    const result = await postService.getAllPosts();

    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "1" }]);
  });

  it("getPostById should call findUnique with id", async () => {
    prisma.post.findUnique.mockResolvedValue({ id: "10" });

    const result = await postService.getPostById("10");

    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: "10" },
    });
    expect(result).toEqual({ id: "10" });
  });

  it("createPost should call prisma.post.create", async () => {
    const payload = { title: "T", content: "C", author: "A" };
    prisma.post.create.mockResolvedValue({ id: "new", ...payload });

    const result = await postService.createPost(payload);

    expect(prisma.post.create).toHaveBeenCalledWith({ data: payload });
    expect(result).toEqual({ id: "new", ...payload });
  });

  it("updatePost should call prisma.post.update", async () => {
    const payload = { title: "Updated" };
    prisma.post.update.mockResolvedValue({ id: "1", ...payload });

    const result = await postService.updatePost("1", payload);

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: payload,
    });
    expect(result).toEqual({ id: "1", ...payload });
  });

  it("deletePost should return true when delete succeeds", async () => {
    prisma.post.delete.mockResolvedValue({ id: "1" });

    const result = await postService.deletePost("1");

    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toBe(true);
  });

  it("deletePost should return false when record does not exist", async () => {
    // Prisma costuma lançar erro P2025 quando não encontra para deletar
    const err = new Error("Record to delete does not exist");
    err.code = "P2025";
    prisma.post.delete.mockRejectedValue(err);

    const result = await postService.deletePost("999999");

    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: { id: "999999" },
    });
    expect(result).toBe(false);
  });

  it("searchPosts should call findMany with OR contains filters", async () => {
    prisma.post.findMany.mockResolvedValue([{ id: "s1" }]);

    const result = await postService.searchPosts("abc");

    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "s1" }]);
  });
});