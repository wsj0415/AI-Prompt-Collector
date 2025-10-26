# AI Prompt Collector - Future Development Plan

This document outlines the planned features and improvements for the AI Prompt Collector application.

**Phase 4: User Experience & Theming**

-   **[✔️] 6. Implement Dark/Light Mode Toggle:**
    -   [x] Add a UI control (e.g., a toggle switch in the sidebar or header) to allow users to manually switch between light and dark themes.
    -   [x] Use JavaScript to add/remove the `dark` class on the `<html>` element.
    -   [x] Persist the user's theme preference in `localStorage` so it's remembered across sessions.
    -   [x] Ensure all components are fully theme-aware and have optimal contrast in both modes.

-   **[✔️] 7. Implement a Toast Notification System:**
    -   [x] Replace the simple "Copied!" text feedback with a more robust toast notification system.
    -   [x] Use toast notifications for other actions like "Prompt Saved," "Prompt Deleted," "Import Successful," and API error messages.
    -   [x] Position notifications in a non-intrusive corner of the screen (e.g., top-right or bottom-center).

**Phase 5: Data Portability & Advanced Filtering**

-   **[✔️] 8. Implement JSON Export Functionality:**
    -   [x] Added logic to the "Export" button to download all prompts as a `.json` file.
    -   [ ] (Future) Add option to export as CSV.

-   **[✔️] 9. Implement CSV Import Functionality:**
    -   [x] Add logic to the "Import" button that opens a file selection dialog for `.csv` files.
    -   [x] Implement a CSV parsing function that reads the file and converts each row into a valid `Prompt` object.
    -   [x] Provide feedback to the user on the import process (e.g., "Successfully imported 15 prompts").
    -   [x] Include robust error handling for malformed CSV files or incorrect data types.

-   **[✔️] 10. Add Quick Filters for Themes/Tags:**
    -   [x] In the sidebar, dynamically identified the 5 most frequently used themes.
    -   [x] Displayed these as clickable pills under a "Quick Filters" section.
    -   [x] Clicking a theme pill filters the main view to show only prompts with that theme, and works with other filters.