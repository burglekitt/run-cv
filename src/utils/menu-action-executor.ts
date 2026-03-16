import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import open from "open";
import type { Page } from "../types";
import type { MenuAction } from "./menu-actions";

interface ExecuteMenuActionOptions {
  action: MenuAction;
  currentDir: string;
  pdfRoot: string;
  loadPage: (baseDir: string, file: string) => Promise<Page>;
  onNavigate: (nextPage: Page) => void;
  onError: (message: string) => void;
}

export async function executeMenuAction({
  action,
  currentDir,
  pdfRoot,
  loadPage,
  onNavigate,
  onError,
}: ExecuteMenuActionOptions): Promise<void> {
  if (action.type === "download-pdf") {
    await downloadPdf(action.filename, pdfRoot, onError);
    return;
  }

  if (action.type === "open-url") {
    try {
      await open(action.url);
    } catch (error) {
      onError(`SYSTEM·FAILURE:·${(error as Error).message}`);
    }
    return;
  }

  if (action.type === "navigate") {
    try {
      const nextPage = await loadPage(currentDir, action.file);
      onNavigate(nextPage);
    } catch (error) {
      onError((error as Error).message);
    }
  }
}

async function downloadPdf(
  filename: string,
  pdfRoot: string,
  onError: (message: string) => void,
): Promise<void> {
  const internalPdfPath = path.join(pdfRoot, filename);
  const downloadsFolder = path.join(os.homedir(), "Downloads");
  const userDownloadPath = path.join(downloadsFolder, filename);

  try {
    if (!fs.existsSync(internalPdfPath)) {
      onError(`ARCHIVE ERROR: Resource ${filename} not found in package.`);
      return;
    }

    fs.copyFileSync(internalPdfPath, userDownloadPath);
    await open(userDownloadPath);
  } catch (error) {
    onError(`SYSTEM·FAILURE:·${(error as Error).message}`);
  }
}
