#!/usr/bin/env node
import { useState, useEffect } from "react";
import { render, Text, Box, useInput } from "ink";
import SelectInput from "ink-select-input";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import meow from "meow";
import { getHuman, getSectionContent } from "./cvParser";
import { HumanManifest } from "./types";

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

const App = ({ name }: { name?: string }) => {
  const [human, setHuman] = useState<HumanManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"home" | "section">("home");
  const [sectionContent, setSectionContent] = useState<string>("");
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
    if (view === "section" && (key.escape || key.backspace)) {
      setView("home");
    }
    if (input === "q" && view === "home") {
      process.exit(0);
    }
  });

  const handleSelect = async (item: { value: string }) => {
    if (!human) return;
    const content = await getSectionContent(human.dir, item.value);
    setSectionContent(content);
    setView("section");
  };

  if (loading) return <Text color="green">Initializing sequence...</Text>;

  if (error) return <Text color="red">ERROR: {error}</Text>;

  if (!human) return null;

  const menuItems = human.menu.map((item) => ({
    label: item.label,
    value: item.file,
  }));

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
        {view === "home" ? (
          <Box flexDirection="column">
            <Text color="green" dimColor>
              {human.introContent}
            </Text>
            <Box marginTop={1}>
              <SelectInput items={menuItems} onSelect={handleSelect} />
            </Box>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text color="green">{sectionContent}</Text>
            <Box marginTop={1} borderStyle="single" borderColor="gray">
              <Text color="gray">Press [ESC] to return to main menu</Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

render(<App name={cli.input[0]} />);
