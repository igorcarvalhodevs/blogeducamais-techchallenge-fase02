const { createPostSchema, updatePostSchema } = require("../src/modules/posts/post.validators");

describe("Zod validators", () => {
  it("createPostSchema should fail when missing fields", () => {
    const result = createPostSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("createPostSchema should pass with valid fields", () => {
    const result = createPostSchema.safeParse({
      title: "t",
      content: "c",
      author: "a",
    });
    expect(result.success).toBe(true);
  });

  it("updatePostSchema should allow partial", () => {
    const result = updatePostSchema.safeParse({ title: "only title" });
    expect(result.success).toBe(true);
  });
});

