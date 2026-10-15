# Flakepiles for Obsidian

An Obsidian plugin to put small notes / stickies / cards in a single file, and manage them in a masonry layout.

> This is a refactor of the original [Flakepiles (legacy)](https://github.com/idlist/flakepiles-legacy) with a change to [license](#license). The original plugin will remain as open source, and is available via [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Prerequisite

Somewhat newer version of Obsidian. The plugin relies on CSS [`field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing) property that is kind of new.

## Why

I don't want 100 `.md` files with 1 sentence each, and I'm pretty picky about information density.

## Features

- UI design that (tried my best to) align with Obsidian's design language.
- Edit Flakes in place instead of having to open another window.
- Easy to copy and paste your Flakes from everywhere to everywhere.

## Roadmap

Plugin side:

- [x] Flakepile
  - [x] Masonry layout
  - [x] Masonry direction (vertical / horizontal)
  - [x] (Sort of) mobile-adaptive layout
  - [x] Flake size settings and elastic sizing
  - [x] Flake sorting (time created, time modified, content)
- [x] Flake
  - [x] Flake creation, update, deletion
  - [x] Markdown rendering of Flake content
  - [x] Copy Flake content to clipboard
  - [x] Pinning a Flake
- [x] Search
  - [x] Search content
  - [ ] Search labels
- [ ] Flake labels
  - [ ] Label creation, update, deletion
  - [ ] Add / remove label to flake
  - [ ] Label color (as Flake color)
  - [ ] Collapse certain labels in flakes (display as `+N`)
  - [ ] Hide flake with certain labels

Obsidian side:

- [x] Optional Obsidian commands
- [x] "Flake count" status bar item [1]
- [x] Preview other markdown files via `[[file link]]`

[1] Due to the nature of this plugin, other status bar items are hidden in flakepile view. Please let me know if you think some other status bar items should be displayed.

## Long term goals

- Search keywords highlighting
- Embed a Flake into another markdown file
- Export a Flakepile as markdown
  - Export as a single markdown file
  - Export as a `.zip` archive, each Flake as a markdown file
- Import the `.zip` archive mentioned above to a Flakepile
- Import multiple markdown files to a Flakepile

## Non-goals

- Freedom / manual layout (consider using Canvas)
- Very large Flakepile support (not impossible, but lots of work)
- Live editing of a Flake (consider copying to an editor and then copy it back)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing (restricted by API)

This plugin is primarily to fulfill my own use cases. For this reason, I would prioritize maintainability over adding unplanned features. I'm open to suggestions, though feature requests might be considered only when it's aligned to my own use case.

## Technical details

The tech stack of the plugin is Vite + Vue 3 + TypeScript + Sass.

The underlying file format (`.flakes`) is JSON.

### Build from source

If you want to build the plugin from source, you can clone this repository and:

```
npm i
npm run dev       // Watch mode, works with hot reload [1]
npm run build:dev // One-time dev build without minification
npm run build     // Build for production
```

[1] [Hot reload](https://github.com/pjeby/hot-reload)

When running `npm run build`, the output files will be copied to the `dist` folder.

### Cache storage

This plugin uses IndexedDB with [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) to store cache data, which means (by default) the data is stored in database `keyval-store` and table `keyval`.

## Changelog

[Changelog for pre-1.0 versions](docs/changelog.pre-v1.md)

## License

[PolyForm Internal Use](https://polyformproject.org/licenses/internal-use/1.0.0) (c) i'DLisT 2026

- This is not open-source, but a source-available plugin.
- In short, you may freely use the plugin or modify the code for your own use, but you cannot redistribute it.
