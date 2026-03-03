import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import meow from "meow";
import playwright from "playwright-core";

// 1. Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES_DIR = path.resolve(__dirname, "styles");
const HUMANS_DIR = path.resolve(__dirname, "../../src/humans");

const cli = meow(
  `
    Usage
      $ npm run gen-pdf <name>

    Options
      --theme, -t  Specify a theme (e.g., hacker, vintage)
  `,
  {
    importMeta: import.meta,
    flags: {
      theme: {
        type: "string",
        shortFlag: "t", // Changed from alias: "t"
        default: "vintage",
      },
    },
  },
);

async function main() {
  const [name] = cli.input;
  const { theme } = cli.flags;

  if (!name) {
    cli.showHelp();
    return;
  }

  const userPath = path.join(HUMANS_DIR, name.toLowerCase());

  // 3. Graceful Failure: Check if the directory exists
  if (!fs.existsSync(userPath)) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      `Error: Human "${name}" not found in ${HUMANS_DIR}`,
    );
    console.log("Available humans:", fs.readdirSync(HUMANS_DIR).join(", "));
    process.exit(1);
  }

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✔ Found data tape for: ${name.toUpperCase()}`,
  );
  console.log(`Starting PDF generation for ${userPath} using theme: ${theme}`);

  try {
    await generatePDF(name, userPath, theme);
  } catch (error) {
    console.error("Critical failure during PDF generation:", error);
    process.exit(1);
  }
}

async function generatePDF(name: string, dataPath: string, theme: string) {
  // 1. Read and parse pdf-config.md
  const configPath = path.join(dataPath, "pdf-config.md");
  const configFile = fs.readFileSync(configPath, "utf8");
  const { data: config } = matter(configFile);

  // Read CSS files
  const rootCss = fs.readFileSync(path.join(STYLES_DIR, "root.css"), "utf8");
  const themePath = path.join(STYLES_DIR, "themes", `${theme}.css`);
  const themeCss = fs.existsSync(themePath)
    ? fs.readFileSync(themePath, "utf8")
    : "";

  if (!themeCss) {
    console.warn(
      `\x1b[33mWarning: Theme "${theme}" not found. Falling back to default styles.\x1b[0m`,
    );
  }

  let htmlContent = "";

  for (const section of config.sections) {
    // 1. SKIP logic for introduction.md
    if (section === "introduction") continue;

    const sectionPath = path.join(dataPath, section);
    const directFilePath = path.join(dataPath, `${section}.md`);

    let filesToProcess: string[] = [];
    let currentBasePath = sectionPath;

    if (
      fs.existsSync(directFilePath) &&
      fs.lstatSync(directFilePath).isFile()
    ) {
      filesToProcess = [`${section}.md`];
      currentBasePath = dataPath;
    } else if (
      fs.existsSync(sectionPath) &&
      fs.lstatSync(sectionPath).isDirectory()
    ) {
      const indexPath = path.join(sectionPath, "index.md");

      if (fs.existsSync(indexPath)) {
        const indexFile = fs.readFileSync(indexPath, "utf8");
        const { data: indexData } = matter(indexFile);

        // 2. SMART PARSING: Handle the YAML menu structure
        if (indexData.menu && Array.isArray(indexData.menu)) {
          filesToProcess = indexData.menu.map((item: any) => item.file);
        } else {
          // Fallback for plain list
          filesToProcess = indexFile.split("\n").filter(Boolean);
        }
      } else {
        filesToProcess = fs
          .readdirSync(sectionPath)
          .filter((file) => file.endsWith(".md") && file !== "index.md");
      }
    }

    for (const file of filesToProcess) {
      const filePath = path.join(currentBasePath, file.trim());
      if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, "utf8");
        const { content } = matter(markdown);

        // Wrap in a section for CSS targeting
        htmlContent += `<section class="cv-section section-${section}">
          ${marked(content)}
        </section>`;
      }
    }
  }

  // 3. Construct full HTML
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.header}</title>
        <style>
          ${rootCss}
          ${themeCss}
        </style>
      </head>
      <body>
        <header>${config.header}</header>
        <main>
          ${htmlContent}
        </main>
        <footer>${config.footer}</footer>
      </body>
    </html>
  `;

  // 4. Generate PDF
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle" });

  // This will result in: /dist/pdf/<name>-hacker-cv.pdf
  const pdfPath = path.resolve(
    __dirname,
    `../../dist/pdf/${name}-${theme}-cv.pdf`,
  );

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
  });

  await browser.close();

  console.log(
    `\x1b[32m%s\x1b[0m`,
    `✔ PDF generated successfully at: ${pdfPath}`,
  );
}

main();
