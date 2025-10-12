# AI Dev Tasks
Use these files when I request structured feature development using PRDs:
/ai-dev-tasks/create-prd.md
/ai-dev-tasks/generate-tasks.md
/ai-dev-tasks/process-task-list.md

use Gemini Cli 2.5 PRO and Codex gpt-5 when doing design work and planing use your main CLAUDE.md to tell you how to use them
always run /coderabbit before a commit unless working on a branch and doing a PR. CHeck with user first.

Stack:

New projects must use the following stack:

Next.js 15
node 22 if needed
Biome
Drizzle + Postgres 18
tRPC + TanStack Query (latest versions)
valkey 8
better-auth
polar (if needed for billing)

## Development Environment

All alpine images if available or distroless for security/size/performance.

**IMPORTANT: This project uses Docker exclusively. No local Node.js installation required.**

### Docker-Only Workflow

All builds, tests, and development happen inside Docker containers:

```bash
# Build and start services
npm run docker:up

# View logs
npm run docker:logs

# Rebuild after changes
cd build && docker-compose build app && docker-compose up -d

# Stop services
npm run docker:down
```

### Project Structure

keep folder tidy!

```
build/          # Docker files and docker-compose.yml
config/         # Configuration files (jest, tailwind, etc)
src/            # Source code
docs/           # Documentation
public/         # Static assets
tests/          # Test files
```

### Key Files

- `build/docker-compose.yml` - Main service definitions
- `build/Dockerfile.prod` - Production Docker build
- `build/Dockerfile.dev` - Development Docker build
- `src/outlook-addin/manifest-microsoft.xml` - Outlook add-in manifest

### Container Services

1. **app** - Next.js (port 4000)
2. **postgres** - PostgreSQL 18
3. **redis** - Redis 7

### Making Changes

After editing files:

```bash
# Option 1: Rebuild container (recommended)
cd build
docker-compose build app
docker-compose up -d app

# Option 2: Copy single file (quick updates)
docker cp file.html container:/app/path/to/file.html

# Option 3: Use volume mounts for development
# Files sync automatically with the running container
```

### Tooling Commands

```bash
# Lint and format
biome check --write
biome check --unsafe           # Unsafe fixes
biome format .                  # Format all files

# Development
npm run dev                      # Start development server with HMR
npm run docker:up               # Build and start all services
npm run docker:logs             # View container logs
npm run docker:down             # Stop all services

# Database
npm run db:generate             # Generate Drizzle migrations
npm run db:migrate              # Run migrations
npm run db:studio               # Open Drizzle Studio

# Testing
npm test                        # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm run test:setup              # Start test containers
npm run test:teardown           # Stop test containers

# Build & Validation
npm run build                   # Production build
npm run typecheck               # TypeScript validation
npm run lint                    # Biome linting only
npm run validate                # Run all checks (typecheck + lint + test)
```

### Code Style & Standards

- **Use Biome exclusively** for all linting and formatting
- **Biome configuration**: Tab indentation, double quotes, trailing commas
- Run `biome check --write` before commits
- Prefer arrow functions over function declarations
- Use early returns over nested conditionals
- Keep functions under 20 lines
- Use TypeScript strict mode
- Never use `any!` type annotations
- Use descriptive variable names (URL not Url, API not Api, ID not Id)
- 100 character line limit
- Use consistent-type-imports for TypeScript imports

### Architecture Patterns

- Services go in `src/services` with matching interfaces
- All database queries use the repository pattern
- Follow existing patterns in the codebase
- Keep project structure tidy and organized

#### tRPC Specific Patterns
- Router organization: `src/server/api/routers/` with index exports
- Type safety: Export `AppRouter` type for client usage
- Middleware: Use tRPC middleware for auth and validation
- Error handling: Use tRPC error shapes for consistent API responses

#### Drizzle ORM Patterns
- Schema organization: `src/server/db/schema/` with domain-specific files
- Migrations: Use Drizzle Kit for schema management
- Queries: Prefer Drizzle query syntax over raw SQL
- Types: Infer TypeScript types from schema using `drizzle-zod`

#### Docker Development
- Use `npm run dev` **never** `npm run build` during development
- Container hot-reload works with file changes
- Database and Redis run in separate containers as defined in docker-compose.yml
- Rebuild containers only when dependencies change: `cd build && docker-compose build app`

### Testing Requirements

- **Always run `npm test` before completing any feature**
- Run `npm run validate` (typecheck + lint + test) before commits
- New features need unit tests with proper coverage
- API changes need integration tests
- Use factories, not fixtures for test data
- Keep tests fast for immediate feedback
- Test files: `*.test.ts` or `*.spec.ts`
- Use `expect(VALUE).toXyz(...)` pattern, avoid storing in variables
- Omit "should" from test descriptions (e.g., `it("validates input")` not `it("should validate input")`)

### Testing

```bash
npm run test:setup    # Start test containers
npm run test          # Run tests
npm run test:teardown # Stop test containers
```

### Development Best Practices

- Use `npm run dev` **never** `npm run build` during development
- Container hot-reload works with file changes
- Database and Redis run in separate containers as defined in docker-compose.yml
- Rebuild containers only when dependencies change: `cd build && docker-compose build app`
- Run `npm run validate` before commits (typecheck + lint + test)
- Use Biome for all formatting and linting
- Keep functions under 20 lines
- Use descriptive variable names (URL not Url, API not Api, ID not Id)
- 100 character line limit
- Use consistent-type-imports for TypeScript imports

### Git Workflow

- Branch naming: `feature/feature-name`, `fix/issue-description`
- Commit format: `type(scope): description`
- Always run `npm run validate` before committing
- Never use `git push --force` on main branch
- Use `git push --force-with-lease` for feature branches if needed
- Always run `/coderabbit` before commits (unless working on branch/PR - check with user first)

### Security Guidelines

- Never commit `.env` files or secrets
- Use environment variables for sensitive data
- Validate all inputs on both client and server
- Use parameterized queries (Drizzle handles this automatically)
- Regular dependency updates via `npm audit fix`
- Follow principle of least privilege

### Performance Guidelines

- Optimize images and assets
- Use TanStack Query for efficient data fetching
- Implement proper caching strategies with Valkey
- Monitor bundle size: `npm run analyze` (if available)
- Use Next.js Image component for optimized image loading

