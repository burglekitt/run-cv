# run-cv

A Fallout-inspired terminal CV viewer built with Node.js, React, and Ink.

![Terminal UI](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3R5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eXJ5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjeiVyM/giphy.gif)

## Features

- 📟 **Retro Terminal UI**: Green-screen aesthetic with keyboard navigation.
- 📝 **Markdown Driven**: CV content is managed entirely via Markdown files.
- 📂 **Multi-Candidate Support**: Easily switch between different profiles.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)

### Installation

```bash
npm install
```

### Usage

To run the CV for a specific candidate (e.g., `craig`):

```bash
npm run dev craig
```

## Adding a New Candidate

1. Create a folder in `src/humans/<name>`.
2. Create an `introduction.md` file. This acts as the manifest and entry point.

```markdown
---
name: Your Name
role: Your Role
menu:
  - label: Work Experience
    file: experience.md
  - label: Contact
    file: contact.md
---

# SYSTEM ONLINE

Welcome to the terminal.
```

3. Add the referenced markdown files (e.g., `experience.md`, `contact.md`) in the same folder.
