#!/usr/bin/env node
import { useState, useEffect } from "react";
import { render, Text, Box, useInput } from "ink";
import SelectInput from "ink-select-input";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import meow from "meow";
import { getHuman, getPage } from "./cvParser";
import { HumanManifest, Page } from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";

const cli = meow(
  `
	Usage
	  $ run-cv <name>

	Examples
	  $ run-cv willow
	  $ run-cv madmardigan
`,
  {
    importMeta: import.meta,
  },
);

function App({ name }: { name?: string }) {
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
        setError((err as Error).message);
      }
      setLoading(false);
    };
    load();
  }, [name]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => process.exit(1), 0);
      return () => clearTimeout(t);
    }
  }, [error]);

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
    if (input === "q" && history.length === 1) {
      process.exit(0);
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

  if (loading) return <Text color="green">Initializing sequence...</Text>;

  if (error) return <Text color="red">ERROR: {error}</Text>;

  if (!human) return null;

  const currentPage = history[history.length - 1];

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="green"
      padding={1}
      width={80}
    >
      <Box marginBottom={1}>
        <Gradient colors={gradientColors}>
          <BigText text="RUN-CV" font="tiny" />
        </Gradient>
      </Box>

      <Box marginBottom={1}>
        <Text color="green">User: {human.name}</Text>
        <Text color="gray"> | </Text>
        <Text color="green">Role: {human.role}</Text>
      </Box>

      <Box borderStyle="single" borderColor="green" padding={1} minHeight={15}>
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
                limit={10}
              />
            </Box>
            <Box marginTop={1} borderStyle="single" borderColor="gray">
              <Text color="gray">Press [ESC] or 'b' to go back</Text>
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            <MarkdownRenderer content={currentPage.content} />
            <Box marginTop={1} borderStyle="single" borderColor="gray">
              <Text color="gray">Press [ESC] or 'b' to go back</Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

render(<App name={cli.input[0]} />);
