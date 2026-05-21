import remarkGfm from "remark-gfm";

/**
 * Shared options passed to every <MDXRemote /> render call.
 *
 * - `remark-gfm` enables GitHub-flavoured markdown: pipe tables,
 *   task-lists, strikethrough, autolinks. Especially important for
 *   the comparison tables in the COMP3027 + COMP4349 teach files.
 */
export const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};
