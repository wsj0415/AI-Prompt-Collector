# AI Prompt Collector

This document provides a comprehensive overview of the AI Prompt Collector application, including a project retrospective, product documentation, and technical details.

---

## Project Retrospective & Summary

We successfully transformed a functional prototype into a professional, robust, and user-friendly application through a planned, iterative process.

**Initial Goal:**
To elevate a basic prompt list application into a professional, scalable, and delightful AI prompt management tool.

**Key Milestones Achieved:**
1.  **[✔️] Foundational Layout Refactoring:** Evolved from a single-header layout to a professional structure with a persistent sidebar and a main content area, providing a scalable framework for future features.
2.  **[✔️] Core Component Enhancement:** Redesigned the core `Prompt Card` component, introducing hover interactions, one-click copy functionality, and a cleaner visual hierarchy to improve usability and efficiency.
3.  **[✔️] Powerful Querying Capabilities:** Implemented modality filtering in the sidebar and multi-faceted sorting controls in the main header, empowering users to quickly and accurately find their prompts.
4.  **[✔️] In-Depth Interaction:** Introduced a `Prompt Detail View`, allowing users to see the full, un-truncated content of their prompts in a focused, distraction-free environment, elevating the app from a simple list to a true knowledge base.
5.  **[✔️] Enhanced Data Insights:** Polished the `Statistics View` by adding key metric cards, providing users with an immediate, at-a-glance overview of their collection.
6.  **[✔️] Data Portability:** Implemented robust JSON export and import functionalities, allowing users to back up and restore their data with ease.
7.  **[✔️] Advanced Prompt Management:** Implemented version control for prompts, allowing users to track changes, view history, and revert to previous versions.
8.  **[✔️] Testing & Evaluation Framework:** Added a comprehensive interface for running prompts against the Gemini API, viewing results, and using an AI-powered evaluation to score outputs based on quality.
9.  **[✔️] Version Comparison:** Created a side-by-side view for comparing different versions of a prompt and their test results, helping users optimize their prompts effectively.

**Final Outcome:**
The result is an application that is not only feature-complete but also professional in its aesthetics and user experience. It is now more intuitive, efficient, and well-prepared for future feature enhancements.

---

## Product Documentation

### 1. Application Overview
**AI Prompt Collector** is an intelligent personal management tool for AI prompts. It is designed to help creatives, developers, and AI enthusiasts efficiently collect, organize, search, and utilize prompts for various scenarios, including text generation, image creation, code development, and more. The application's core feature is its use of AI to automate content categorization and enable semantic search.

### 2. Key Features

*   **Centralized Prompt Collection:** Users can add, edit, and delete prompts, each with rich metadata including a title, prompt text, modality, theme, tags, and notes.
*   **AI-Powered Categorization:** When adding a prompt, a "Generate with AI" button uses the Gemini API to analyze the content and automatically suggest a concise theme and up to three relevant tags, streamlining the organization process.
*   **Intelligent Semantic Search:** An "AI Search" mode allows users to find prompts based on the semantic meaning of their query, returning relevant results even if the keywords don't match exactly.
*   **Multi-Modality Support:** The application natively supports five core modalities—Text, Image, Video, Audio, and Code—each distinguished by a unique icon.
*   **Advanced Filtering & Sorting:**
    *   **Modality Filtering:** The sidebar provides quick filters to view prompts of a specific type.
    *   **Sorting:** The collection can be sorted by creation date (newest/oldest) or title (A-Z/Z-A).
*   **Prompt Versioning:** The app automatically saves a new version of a prompt whenever its text is modified, allowing users to track changes and revert to previous versions.
*   **Testing & AI Evaluation:** A dedicated "Testing" tab in the detail view allows users to run prompts against the Gemini API. An AI-powered evaluation feature provides a quantitative score (1-10) and qualitative feedback on the test results.
*   **Shareable Prompts:** Users can generate a unique, shareable link for any prompt directly from the detail view. This link opens a read-only page displaying the prompt's details and its best-performing test result, allowing for easy collaboration and showcasing of work without needing a login.
*   **AI-Powered Prompt Enhancement:** A dedicated "Enhance with AI" feature helps users refine their prompts. It can suggest improvements for clarity and detail or generate creative variations, which can be saved as new versions for A/B testing.
*   **Prompt Templates:** Users can create prompts with dynamic variables using `[variable_name]` syntax. In the Testing view, these variables automatically become input fields, allowing for rapid generation of prompt variations by filling in the blanks.
*   **Data-Driven Insights:** The "Statistics" page visualizes the collection's data, showing total counts, modality distribution, and top themes through charts and key metric cards.
*   **Data Portability:**
    *   **Export:** Users can export their entire prompt collection to a JSON file for backup.
    *   **Import:** Users can import prompts from a properly formatted JSON file, ensuring seamless data transfer.

