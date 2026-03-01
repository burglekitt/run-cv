import { ReactNode } from "react";
import { Box, Text } from "ink";
import { marked, Token, Tokens } from "marked";

const unescape = (text: string): string => {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

// This is a simplified recursive renderer for marked tokens.
const renderTokens = (tokens: Token[] | undefined): ReactNode => {
  if (!tokens) {
    return null;
  }

  return tokens.map((token, index) => {
    switch (token.type) {
      case "heading":
        return (
          <Box key={index} marginBottom={1}>
            <Text bold color="green">
              {renderTokens(token.tokens)}
            </Text>
          </Box>
        );
      case "paragraph":
        return (
          <Box key={index} marginBottom={1}>
            <Text color="green">{renderTokens(token.tokens)}</Text>
          </Box>
        );
      case "list":
        return (
          <Box key={index} flexDirection="column" marginBottom={1}>
            {(token as Tokens.List).items.map((item, i) => (
              <Box key={i} paddingLeft={2}>
                <Text color="green">- {renderTokens(item.tokens)}</Text>
              </Box>
            ))}
          </Box>
        );
      case "strong":
        return (
          <Text key={index} bold>
            {renderTokens(token.tokens)}
          </Text>
        );
      case "em":
        return (
          <Text key={index} italic>
            {renderTokens(token.tokens)}
          </Text>
        );
      case "text":
        // marked.js can escape html entities, so we unescape them
        return <Text key={index}>{unescape(token.text)}</Text>;
      case "space":
        return <Box key={index} marginTop={1} />;
      default:
        return null;
    }
  });
};

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  const tokens = marked.lexer(content);
  return <>{renderTokens(tokens)}</>;
}
