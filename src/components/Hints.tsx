import { Box, Text } from "ink";

interface Props {
  hints: Record<string, string>;
}

export function Hints({ hints }: Props) {
  if (!hints || Object.keys(hints).length === 0) {
    return null;
  }

  return (
    <Box borderStyle="single" paddingX={1} marginTop={1}>
      {Object.entries(hints).map(([key, description], index) => (
        <Box key={key} marginLeft={index > 0 ? 2 : 0}>
          <Text color="cyan" bold>
            {key}
          </Text>
          <Text>: {description}</Text>
        </Box>
      ))}
    </Box>
  );
}
