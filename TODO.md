# AI Prompt Collector - Future Development Plan

This document outlines the planned features and improvements for the AI Prompt Collector application.

**Phase 4: User Experience & Theming (Completed)**

-   [✔️] Implement Dark/Light Mode Toggle
-   [✔️] Implement a Toast Notification System

**Phase 5: Data Portability & Advanced Filtering (Completed)**

-   [✔️] Implement JSON Export Functionality
-   [✔️] Implement CSV Import Functionality
-   [✔️] Add Quick Filters for Themes/Tags

---
### **NEW: Phase 6: Advanced Prompt Management & Versioning**

-   **[✔️] 11. Implement Prompt Version Control:**
    -   [x] Update the data structure to store a history of `promptText` changes for each prompt.
    -   [x] Modify the "Edit" functionality to create a new version when the prompt text is changed, rather than overwriting it.
    -   [x] Add a "Version History" section to the `PromptDetailView` to list all available versions.
    -   [x] Implement a mechanism to revert to or set a previous version as the "active" version.

### **NEW: Phase 7: Prompt Testing & Evaluation Framework**

-   **[✔️] 12. Implement Prompt Testing Interface:**
    -   [x] In the `PromptDetailView`, add a "Testing" tab or section.
    -   [x] Allow users to run the active prompt version against the Gemini API directly from this interface and view the output.
    -   [x] Store the test results (output, date) associated with the specific prompt version that was tested.

-   **[✔️] 13. Implement AI-Powered Evaluation:**
    -   [x] After a test is run, add an "Evaluate with AI" button.
    -   [x] This feature will send the prompt, its output, and a predefined rubric to the Gemini API for a quality assessment.
    -   [x] The AI will return a score (e.g., 1-10) and qualitative feedback based on criteria like clarity, creativity, and adherence to instructions.
    -   [x] Store the evaluation score and feedback with the test result.

-   **[✔️] 14. Implement Version Comparison View:**
    -   [x] Create a UI within the "Testing" section to compare test results from different versions side-by-side.
    -   [x] Display the prompt text, generated output, AI score, and feedback for each version to help users identify which changes improved the prompt's performance.
