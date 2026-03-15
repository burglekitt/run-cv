declare module "gray-matter" {
  function matter(
    input: string | Buffer,
    options?: unknown,
  ): { data: Record<string, unknown>; content: string };
  export = matter;
}
