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
  // 1. Read config and main CSS
  const configPath = path.join(dataPath, "pdf-config.md");
  const configFile = fs.readFileSync(configPath, "utf8");
  const { data: config } = matter(configFile);

  const rootCss = fs.readFileSync(path.join(STYLES_DIR, "root.css"), "utf8");
  const themeDir = path.join(STYLES_DIR, "themes", theme);

  // need to get now the scripts/pdf-gen/styles/themes/vintage/base.css
  const themeVariablesCss = path.join(themeDir, "variables.css");
  const themeVariables = fs.existsSync(themeVariablesCss)
    ? fs.readFileSync(themeVariablesCss, "utf8")
    : "/* No theme variables found */";

  const themeCssPath = path.join(themeDir, "base.css");
  const themeCss = fs.existsSync(themeCssPath)
    ? fs.readFileSync(themeCssPath, "utf8")
    : "/* No base theme styles found */";

  // need to get new scripts/pdf-gen/styles/themes/vintage/header-footer.css
  const themePdfCssPath = path.join(themeDir, "header-footer.css");
  const themePdfCss = fs.existsSync(themePdfCssPath)
    ? fs.readFileSync(themePdfCssPath, "utf8")
    : "/* No header/footer styles found */";

  let htmlContent = "";

  for (const section of config.sections) {
    if (section === "introduction") continue;

    const sectionPath = path.join(dataPath, section);
    const directFilePath = path.join(dataPath, `${section}.md`);

    let filesToProcess: string[] = [];
    let currentBasePath = sectionPath;
    let sectionTitle = ""; // Initialize title variable

    if (
      fs.existsSync(directFilePath) &&
      fs.lstatSync(directFilePath).isFile()
    ) {
      filesToProcess = [`${section}.md`];
      currentBasePath = dataPath;

      // Optional: Extract title from the standalone file's matter
      const fileContent = fs.readFileSync(directFilePath, "utf8");
      const { data } = matter(fileContent);
      sectionTitle = data.title || "";
    } else if (
      fs.existsSync(sectionPath) &&
      fs.lstatSync(sectionPath).isDirectory()
    ) {
      const indexPath = path.join(sectionPath, "index.md");

      if (fs.existsSync(indexPath)) {
        const indexFile = fs.readFileSync(indexPath, "utf8");
        const { data: indexData } = matter(indexFile);

        // CAPTURE THE TITLE HERE
        sectionTitle = indexData.title || "";

        if (indexData.menu && Array.isArray(indexData.menu)) {
          filesToProcess = indexData.menu.map((item: any) => item.file);
        } else {
          filesToProcess = indexFile.split("\n").filter(Boolean);
        }
      } else {
        filesToProcess = fs
          .readdirSync(sectionPath)
          .filter((file) => file.endsWith(".md") && file !== "index.md");
      }
    }

    // PREPEND THE TITLE TO THE HTML CONTENT
    if (sectionTitle) {
      htmlContent += `<h2 class="section-title title-${section}">${sectionTitle}</h2>`;
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

  const fullHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${rootCss}
        ${themeVariables}
        ${themeCss}
      </style>
    </head>
    <body>
      <main>${htmlContent}</main>
    </body>
  </html>
`;

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  // WAIT UNTIL LOAD: Important for fonts/images
  await page.setContent(fullHtml, { waitUntil: "networkidle" });

  const pdfPath = path.resolve(
    __dirname,
    `../../dist/pdf/${name}-${theme}-cv.pdf`,
  );
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });

  // 3. The "Safe" Template Style
  // We keep this minimal. No @imports, no complex fonts.
  const baseTemplateStyle = `
    <style>
        /* 0 - Base styles for header/footer templates */
        ${themeVariables}

        /* 1. Reset the template's internal root elements */
        html, body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            width: 100%;
        }

        /* 2. Target the specific Chromium wrapper IDs */
        #header, #footer {
            padding: 0;
            margin: 0;
            width: 100%;
        }
        
        /* 3. Ensure the container is truly full-width */
        .container {
            width: 100%;
            display: flex;
            align-items: center;
            font-size: 9pt;
            font-family: monospace;
            padding: 5mm 10mm;
            box-sizing: border-box; /* Crucial for padding to not exceed 100% */
            height: 10mm;
        }

        /* Inject the theme-specific sidecar CSS */
        ${themePdfCss}
    </style>
    `;

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      ${baseTemplateStyle}
      <div class="container header-area">
        <span class="header-text">${config.header}</span>
      </div>`,
    footerTemplate: `
      ${baseTemplateStyle}
      <div class="container footer-area">
        <span class="footer-text">${config.footer}</span>
        <span class="page-info">
          Page <span class="pageNumber"></span> / <span class="totalPages"></span>
        </span>
      </div>`,
  });

  await browser.close();
  console.log(`\x1b[32m✔ PDF generated: ${pdfPath}\x1b[0m`);
}

main();
