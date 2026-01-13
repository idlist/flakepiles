# Flakepiles for Obsidian

Put small stickies / cards in a single file. Manage them in masonry layout.

An obsidian plugin. For personal use. In early development.

## Status

Minimum viable product. I've tested many edge cases I can think of, but still, please expect bugs.

## Why

I don't want 100 `.md` files with 1 sentence each.

## Tech Stack

Vite + Vue 3 + TypeScript + Sass

Using Vite as I'm using Vue, using Vue as I'm mostly familiar with it.

## Goals

- [x] Mount Vue into Obsidian
- [x] Flakepile
  - [x] Masonry layout
  - [x] Masonry direction (vertical / horizontal)
  - [x] (Somewhat) Mobile-adaptive layout
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

- Flake colors (theme)
- Search keywords highlight
- Import multiple markdown files to Flakes
- Import `.zip` archive to a Flakepile
  - Import as a new Flakepile
  - Import into an existing Flakepile
- Export files to a .zip archive, each Flake as a markdown file
- Transition animation (investigated a bit, mostly jank, needs help)

## Non-goals

- Very large Flakepile support (not the very intended way)
- Live editing of Flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing support (restricted by API)
- Unit testing (do not have time)

## License

MIT © i'DLisT 2026
