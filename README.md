# claude-gen

> Auto-generate `CLAUDE.md` from any codebase. One command. Zero config.

```
  claude-gen — scanning project...

  Language:    TypeScript/JavaScript
  Pkg manager: npm
  Frameworks:  Next.js, React, Tailwind CSS, Supabase, Stripe, Resend, Vercel
  TypeScript:  strict
  Testing:     Vitest + Playwright
  Linting:     ESLint + Prettier
  Deploy:      Vercel

  Written to CLAUDE.md
  47 lines generated
```

**95% of Claude Code projects don't have a CLAUDE.md.** The ones that do usually wrote it by hand and missed half their stack. This tool scans your entire project and generates one automatically.

## Try it

```bash
npx claude-gen
```

That's it. CLAUDE.md appears in your project root. Done.

## What it detects

| Category | Examples |
|----------|---------|
| **Frameworks** | Next.js (App/Pages Router), React, Vue, Nuxt, Svelte, Angular, Astro, Remix, Express, FastAPI, Django, NestJS, Hono, Gin, Rails, and 30+ more |
| **Database/ORM** | Prisma, Drizzle, Supabase, Firebase, Mongoose, TypeORM, Sequelize, SQLAlchemy |
| **CSS/UI** | Tailwind, shadcn/ui, Chakra UI, Material UI, Styled Components |
| **Auth** | NextAuth, Clerk, Lucia |
| **Payments** | Stripe, LemonSqueezy |
| **Testing** | Vitest, Jest, Mocha, Pytest, Playwright, Cypress |
| **Linting** | ESLint (flat config detection), Prettier (options extraction), Biome |
| **TypeScript** | Strict mode, path aliases, compiler options |
| **Git** | Commit convention (conventional, emoji, etc.), branch strategy |
| **CI/CD** | GitHub Actions, GitLab CI, CircleCI, Travis, Jenkins, Azure Pipelines |
| **Deploy** | Vercel, Netlify, Railway, Fly.io, Docker, AWS, GCP, Heroku |
| **Monorepo** | Turborepo, Nx, Lerna, pnpm workspaces |
| **Language** | JS/TS, Python, Go, Rust |
| **Pkg manager** | npm, yarn, pnpm, bun, pip, poetry, uv, cargo, go modules |

## Generated output

```markdown
# my-project

## Tech Stack
**Language:** TypeScript/JavaScript (strict mode)
**Stack:** Next.js, React, Tailwind CSS, Supabase, Stripe
**Router:** App Router
**Package manager:** pnpm

## Commands
- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Test:** `pnpm test`
- **Lint:** `pnpm lint`
- **Typecheck:** `npx tsc --noEmit`

## Architecture
Key directories:
- `src/app/` — Next.js App Router
- `src/components/` — React components
- `src/lib/` — Shared library code
- `prisma/` — Prisma schema and migrations

## Code Conventions
- TypeScript strict mode — no `any` types
- Prettier (single quotes, no semicolons, 2-space indent)
- Conventional Commits (feat:, fix:, chore:)
- Tailwind CSS utility classes — avoid custom CSS

## Rules
- ALWAYS read a file before editing it
- Run tests before committing changes
- NEVER commit .env files or hardcode secrets
- NEVER use `rm -rf`, `git push --force` without approval
- Database migrations require explicit confirmation
```

## Options

```bash
claude-gen                       # scan current dir, write CLAUDE.md
claude-gen /path/to/project      # scan specific project
claude-gen --stdout              # print to terminal (don't write file)
claude-gen --merge               # merge with existing CLAUDE.md
claude-gen --json                # raw scan data as JSON
claude-gen -o custom/path.md     # custom output path
```

## Part of the Claude Code Toolkit

| Tool | What it does |
|------|-------------|
| [claude-score](https://github.com/antonioilinca/claude-score) | Score your setup A-F, see what's missing |
| **claude-gen** | Generate CLAUDE.md from your codebase |
| [claude-enforce](https://github.com/antonioilinca/claude-enforce) | Convert rules into deterministic hooks |

```bash
npx claude-score       # diagnose
npx claude-gen         # fix
npx claude-enforce init  # protect
```

## How it works

Zero AI. Zero network calls. Pure static analysis. Reads your config files, detects your stack, generates instructions. Under 1 second.

Only dependencies: `commander` and `chalk`.

## License

MIT
