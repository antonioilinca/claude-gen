const fs = require('fs');
const path = require('path');

/**
 * Detect frameworks, libraries, and major architectural patterns.
 */

const FRAMEWORK_SIGNATURES = {
  // Frontend
  'Next.js': { deps: ['next'], files: ['next.config.js', 'next.config.mjs', 'next.config.ts'] },
  'React': { deps: ['react', 'react-dom'], files: [] },
  'Vue.js': { deps: ['vue'], files: ['vue.config.js', 'nuxt.config.ts', 'nuxt.config.js'] },
  'Nuxt': { deps: ['nuxt'], files: ['nuxt.config.ts', 'nuxt.config.js'] },
  'Svelte': { deps: ['svelte'], files: ['svelte.config.js'] },
  'SvelteKit': { deps: ['@sveltejs/kit'], files: ['svelte.config.js'] },
  'Angular': { deps: ['@angular/core'], files: ['angular.json'] },
  'Astro': { deps: ['astro'], files: ['astro.config.mjs', 'astro.config.ts'] },
  'Remix': { deps: ['@remix-run/react'], files: [] },
  'Solid': { deps: ['solid-js'], files: [] },
  'Vite': { deps: ['vite'], files: ['vite.config.ts', 'vite.config.js'] },

  // Backend
  'Express': { deps: ['express'], files: [] },
  'Fastify': { deps: ['fastify'], files: [] },
  'Hono': { deps: ['hono'], files: [] },
  'NestJS': { deps: ['@nestjs/core'], files: ['nest-cli.json'] },
  'Koa': { deps: ['koa'], files: [] },
  'Django': { deps: ['django', 'Django'], files: ['manage.py'] },
  'Flask': { deps: ['flask', 'Flask'], files: [] },
  'FastAPI': { deps: ['fastapi'], files: [] },
  'Rails': { deps: [], files: ['Gemfile', 'config/routes.rb'] },
  'Spring Boot': { deps: [], files: ['pom.xml', 'build.gradle'] },
  'Gin': { deps: ['github.com/gin-gonic/gin'], files: [] },
  'Fiber': { deps: ['github.com/gofiber/fiber'], files: [] },
  'Actix': { deps: ['actix-web'], files: [] },
  'Axum': { deps: ['axum'], files: [] },
  'Laravel': { deps: [], files: ['artisan', 'composer.json'] },

  // Mobile
  'React Native': { deps: ['react-native'], files: [] },
  'Expo': { deps: ['expo'], files: ['app.json', 'expo.config.js'] },
  'Flutter': { deps: [], files: ['pubspec.yaml'] },

  // CSS/UI
  'Tailwind CSS': { deps: ['tailwindcss'], files: ['tailwind.config.js', 'tailwind.config.ts'] },
  'shadcn/ui': { deps: [], files: ['components.json'] },
  'Chakra UI': { deps: ['@chakra-ui/react'], files: [] },
  'Material UI': { deps: ['@mui/material'], files: [] },
  'Styled Components': { deps: ['styled-components'], files: [] },

  // Database / ORM
  'Prisma': { deps: ['prisma', '@prisma/client'], files: ['prisma/schema.prisma'] },
  'Drizzle': { deps: ['drizzle-orm'], files: ['drizzle.config.ts'] },
  'Supabase': { deps: ['@supabase/supabase-js'], files: [] },
  'Firebase': { deps: ['firebase', 'firebase-admin'], files: ['firebase.json', '.firebaserc'] },
  'MongoDB/Mongoose': { deps: ['mongoose', 'mongodb'], files: [] },
  'TypeORM': { deps: ['typeorm'], files: [] },
  'Sequelize': { deps: ['sequelize'], files: [] },
  'SQLAlchemy': { deps: ['sqlalchemy', 'SQLAlchemy'], files: [] },

  // Auth
  'NextAuth/Auth.js': { deps: ['next-auth', '@auth/core'], files: [] },
  'Clerk': { deps: ['@clerk/nextjs', '@clerk/clerk-sdk-node'], files: [] },
  'Lucia': { deps: ['lucia'], files: [] },

  // Payments
  'Stripe': { deps: ['stripe', '@stripe/stripe-js'], files: [] },
  'LemonSqueezy': { deps: ['@lemonsqueezy/lemonsqueezy.js'], files: [] },

  // Email
  'Resend': { deps: ['resend'], files: [] },
  'Nodemailer': { deps: ['nodemailer'], files: [] },
  'React Email': { deps: ['@react-email/components', 'react-email'], files: [] },

  // State Management
  'Zustand': { deps: ['zustand'], files: [] },
  'Redux': { deps: ['@reduxjs/toolkit', 'redux'], files: [] },
  'Jotai': { deps: ['jotai'], files: [] },
  'TanStack Query': { deps: ['@tanstack/react-query'], files: [] },

  // Validation
  'Zod': { deps: ['zod'], files: [] },
  'Yup': { deps: ['yup'], files: [] },

  // Monorepo
  'Turborepo': { deps: ['turbo'], files: ['turbo.json'] },
  'Nx': { deps: ['nx'], files: ['nx.json'] },
  'Lerna': { deps: ['lerna'], files: ['lerna.json'] },

  // Deployment
  'Docker': { deps: [], files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'] },
  'Vercel': { deps: ['vercel'], files: ['vercel.json'] },
  'Terraform': { deps: [], files: ['main.tf'] },
};

module.exports = function scanFrameworks(projectDir, packageFacts) {
  const allDeps = [...(packageFacts.dependencies || []), ...(packageFacts.devDependencies || [])];
  const detected = [];

  for (const [name, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
    const hasDep = sig.deps.some(d => allDeps.includes(d));
    const hasFile = sig.files.some(f => fs.existsSync(path.join(projectDir, f)));

    if (hasDep || hasFile) {
      detected.push(name);
    }
  }

  // Detect app router vs pages router for Next.js
  let nextjsRouter = null;
  if (detected.includes('Next.js')) {
    if (fs.existsSync(path.join(projectDir, 'app')) || fs.existsSync(path.join(projectDir, 'src/app'))) {
      nextjsRouter = 'App Router';
    }
    if (fs.existsSync(path.join(projectDir, 'pages')) || fs.existsSync(path.join(projectDir, 'src/pages'))) {
      nextjsRouter = nextjsRouter ? 'App Router + Pages Router' : 'Pages Router';
    }
  }

  // Detect src/ directory pattern
  const usesSrcDir = fs.existsSync(path.join(projectDir, 'src'));

  return {
    frameworks: detected,
    nextjsRouter,
    usesSrcDir,
  };
};
