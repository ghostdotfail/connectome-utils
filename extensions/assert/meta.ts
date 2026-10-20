declare const BUILD_SHA: string;
/** `git describe --always --dirty` at build time (`bun run build`); 'unbuilt' when run from source. */
export const EXTENSION_BUILD = typeof BUILD_SHA === 'undefined' ? 'unbuilt' : BUILD_SHA;

/** Key in recipe.json `extensions` object */
export const EXTENSION_NAME = 'assert' as const;
