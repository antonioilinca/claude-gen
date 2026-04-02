const fs = require('fs');
const path = require('path');

/**
 * Scan TypeScript configuration to extract compiler options and conventions.
 */

module.exports = function scanTypescript(projectDir) {
  const facts = {
    enabled: false,
    strict: false,
    config: {},
    paths: null,
    target: null,
    jsx: null,
    baseUrl: null,
  };

  // Check for tsconfig
  const tsconfigPaths = [
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.base.json',
  ];

  let tsconfigPath = null;
  for (const p of tsconfigPaths) {
    const full = path.join(projectDir, p);
    if (fs.existsSync(full)) {
      tsconfigPath = full;
      break;
    }
  }

  if (!tsconfigPath) {
    // Check if .ts files exist even without tsconfig
    const srcDir = path.join(projectDir, 'src');
    if (fs.existsSync(srcDir)) {
      try {
        const files = fs.readdirSync(srcDir);
        facts.enabled = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      } catch {}
    }
    return facts;
  }

  facts.enabled = true;

  try {
    // Strip comments from JSON (tsconfig allows them)
    let content = fs.readFileSync(tsconfigPath, 'utf-8');
    content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // Handle trailing commas
    content = content.replace(/,\s*([\]}])/g, '$1');

    const tsconfig = JSON.parse(content);
    const compilerOptions = tsconfig.compilerOptions || {};

    facts.strict = compilerOptions.strict === true;
    facts.target = compilerOptions.target || null;
    facts.jsx = compilerOptions.jsx || null;
    facts.baseUrl = compilerOptions.baseUrl || null;
    facts.paths = compilerOptions.paths || null;

    // Extract important flags
    facts.config = {
      strict: compilerOptions.strict,
      noUncheckedIndexedAccess: compilerOptions.noUncheckedIndexedAccess,
      exactOptionalPropertyTypes: compilerOptions.exactOptionalPropertyTypes,
      noImplicitReturns: compilerOptions.noImplicitReturns,
      noFallthroughCasesInSwitch: compilerOptions.noFallthroughCasesInSwitch,
      forceConsistentCasingInFileNames: compilerOptions.forceConsistentCasingInFileNames,
      moduleResolution: compilerOptions.moduleResolution,
      module: compilerOptions.module,
      verbatimModuleSyntax: compilerOptions.verbatimModuleSyntax,
    };

    // Clean undefined values
    for (const key of Object.keys(facts.config)) {
      if (facts.config[key] === undefined) delete facts.config[key];
    }
  } catch {}

  return facts;
};
