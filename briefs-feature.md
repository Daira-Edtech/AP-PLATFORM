# Dynamic Cabinet Briefs Feature

## Goal
Implement a dynamic, DOM-based "Cabinet Brief" generator in the Commissioner portal that takes live state data, renders it into a multi-page interactive preview, and exports it as a high-fidelity PDF.

## Context
We are implementing **Option A**: Interactive DOM-Based Viewer + Client-Side Export. 
- We will build a new preview component that looks like an A4 document.
- We will populate it with live data from our existing endpoints.
- We will use `react-to-print` to handle printing the DOM exactly as it appears on screen to a PDF.

## Tasks

- [ ] **Task 1: Install Dependencies** 
  - Install `react-to-print` for converting DOM to PDF formatting.
  - Verify: Check `package.json` for `react-to-print`.

- [ ] **Task 2: Build API Support** 
  - Create `/api/commissioner/briefs/generate` endpoint to fetch aggregated data needed for the report (using existing utility logic or querying tables for a "snapshot" view).
  - Verify: Calling the endpoint returns a JSON payload with executive summary stats, district rankings, and risk trends.

- [ ] **Task 3: Create `BriefPreview` Component** 
  - Build a new component `src/components/commissioner/BriefPreview.tsx` that receives the data payload.
  - Design it to have an A4 aspect ratio with proper print media queries (`@media print { ... }`).
  - Include the 3 main sections: Executive Summary (dynamic text), KPI Grid, and Risk Trend Chart.
  - Verify: Component renders correctly on screen and looks like a formal government document.

- [ ] **Task 4: Wire `BriefsReportsView.tsx`** 
  - Update the "Generate Cabinet Brief" button to fetch data from the API.
  - Conditionally render the `BriefPreview` component inside the viewer overlay.
  - Add the `react-to-print` trigger to the "Download Final PDF" button, targeting the `BriefPreview` ref.
  - Verify: Clicking Generate shows the live preview. Clicking Download triggers the browser's print dialog (which allows saving as PDF) with correct pagination.

## Done When
- [ ] User can click "Generate Cabinet Brief".
- [ ] A preview renders showing *real* data (e.g., actual number of children, actual screening compliance).
- [ ] User can click "Download Final PDF" and receive a cleanly formatted, multi-page PDF document without cut-off charts.
- [ ] TypeScript check `tsc --noEmit` passes.
