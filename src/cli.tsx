#!/usr/bin/env node

import { render } from "ink";
import meow from "meow";
import { App } from "./App";

async function main() {
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

  const { waitUntilExit } = render(<App name={cli.input[0]} />);

  await waitUntilExit();
  process.stdout.write("\x1B[3J\x1B[2J\x1B[H");
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
  }
  process.exit(1);
});
