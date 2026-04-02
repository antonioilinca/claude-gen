const fs = require('fs');
const path = require('path');

/**
 * Scan package.json (or pyproject.toml, Cargo.toml, go.mod, etc.)
 * to extract project metadata, dependencies, and scripts.
 */

module.exports = function scanPackage(projectDir) {
  const facts = {
    name: null,
    description: null,
    language: null,
    packageManager: null,
    scripts: {},
    dependencies: [],
    devDependencies: [],
  };

  // --- Node.js ---
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      facts.name = pkg.name || null;
      facts.description = pkg.description || null;
      facts.language = 'TypeScript/JavaScript';
      facts.scripts = pkg.scripts || {};
      facts.dependencies = Object.keys(pkg.dependencies || {});
      facts.devDependencies = Object.keys(pkg.devDependencies || {});

      // Detect package manager
      if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
        facts.packageManager = 'pnpm';
      } else if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
        facts.packageManager = 'yarn';
      } else if (fs.existsSync(path.join(projectDir, 'bun.lockb')) || fs.existsSync(path.join(projectDir, 'bun.lock'))) {
        facts.packageManager = 'bun';
      } else {
        facts.packageManager = 'npm';
      }
    } catch {}
  }

  // --- Python ---
  const pyprojectPath = path.join(projectDir, 'pyproject.toml');
  const requirementsPath = path.join(projectDir, 'requirements.txt');
  const setupPyPath = path.join(projectDir, 'setup.py');

  if (fs.existsSync(pyprojectPath)) {
    facts.language = facts.language || 'Python';
    try {
      const content = fs.readFileSync(pyprojectPath, 'utf-8');
      const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
      if (nameMatch) facts.name = facts.name || nameMatch[1];
      const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
      if (descMatch) facts.description = facts.description || descMatch[1];

      // Detect package manager
      if (fs.existsSync(path.join(projectDir, 'poetry.lock'))) {
        facts.packageManager = facts.packageManager || 'poetry';
      } else if (fs.existsSync(path.join(projectDir, 'uv.lock'))) {
        facts.packageManager = facts.packageManager || 'uv';
      } else if (fs.existsSync(path.join(projectDir, 'Pipfile.lock'))) {
        facts.packageManager = facts.packageManager || 'pipenv';
      } else {
        facts.packageManager = facts.packageManager || 'pip';
      }

      // Extract deps from pyproject
      const depsSection = content.match(/\[project\][\s\S]*?dependencies\s*=\s*\[([\s\S]*?)\]/);
      if (depsSection) {
        const deps = depsSection[1].match(/"([^"]+)"/g);
        if (deps) facts.dependencies.push(...deps.map(d => d.replace(/"/g, '').split(/[>=<]/)[0].trim()));
      }
    } catch {}
  } else if (fs.existsSync(requirementsPath)) {
    facts.language = facts.language || 'Python';
    facts.packageManager = facts.packageManager || 'pip';
    try {
      const content = fs.readFileSync(requirementsPath, 'utf-8');
      const deps = content.split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-'))
        .map(l => l.split(/[>=<\[]/)[0].trim());
      facts.dependencies.push(...deps);
    } catch {}
  } else if (fs.existsSync(setupPyPath)) {
    facts.language = facts.language || 'Python';
    facts.packageManager = facts.packageManager || 'pip';
  }

  // --- Go ---
  const goModPath = path.join(projectDir, 'go.mod');
  if (fs.existsSync(goModPath)) {
    facts.language = facts.language || 'Go';
    facts.packageManager = facts.packageManager || 'go modules';
    try {
      const content = fs.readFileSync(goModPath, 'utf-8');
      const modMatch = content.match(/^module\s+(.+)/m);
      if (modMatch) facts.name = facts.name || modMatch[1].trim();
      const reqSection = content.match(/require\s*\(([\s\S]*?)\)/);
      if (reqSection) {
        const deps = reqSection[1].split('\n')
          .filter(l => l.trim() && !l.startsWith('//'))
          .map(l => l.trim().split(/\s/)[0]);
        facts.dependencies.push(...deps);
      }
    } catch {}
  }

  // --- Rust ---
  const cargoPath = path.join(projectDir, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    facts.language = facts.language || 'Rust';
    facts.packageManager = facts.packageManager || 'cargo';
    try {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
      if (nameMatch) facts.name = facts.name || nameMatch[1];
      const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
      if (descMatch) facts.description = facts.description || descMatch[1];
    } catch {}
  }

  return facts;
};
