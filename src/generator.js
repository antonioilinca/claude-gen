/**
 * Generate CLAUDE.md content from collected scan facts.
 * Outputs clean, actionable instructions — no fluff.
 */

module.exports = function generate(facts) {
  const sections = [];

  // === Header ===
  sections.push(generateHeader(facts));

  // === Tech Stack ===
  sections.push(generateStack(facts));

  // === Commands ===
  sections.push(generateCommands(facts));

  // === Architecture ===
  sections.push(generateArchitecture(facts));

  // === Code Conventions ===
  sections.push(generateConventions(facts));

  // === Important Rules ===
  sections.push(generateRules(facts));

  return sections.filter(Boolean).join('\n\n');
};

function generateHeader(facts) {
  const { pkg } = facts;
  const name = pkg.name || 'Project';
  const desc = pkg.description || '';

  let header = `# ${name}`;
  if (desc) header += `\n\n${desc}`;
  return header;
}

function generateStack(facts) {
  const { pkg, framework, typescript } = facts;
  const items = [];

  // Language
  if (pkg.language) items.push(`**Language:** ${pkg.language}${typescript.strict ? ' (strict mode)' : ''}`);

  // Frameworks
  if (framework.frameworks.length > 0) {
    // Group by category
    const primary = framework.frameworks.slice(0, 5);
    items.push(`**Stack:** ${primary.join(', ')}`);
    if (framework.frameworks.length > 5) {
      items.push(`**Also uses:** ${framework.frameworks.slice(5).join(', ')}`);
    }
  }

  // Next.js router detail
  if (framework.nextjsRouter) {
    items.push(`**Router:** ${framework.nextjsRouter}`);
  }

  // Package manager
  if (pkg.packageManager) items.push(`**Package manager:** ${pkg.packageManager}`);

  if (items.length === 0) return null;
  return `## Tech Stack\n\n${items.join('\n')}`;
}

function generateCommands(facts) {
  const { pkg, testing, linting } = facts;
  const commands = [];
  const pm = pkg.packageManager || 'npm';
  const run = pm === 'npm' ? 'npm run' : pm;

  // Dev server
  if (pkg.scripts.dev) commands.push(`- **Dev server:** \`${run} dev\``);
  else if (pkg.scripts.start) commands.push(`- **Dev server:** \`${run} start\``);
  else if (pkg.scripts.serve) commands.push(`- **Dev server:** \`${run} serve\``);

  // Build
  if (pkg.scripts.build) commands.push(`- **Build:** \`${run} build\``);

  // Test
  if (testing.testCommand) {
    commands.push(`- **Test:** \`${testing.testCommand}\``);
  }

  // E2E
  if (testing.e2eCommand) {
    commands.push(`- **E2E tests:** \`${testing.e2eCommand}\``);
  }

  // Lint
  if (linting.lintCommand) {
    commands.push(`- **Lint:** \`${linting.lintCommand}\``);
  }

  // Format
  if (linting.formatCommand) {
    commands.push(`- **Format:** \`${linting.formatCommand}\``);
  }

  // Typecheck
  if (facts.typescript.enabled) {
    if (pkg.scripts.typecheck || pkg.scripts['type-check'] || pkg.scripts.tsc) {
      const cmd = pkg.scripts.typecheck ? 'typecheck' : pkg.scripts['type-check'] ? 'type-check' : 'tsc';
      commands.push(`- **Typecheck:** \`${run} ${cmd}\``);
    } else {
      commands.push(`- **Typecheck:** \`npx tsc --noEmit\``);
    }
  }

  // DB
  if (pkg.scripts['db:push']) commands.push(`- **DB push:** \`${run} db:push\``);
  if (pkg.scripts['db:migrate']) commands.push(`- **DB migrate:** \`${run} db:migrate\``);
  if (pkg.scripts['db:seed']) commands.push(`- **DB seed:** \`${run} db:seed\``);
  if (pkg.scripts['db:generate']) commands.push(`- **DB generate:** \`${run} db:generate\``);
  if (pkg.scripts.generate && !pkg.scripts['db:generate']) commands.push(`- **Generate:** \`${run} generate\``);

  if (commands.length === 0) return null;
  return `## Commands\n\n${commands.join('\n')}`;
}

