# connectome-utils

Various helpers, types, modules, and more for [Connectome](https://github.com/anima-research/connectome-host).

This repo is early and not considered stable yet, and it assumes you're hacking with the host yourself. Use whatever you find useful.

## What's here

- **Sanity checking:** [Zod schemas](./src/types/) and [assertions](./extensions/assert/). Useful if you prefer things to fail loud and early, or if you prefer to spend less time manually sifting for type declarations among tens of thousands of lines of code across five upstream repositories.
