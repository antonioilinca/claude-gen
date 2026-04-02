const fs = require('fs');
const path = require('path');

/**
 * Scan directory structure to understand project architecture.
 */

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.svelte-kit', 'dist', 'build',
  'out', '.output', '.vercel', '.turbo', 'coverage', '.cache', '__pycache__',
  'venv', '.venv', 'env', '.env', 'target', 'vendor', '.idea', '.vscode',
  '.DS_Store', '.pytest_cache', '.mypy_cache', 'eggs', '*.egg-info',
]);

module.exports = function scanStructure(projectDir) {
  const facts = {
    topLevelDirs: [],
    topLevelFiles: [],
    keyPaths: {},
    totalFiles: 0,
    hasMonorepo: false,
    envFiles: [],
  };

  try {
    const entries = fs.readdirSync(projectDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env' && entry.name !== '.env.example' && entry.name !== '.env.local') {
        // Track dotfiles that matter
        if (['.eslintrc.js', '.prettierrc', '.dockerignore', '.editorconfig', '.nvmrc', '.node-version', '.python-version', '.tool-versions'].includes(entry.name)) {
          facts.topLevelFiles.push(entry.name);
        }
        continue;
      }

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          facts.topLevelDirs.push(entry.name);
        }
      } else {
        facts.topLevelFiles.push(entry.name);
      }
    }
  } catch {}

  // Detect key architectural paths
  const keyPathChecks = {
    'src/app': 'Next.js App Router directory',
    'src/pages': 'Pages directory',
    'src/components': 'React components',
    'src/lib': 'Shared library code',
    'src/utils': 'Utility functions',
    'src/hooks': 'Custom React hooks',
    'src/styles': 'Stylesheets',
    'src/types': 'TypeScript type definitions',
    'src/api': 'API routes/handlers',
    'src/services': 'Service layer',
    'src/store': 'State management',
    'src/context': 'React context providers',
    'src/middleware': 'Middleware',
    'src/config': 'Configuration files',
    'src/constants': 'Constants',
    'src/schemas': 'Validation schemas',
    'src/db': 'Database layer',
    'app': 'Next.js App Router directory (root)',
    'pages': 'Pages directory (root)',
    'pages/api': 'API routes (Pages Router)',
    'components': 'Components (root)',
    'lib': 'Library code (root)',
    'utils': 'Utilities (root)',
    'public': 'Static assets',
    'static': 'Static files',
    'assets': 'Asset files',
    'prisma': 'Prisma schema and migrations',
    'drizzle': 'Drizzle migrations',
    'supabase': 'Supabase config and migrations',
    'migrations': 'Database migrations',
    'scripts': 'Build/utility scripts',
    'docs': 'Documentation',
    'packages': 'Monorepo packages',
    'apps': 'Monorepo apps',
  };

  for (const [p, desc] of Object.entries(keyPathChecks)) {
    const full = path.join(projectDir, p);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      facts.keyPaths[p] = desc;
    }
  }

  // Detect monorepo
  facts.hasMonorepo = fs.existsSync(path.join(projectDir, 'packages'))
    || fs.existsSync(path.join(projectDir, 'apps'))
    || fs.existsSync(path.join(projectDir, 'turbo.json'))
    || fs.existsSync(path.join(projectDir, 'nx.json'))
    || fs.existsSync(path.join(projectDir, 'pnpm-workspace.yaml'))
    || fs.existsSync(path.join(projectDir, 'lerna.json'));

  // Detect env files
  const envPatterns = ['.env', '.env.local', '.env.example', '.env.development', '.env.production', '.env.test'];
  for (const e of envPatterns) {
    if (fs.existsSync(path.join(projectDir, e))) {
      facts.envFiles.push(e);
    }
  }

  // Count total files (quick estimate, max 2 levels deep)
  facts.totalFiles = countFiles(projectDir, 0, 3);

  return facts;
};

function countFiles(dir, depth, maxDepth) {
  if (depth >= maxDepth) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      if (entry.isFile()) count++;
      else if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name), depth + 1, maxDepth);
    }
  } catch {}
  return count;
}
