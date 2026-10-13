# Flakepiles for Obsidian

An Obsidian plugin to put small notes / stickies / cards in a single file, and manage them in masonry layout.

> This is a refactor of the original [Flakepiles (Legacy)](https://github.com/idlist/flakepiles-legacy) with a change in license.

## Why

I don't want 100 `.md` files with 1 sentence each, and I'm pretty picky about information density.

## Prerequisite

Somewhat newer version of Obsidian. The plugin relies on CSS [`field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing) property, which is quite new.

## Features

- UI design that aligns with Obsidian. It doesn't feel like another App is in your Obsidian.

## Tech Stack

Vite + Vue 3 + TypeScript + Sass

The underlying file format (`.flakes`) is JSON. See the [non-goals](#non-goals) section for explanation.

## Roadmap

Flakepile:

- [x] Flakepile
  - [x] Masonry layout
  - [x] Masonry direction (vertical / horizontal)
  - [x] (Sort of) mobile-adaptive layout
  - [x] Flake size
  - [x] Flake elastic sizing
  - [x] Flake sorting (name, time created, time modified)
- [x] Flake
  - [x] Flake creation, update, deletion
  - [x] Flake markdown rendering
  - [x] Copy flake content to clipboard
- [x] Search filter inside a flakepile
- [ ] Flake labels
  - [x] Label creation, update, deletion
  - [ ] Add / remove label to flake
  - [ ] Label color
  - [ ] Short display of labels in flakes (display as `+N`)
  - [ ] Hide flake with labels

Obsidian:

- [x] "Flake count" status bar item [1]
- [x] Preview other markdown files via `[[file link]]`

[1] Due to the nature of this plugin, other status bar items are hidden in flakepile view. Please let me know if you think some status bar item should be displayed.

## Long term goals

- Search keywords highlighting
- Move and copy one or multiple flakes across flakepiles
- Embed a flake into a markdown file
- Export files to markdown files
  - Export as a single markdown file
  - Export as a `.zip` archive, each flake as a markdown file
- Import the `.zip` archive to a flakepile
- Import multiple markdown files to Flakes

## Non-goals

- Freedom / manual layout (consider using Canvas)
- Very large flakepile support (not the very intended way)
- Live editing of a flake (too complex)
- Cross-file searching / Obsidian-wise searching (restricted by API)
- Global search indexing (restricted by API)
- Unit testing (do not have enough time)

I recognize that this plugin is not so an Obsidian-style plugin, as it does not leverage markdown file like many other plugins do. On the other hand, this has the benefit of not having to juggle with black magics that makes a markdown file look like other layout (when the layout itself is quite complicated).

Also, this plugin is primarily to fulfill my specific need. For this reason, I would prioritize maintainability over adding unplanned features. I'm open to suggestions, though feature requests might be considered only when it's aligned to my own use case. 🙏

## Build from source

If you want to take a look inside the development of the plugin, or just want to ensure maximum safety, you can clone this repository and build it from source:

```
npm i
npm run dev       // Watch mode, works with hot reload [1]
npm run build:dev // One-time dev build without minification
npm run build     // Build for production
```

[1] [Hot reload](https://github.com/pjeby/hot-reload)

WHen running `npm run build`, the output files will be copied to `dist` folder.

## License

[PolyForm Internal Use](https://polyformproject.org/licenses/internal-use/1.0.0) (c) i'DLisT 2026

- This is not open-source, but a source-available plugin.
- In short, you may freely use the plugin or modify the code for your own use, but you cannot redistribute it.
