import { Box, Text } from "ink";
import { marked, type Token, type Tokens } from "marked";
import { Fragment, type ReactNode, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ListItemWithId, TokenWithId } from "../types";

function unescapeText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// This is a simplified recursive renderer for marked tokens.
function renderTokens(tokens: TokenWithId[] | undefined): ReactNode {
  if (!tokens) {
    return null;
  }

  return tokens.map((token: TokenWithId) => {
    switch (token.type) {
      case "heading":
        return (
          <Box key={token.id} marginBottom={1}>
            <Text bold color="green">
              {renderTokens(token.tokens as TokenWithId[] | undefined)}
            </Text>
          </Box>
        );
      case "paragraph":
        return (
          <Box key={token.id} marginBottom={1}>
            <Text color="green">
              {renderTokens(token.tokens as TokenWithId[] | undefined)}
            </Text>
          </Box>
        );
      case "list":
        return (
          <Box key={token.id} flexDirection="column" marginBottom={1}>
            {(token.items as ListItemWithId[] | undefined)?.map((item) => {
              const elements: ReactNode[] = [];
              let inlineTokens: TokenWithId[] = [];

              const flushInline = () => {
                if (inlineTokens.length > 0) {
                  const inlineKey = `inline-${elements.length}`;
                  elements.push(
                    <Text key={inlineKey} color="green">
                      {renderTokens(inlineTokens)}
                    </Text>,
                  );
                  inlineTokens = [];
                }
              };

              (item.tokens as TokenWithId[]).forEach((t) => {
                if (
                  t.type === "heading" ||
                  t.type === "paragraph" ||
                  t.type === "list" ||
                  t.type === "space"
                ) {
                  flushInline();
                  const blockKey = `block-${elements.length}`;
                  elements.push(
                    <Fragment key={blockKey}>{renderTokens([t])}</Fragment>,
                  );
                } else {
                  inlineTokens.push(t);
                }
              });
              flushInline();

              return (
                <Box key={item.id} flexDirection="row" paddingLeft={2}>
                  <Box marginRight={1}>
                    <Text color="green">-</Text>
                  </Box>
                  <Box flexDirection="column">{elements}</Box>
                </Box>
              );
            })}
          </Box>
        );
      case "strong":
        return (
          <Text key={token.id} bold>
            {renderTokens(token.tokens as TokenWithId[] | undefined)}
          </Text>
        );
      case "em":
        return (
          <Text key={token.id} italic>
            {renderTokens(token.tokens as TokenWithId[] | undefined)}
          </Text>
        );
      case "text":
        // marked.js can escape html entities, so we unescape them
        return <Text key={token.id}>{unescapeText(token.text)}</Text>;
      case "space":
        return <Box key={token.id} marginTop={1} />;
      default:
        return null;
    }
  });
}

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  const tokensWithIds = useMemo((): TokenWithId[] => {
    const tokens = marked.lexer(content);

    const addId = (token: Token): TokenWithId => {
      const baseToken = { ...token, id: uuidv4() } as TokenWithId;

      if ("tokens" in baseToken && baseToken.tokens) {
        baseToken.tokens = baseToken.tokens.map(addId);
      }

      if (
        baseToken.type === "list" &&
        "items" in baseToken &&
        baseToken.items
      ) {
        baseToken.items = baseToken.items.map((item: Tokens.ListItem) => {
          const itemWithId = { ...item, id: uuidv4() } as ListItemWithId;
          if (item.tokens) {
            itemWithId.tokens = item.tokens.map(addId);
          }
          return itemWithId;
        });
      }

      return baseToken;
    };

    return tokens.map(addId);
  }, [content]);

  return <>{renderTokens(tokensWithIds)}</>;
}
