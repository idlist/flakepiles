# Flakepiles for Obsidian

Put small stickers / cards in a single file.

An obsidian plugin. For personal use. In very early development.

## Status

MVP (i.e., barely usable), lacking convenient tools.

## Why

I don't want 100 `.md` files with 1 sentence each.

## Tech Stack

Vite + Vue 3 + TypeScript + Sass

## Goals

- [x] Mount Vue into Obsidian
- [x] Flakepile
  - [x] Masonry layout
  - [x] Masonry direction (vertical / horizontal)
  - [x] Mobile-adaptive layout
  - [x] Flake size
  - [x] Flake elastic sizing
  - [x] Flake sorting
- [ ] Flake
  - [x] Flake creation, update, deletion
  - [x] Flake markdown rendering
  - [x] Text Flake
  - [x] Code Flake
  - [x] Image Flake
  - [ ] Flake color (theme)
- [ ] Flake labels
  - [ ] Label creation, update, deletion
  - [ ] Label color
  - [ ] Hide specific label (display as `+N`)
  - [ ] Label filtering
- [ ] Search inside a Flakepile
  - [ ] Search title
  - [ ] Search content
- Limited support to internal plugins
  - [x] Preview other markdown file
  - [x] Jump to global search when clicking on a tag.

## Long term goals

- [ ] Import multiple markdown files to Flakes
- [ ] Import `.zip` archive to a Flakepile
  - [ ] Import as a new Flakepile
  - [ ] Import into an existing Flakepile
- [ ] Export files to a .zip archive, each Flake as a markdown file
- [ ] Transition animation (investigated a bit, struggling with lifecycles)

## Non-goals

- Live editing of Flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing support (restricted by API)

## License

MIT
