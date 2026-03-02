#!/usr/bin/env node

import { render } from "ink";
import meow from "meow";
import { App } from "./App";

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

render(<App name={cli.input[0]} />);
