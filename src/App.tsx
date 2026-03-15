#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Box, Text, useInput } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import SelectInput from "ink-select-input";
import open from "open";
import { Fragment, useEffect, useState } from "react";
import { AccessDenied } from "./components/AccessDenied";
import { Hints } from "./components/Hints";
import { LoadingScreen } from "./components/LoadingScreen";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { SkillBadge } from "./components/SkillBadge";
import { getHuman, getPage } from "./cvParser";
import { theme } from "./styles/theme";
import type { HighlightedItem, HumanManifest, MenuItem, Page } from "./types";
// navigation helpers moved out of App
import {
  canDrillIn,
  computeHighlightedItem,
  computeNavigationHint,
} from "./utils/navigation-utils";
import { grabEmailPattern, grabLinkedInPattern } from "./utils/regex-utils";

interface AppProps {
  name?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PATH LOGIC:
 * 1. PROD: If we are in 'dist/index.js', the pdfs are in './pdf'
 * 2. DEV: If we are in 'src/App.tsx', the pdfs are in '../dist/pdf'
 */
function getPdfRoot() {
  // Try sibling 'pdf' folder (Production /dist/pdf)
  const prodPath = path.resolve(__dirname, "pdf");
  if (fs.existsSync(prodPath)) return prodPath;

  // Try sibling 'dist/pdf' (Dev root)
  const localDistPath = path.resolve(__dirname, "dist", "pdf");
  if (fs.existsSync(localDistPath)) return localDistPath;

  // Try upward 'dist/pdf' (Inside src/)
  const devPath = path.resolve(__dirname, "..", "dist", "pdf");
  if (fs.existsSync(devPath)) return devPath;

  // Fallback to current directory as a last resort
  return __dirname;
}

const PDF_ROOT = getPdfRoot();

export function App({ name }: AppProps) {
  const [human, setHuman] = useState<HumanManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Page[]>([]);
  const [gradientColors, setGradientColors] = useState([
    theme.terminalGreenBright,
    theme.terminalGreenMedium,
    theme.terminalGreenDark,
    theme.terminalGreenMedium,
    theme.terminalGreenBright,
  ]);
  const [navigationMemory, setNavigationMemory] = useState<
    Record<string, number>
  >({});
  const [highlightedItem, setHighlightedItem] =
    useState<HighlightedItem | null>(null);
  const [contactInfo, setContactInfo] = useState<{
    email?: string;
    linkedin?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      if (!name) {
        setError("Please provide a human name. Example: npx run-cv <name>");
        setLoading(false);
        return;
      }

      try {
        const data = await getHuman(name);
        setHuman(data);
        setHistory([data]);
      } catch {
        setError("ACCESS DENIED");
      }
    };
    load();
  }, [name]);

  const currentPage = history.length > 0 ? history[history.length - 1] : null;
  const isContactPage = currentPage?.file === "contact.md";

  // keep the highlighted item in sync when the page changes
  useEffect(() => {
    setHighlightedItem(computeHighlightedItem(currentPage, navigationMemory));
  }, [currentPage, navigationMemory]);

  useEffect(() => {
    if (isContactPage && currentPage) {
      const content = currentPage.content;
      const emailMatch = grabEmailPattern(content);
      const linkedinMatch = grabLinkedInPattern(content);
      setContactInfo({
        email: emailMatch ? emailMatch[0] : undefined,
        linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
      });
    } else {
      setContactInfo({});
    }
  }, [currentPage, isContactPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientColors((prev) => {
        const newColors = [...prev];
        const first = newColors.shift();
        if (first) newColors.push(first);
        return newColors;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  useInput((input, key) => {
    // Global navigation should always work: back and quit
    if (key.escape || key.leftArrow || (input === "b" && history.length > 1)) {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (input === "q" && (history.length <= 1 || error)) {
      // clear terminal first
      process.stdout.write("\x1Bc");
      // then exit
      process.exit(0);
    }

    // If on a contact page, handle command input (left/right should not interfere)
    if (isContactPage) {
      if (input === "m" && contactInfo.email) {
        const subject = encodeURIComponent("Accessed run-cv, initiating comms");
        const body = encodeURIComponent(
          "Having navigated the digital tapestry of your run-cv, I'm reaching out to establish a more direct line of communication. I'm impressed with what I've seen and would like to discuss potential opportunities.",
        );
        open(`mailto:${contactInfo.email}?subject=${subject}&body=${body}`, {
          app: { name: "Mail" },
        });
      }
      if (input === "p" && contactInfo.linkedin) {
        open(contactInfo.linkedin);
      }
      return;
    }

    // arrow-right should drill in when an item is highlighted and we have a non-empty menu
    if (
      key.rightArrow &&
      canDrillIn(currentPage, highlightedItem) &&
      highlightedItem
    ) {
      handleSelect(highlightedItem);
      return;
    }

    // Handle space selection for menu items as before
    if (
      input === " " &&
      canDrillIn(currentPage, highlightedItem) &&
      highlightedItem
    ) {
      handleSelect(highlightedItem);
    }
  });

  async function handleSelect(item: { value: string }) {
    if (!currentPage || !human || !item) return;

    // 1. Find the specific menu item object to check for extra metadata (like 'theme')
    const selectedMenuItem = currentPage.menu?.find(
      (m: MenuItem) => m.file === item.value || m.theme === item.value,
    );

    // 2. SAVE NAVIGATION MEMORY (Existing logic)
    const selectedIndex =
      currentPage.menu?.findIndex(
        (i: MenuItem) => i.file === item.value || i.theme === item.value,
      ) ?? 0;

    setNavigationMemory((prev) => ({
      ...prev,
      [currentPage.dir]: selectedIndex,
    }));

    // 3. CHECK FOR DOWNLOAD ACTION
    // If the menu item has a 'theme' property, it's a PDF download request
    if (selectedMenuItem?.theme) {
      const filename = `${human.name.toLowerCase()}-${selectedMenuItem.theme}-cv.pdf`;
      const internalPdfPath = path.join(PDF_ROOT, filename);

      // Cross-platform way to target the Downloads folder
      const downloadsFolder = path.join(os.homedir(), "Downloads");
      const userDownloadPath = path.join(downloadsFolder, filename);

      try {
        if (fs.existsSync(internalPdfPath)) {
          // 1. Copy to the actual Downloads folder
          fs.copyFileSync(internalPdfPath, userDownloadPath);

          // 2. Open the file from the Downloads folder
          await open(userDownloadPath);

          // Optionally: Update UI to show it was saved to Downloads
          // (You'd need a state variable for a "Success" message)
        } else {
          setError(`ARCHIVE ERROR: Resource ${filename} not found in package.`);
        }
      } catch (err) {
        setError(`SYSTEM·FAILURE:·${(err as Error).message}`);
      }
      return;
    }

    // 4. STANDARD NAVIGATION (Existing logic)
    try {
      const nextPage = await getPage(currentPage.dir, item.value);
      setHistory((prev) => [...prev, nextPage]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const navigationHint = computeNavigationHint(history);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={
        !loading && error ? theme.terminalRedBright : theme.terminalGreenBright
      }
      padding={1}
      width={80}
    >
      <Box marginBottom={1}>
        <Gradient
          colors={
            !loading && error
              ? [
                  theme.terminalRedBright,
                  theme.terminalRedMedium,
                  theme.terminalRedDark,
                ]
              : gradientColors
          }
        >
          <BigText text="RUN-CV" font="tiny" />
        </Gradient>
      </Box>

      {loading ? (
        <LoadingScreen onFinished={() => setLoading(false)} />
      ) : error ? (
        <AccessDenied />
      ) : human && currentPage ? (
        <Fragment>
          <Box marginBottom={1} flexDirection="column">
            <Text color={theme.terminalGreenBright}>User: {human.name}</Text>
            <Text color={theme.terminalGreenMedium}>Role: {human.role}</Text>
          </Box>

          <Box
            borderStyle="single"
            borderColor={theme.terminalGreenBright}
            padding={1}
            flexDirection="column"
          >
            {/* if we're showing the introduction page, render skill badges above */}
            {currentPage.file === human?.file &&
              human?.skills &&
              human.skills.length > 0 && (
                <Box flexDirection="row" flexWrap="wrap">
                  {human.skills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} />
                  ))}
                </Box>
              )}

            {currentPage.menu ? (
              <Box flexDirection="column">
                <MarkdownRenderer content={currentPage.content} />
                <Box marginTop={1}>
                  <SelectInput
                    key={currentPage.dir}
                    items={currentPage.menu.map((item: MenuItem) => ({
                      label: item.label,
                      // Use file if it exists, otherwise use the theme name as the value
                      value: item.file || item.theme || "",
                    }))}
                    onSelect={handleSelect}
                    onHighlight={setHighlightedItem}
                    initialIndex={navigationMemory[currentPage.dir] || 0}
                  />
                </Box>
                {navigationHint && (
                  <Box marginTop={1} borderStyle="single" borderColor="gray">
                    <Text color="gray">{navigationHint}</Text>
                  </Box>
                )}
              </Box>
            ) : (
              <Box flexDirection="column">
                <MarkdownRenderer content={currentPage.content} />
                {isContactPage && (
                  <Box flexDirection="column" marginTop={1}>
                    <Hints
                      hints={{
                        ...(contactInfo.email && { m: "Send email" }),
                        ...(contactInfo.linkedin && {
                          p: "Open LinkedIn profile",
                        }),
                      }}
                    />
                  </Box>
                )}
                {navigationHint && (
                  <Box
                    marginTop={1}
                    borderStyle="single"
                    borderColor={theme.terminalGreyMedium}
                  >
                    <Text color={theme.terminalGreyBright}>
                      {navigationHint}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Fragment>
      ) : null}
    </Box>
  );
}
