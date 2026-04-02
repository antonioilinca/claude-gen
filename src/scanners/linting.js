const fs = require('fs');
const path = require('path');

/**
 * Scan linting and formatting configuration.
 */

module.exports = function scanLinting(projectDir, packageFacts) {
  const facts = {
    eslint: null,
    prettier: null,
    biome: null,
    stylelint: null,
    lintCommand: null,
    formatCommand: null,
  };

  const allDeps = [...(packageFacts.dependencies || []), ...(packageFacts.devDependencies || [])];
  const scripts = packageFacts.scripts || {};

  // --- ESLint ---
  const eslintConfigs = [
    'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
    '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', '.eslintrc',
  ];

  for (const f of eslintConfigs) {
    if (fs.existsSync(path.join(projectDir, f))) {
      facts.eslint = { configFile: f, plugins: [] };

      // Detect ESLint plugins from deps
      const eslintPlugins = allDeps.filter(d => d.startsWith('eslint-plugin-') || d.startsWith('@typescript-eslint'));
      facts.eslint.plugins = eslintPlugins;

      // Detect flat config (ESLint 9+)
      if (f.startsWith('eslint.config')) {
        facts.eslint.flatConfig = true;
      }
      break;
    }
  }

  // ESLint in package.json
  if (!facts.eslint && allDeps.includes('eslint')) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
      if (pkg.eslintConfig) {
        facts.eslint = { configFile: 'package.json (eslintConfig)', plugins: [] };
      }
    } catch {}
  }

  // --- Prettier ---
  const prettierConfigs = [
    '.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.mjs',
    '.prettierrc.json', '.prettierrc.yml', '.prettierrc.yaml',
    'prettier.config.js', 'prettier.config.mjs', 'prettier.config.cjs',
  ];

  for (const f of prettierConfigs) {
    if (fs.existsSync(path.join(projectDir, f))) {
      facts.prettier = { configFile: f };

      // Try to read some options
      if (f.endsWith('.json') || f === '.prettierrc') {
        try {
          const content = fs.readFileSync(path.join(projectDir, f), 'utf-8');
          const config = JSON.parse(content);
          facts.prettier.options = {
            semi: config.semi,
            singleQuote: config.singleQuote,
            tabWidth: config.tabWidth,
            trailingComma: config.trailingComma,
            printWidth: config.printWidth,
          };
          // Remove undefined
          for (const k of Object.keys(facts.prettier.options)) {
            if (facts.prettier.options[k] === undefined) delete facts.prettier.options[k];
          }
        } catch {}
      }
      break;
    }
  }

  if (!facts.prettier && allDeps.includes('prettier')) {
    facts.prettier = { configFile: null };
  }

  // --- Biome ---
  if (fs.existsSync(path.join(projectDir, 'biome.json')) || fs.existsSync(path.join(projectDir, 'biome.jsonc'))) {
    facts.biome = { configFile: fs.existsSync(path.join(projectDir, 'biome.json')) ? 'biome.json' : 'biome.jsonc' };
  } else if (allDeps.includes('@biomejs/biome')) {
    facts.biome = { configFile: null };
  }

  // --- Detect lint/format commands from scripts ---
  if (scripts.lint) facts.lintCommand = `${packageFacts.packageManager || 'npm'} run lint`;
  else if (scripts['lint:fix']) facts.lintCommand = `${packageFacts.packageManager || 'npm'} run lint:fix`;

  if (scripts.format) facts.formatCommand = `${packageFacts.packageManager || 'npm'} run format`;
  else if (scripts.prettier) facts.formatCommand = `${packageFacts.packageManager || 'npm'} run prettier`;

  return facts;
};