function generateArchitecture(facts) {
  const { structure } = facts;
  const lines = [];

  if (structure.hasMonorepo) {
    lines.push('This is a **monorepo**.');
    if (structure.keyPaths['packages']) lines.push('- `packages/` — shared packages');
    if (structure.keyPaths['apps']) lines.push('- `apps/` — applications');
  }

  // Key directories
  const keyDirs = Object.entries(structure.keyPaths);
  if (keyDirs.length > 0) {
    if (!structure.hasMonorepo) lines.push('Key directories:');
    else lines.push('\nProject structure:');

    for (const [dir, desc] of keyDirs) {
      if (dir === 'packages' || dir === 'apps') continue; // Already listed
      lines.push(`- \`${dir}/\` — ${desc}`);
    }
  }

  // Env files
  if (structure.envFiles.length > 0) {
    const exampleFile = structure.envFiles.find(f => f.includes('example'));
    if (exampleFile) {
      lines.push(`\nEnvironment: copy \`${exampleFile}\` to \`.env.local\` for local development.`);
    }
  }

  if (lines.length === 0) return null;
  return `## Architecture\n\n${lines.join('\n')}`;
}

function generateConventions(facts) {
  const { typescript, linting, git, framework } = facts;
  const rules = [];

  // TypeScript
  if (typescript.enabled) {
    if (typescript.strict) {
      rules.push('- TypeScript strict mode is enabled — no `any` types, handle all nullable values');
    } else {
      rules.push('- TypeScript is used but strict mode is off');
    }

    if (typescript.paths) {
      const aliases = Object.keys(typescript.paths);
      if (aliases.length > 0) {
        rules.push(`- Path aliases configured: ${aliases.map(a => `\`${a}\``).join(', ')}`);
      }
    }
  }

  // Linting
  if (linting.biome) {
    rules.push('- Biome is used for linting and formatting');
  } else {
    if (linting.eslint) {
      rules.push(`- ESLint is configured (${linting.eslint.configFile})`);
      if (linting.eslint.flatConfig) rules.push('- ESLint uses the flat config format (v9+)');
    }
    if (linting.prettier) {
      let prettierNote = '- Prettier is configured for formatting';
      if (linting.prettier.options) {
        const opts = linting.prettier.options;
        const details = [];
        if (opts.singleQuote !== undefined) details.push(opts.singleQuote ? 'single quotes' : 'double quotes');
        if (opts.semi !== undefined) details.push(opts.semi ? 'semicolons' : 'no semicolons');
        if (opts.tabWidth) details.push(`${opts.tabWidth}-space indent`);
        if (opts.trailingComma) details.push(`trailing commas: ${opts.trailingComma}`);
        if (details.length) prettierNote += ` (${details.join(', ')})`;
      }
      rules.push(prettierNote);
    }
  }

  // Git
  if (git.commitConvention === 'conventional-commits') {
    rules.push('- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)');
  }
  if (facts.ci.hasHusky) {
    rules.push('- Husky git hooks are installed — do not skip with `--no-verify`');
  }
  if (facts.ci.hasCommitlint) {
    rules.push('- Commitlint enforces commit message format');
  }

  // Framework-specific
  if (framework.frameworks.includes('Next.js')) {
    if (framework.nextjsRouter === 'App Router') {
      rules.push('- Use Server Components by default, add `"use client"` only when needed');
    }
  }
  if (framework.frameworks.includes('Tailwind CSS')) {
    rules.push('- Use Tailwind CSS utility classes for styling — avoid custom CSS');
  }

  if (rules.length === 0) return null;
  return `## Code Conventions\n\n${rules.join('\n')}`;
}

function generateRules(facts) {
  const { structure, typescript, testing, linting, ci, framework, pkg } = facts;
  const rules = [];

  // --- Read before edit (universal) ---
  rules.push('- ALWAYS read a file before editing it');

  // --- Testing ---
  if (testing.framework) {
    rules.push(`- Run tests (\`${testing.testCommand || 'npm test'}\`) before committing changes`);

    if (testing.testDirs.length > 0) {
      rules.push(`- Tests live in: ${testing.testDirs.map(d => `\`${d}/\``).join(', ')}`);
    }
  }

  // --- Typecheck ---
  if (typescript.enabled) {
    rules.push('- Ensure TypeScript compiles without errors before committing');
  }

  // --- Lint ---
  if (linting.lintCommand) {
    rules.push(`- Run linter (\`${linting.lintCommand}\`) before committing`);
  }

  // --- Env files ---
  if (structure.envFiles.length > 0) {
    rules.push('- NEVER commit .env files or hardcode secrets — use environment variables');
  }

  // --- Destructive operations ---
  rules.push('- NEVER use `rm -rf`, `git push --force`, or `git reset --hard` without explicit approval');

  // --- Database ---
  if (framework.frameworks.some(f => ['Prisma', 'Drizzle', 'Supabase', 'TypeORM', 'Sequelize', 'SQLAlchemy'].includes(f))) {
    rules.push('- Database migrations require explicit confirmation before running');
  }

  // --- CI ---
  if (ci.ci) {
    rules.push(`- ${ci.ci} is configured — ensure CI passes before merging`);
  }

  // --- Deployment ---
  if (ci.deployment) {
    rules.push(`- Deployment is via ${ci.deployment}`);
  }

  return `## Rules\n\n${rules.join('\n')}`;
}
