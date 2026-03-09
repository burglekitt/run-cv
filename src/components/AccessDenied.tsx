import { Box, Text } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";

export function AccessDenied() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box paddingY={2}>
        <Gradient colors={["#ff0000", "#cc0000"]}>
          <BigText text="ACCESS DENIED" font="tiny" />
        </Gradient>
      </Box>
      <Box marginTop={1}>
        <Text color="red" bold>
          TERMINAL LOCKED. USER UNAUTHORIZED.
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press 'q' to quit</Text>
      </Box>
    </Box>
  );
}
