# AI Prompt Collector - Future Development Plan

This document outlines the planned features and improvements for the AI Prompt Collector application.

**Phase 4: User Experience & Theming**

-   **[✔️] 6. Implement Dark/Light Mode Toggle:**
    -   [ ] Add a UI control (e.g., a toggle switch in the sidebar or header) to allow users to manually switch between light and dark themes.
    -   [ ] Use JavaScript to add/remove the `dark` class on the `<html>` element.
    -   [ ] Persist the user's theme preference in `localStorage` so it's remembered across sessions.
    -   [ ] Ensure all components are fully theme-aware and have optimal contrast in both modes.

-   **[✔️] 7. Implement a Toast Notification System:**
    -   [ ] Replace the simple "Copied!" text feedback with a more robust toast notification system.
    -   [ ] Use toast notifications for other actions like "Prompt Saved," "Prompt Deleted," "Import Successful," and API error messages.
    -   [ ] Position notifications in a non-intrusive corner of the screen (e.g., top-right or bottom-center).

**Phase 5: Data Portability & Advanced Filtering**

-   **[TODO] 8. Implement CSV/JSON Export Functionality:**
    -   [ ] Add logic to the "Export" button that converts the `prompts` array into a CSV or JSON string.
    -   [ ] Trigger a file download of the generated string (`prompts.csv` or `prompts.json`).
    -   [ ] Ensure all fields, including multi-value fields like tags, are handled correctly (e.g., tags could be a single pipe-separated string in CSV).

-   **[TODO] 9. Implement CSV Import Functionality:**
    -   [ ] Add logic to the "Import" button that opens a file selection dialog for `.csv` files.
    -   [ ] Implement a CSV parsing function that reads the file and converts each row into a valid `Prompt` object.
    -   [ ] Provide feedback to the user on the import process (e.g., "Successfully imported 15 prompts").
    -   [ ] Include robust error handling for malformed CSV files or incorrect data types.

-   **[TODO] 10. (Optional) Add Quick Filters for Themes/Tags:**
    -   [ ] In the sidebar, dynamically identify the 5-7 most frequently used themes or tags.
    -   [ ] Display these as clickable pills or links under a "Quick Filters" section.
    -   [ ] Clicking a theme/tag filter should update the main view to show only prompts with that attribute.