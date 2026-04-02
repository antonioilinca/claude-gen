# claude-gen

Auto-generate `CLAUDE.md` from any codebase. Zero config, instant, offline.

Point it at a project directory. It scans everything — `package.json`, `tsconfig.json`, ESLint, Prettier, Git history, CI/CD, directory structure — and generates a complete `CLAUDE.md` that makes Claude Code actually understand your project.

## Why

95% of projects using Claude Code either don't have a `CLAUDE.md` or have a bad one. This is the single highest-leverage thing you can do to improve Claude Code's output. `claude-gen` does it in 2 seconds.

## Install

```bash
git clone https://github.com/your-org/claude-gen.git
cd claude-gen
npm install
npm link  # makes `claude-gen` available globally
```

## Usage

```bash
# Scan current directory, write CLAUDE.md
claude-gen

# Scan a specific project
claude-gen /path/to/project

# Print to stdout (don't write file)
claude-gen --stdout

# Merge with existing CLAUDE.md (keeps your custom sections)
claude-gen --merge

# Custom output path
claude-gen -o /path/to/output/CLAUDE.md

# Raw scan data as JSON
claude-gen --json
```

## What it detects

| Category | Details |
|----------|---------|
| **Language** | JS/TS, Python, Go, Rust |
| **Package manager** | npm, yarn, pnpm, bun, pip, poetry, uv, cargo, go modules |
| **Frameworks** | Next.js (App/Pages Router), React, Vue, Nuxt, Svelte, Angular, Astro, Remix, Express, FastAPI, Django, NestJS, Hono, Gin, and 30+ more |
| **Database/ORM** | Prisma, Drizzle, Supabase, Firebase, Mongoose, TypeORM, Sequelize, SQLAlchemy |
| **CSS/UI** | Tailwind, shadcn/ui, Chakra UI, Material UI, Styled Components |
| **Auth** | NextAuth, Clerk, Lucia |
| **Payments** | Stripe, LemonSqueezy |
| **Testing** | Vitest, Jest, Mocha, Pytest, Playwright, Cypress + test directories |
| **Linting** | ESLint (flat config detection), Prettier (options extraction), Biome |
| **TypeScript** | Strict mode, path aliases, compiler options |
| **Git** | Commit convention (conventional, emoji, etc.), branch strategy, active files |
| **CI/CD** | GitHub Actions, GitLab CI, CircleCI, Travis, Jenkins, Azure Pipelines |
| **Deployment** | Vercel, Netlify, Railway, Fly.io, Docker, AWS, GCP, Heroku |
| **Monorepo** | Turborepo, Nx, Lerna, pnpm workspaces |
| **Git hooks** | Husky, lint-staged, commitlint |

## Generated output

The generated `CLAUDE.md` includes:

1. **Project name & description** — from package.json/pyproject.toml
2. **Tech Stack** — frameworks, language, package manager
3. **Commands** — dev, build, test, lint, format, typecheck, db commands
4. **Architecture** — key directories, monorepo structure, env file setup
5. **Code Conventions** — from TypeScript config, ESLint, Prettier, Git history
6. **Rules** — enforceable rules based on project setup (testing, linting, env, destructive ops, migrations, CI)

## Merge mode

Already have a `CLAUDE.md` with custom instructions? Use `--merge`:

```bash
claude-gen --merge
```

This keeps your custom sections and updates the auto-generated ones. Sections with the same heading get replaced; custom sections are preserved.

## JSON mode

Get raw scan data for scripting or piping:

```bash
claude-gen --json | jq '.framework.frameworks'
# ["Next.js", "React", "Tailwind CSS", "Supabase", "Stripe"]
```

## Zero dependencies (almost)

Only `commander` and `chalk`. No AI, no network calls, no heavy processing. Runs in under a second on any project.

## License

MIT
