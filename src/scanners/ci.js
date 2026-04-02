const fs = require('fs');
const path = require('path');

/**
 * Detect CI/CD configuration and deployment setup.
 */

module.exports = function scanCI(projectDir) {
  const facts = {
    ci: null,
    deployment: null,
    hasHusky: false,
    hasLintStaged: false,
    hasCommitlint: false,
  };

  // --- CI Systems ---
  const ciChecks = [
    { name: 'GitHub Actions', path: '.github/workflows' },
    { name: 'GitLab CI', path: '.gitlab-ci.yml' },
    { name: 'CircleCI', path: '.circleci/config.yml' },
    { name: 'Travis CI', path: '.travis.yml' },
    { name: 'Jenkins', path: 'Jenkinsfile' },
    { name: 'Bitbucket Pipelines', path: 'bitbucket-pipelines.yml' },
    { name: 'Azure Pipelines', path: 'azure-pipelines.yml' },
  ];

  for (const ci of ciChecks) {
    if (fs.existsSync(path.join(projectDir, ci.path))) {
      facts.ci = ci.name;

      // For GitHub Actions, list workflow files
      if (ci.name === 'GitHub Actions') {
        try {
          const workflowDir = path.join(projectDir, '.github/workflows');
          facts.ciWorkflows = fs.readdirSync(workflowDir)
            .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        } catch {}
      }
      break;
    }
  }

  // --- Deployment ---
  const deployChecks = [
    { name: 'Vercel', files: ['vercel.json', '.vercel'] },
    { name: 'Netlify', files: ['netlify.toml', '_redirects'] },
    { name: 'Railway', files: ['railway.json', 'railway.toml'] },
    { name: 'Fly.io', files: ['fly.toml'] },
    { name: 'Render', files: ['render.yaml'] },
    { name: 'AWS (CDK)', files: ['cdk.json'] },
    { name: 'AWS (SAM)', files: ['template.yaml', 'samconfig.toml'] },
    { name: 'Google Cloud', files: ['app.yaml', 'cloudbuild.yaml'] },
    { name: 'Heroku', files: ['Procfile', 'app.json'] },
    { name: 'Docker', files: ['Dockerfile', 'docker-compose.yml'] },
    { name: 'Kubernetes', files: ['k8s', 'kubernetes', 'helm'] },
  ];

  for (const dep of deployChecks) {
    if (dep.files.some(f => fs.existsSync(path.join(projectDir, f)))) {
      facts.deployment = dep.name;
      break;
    }
  }

  // --- Git hooks ---
  facts.hasHusky = fs.existsSync(path.join(projectDir, '.husky'));
  facts.hasLintStaged = fs.existsSync(path.join(projectDir, '.lintstagedrc'))
    || fs.existsSync(path.join(projectDir, '.lintstagedrc.js'))
    || fs.existsSync(path.join(projectDir, '.lintstagedrc.json'));

  // Check package.json for lint-staged config
  if (!facts.hasLintStaged) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
      if (pkg['lint-staged']) facts.hasLintStaged = true;
    } catch {}
  }

  facts.hasCommitlint = fs.existsSync(path.join(projectDir, 'commitlint.config.js'))
    || fs.existsSync(path.join(projectDir, 'commitlint.config.cjs'))
    || fs.existsSync(path.join(projectDir, '.commitlintrc.json'));

  return facts;
};
