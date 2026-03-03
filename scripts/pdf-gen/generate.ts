import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import chromium from "@sparticuz/chromium";
import playwright from "playwright-core";

// 1. Setup paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HUMANS_DIR = path.resolve(__dirname, "../../src/humans");

async function main() {
  // 2. Extract the name from arguments (e.g., --craig becomes 'craig')
  const args = process.argv.slice(2);
  const name = args[0];

  if (!name) {
    console.error("\x1b[31m%s\x1b[0m", "Error: No user specified.");
    console.log("Usage: npm run gen-pdf <name>");
    process.exit(1);
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
  console.log(`Starting PDF generation for ${userPath}...`);

  try {
    // This is where your Playwright / Chromium logic will live
    await generatePDF(name, userPath);
  } catch (error) {
    console.error("Critical failure during PDF generation:", error);
    process.exit(1);
  }
}

async function generatePDF(name: string, dataPath: string) {
  // 1. Read and parse pdf-config.md
  const configPath = path.join(dataPath, "pdf-config.md");
  const configFile = fs.readFileSync(configPath, "utf8");
  const { data: config } = matter(configFile);

  // 2. Process sections
  let htmlContent = "";
  for (const section of config.sections) {
    const sectionPath = path.join(dataPath, section);
    const directFilePath = path.join(dataPath, `${section}.md`);

    let filesToProcess: string[] = [];
    let currentBasePath = sectionPath;

    // 1. Check if the section is a direct .md file (e.g., introduction.md)
    if (
      fs.existsSync(directFilePath) &&
      fs.lstatSync(directFilePath).isFile()
    ) {
      filesToProcess = [`${section}.md`];
      currentBasePath = dataPath; // The file lives in the human's root
    }
    // 2. Otherwise, check if it's a directory (e.g., career/)
    else if (
      fs.existsSync(sectionPath) &&
      fs.lstatSync(sectionPath).isDirectory()
    ) {
      const indexPath = path.join(sectionPath, "index.md");
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, "utf8");
        filesToProcess = indexContent.split("\n").filter(Boolean);
      } else {
        filesToProcess = fs
          .readdirSync(sectionPath)
          .filter((file) => file.endsWith(".md") && file !== "index.md");
      }
    } else {
      console.warn(
        `\x1b[33mWarning: Section "${section}" not found as file or folder.\x1b[0m`,
      );
      continue;
    }

    // 3. Process the identified files
    for (const file of filesToProcess) {
      const filePath = path.join(
        currentBasePath,
        file.endsWith(".md") ? file : `${file}.md`,
      );
      if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, "utf8");
        const { content } = matter(markdown);
        htmlContent += `<section class="section-${section}">${marked(content)}</section>`;
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
          /* Add styles here later */
        </style>
      </head>
      <body>
        <header><h1>${config.header}</h1></header>
        <main>
          ${htmlContent}
        </main>
        <footer><p>${config.footer}</p></footer>
      </body>
    </html>
  `;

  // 4. Generate PDF
  const browser = await playwright.chromium.launch({
    headless: true, // Set to false if you want to see the browser window
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle" });

  const pdfPath = path.resolve(__dirname, `../../dist/pdf/${name}-cv.pdf`);

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: false,
  });

  await browser.close();

  console.log(
    `\x1b[32m%s\x1b[0m`,
    `✔ PDF generated successfully at: ${pdfPath}`,
  );
}

main();
