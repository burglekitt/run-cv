declare module "gray-matter" {
  function matter(
    input: string | Buffer,
    options?: any,
  ): { data: any; content: string };
  export = matter;
}
