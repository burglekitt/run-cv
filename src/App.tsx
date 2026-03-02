#!/usr/bin/env node
import { Fragment, useState, useEffect } from "react";
import { Text, Box, useInput } from "ink";
import SelectInput from "ink-select-input";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";

import { getHuman, getPage } from "./cvParser";
import { HumanManifest, Page } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { LoadingScreen } from "./components/LoadingScreen";
import { AccessDenied } from "./components/AccessDenied";

interface AppProps {
  name?: string;
}

export function App({ name }: AppProps) {
  const [human, setHuman] = useState<HumanManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Page[]>([]);
  const [gradientColors, setGradientColors] = useState([
    "#00FF00",
    "#008000",
    "#003300",
    "#008000",
    "#00FF00",
  ]);
  const [highlightedItem, setHighlightedItem] = useState<{
    label: string;
    value: string;
  } | null>(null);

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
    // Handle Back navigation
    if (key.escape || (input === "b" && history.length > 1)) {
      if (history.length > 1) {
        setHistory((prev) => prev.slice(0, -1));
      }
    }
    if (input === "q" && (history.length <= 1 || error)) {
      process.exit(0);
    }

    // Handle spacebar selection for menu items
    const currentPage = history.length > 0 ? history[history.length - 1] : null;
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

  const currentPage = history.length > 0 ? history[history.length - 1] : null;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={!loading && error ? "red" : "green"}
      padding={1}
      width={80}
    >
      <Box marginBottom={1}>
        <Gradient colors={!loading && error ? ["red", "red"] : gradientColors}>
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
            <Text color="green">User: {human.name}</Text>
            <Text color="gray"> | </Text>
            <Text color="green">Role: {human.role}</Text>
          </Box>

          <Box
            borderStyle="single"
            borderColor="green"
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
                <Box marginTop={1} borderStyle="single" borderColor="gray">
                  <Text color="gray">
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
