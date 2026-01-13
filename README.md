# Flakepiles for Obsidian

An Obsidian plugin to put small stickies / cards in a single file, and manage them in masonry layout.

The underlying file format (`.flakes`) is JSON. The plugin is in early development, though basic features should now work properly.

![preview](docs/preview.jpg)

## Installation

The plugin is not published as Obsidian's community plugin yet. Please use [BRAT](https://github.com/TfTHacker/obsidian42-brat) to install the plugin. I might (or might not) submit the plugin later.

## Status

Basic features. I've tested many edge cases I can think of, and [I myself am using it currently](https://en.wikipedia.org/wiki/Eating_your_own_dog_food), but please expect bugs exist.

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
  - [x] (Sort of) Mobile-adaptive layout
  - [x] Flake size
  - [x] Flake elastic sizing
  - [x] Flake sorting (name, time created, time modified)
- [x] Flake
  - [x] Flake creation, update, deletion
  - [x] Flake markdown rendering
  - [x] Text Flake
  - [x] Code Flake
  - [x] Image Flake
- [x] Search filter inside a Flakepile
- [ ] Flake colors (theme)
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

- Search keywords highlight
- Copy Flake across Flakepile (the Copy Raw botton is for this)
- Import multiple markdown files to Flakes
- Import `.zip` archive to a Flakepile
  - Import as a new Flakepile
  - Import into an existing Flakepile
- Export files to a `.zip` archive, each Flake as a markdown file
- Transition animation (investigated a bit, mostly jank, needs help)

## Non-goals

- Very large Flakepile support (not the very intended way)
- Live editing of Flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing support (restricted by API)
- Unit testing (do not have time)

## Build from source

If you want to take a look inside the development of the plugin, or just want to ensure maximum safety, you can clone this repository and build from source:

```
npm i
npm run dev       // watch mode, works with hot reload [1]
npm run build:dev // one-time dev build without minification
npm run build     // build for production
```

[1] [Hot reload](https://github.com/pjeby/hot-reload)

With `npm run build`, the output files will be copied to `dist` folder.

## License

MIT © i'DLisT 2026
