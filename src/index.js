#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const scanPackage = require('./scanners/package');
const scanFrameworks = require('./scanners/framework');
const scanTypescript = require('./scanners/typescript');
const scanLinting = require('./scanners/linting');
const scanTesting = require('./scanners/testing');
const scanGit = require('./scanners/git');
const scanStructure = require('./scanners/structure');
const scanCI = require('./scanners/ci');
const generate = require('./generator');

const pkg = require('../package.json');

const program = new Command();

program
  .name('claude-gen')
  .description(chalk.bold('Auto-generate CLAUDE.md from any codebase'))
  .version(pkg.version);

program
  .command('scan')
  .description('Scan a project and generate CLAUDE.md')
  .argument('[directory]', 'Project directory to scan', '.')
  .option('-o, --output <path>', 'Output path for CLAUDE.md (default: <directory>/CLAUDE.md)')
  .option('--stdout', 'Print to stdout instead of writing a file')
  .option('--merge', 'Merge with existing CLAUDE.md instead of overwriting')
  .option('--json', 'Output raw scan data as JSON')
  .action(scanCommand);

// Also make scan the default when no command is given
program
  .argument('[directory]', 'Project directory to scan', '.')
  .option('-o, --output <path>', 'Output path for CLAUDE.md')
  .option('--stdout', 'Print to stdout instead of writing a file')
  .option('--merge', 'Merge with existing CLAUDE.md instead of overwriting')
  .option('--json', 'Output raw scan data as JSON')
  .action(scanCommand);

async function scanCommand(directory, options) {
  const projectDir = path.resolve(directory || '.');

  if (!fs.existsSync(projectDir)) {
    console.error(chalk.red(`Directory not found: ${projectDir}`));
    process.exit(1);
  }

  if (!options.stdout && !options.json) {
    console.log(chalk.bold.cyan('\n  claude-gen') + chalk.dim(' — scanning project...\n'));
  }

  // Run all scanners
  const packageFacts = scanPackage(projectDir);
  const frameworkFacts = scanFrameworks(projectDir, packageFacts);
  const typescriptFacts = scanTypescript(projectDir);
  const lintingFacts = scanLinting(projectDir, packageFacts);
  const testingFacts = scanTesting(projectDir, packageFacts);
  const gitFacts = scanGit(projectDir);
  const structureFacts = scanStructure(projectDir);
  const ciFacts = scanCI(projectDir);

  const allFacts = {
    pkg: packageFacts,
    framework: frameworkFacts,
    typescript: typescriptFacts,
    linting: lintingFacts,
    testing: testingFacts,
    git: gitFacts,
    structure: structureFacts,
    ci: ciFacts,
  };

  // JSON output mode
  if (options.json) {
    console.log(JSON.stringify(allFacts, null, 2));
    return;
  }

  // Print scan results
  if (!options.stdout) {
    printScanSummary(allFacts);
  }

  // Generate CLAUDE.md
  let content = generate(allFacts);

  // Merge mode
  if (options.merge) {
    const outputPath = options.output || path.join(projectDir, 'CLAUDE.md');
    if (fs.existsSync(outputPath)) {
      const existing = fs.readFileSync(outputPath, 'utf-8');
      content = mergeClaudeMd(existing, content);
      if (!options.stdout) {
        console.log(chalk.dim('  Merging with existing CLAUDE.md...\n'));
      }
    }
  }

  // Output
  if (options.stdout) {
    console.log(content);
    return;
  }

  const outputPath = options.output || path.join(projectDir, 'CLAUDE.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(chalk.green(`  Written to ${outputPath}`));

  const lineCount = content.split('\n').length;
  console.log(chalk.dim(`  ${lineCount} lines generated\n`));
}

function printScanSummary(facts) {
  const { pkg, framework, typescript, linting, testing, git, structure, ci } = facts;

  // Language & package manager
  if (pkg.language) {
    console.log(chalk.dim('  Language:    ') + chalk.white(pkg.language));
  }
  if (pkg.packageManager) {
    console.log(chalk.dim('  Pkg manager: ') + chalk.white(pkg.packageManager));
  }

  // Frameworks
  if (framework.frameworks.length > 0) {
    console.log(chalk.dim('  Frameworks:  ') + chalk.cyan(framework.frameworks.join(', ')));
  }

  // TypeScript
  if (typescript.enabled) {
    console.log(chalk.dim('  TypeScript:  ') + chalk.white(typescript.strict ? 'strict' : 'enabled'));
  }

  // Testing
  if (testing.framework) {
    const e2e = testing.e2eFramework ? ` + ${testing.e2eFramework}` : '';
    console.log(chalk.dim('  Testing:     ') + chalk.white(`${testing.framework}${e2e}`));
  }

  // Linting
  const linters = [];
  if (linting.eslint) linters.push('ESLint');
  if (linting.prettier) linters.push('Prettier');
  if (linting.biome) linters.push('Biome');
  if (linters.length > 0) {
    console.log(chalk.dim('  Linting:     ') + chalk.white(linters.join(' + ')));
  }

  // CI/CD
  if (ci.ci) {
    console.log(chalk.dim('  CI:          ') + chalk.white(ci.ci));
  }
  if (ci.deployment) {
    console.log(chalk.dim('  Deploy:      ') + chalk.white(ci.deployment));
  }

  // Git
  if (git.isGitRepo) {
    const details = [];
    if (git.totalCommits) details.push(`${git.totalCommits} commits`);
    if (git.contributors) details.push(`${git.contributors} contributors`);
    if (git.commitConvention) details.push(git.commitConvention);
    if (details.length) {
      console.log(chalk.dim('  Git:         ') + chalk.white(details.join(', ')));
    }
  }

  // Structure
  if (structure.hasMonorepo) {
    console.log(chalk.dim('  Structure:   ') + chalk.yellow('monorepo'));
  }
  console.log(chalk.dim('  Files:       ') + chalk.white(`~${structure.totalFiles} (scanned 3 levels)`));

  console.log();
}

/**
 * Merge generated CLAUDE.md with existing one.
 * Strategy: keep existing custom sections, update generated sections.
 */
function mergeClaudeMd(existing, generated) {
  const existingSections = parseSections(existing);
  const generatedSections = parseSections(generated);

  const generatedHeadings = new Set(generatedSections.map(s => s.heading));
  const merged = [];

  // Add generated sections first
  for (const section of generatedSections) {
    merged.push(section.raw);
  }

  // Then add any existing custom sections not in generated
  for (const section of existingSections) {
    if (!generatedHeadings.has(section.heading)) {
      merged.push(section.raw);
    }
  }

  return merged.join('\n\n');
}

function parseSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = { heading: null, raw: '', lines: [] };

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) {
      if (current.heading || current.lines.length) {
        current.raw = current.lines.join('\n').trim();
        if (current.raw) sections.push({ ...current });
      }
      current = { heading: match[1].trim(), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.lines.length) {
    current.raw = current.lines.join('\n').trim();
    if (current.raw) sections.push({ ...current });
  }

  return sections;
}

program.parse();
