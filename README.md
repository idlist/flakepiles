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
- [x] Flakepile
  - [x] Flow direction (vertical / horizontal)
  - [x] Flake size
  - [x] Flake elastic sizing
  - [x] Flake sorting
  - [x] Mobile-adaptive layout
- [ ] Flake
  - [x] Flake markdown rendering
  - [x] Flake creation, update, deletion
  - [ ] Flake type (text / image / code)
  - [ ] Flake color (theme)
- [ ] Flake labels
  - [ ] Label creation, update, deletion
  - [ ] Label color
  - [ ] Hide specific label (display as `+N`)
  - [ ] Label filtering
- [ ] Search inside a Flakepile
  - [ ] Search title
  - [ ] Search content
- [ ] Import multiple markdown files to Flakes
- [ ] Export files to a .zip archive, each Flake as a markdown file

## Non-goals

- Live editing of Flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- File linking (tags, wiki links) (restricted by API)

## License

MIT
