import { Box, Text } from "ink";
import { useEffect, useState } from "react";

const LOADING_TIME = 200;
const UPDATE_INTERVAL = LOADING_TIME / 100;

// Simple fake loading bar component
export function LoadingScreen({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      onFinished();
    }
  }, [progress, onFinished]);

  const width = 20;
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text color="green">INITIALIZING SYSTEM...</Text>
      <Text color="green">
        [{"=".repeat(filled)}
        {" ".repeat(empty)}] {progress}%
      </Text>
    </Box>
  );
}
