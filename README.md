# run-cv

A mainframe-inspired terminal CV viewer built with Node.js, React, and Ink.

![Terminal UI](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif)

[View Landing Page](https://burglekitt.github.io/run-cv/)

## Features

- 📟 **Retro Terminal UI**: Green-screen aesthetic with keyboard navigation.
- 📝 **Markdown Driven**: CV content is managed entirely via Markdown files.
- 📂 **Multi-Human Support**: Easily switch between different profiles.

## Usage

To view the CV in your terminal:

```bash
npx run-cv
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
