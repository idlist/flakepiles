# Flakepiles for Obsidian

An Obsidian plugin to put small notes, stickies, code snippets and more in a single file, and manage them in a masonry layout.

The plugin registers a custom file type `.flakes` (which is [JSON](#file-format)) and a custom view. You can check what the plugin looks like at the [Community Page](https://community.obsidian.md/plugins/flakepiles).

> This is a refactor of the original [Flakepiles (legacy)](https://github.com/idlist/flakepiles-legacy) with a change to [license](#license). The original plugin will remain as open source, and is available via [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Prerequisite

Somewhat newer version of Obsidian. The plugin relies on CSS [`field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing) property that is kind of new.

## Why

I don't want 100 `.md` files with 1 sentence each, and I'm pretty picky about information density.

## Features

- UI design that (tried my best to) align with Obsidian's design language.
- View and manage your Flakes (small pieces of notes) in masonry layout, vertical or horizontal.
- Edit Flakes in place instead of having to open another window or dialog.
- Easy to copy and paste your Flakes from everywhere to everywhere.
- A simple label system to categorize and filter your Flakes.

Plugin side:

- [x] Flakepile
  - [x] Masonry layout
  - [x] Masonry direction (vertical / horizontal)
  - [x] (Sort of) mobile-adaptive layout
  - [x] Flake size settings and elastic sizing
  - [x] Auto expand on single image or block of code
  - [x] Flake sorting (time created, time modified, content)
- [x] Flake
  - [x] Markdown rendering of Flake content
  - [x] Copy Flake content to clipboard
  - [x] Pinning a Flake
- [x] Search
  - [x] Simple search for content
  - [x] Simple search for labels
- [x] Flake labels
  - [x] Attach / detach labels to Flake
  - [x] Label color (as Flake color)
  - [x] Collapse certain labels on Flakes (display as `+N`)
  - [x] Hide Flakes with certain labels

Obsidian side:

- [x] Optional Obsidian commands
- [x] "Flake count" status bar item [1]
- [x] Preview other markdown files via `[[file link]]`

[1] Due to the nature of this plugin, other status bar items are hidden in flakepile view. Please let me know if you think some other status bar items should be displayed.

## Long term goals

These are something I want to achieve if I've completed the core features and still have some extra time. Most of them are desktop-only features.

- Embed a Flake into another markdown file
- Export a Flakepile as markdown
  - Export as a single markdown file
  - Export as a `.zip` archive, each Flake as a markdown file
- Import the `.zip` archive mentioned above to a Flakepile
- Import multiple markdown files to a Flakepile
- Search keywords highlighting (sounds challenging, though)

## Non-goals

- Freedom / manual layout and sorting (consider using Canvas)
- Very large Flakepile support (not impossible, but lots of work)
- Live editing of a Flake (consider copying it to an editor and then back)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing (restricted by API)

This plugin is primarily to fulfill my own use cases. For this reason, I would prioritize maintainability over adding unplanned features. I'm open to suggestions, though feature requests might be considered only when it's aligned to my own use case.

## Technical details

### Tech stack

Vite + Vue 3 + TypeScript + Sass.

### File format

The underlying file format (`.flakes`) is plain (i.e., unencrypted) JSON. You can open it in an external editor to see the content, or check the data schema ([here](./src/schemes/v1.ts)) in this repository.

Though not in a more common `.md` file, your data is still and always on your local machine. This also means that file-based syncing is supported out of the box (though without the ability to merge conflicts).

### Build from source

If you want to build the plugin from source, you can clone this repository and:

```
npm i
npm run dev       // Watch mode, works with hot reload [1]
npm run build:dev // One-time dev build without minification
npm run build     // Build for production
```

[1] [Hot reload](https://github.com/pjeby/hot-reload)

When running `npm run build`, the output files will also be copied to the `dist` folder, so that you don't need to manually select 3 files one by one.

### Cache storage

This plugin uses IndexedDB with [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) to store cache data, which means (by default) the data is stored in database `keyval-store` and table `keyval`.

### Overrides in `package.json`

- `chokidar`: Resolves vulnerability in `vite-plugin-static-copy`.
- `moment`: Resolves vulnerability in `obsidian` (package). As the plugin itself uses `dayjs` instead and never touches `moment`, it's safe to have (possibly) inconsistent version with Obsidian.

## Changelog

[Changelog for pre-1.0 versions](docs/changelog.pre-v1.md)

## License

[PolyForm Internal Use](https://polyformproject.org/licenses/internal-use/1.0.0) (c) i'DLisT 2026

- This is not open-source, but a source-available plugin.
- In short, you may freely use the plugin or modify the code for your own use, but you cannot redistribute it.
