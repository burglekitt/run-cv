import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import meow from "meow";

import { getDirectories, resolveSections, SectionInfo } from "./utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUMANS_DIR = path.resolve(__dirname, "../../src/humans");
export const TMP_DIR = path.resolve(__dirname, "../../tmp");

// CLI initialization is done lazily inside main to avoid
// side-effects when the module is imported for testing.

async function main() {
  const cli = meow(
    `
    Usage
      $ npm run gen-json <name>

    Options
      --all        Generate JSON for all humans
  `,
    {
      importMeta: import.meta,
      flags: {
        all: { type: "boolean", default: false },
      },
    },
  );

  const [nameInput] = cli.input;
  const { all } = cli.flags;

  const tasks: { name: string }[] = [];
  if (all) {
    const humans = getDirectories(HUMANS_DIR);
    for (const h of humans) {
      tasks.push({ name: h });
    }
  } else if (nameInput) {
    tasks.push({ name: nameInput.toLowerCase() });
  } else {
    cli.showHelp();
    return;
  }

  fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const task of tasks) {
    try {
      await generateJSON(task.name);
    } catch (err) {
      console.error(`✖ Failed ${task.name}:`, err);
    }
  }

  console.log("✔ JSON generation complete.");
}

export async function generateJSON(name: string) {
  const userPath = path.join(HUMANS_DIR, name);
  if (!fs.existsSync(userPath)) {
    throw new Error(`Human "${name}" not found`);
  }

  const configPath = path.join(userPath, "pdf-config.md");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing pdf-config.md for ${name}`);
  }

  const { data: config } = matter(fs.readFileSync(configPath, "utf8"));
  const sections: SectionInfo[] = resolveSections(userPath, config.sections);

  // Build a flatter, CV‑centric structure.
  // We no longer care about the terminal UI menu or file names – the
  // consumer just needs frontmatter fields and the raw markdown body.
  const output: any = { name, entries: [] };

  for (const sect of sections) {
    for (const file of sect.files) {
      const filePath = path.join(sect.basePath, file.trim());
      if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, "utf8");
        const { data, content } = matter(markdown);
        // drop UI-only fields that were only there for the terminal app
        if (sect.section === "introduction" && data && data.menu) {
          delete data.menu;
        }
        // each entry carries its source section so we can reconstruct
        // grouping later if desired
        output.entries.push({
          section: sect.section,
          frontmatter: data,
          content,
        });
      }
    }
  }

  const outPath = path.join(TMP_DIR, `${name}.json`);
  // make sure the target directory exists when called directly
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`✔ wrote ${outPath}`);
}

// only run main when executed as a script, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
