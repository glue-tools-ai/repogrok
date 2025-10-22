# repogrok

**Pack your entire codebase into a single AI-friendly file.**

Feed your repository to Claude, ChatGPT, Gemini, and other LLMs -- with built-in security scanning, cost estimation, and prompt templates.

## Quick Start

```bash
npx repogrok
```

## Features

- Pack any codebase into a single XML, Markdown, JSON, or plain text file
- Built-in security scanning to prevent accidental secret exposure
- Token counting with LLM cost estimation
- 7 built-in prompt templates (code-review, refactor, document, security, onboard, test, migrate)
- Diff-only mode for PR reviews
- Remote repository support
- Git log inclusion
- Clipboard copy support
- Zero config - works out of the box

## Installation

```bash
npm install -g repogrok
```

## Usage

```bash
# Pack current directory
repogrok

# With a prompt template
repogrok --prompt code-review

# Pack only changed files
repogrok --diff

# See costs
repogrok --cost

# Copy to clipboard
repogrok --copy

# Pack a remote repo
repogrok --remote facebook/react
```

## License

MIT
