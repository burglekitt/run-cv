import { Box, Text } from "ink";
import { theme } from "../styles/theme";

export function SkillBadge({ skill }: { skill: string }) {
  return (
    <Box
      key={skill}
      borderStyle="round"
      paddingX={0} /* tighter fit */
      borderColor={theme.terminalGreenMedium}
    >
      <Text color={theme.terminalGreenMedium}>{skill}</Text>
    </Box>
  );
}
