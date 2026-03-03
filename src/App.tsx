#!/usr/bin/env node
import { Fragment, useState, useEffect } from "react";
import { Text, Box, useInput } from "ink";
import SelectInput from "ink-select-input";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import open from "open";
import { getHuman, getPage } from "./cvParser";
import { HumanManifest, Page } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { LoadingScreen } from "./components/LoadingScreen";
import { AccessDenied } from "./components/AccessDenied";
import { Hints } from "./components/Hints";
import { grabEmailPattern, grabLinkedInPattern } from "./utils/regex-utils";
import { theme } from "./styles/theme";

interface AppProps {
  name?: string;
}

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
  const [highlightedItem, setHighlightedItem] = useState<{
    label: string;
    value: string;
  } | null>(null);
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
      } catch (err) {
        setError("ACCESS DENIED");
      }
    };
    load();
  }, [name]);

  const currentPage = history.length > 0 ? history[history.length - 1] : null;
  const isContactPage = currentPage?.file === "contact.md";

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
    // Global navigation should always work
    if (key.escape || (input === "b" && history.length > 1)) {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
      }
      return;
    }
    if (input === "q" && (history.length <= 1 || error)) {
      process.exit(0);
    }

    // If on a contact page, handle command input
    if (isContactPage) {
      if (input === "m" && contactInfo.email) {
        const subject = encodeURIComponent("Accessed run-cv, initiating comms");
        const body = encodeURIComponent(
          "Having navigated the digital tapestry of your run-cv, I'm reaching out to establish a more direct line of communication. I'm impressed with what I've seen and would like to discuss potential opportunities.",
        );
        open(`mailto:${contactInfo.email}?subject=${subject}&body=${body}`, {
          app: { name: "Mail" },
        });
      } else if (input === "p" && contactInfo.linkedin) {
        open(contactInfo.linkedin);
      }
      return;
    }

    // Handle spacebar selection for menu items
    if (input === " " && currentPage?.menu && highlightedItem) {
      handleSelect(highlightedItem);
    }
  });

  async function handleSelect(item: { value: string }) {
    const currentPage = history[history.length - 1];
    try {
      const nextPage = await getPage(currentPage.dir, item.value);
      setHistory((prev) => [...prev, nextPage]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

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
          <Box marginBottom={1}>
            <Text color={theme.terminalGreenBright}>User: {human.name}</Text>
            <Text color="gray"> | </Text>
            <Text color={theme.terminalGreenMedium}>Role: {human.role}</Text>
          </Box>

          <Box
            borderStyle="single"
            borderColor={theme.terminalGreenBright}
            padding={1}
            minHeight={15}
          >
            {currentPage.menu ? (
              <Box flexDirection="column">
                <MarkdownRenderer content={currentPage.content} />
                <Box marginTop={1}>
                  <SelectInput
                    items={currentPage.menu.map((item) => ({
                      label: item.label,
                      value: item.file,
                    }))}
                    onSelect={handleSelect}
                    onHighlight={setHighlightedItem}
                    limit={10}
                  />
                </Box>
                <Box marginTop={1} borderStyle="single" borderColor="gray">
                  <Text color="gray">
                    {history.length > 1
                      ? "Press [ESC] or 'b' to go back"
                      : "Press 'q' to quit"}
                  </Text>
                </Box>
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
                <Box
                  marginTop={1}
                  borderStyle="single"
                  borderColor={theme.terminalGreyMedium}
                >
                  <Text color={theme.terminalGreyBright}>
                    {history.length > 1
                      ? "Press [ESC] or 'b' to go back"
                      : "Press 'q' to quit"}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        </Fragment>
      ) : null}
    </Box>
  );
}
