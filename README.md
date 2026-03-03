# run-cv

A mainframe-inspired terminal CV viewer built with Node.js, React, and Ink.

![Terminal UI](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif)

[View Landing Page](https://burglekitt.github.io/run-cv/)

## Features

- 📟 **Retro Terminal UI**: Green-screen aesthetic with keyboard navigation.
- 📝 **Markdown Driven**: CV content is managed entirely via Markdown files.
- 📂 **Multi-Human Support**: Easily switch between different profiles.

## Usage

- 📟 MacOS/Linux: Just run npx run-cv <name>
- 🪟 Windows: Ensure Node.js is installed, then run npx run-cv <name> in your terminal.

```bash
npx run-cv <name>
```

## Development

To run the project locally:

```bash
npm install
npm run dev
# or for a specific profile
npm run dev <name>
```

### Usage

To run the CV for a specific human:

```bash
npm run dev <name>
```

## Adding a New Human

1. Create a folder in `src/humans/<name>`.
2. Create an `introduction.md` file. This acts as the manifest and entry point.

```markdown
---
name: Your Name
role: Your Role
menu:
  - label: Work Experience
    file: experience/index.md
  - label: Contact
    file: contact.md
---

# SYSTEM ONLINE

Welcome to the terminal.
```

3. Add the referenced markdown files (e.g., `experience.md`, `contact.md`) in the same folder.

## PDF Generation

You can generate a PDF version of a CV using the `gen-pdf` script.

```bash
npm run gen-pdf <name> [-- --theme <theme-name>]
```

- `<name>`: The name of the human (e.g., `craig`, `baldur`).
- `--theme <theme-name>`: (Optional) Specify a theme. Defaults to `vintage`.

Available themes:

- `vintage`
- `hacker`

**Example:**

```bash
# Generate a PDF for 'craig' with the 'hacker' theme
npm run gen-pdf craig -- --theme hacker
```

## Publishing to NPM

After you make changes, be sure to:

1.  **Bump Version:** Update the `version` number in `package.json`.
2.  **Update Lockfile:** Run `npm install` to update `package-lock.json`.
3.  **Commit Changes:** Commit your changes to git.
4.  **Tag Version:** Run `git tag vx.x.x` (e.g., `v0.0.5`) and `git push origin vx.x.x`.
5.  **Publish:** Run `npm publish`.
6.  **Create Release:** In GitHub, go to the "Releases" tab and draft a new release from the tag you just pushed.
