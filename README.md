# Flakepiles for Obsidian

Sticker pile in a single file.

For personal use. In very early development.

## Status

MVP (i.e., barely usable), lacking convenient tools.

## Why

I don't want 100 `.md` files with 1 sentence each.

## Tech Stack

Vite + Vue 3 + Sass

## Goals

- [x] Mount Vue into Obsidian
- [ ] Flakepile
  - [x] Flow direction (vertical / horizontal)
  - [ ] Flake size
  - [ ] Flake elastic sizing
  - [x] Flake sorting
  - [x] Adaptive layout
- [ ] Flake
  - [x] Flake markdown rendering
  - [x] Flake creation, update, deletion
  - [ ] Flake type (text / image / code)
  - [ ] Flake color (theme)
  - [ ] Flake labels
- [ ] Searching inside a flakepile
- [ ] Virtual scrolling
- [ ] Import multiple markdown files to Flakes
- [ ] Export files to a .zip archive, each Flake as a markdown file

## Non-goals

- Live editing of Flake (too complex)
- Cross-file searching or Obsidian-wise searching (restricted by API)
- File linking (tags, wiki links) (restricted by API)

## License

MIT
