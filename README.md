# Flakepiles for Obsidian

Put small stickers / cards in a single file.

An obsidian plugin. For personal use. In very early development.

## Status

Minimum viable product. Please expect bugs in edge cases.

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
- [x] Flake
  - [x] Flake creation, update, deletion
  - [x] Flake markdown rendering
  - [x] Text Flake
  - [x] Code Flake
  - [x] Image Flake
- [ ] Search inside a Flakepile
  - [ ] Search title
  - [ ] Search content
- [ ] Flake labels
  - [ ] Label creation, update, deletion
  - [ ] Add / remove label to Flake
  - [ ] Label color
  - [ ] Hide specific label (display as `+N`)
  - [ ] Label filtering
- Limited support to internal plugins
  - [x] Preview other markdown file
  - [x] Jump to global search when clicking on a tag.

## Long term goals

- [ ] Flake colors (theme)
- [ ] Search keywords highlight
- [ ] Import multiple markdown files to Flakes
- [ ] Import `.zip` archive to a Flakepile
  - [ ] Import as a new Flakepile
  - [ ] Import into an existing Flakepile
- [ ] Export files to a .zip archive, each Flake as a markdown file
- [ ] Transition animation (investigated a bit, mostly jank, needs help)

## Non-goals

- Live editing of Flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing support (restricted by API)

## License

MIT
