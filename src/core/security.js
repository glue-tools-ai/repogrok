// Lightweight secret detection without heavy secretlint dependency
// Checks for common patterns that indicate secrets

const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', pattern: /[A-Za-z0-9/+=]{40}(?=\s|$|")/ },
  { name: 'GitHub Token', pattern: /gh[ps]_[A-Za-z0-9_]{36,}/ },
  { name: 'Generic API Key', pattern: /['"](sk-[A-Za-z0-9]{32,})['"]/  },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: 'Generic Secret', pattern: /['"]?(?:secret|password|passwd|token|api[_-]?key)\s*[:=]\s*['"][^\s'"]{8,}['"]/i },
  { name: 'Connection String', pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+:[^\s'"]+@/ },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]+/ },
];

export async function scanForSecrets(files, config) {
  if (!config.security.enableSecurityCheck) {
    return { safeFiles: files, suspiciousFiles: [] };
  }

  const safeFiles = [];
  const suspiciousFiles = [];

  for (const file of files) {
    let isSuspicious = false;
    const matches = [];

    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(file.content)) {
        isSuspicious = true;
        matches.push(name);
      }
    }

    if (isSuspicious) {
      suspiciousFiles.push({ path: file.path, reasons: matches });
    } else {
      safeFiles.push(file);
    }
  }

  return { safeFiles, suspiciousFiles };
}
