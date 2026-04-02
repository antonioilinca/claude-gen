const { execSync } = require('child_process');
const path = require('path');

/**
 * Scan git history for commit conventions, active areas, and branch strategy.
 */

module.exports = function scanGit(projectDir) {
  const facts = {
    isGitRepo: false,
    commitConvention: null,
    defaultBranch: null,
    recentFiles: [],
    totalCommits: 0,
    contributors: 0,
  };

  const exec = (cmd) => {
    try {
      return execSync(cmd, { cwd: projectDir, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      return '';
    }
  };

  // Check if git repo
  const gitCheck = exec('git rev-parse --is-inside-work-tree');
  if (gitCheck !== 'true') return facts;
  facts.isGitRepo = true;

  // Default branch
  const defaultBranch = exec('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null');
  if (defaultBranch) {
    facts.defaultBranch = defaultBranch.replace('refs/remotes/origin/', '');
  } else {
    // Fallback: check if main or master exists
    const branches = exec('git branch -a');
    if (branches.includes('main')) facts.defaultBranch = 'main';
    else if (branches.includes('master')) facts.defaultBranch = 'master';
  }

  // Total commits
  const commitCount = exec('git rev-list --count HEAD 2>/dev/null');
  facts.totalCommits = parseInt(commitCount, 10) || 0;

  // Contributors
  const contributors = exec('git shortlog -sn --no-merges HEAD 2>/dev/null');
  facts.contributors = contributors ? contributors.split('\n').filter(l => l.trim()).length : 0;

  // Recent commit messages (last 20) to detect convention
  const recentMessages = exec('git log --oneline -20 --no-merges 2>/dev/null');
  if (recentMessages) {
    const messages = recentMessages.split('\n').map(l => l.replace(/^[a-f0-9]+\s+/, ''));

    // Detect conventional commits
    const conventionalPattern = /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?:/;
    const conventionalCount = messages.filter(m => conventionalPattern.test(m)).length;

    if (conventionalCount >= messages.length * 0.5) {
      facts.commitConvention = 'conventional-commits';
    } else {
      // Check for other patterns
      const capitalizedCount = messages.filter(m => /^[A-Z]/.test(m)).length;
      const lowercaseCount = messages.filter(m => /^[a-z]/.test(m)).length;
      const emojiCount = messages.filter(m => /^[\u{1F000}-\u{1FFFF}]/u.test(m) || m.startsWith(':')).length;

      if (emojiCount >= messages.length * 0.3) facts.commitConvention = 'emoji';
      else if (capitalizedCount >= messages.length * 0.7) facts.commitConvention = 'capitalized';
      else if (lowercaseCount >= messages.length * 0.7) facts.commitConvention = 'lowercase';
      else facts.commitConvention = 'mixed';
    }
  }

  // Most changed files recently (top 10)
  const changedFiles = exec('git log --pretty=format: --name-only -50 --no-merges 2>/dev/null');
  if (changedFiles) {
    const fileCounts = {};
    for (const f of changedFiles.split('\n').filter(l => l.trim())) {
      fileCounts[f] = (fileCounts[f] || 0) + 1;
    }
    facts.recentFiles = Object.entries(fileCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, count]) => ({ file, changes: count }));
  }

  return facts;
};
