const TEMPLATES = {
  'code-review': `Please review this codebase thoroughly. Focus on:
1. Potential bugs and logic errors
2. Security vulnerabilities (injection, XSS, auth issues)
3. Performance bottlenecks
4. Code quality and maintainability issues
5. Missing error handling
6. Adherence to best practices

For each issue found, provide:
- File and approximate location
- Severity (critical/high/medium/low)
- Description of the issue
- Suggested fix`,

  'refactor': `Analyze this codebase and identify refactoring opportunities. Focus on:
1. Code duplication that should be extracted into shared functions
2. Functions/classes that are too large and should be split
3. Unclear naming that hurts readability
4. Architectural improvements
5. Design pattern opportunities
6. Dead code that can be removed

Prioritize suggestions by impact and provide concrete refactoring steps.`,

  'document': `Generate comprehensive documentation for this codebase. Include:
1. Project overview and purpose
2. Architecture description
3. Key modules and their responsibilities
4. API reference for public functions/classes
5. Data flow diagrams (in text/mermaid format)
6. Setup and development instructions
7. Configuration options

Write the documentation in Markdown format, suitable for a README or docs/ directory.`,

  'security': `Perform a thorough security audit of this codebase. Check for:
1. Injection vulnerabilities (SQL, command, XSS, etc.)
2. Authentication and authorization flaws
3. Sensitive data exposure
4. Insecure dependencies
5. Cryptographic weaknesses
6. Input validation gaps
7. Error handling that leaks information
8. CORS and CSP misconfigurations

Rate each finding by severity and provide remediation steps.`,

  'onboard': `You are helping a new developer understand this codebase. Provide:
1. A high-level overview of what this project does
2. The tech stack and key dependencies
3. The project structure and what each directory contains
4. The main entry points and execution flow
5. Key concepts and domain terms
6. How to set up the development environment
7. Common tasks (adding a feature, fixing a bug, running tests)
8. Areas of complexity that need extra attention

Write in a friendly, approachable tone as if explaining to a colleague on their first day.`,

  'test': `Analyze this codebase and generate a comprehensive test plan. Include:
1. Unit tests for core functions and classes
2. Integration tests for module interactions
3. Edge cases and error scenarios
4. Suggested test framework and setup
5. Mock strategies for external dependencies

Provide actual test code examples for the most critical paths.`,

  'migrate': `Analyze this codebase for migration opportunities. Identify:
1. Outdated dependencies that need upgrading
2. Deprecated APIs or patterns in use
3. Opportunities to modernize (e.g., callbacks to async/await)
4. Framework version migration paths
5. Breaking changes to watch for

Provide a prioritized migration roadmap with estimated effort.`,
};

export function getPromptTemplate(name) {
  const template = TEMPLATES[name];
  if (!template) {
    const available = Object.keys(TEMPLATES).join(', ');
    throw new Error(`Unknown prompt template: "${name}". Available: ${available}`);
  }
  return template;
}

export function listPromptTemplates() {
  return Object.keys(TEMPLATES);
}