### 3. User Workflow
1.  **Add & Categorize:** A user clicks "Add Prompt" in the sidebar. They can create a standard prompt or a template by using `[variable]` syntax in the text. The AI generation feature helps automatically assign a theme and tags.
2.  **Browse & Find:** In the "Collection" view, the user can browse, filter, sort, or search to find a prompt. Template prompts are marked with a special icon.
3.  **Test & Iterate:** The user opens the detail view. In the "Testing" tab, if it's a template, they fill in the variable fields and see a live preview before running the test. They can edit the prompt (creating a new version), use the "Enhance with AI" feature, and compare results to refine it.
4.  **Share:** Once a prompt is perfected, the user clicks "Share" to copy a link to their clipboard and send it to others.
5.  **Review & Analyze:** The user can switch to the "Statistics" view at any time to get an overview of their collection habits.
6.  **Import & Export:** Users can click "Import" to add prompts from a JSON file or "Export" to save a backup of their collection as a JSON file.

---

## Technical Documentation

### 1. Technology Stack
*   **Frontend Framework:** React 19 (via CDN)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI Model:** Google Gemini API (`gemini-2.5-flash`, `imagen-4.0-generate-001`, `veo-3.1-fast-generate-preview`)
*   **Charting Library:** Recharts
*   **Local Storage:** Browser `localStorage` for data persistence.

### 2. Project Structure
```
/
├── README.md           # This documentation file
├── index.html          # Application entry point, CDN configuration
├── index.tsx           # React application root
├── metadata.json       # Application metadata
├── App.tsx             # Main app component (state management, view routing)
├── types.ts            # Global TypeScript type definitions
├── services/
│   └── geminiService.ts  # Encapsulates all Gemini API interaction logic
└── components/
    ├── PromptModal.tsx   # Modal for adding/editing prompts
    ├── StatisticsView.tsx# Data statistics view component
    ├── PromptDetailView.tsx# Prompt detail view modal component
    ├── ...and more
```

### 3. State Management
Application state is managed within the main `App.tsx` component using React Hooks (`useState`, `useEffect`, `useMemo`).
*   `prompts`: `Prompt[]` - The core data array holding all prompt objects.
*   `view`: `'list' | 'stats'` - Controls which main view is rendered.
*   `isModalOpen`, `promptToEdit`: Manages the state for the add/edit modal.
*   `selectedPrompt`: Manages the state for the detail view modal.
*   `searchQuery`, `isAiSearch`, `filteredPrompts`: Manages all states related to the search functionality.

### 4. Core Logic & Data Flow

*   **Data Persistence:** The `prompts` state is automatically saved to `localStorage` whenever it changes, using a `useEffect` hook. The app hydrates its initial state from `localStorage` on load.

*   **CRUD Operations:**
    *   `handleSavePrompt`: Handles both creating new prompts and updating existing ones. If the prompt text is changed on an existing prompt, it creates a new version instead of overwriting the data.
    *   `handleDeletePrompt`: Removes a prompt from the `prompts` array.

*   **Display Logic:** The `displayedPrompts` variable is derived using `useMemo` for performance optimization. It calculates the final list to be rendered by applying filtering, searching, and sorting logic sequentially.

*   **Gemini API Integration:**
    *   All communication with the Gemini API is isolated in `services/geminiService.ts`.
    *   `generateTagsAndTheme`, `findRelevantPrompts`, `runPromptTest`, `evaluateTestResult`, and `enhancePrompt` are the core functions that construct requests with specific JSON schemas to ensure the API returns consistently structured data.

### 5. Data Import/Export

*   **Export:** The entire collection is exported as a single JSON file with a timestamped filename.
*   **Import:** Users can import prompts from a JSON file. The format should be the same as the one generated by the "Export" feature. Duplicate IDs are skipped.
*   **Migration:** The import logic includes a migration function (`migratePrompts`) to ensure backward compatibility with older data formats.