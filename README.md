# repogrok

**Pack your entire codebase into a single AI-friendly file.**

Feed your repository to Claude, ChatGPT, Gemini, and other LLMs -- with built-in security scanning, cost estimation, and prompt templates.

[![npm version](https://img.shields.io/npm/v/repogrok.svg)](https://www.npmjs.com/package/repogrok)
[![npm downloads](https://img.shields.io/npm/dm/repogrok.svg)](https://www.npmjs.com/package/repogrok)
[![license](https://img.shields.io/npm/l/repogrok.svg)](https://github.com/glue-tools-ai/repogrok/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/repogrok.svg)](https://nodejs.org)

---

## Why repogrok?

LLMs work best when they can see your entire codebase at once. But copying and pasting files manually is tedious, error-prone, and dangerous -- you might accidentally send API keys or credentials to a third-party model.

repogrok solves this. One command turns your repository into a single, structured file that is optimized for AI consumption. It scans for secrets before they leave your machine, counts tokens so you know the cost before you paste, and includes prompt templates so the AI knows exactly what to do.

```
npx repogrok
```

That is it. Zero config. Works out of the box.

---

## Quick Start

### Run instantly with npx (no installation required)

```bash
npx repogrok
```

### Or install globally

```bash
# npm
npm install -g repogrok

# yarn
yarn global add repogrok

# homebrew (coming soon)
brew install repogrok
```

### Basic usage

```bash
# Pack the current directory into repogrok-output.xml
repogrok

# Pack with a specific prompt template
repogrok --prompt code-review

# Pack only changed files for a PR review
repogrok --diff

# See token counts and estimated LLM costs
repogrok --tokens

# Copy output directly to clipboard
repogrok --copy

# Pack a remote GitHub repository
repogrok --remote facebook/react
```

---

## Features

### Pack Any Codebase into One File

repogrok traverses your repository, respects your `.gitignore` and `.repogrokignore` rules, and produces a single file with every source file neatly structured. The output includes a file tree, metadata, and the full contents of each file with clear delimiters.

### Multiple Output Formats

Choose the format that works best for your workflow:

| Format   | Flag                | Best For                          |
|----------|---------------------|-----------------------------------|
| XML      | `--format xml`      | Claude, structured parsing        |
| Markdown | `--format markdown` | ChatGPT, human readability        |
| JSON     | `--format json`     | Programmatic access, pipelines    |
| Plain    | `--format plain`    | Simple text, universal compat     |

XML is the default because it provides the clearest structure for most LLMs.

### Built-in Security Scanning

Before your code reaches any LLM, repogrok scans every file for:

- API keys and secret keys
- Passwords and credentials
- Authentication tokens
- Private keys and certificates
- Connection strings with embedded credentials

If a secret is detected, repogrok warns you and excludes the offending content. Your credentials never leave your machine.

### Token Counting with LLM Cost Estimation

Know exactly how much an AI query will cost before you send it:

```bash
repogrok --tokens
```

```
repogrok -- Token & Cost Report
--------------------------------------------
Total files:        142
Total tokens:       87,341

Estimated cost per query:
  Claude Opus 4     $1.31  (input) + ~$0.40 (output)
  Claude Sonnet 4   $0.26  (input) + ~$0.12 (output)
  GPT-4o            $0.22  (input) + ~$0.11 (output)
  Gemini 2.5 Pro    $0.11  (input) + ~$0.07 (output)
--------------------------------------------
```

No more guessing. No more surprise bills.

### Prompt Templates

Skip the prompt engineering. repogrok ships with seven battle-tested templates that tell the LLM exactly what to do with your codebase:

```bash
repogrok --prompt <template>
```

| Template       | What It Does                                                    |
|----------------|-----------------------------------------------------------------|
| `code-review`  | Comprehensive code review with severity-ranked findings         |
| `refactor`     | Identify refactoring opportunities with concrete suggestions    |
| `document`     | Generate documentation for undocumented code                    |
| `security`     | Deep security audit focused on vulnerabilities and exploits     |
| `onboard`      | Produce an onboarding guide for new developers                  |
| `test`         | Generate test cases and identify untested code paths            |
| `migrate`      | Analyze migration paths for frameworks, languages, or versions  |

Each template is carefully crafted to produce actionable, structured output from the LLM.

### Diff-Only Mode

Working on a pull request? Pack only the files that changed:

```bash
repogrok --diff
```

This compares your working tree against the base branch and packs only modified, added, or renamed files. Perfect for focused PR reviews without burning tokens on unchanged code.

### Remote Repository Support

Analyze any public GitHub repository without cloning it first:

```bash
repogrok --remote owner/repo
```

repogrok clones the repository to a temporary directory, packs it, and cleans up after itself.

### Git Log Inclusion

Include recent commit history for additional context:

```bash
repogrok --include-logs
```

The AI can use commit messages to understand why code was written, not just what it does.

### Clipboard Support

Send the output straight to your clipboard, ready to paste into any AI chat interface:

```bash
repogrok --copy
```

### Smart Ignore Rules

repogrok automatically respects your `.gitignore` file. For additional exclusions specific to AI packing, create a `.repogrokignore` file in your project root:

```
# .repogrokignore
node_modules/
dist/
*.min.js
coverage/
*.lock
```

---

## Output Format Example

The default XML output is structured for maximum LLM comprehension:

```xml
<repogrok>
  <meta>
    <repository>my-project</repository>
    <generated>2026-02-16T12:00:00Z</generated>
    <file_count>142</file_count>
    <total_tokens>87341</total_tokens>
  </meta>

  <file_tree>
    src/
      index.ts
      utils/
        helpers.ts
        validate.ts
    package.json
    tsconfig.json
  </file_tree>

  <files>
    <file path="src/index.ts" language="typescript" tokens="342">
      import { helpers } from './utils/helpers';
      import { validate } from './utils/validate';

      export function main() {
        const config = helpers.loadConfig();
        validate(config);
        return config;
      }
    </file>

    <file path="src/utils/helpers.ts" language="typescript" tokens="198">
      export const helpers = {
        loadConfig() {
          // ...
        }
      };
    </file>
  </files>
</repogrok>
```

---

## All CLI Options

```
Usage: repogrok [directory] [options]

Arguments:
  directory                  Target directory (default: current directory)

Output Options:
  -o, --output <file>        Output file path (default: repogrok-output.xml)
  -f, --format <type>        Output format: xml, markdown, json, plain (default: xml)
  --copy                     Copy output to clipboard
  --tokens                   Display token counts and cost estimates

Content Options:
  --prompt <template>        Apply a prompt template: code-review, refactor,
                             document, security, onboard, test, migrate
  --diff                     Pack only changed files (compared to base branch)
  --remote <owner/repo>      Pack a remote GitHub repository
  --include-logs             Include recent git commit history

Filter Options:
  --include <globs>          Include only files matching these patterns
  --exclude <globs>          Exclude files matching these patterns
  --no-gitignore             Do not respect .gitignore rules
  --max-file-size <bytes>    Skip files larger than this size

Security Options:
  --no-security-scan         Disable secret detection (not recommended)

General:
  -v, --version              Show version number
  -h, --help                 Show help
```

---

## Configuration File

For project-specific defaults, create a `repogrok.config.json` in your project root:

```json
{
  "output": "repogrok-output.xml",
  "format": "xml",
  "include": ["src/**", "lib/**", "package.json", "tsconfig.json"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "dist/**"],
  "maxFileSize": 524288,
  "securityScan": true,
  "includeGitLogs": false,
  "prompt": null
}
```

Command-line flags always override configuration file values.

---

## Feature Comparison

| Feature                     | repogrok | Repomix |
|-----------------------------|----------|---------|
| Pack codebase to one file   | Yes      | Yes     |
| XML output                  | Yes      | Yes     |
| Markdown output             | Yes      | Yes     |
| JSON output                 | Yes      | Yes     |
| Plain text output           | Yes      | Yes     |
| Security scanning           | Yes      | Yes     |
| Token counting              | Yes      | Yes     |
| **LLM cost estimation**     | **Yes**  | No      |
| **Built-in prompt templates**| **Yes** | No      |
| **Diff-only mode**          | **Yes**  | No      |
| Remote repo support         | Yes      | Yes     |
| Git log inclusion           | Yes      | No      |
| Clipboard copy              | Yes      | Yes     |
| .gitignore support          | Yes      | Yes     |
| Custom ignore file          | Yes      | Yes     |
| Zero config                 | Yes      | Yes     |

---

## Use Cases

**Code review** -- Pack your PR changes with `--diff --prompt code-review` and get a thorough, structured review from any LLM in seconds.

**Onboarding** -- New to a codebase? Run `repogrok --prompt onboard` and get a complete walkthrough of the architecture, key files, and conventions.

**Security audit** -- Run `repogrok --prompt security` to have an LLM scan your entire codebase for vulnerabilities, injection risks, and insecure patterns.

**Documentation** -- Generate missing documentation across your project with `repogrok --prompt document`.

**Migration planning** -- Evaluating a framework upgrade? Run `repogrok --prompt migrate` to get a detailed migration plan with risk assessment.

**Test generation** -- Identify untested code paths and generate test scaffolding with `repogrok --prompt test`.

**Refactoring** -- Find code smells, duplication, and improvement opportunities with `repogrok --prompt refactor`.

---

## Contributing

Contributions are welcome. Whether it is a bug fix, a new prompt template, an output format improvement, or a documentation update -- we appreciate it.

1. Fork the repository at [github.com/glue-tools-ai/repogrok](https://github.com/glue-tools-ai/repogrok)
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m "Add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a pull request

Please open an issue first for major changes so we can discuss the approach.

---

## License

MIT -- see [LICENSE](./LICENSE) for details.

---

## Built by Glue

repogrok is built and maintained by [Glue](https://getglueapp.com). We build developer tools that make working with AI practical, safe, and efficient.

[getglueapp.com](https://getglueapp.com) | [GitHub](https://github.com/glue-tools-ai) | [npm](https://www.npmjs.com/package/repogrok)
