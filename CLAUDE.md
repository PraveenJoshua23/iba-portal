# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 17 learning management system (LMS) for HSZTC (appears to be "iba-portal" internally). The application provides video-based lessons with quizzes, user management, progress tracking, and multi-language support via Firestore-backed translations.

## Development Commands

### Starting Development Server
```bash
ng serve
# or
npm start
# Navigate to http://localhost:4200/
```

### Building
```bash
ng build                          # Production build (outputs to dist/hztc-website)
ng build --watch --configuration development  # Watch mode for development
```

### Testing
```bash
ng test                           # Run all tests via Karma
```

### Code Generation
```bash
ng generate component component-name
ng generate directive|pipe|service|class|guard|interface|enum|module
```

## Architecture

### Standalone Components Architecture
This application uses **Angular Standalone Components** (no NgModules). The app is bootstrapped directly in `src/main.ts` using `bootstrapApplication()` with providers configured inline.

### Routing Structure
The application uses a **shell-based routing** architecture:

- **AppShellComponent**: Main wrapper component containing sidebar and navbar
- **Route files**: Split into separate files for feature areas
  - `app.route.ts`: Top-level routes (login, signup, redirects)
  - `app-shell.route.ts`: Home route (nested under AppShellComponent)
  - `lessons.route.ts`: Lesson viewer with dynamic category/id routing
  - `admin.route.ts`: Admin panel with guard protection
  - `profile.route.ts`: User profile routes

All authenticated routes use the `authGuard` functional guard, which checks Firebase Authentication state. Admin routes additionally use `adminGuard`.

### Firebase Integration
The application heavily relies on Firebase services:

- **Authentication**: Firebase Auth for login/signup/password reset
- **Firestore**: Primary database for users, lessons, progress, classes, and translations
- **Storage**: Firebase Storage for video files and images
- **Realtime Database**: Used in conjunction with Firestore (check `FirebaseService` for specifics)

Firebase is initialized in `src/main.ts` with both compat and modular APIs. Configuration is directly in the file (note: this is a public API key which is standard for Firebase client apps).

### Core Services

**AuthService** (`shared/services/auth/auth.service.ts`):
- Handles authentication flows (login, signup, password reset)
- Maintains `currentUserSignal` for reactive auth state
- Stores auth state in localStorage

**FirebaseService** (`shared/services/firebase.service.ts`):
- Central service for Firestore operations
- Manages collections: students, lessons, progress, classes
- Handles file uploads to Firebase Storage
- Uses both AngularFire compat and modular SDK

**TranslationService** (`shared/services/language/language.service.ts`):
- Multi-language support using ngx-translate
- Custom `FirestoreTranslateLoader` loads translations from Firestore
- Supported languages: English (en), Tamil (ta), Telugu (te), Hindi (hi), Odia (or), Kannada (ka)
- Translations are preloaded on app initialization

**ProgressService** (`shared/services/progress/progress.service.ts`):
- Tracks user lesson progress and quiz results
- Manages lesson completion state

**LessonsService** (`shared/services/lessons/lessons.service.ts`):
- CRUD operations for lessons
- Lesson categorization: 'bb' (beginner basics), 'intro', 'intermediate', 'advanced'

**VimeoService** (`shared/services/vimeo/vimeo.service.ts`):
- Integration for Vimeo video playback
- Used in video player component

**GeminiService** (`shared/services/gemini/gemini.service.ts`):
- Integration with Google's Gemini AI (purpose TBD from context)

### Key Data Models

**IUser** (`shared/models/user.interface.ts`):
- `role`: 'admin' | 'student' | 'instructor'
- `classId`: Associates user with a class
- `language`: User's preferred language
- `userDetails`: Extended profile information (age, dob, phone, occupation, etc.)

**Lesson** (`shared/models/lesson.model.ts`):
- Contains video path, description, quiz questions
- Category-based organization
- Language-specific content support

### Component Structure

**Pages** (`src/app/pages/`):
- `home`: Main dashboard after login
- `lessons`: Video lesson player with quiz functionality
- `admin`: Admin panel for managing users, lessons, classes, and translations
- `login` / `sign-up`: Authentication pages
- `edit-lesson` / `edit-class` / `edit-user`: Admin editing interfaces

**Shared Components** (`src/app/components/`):
- `app-shell`: Main layout wrapper with sidebar and navbar
- `sidebar`: Responsive navigation with mobile toggle
- `navbar`: Top navigation bar
- `video-player`: Custom video player component (using @videogular/ngx-videogular)
- `progress-dialog`: Shows user progress in lessons
- `support-dialog`: User support interface
- Dialog components: `add-user-dialog`, `edit-user-dialog`, `confirm-dialog`, `cropper-dialog`, `terms-dialog`

### Styling
- **Tailwind CSS**: Primary styling framework (config in `tailwind.config.js`)
- **SCSS**: Component-level styles (configured in angular.json)
- **Custom theme colors**:
  - `golden` palette (primary brand color)
  - `pastel-green` palette
- **Responsive breakpoints**: Uses em-based breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Typography**: Custom Poppins font family

### Custom Directives
- `click-outside.directive`: Detects clicks outside an element
- `disable-seeking.directive`: Prevents video seeking (likely for enforcing sequential viewing)

### Resolvers
- `LessonResolver` (`shared/resolvers/lesson.resolver.ts`): Pre-fetches lesson data before route activation

## Important Notes

### Firebase SDK Usage
This project uses **both** AngularFire compat APIs (`@angular/fire/compat`) and modular Firebase APIs (`@angular/fire/*`) side-by-side. When adding new features:
- Prefer modular APIs for new code
- Be aware existing services use compat APIs extensively

### Translation System
Translations are stored in **Firestore** (not in JSON files). The `language-management` component in the admin panel allows runtime translation management. All translations are preloaded on app initialization for performance.

### Video Playback
The app uses `@videogular/ngx-videogular` for video playback. Videos are likely hosted on Vimeo or Firebase Storage.

### State Management
No formal state management library (like NgRx) is used. State is managed through:
- Services with BehaviorSubjects/Signals
- localStorage for persistence (auth state)
- Firebase Firestore as the source of truth

### Environment Configuration
Firebase config is hardcoded in `src/main.ts`. There is an `src/environments/environment.ts` file that may contain additional environment-specific configuration.

## Common Development Patterns

### Adding a New Route
1. Create the component (standalone)
2. Add route definition to appropriate route file (`*.route.ts`)
3. If protected, apply `authGuard` or `adminGuard`
4. Update sidebar navigation if needed

### Adding a New Service
Services are provided at root level using `providedIn: 'root'`. Use Angular's inject() function for dependency injection in newer code.

### Working with Firestore
Use `FirebaseService` for common operations. For direct Firestore access, inject `Firestore` from `@angular/fire/firestore` and use modular SDK functions (collection, doc, getDocs, etc.).

### Adding Translations
Use the language management interface in the admin panel, or directly add to Firestore `translations` collection with structure: `translations/{languageCode}/keys/{key}`.
