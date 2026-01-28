# PLATO Learn

A modular, gamified learning platform for software testing and development education.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable UI components (Button, Card, ProgressBar)
├── engine/         # Core systems (Gamification, ModuleLoader)
├── layouts/        # Page layouts (AppLayout)
├── modules/        # Learning modules (sql, testing, etc.)
├── pages/          # Route pages (Home, ModulePage)
├── styles/         # Global styles and design tokens
└── types/          # TypeScript type definitions
```

## Adding a New Module

1. Create module config in `src/modules/<module-name>/index.ts`:

```typescript
import { LearningModule } from '../../types';

export const myModule: LearningModule = {
  id: 'my-module',
  name: 'My Module',
  description: 'Description of the module',
  icon: 'M',
  color: '#0059E8',
  questionsPath: '/modules/my-module/questions.json',
  rounds: [
    { id: 'r1', name: 'Round 1', description: '...', questions: [] },
  ],
};
```

2. Add questions JSON to `public/modules/<module-name>/questions.json`

3. Register in `src/modules/index.ts`:

```typescript
import { myModule } from './my-module';
export const modules: LearningModule[] = [sqlModule, myModule];
```

## Tech Stack

- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router v6** - Routing
- **CSS Modules** - Scoped styling
