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
*   **Focused Detail View:** Clicking a prompt card opens a full-screen modal that displays the entire prompt text and notes without truncation, along with focused actions like copy, edit, and delete.
*   **Data-Driven Insights:** The "Statistics" page visualizes the collection's data, showing total counts, modality distribution, and top themes through charts and key metric cards.
*   **Data Portability:**
    *   **Export:** Users can export their entire prompt collection to a JSON file for backup.
    *   **Import:** Users can import prompts from a properly formatted JSON file, ensuring seamless data transfer.

### 3. User Workflow
1.  **Add & Categorize:** A user clicks "Add Prompt" in the sidebar, fills out the form, and uses the AI generation feature to automatically assign a theme and tags.
2.  **Browse & Find:** In the "Collection" view, the user can browse, filter by modality, sort the list, or use the search bar (in keyword or AI mode) to find a specific prompt.
3.  **Use & Manage:** Once found, the user can quickly copy the prompt from the card's hover menu or click to open the detail view for full content and management options.
4.  **Review & Analyze:** The user can switch to the "Statistics" view at any time to get an overview of their collection habits.
5.  **Import & Export:** Users can click "Import" to add prompts from a JSON file or "Export" to save a backup of their collection as a JSON file.

---

## Technical Documentation

### 1. Technology Stack
*   **Frontend Framework:** React 19 (via CDN)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI Model:** Google Gemini API (`gemini-2.5-flash`)
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
├── types.ts            # Global TypeScript type definitions (Prompt, Modality)
├── services/
│   └── geminiService.ts  # Encapsulates all Gemini API interaction logic
└── components/
    ├── PromptModal.tsx   # Modal for adding/editing prompts
    ├── StatisticsView.tsx# Data statistics view component
    ├── PromptDetailView.tsx# Prompt detail view modal component
    └── icons.tsx         # Centralized SVG icon components
```

### 3. State Management
Application state is managed within the main `App.tsx` component using React Hooks (`useState`, `useEffect`, `useMemo`).
*   `prompts`: `Prompt[]` - The core data array holding all prompt objects.
*   `view`: `'list' | 'stats'` - Controls which main view is rendered.
*   `isModalOpen`, `promptToEdit`: Manages the state for the add/edit modal.
*   `selectedPrompt`: Manages the state for the detail view modal.
*   `searchQuery`, `isAiSearch`, `filteredPrompts`: Manages all states related to the search functionality.
*   `modalityFilter`: Stores the currently active modality filter.
*   `sortBy`: Stores the current sorting rule.

### 4. Core Logic & Data Flow

*   **Data Persistence:**
    *   The `prompts` state is automatically saved to `localStorage` whenever it changes, using a `useEffect` hook. The app hydrates its initial state from `localStorage` on load.

*   **CRUD Operations:**
    *   `handleSavePrompt`: Handles both creating new prompts and updating existing ones.
    *   `handleDeletePrompt`: Removes a prompt from the `prompts` array.

*   **Display Logic (Filtering, Searching, Sorting):**
    *   The `displayedPrompts` variable is derived using `useMemo` for performance optimization. It calculates the final list to be rendered by applying the following steps in order:
        1.  **Filter:** The list is first filtered by the selected `modalityFilter`.
        2.  **Search:** The filtered list is then processed by the search logic (either local keyword search or the asynchronous AI search results).
        3.  **Sort:** Finally, the resulting list is sorted based on the current `sortBy` state.
    *   This chained, memoized approach ensures that the UI updates efficiently and all controls work together seamlessly.

*   **Gemini API Integration:**
    *   All communication with the Gemini API is isolated in `services/geminiService.ts`.
    *   `generateTagsAndTheme`: Constructs a request with a specific JSON schema to ensure the API returns a consistently structured object for the theme and tags.
    *   `findRelevantPrompts`: Sends a summarized list of all prompts along with the user's query to the API, asking it to return an array of the most relevant prompt IDs, which are then used to filter and sort the results.

### 5. Data Import/Export

*   **Export:** The entire collection is exported as a single JSON file with a timestamped filename (e.g., `ai-prompts-export-YYYY-MM-DD.json`).
*   **Import:** Users can import prompts from a JSON file. The format should be the same as the one generated by the "Export" feature.
    *   **Format:** The file must contain a JSON array of prompt objects.
    *   **Validation:** Each object in the array should represent a valid prompt with fields like `id`, `title`, `versions`, and `modality`.
    *   **Duplicate Handling:** Prompts with an `id` that already exists in your current collection will be skipped to prevent duplicates.