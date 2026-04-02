const fs = require('fs');
const path = require('path');

/**
 * Detect test frameworks, config, and test commands.
 */

module.exports = function scanTesting(projectDir, packageFacts) {
  const facts = {
    framework: null,
    configFile: null,
    testCommand: null,
    testDirs: [],
    e2eFramework: null,
  };

  const allDeps = [...(packageFacts.dependencies || []), ...(packageFacts.devDependencies || [])];
  const scripts = packageFacts.scripts || {};

  // --- Unit/Integration test frameworks ---
  const testFrameworks = [
    { name: 'Vitest', deps: ['vitest'], configs: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts'] },
    { name: 'Jest', deps: ['jest', '@jest/core'], configs: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs', 'jest.config.cjs'] },
    { name: 'Mocha', deps: ['mocha'], configs: ['.mocharc.yml', '.mocharc.json', '.mocharc.js'] },
    { name: 'Ava', deps: ['ava'], configs: [] },
    { name: 'Pytest', deps: ['pytest'], configs: ['pytest.ini', 'pyproject.toml', 'setup.cfg'] },
    { name: 'Go test', deps: [], configs: [], detect: () => fs.existsSync(path.join(projectDir, 'go.mod')) },
    { name: 'Cargo test', deps: [], configs: [], detect: () => fs.existsSync(path.join(projectDir, 'Cargo.toml')) },
  ];

  for (const tf of testFrameworks) {
    const hasDep = tf.deps.some(d => allDeps.includes(d));
    const hasConfig = tf.configs.some(f => fs.existsSync(path.join(projectDir, f)));
    const detected = tf.detect ? tf.detect() : false;

    if (hasDep || hasConfig || detected) {
      facts.framework = tf.name;
      const foundConfig = tf.configs.find(f => fs.existsSync(path.join(projectDir, f)));
      if (foundConfig) facts.configFile = foundConfig;
      break;
    }
  }

  // --- E2E frameworks ---
  const e2eFrameworks = [
    { name: 'Playwright', deps: ['@playwright/test', 'playwright'], configs: ['playwright.config.ts', 'playwright.config.js'] },
    { name: 'Cypress', deps: ['cypress'], configs: ['cypress.config.ts', 'cypress.config.js', 'cypress.json'] },
    { name: 'Puppeteer', deps: ['puppeteer'], configs: [] },
    { name: 'Selenium', deps: ['selenium-webdriver'], configs: [] },
  ];

  for (const ef of e2eFrameworks) {
    if (ef.deps.some(d => allDeps.includes(d)) || ef.configs.some(f => fs.existsSync(path.join(projectDir, f)))) {
      facts.e2eFramework = ef.name;
      break;
    }
  }

  // --- Detect test directories ---
  const testDirCandidates = ['__tests__', 'tests', 'test', 'spec', 'e2e', 'cypress', 'playwright'];
  for (const d of testDirCandidates) {
    const full = path.join(projectDir, d);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      facts.testDirs.push(d);
    }
    // Also check src/
    const srcFull = path.join(projectDir, 'src', d);
    if (fs.existsSync(srcFull) && fs.statSync(srcFull).isDirectory()) {
      facts.testDirs.push(`src/${d}`);
    }
  }

  // --- Detect test command ---
  if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
    facts.testCommand = `${packageFacts.packageManager || 'npm'} test`;
  } else if (scripts['test:unit']) {
    facts.testCommand = `${packageFacts.packageManager || 'npm'} run test:unit`;
  } else if (facts.framework === 'Pytest') {
    facts.testCommand = 'pytest';
  } else if (facts.framework === 'Go test') {
    facts.testCommand = 'go test ./...';
  } else if (facts.framework === 'Cargo test') {
    facts.testCommand = 'cargo test';
  }

  // E2E command
  if (scripts['test:e2e']) facts.e2eCommand = `${packageFacts.packageManager || 'npm'} run test:e2e`;
  else if (scripts.e2e) facts.e2eCommand = `${packageFacts.packageManager || 'npm'} run e2e`;

  return facts;
};
