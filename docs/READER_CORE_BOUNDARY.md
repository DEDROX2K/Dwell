# Dwell Reader Core Boundary

## Purpose
Define a stable "reader core" boundary so home/library UI can be redesigned later without breaking:

- local ingest/open flows
- library persistence
- open/reopen behavior
- reading progress persistence
- continue-reading/session restore behavior
- remove-from-library flow
- EPUB reading path

This document reflects the current implementation and avoids changing behavior.

## Boundary Summary
Reader core is the combination of:

- content ingest/validation/extraction logic
- reader state transitions (open/close/active content)
- SQLite persistence and progress write/read
- close-window save handshake
- EPUB parse/read pipeline

Presentation/UI layer is everything that renders tabs, lists, controls, and style-driven interactions.

Integration/bridging layer is preload + IPC + window orchestration that connects renderer state/actions to Electron and DB.

## Exact Flow Traces

### 1) Local book/file ingest and open
1. UI entry points:
   - `src/renderer/features/home/components/LocationsTab.tsx` (`Open` button / list click)
   - `src/renderer/App.tsx` (drag-and-drop and `reader:loadLink`)
2. Open orchestration:
   - `src/renderer/features/reader/hooks/useDirectoryValidator.ts` (`openInReaderIfValid`)
3. Content branching:
   - Book path (`.epub`, `.xhtml`, `.html`, `.txt`) sets reader state `type: "book"`
   - Manga/archive/pdf path validates/processes images via:
     - `src/renderer/features/reader/services/directoryValidator.ts`
4. Format source-of-truth:
   - `src/renderer/utils/file.ts` (`formatUtils`)

### 2) Local library persistence
1. Renderer invokes DB operations via store thunks:
   - `src/renderer/store/library.ts`
   - `src/renderer/store/bookmarks.ts`
   - `src/renderer/store/bookNotes.ts`
2. Main process DB handlers:
   - `src/electron/ipc/database.ts`
3. DB service and schema:
   - `src/electron/db/index.ts`
   - `src/electron/db/schema.ts`

### 3) Open/reopen behavior
1. Window creation and optional link open:
   - `src/electron/util/window.ts` (`createWindow`, `reader:loadLink`)
2. Single-instance and second-instance behavior:
   - `src/electron/main.ts`
3. Renderer receives link and opens reader:
   - `src/renderer/App.tsx` (`reader:loadLink` listener)
   - `src/renderer/features/reader/hooks/useDirectoryValidator.ts`

### 4) Reading progress persistence
1. In-memory reader updates:
   - `src/renderer/store/reader.ts`
2. Persist write path:
   - `src/renderer/store/library.ts` (`updateCurrentItemProgress`)
   - IPC: `db:book:updateProgress` / `db:manga:updateProgress`
3. Window close save handshake (must preserve):
   - `src/electron/util/window.ts` sends `reader:recordPage`
   - `src/renderer/App.tsx` handles `reader:recordPage`, calls `closeReader` and then `window:destroy`

### 5) Session restore / continue reading
1. Continue reading list:
   - `src/renderer/features/home/components/HistoryTab.tsx`
2. Continue-reading click behavior:
   - `src/renderer/features/home/components/BookmarkHistoryListItem.tsx`
   - passes `mangaPageNumber` OR `epubChapterId` + `epubElementQueryString`
3. Reader load applies persisted location:
   - EPUB: `src/renderer/features/reader/epub/EPubReader.tsx`
   - Manga: `src/renderer/features/reader/manga/Reader.tsx`

### 6) Remove-from-library flow
1. UI trigger:
   - context menus in `App.tsx` templates and list items in home/reader side lists
2. Store thunk:
   - `src/renderer/store/library.ts` (`deleteLibraryItem`)
3. DB delete:
   - `src/electron/ipc/database.ts` (`db:library:deleteItem`) with cascade semantics
4. Store refresh:
   - DB change channels (`db:library:change`, `db:bookmark:change`, `db:bookNote:change`) listened in `App.tsx`

### 7) EPUB reading path
1. Reader mount:
   - `src/renderer/Main.tsx` -> `EPubReader`
2. EPUB extraction/parse/read:
   - `src/renderer/utils/epub.ts`
3. EPUB reader rendering/progress:
   - `src/renderer/features/reader/epub/EPubReader.tsx`
4. Notes/bookmarks persistence:
   - `src/renderer/store/bookNotes.ts`, `src/renderer/store/bookmarks.ts`

## Module Ownership

### Core Reading/Persistence Flows
- `src/renderer/features/reader/hooks/useDirectoryValidator.ts`
- `src/renderer/features/reader/services/directoryValidator.ts`
- `src/renderer/utils/epub.ts`
- `src/renderer/utils/pdf.ts`
- `src/renderer/store/reader.ts`
- `src/renderer/store/library.ts`
- `src/renderer/store/bookmarks.ts`
- `src/renderer/store/bookNotes.ts`
- `src/electron/ipc/database.ts`
- `src/electron/db/index.ts`
- `src/electron/db/schema.ts`

### Presentation/UI Layer
- `src/renderer/features/home/**`
- `src/renderer/features/settings/**`
- `src/renderer/features/reader/epub/components/**`
- `src/renderer/features/reader/manga/components/**`
- `src/renderer/components/**`
- `src/renderer/styles/**`

### Bridging/Integration Layer
- `src/electron/preload.ts`
- `src/electron/main.ts`
- `src/electron/util/window.ts`
- `src/electron/ipc/fs.ts`
- `src/electron/ipc/dialog.ts`
- `src/electron/util/mainSettings.ts`
- `src/renderer/App.tsx` (composition + event wiring)

## Current Coupling Problems
- `App.tsx` contains both shell UI concerns and core orchestration/event wiring.
- Home list components directly depend on reader-open behavior and DB-backed state shape.
- Context menu templates in `App.tsx` mix UI and domain actions.
- Reader flows are expressed via store thunks and global `window.*` APIs, not through a small explicit core service interface.
- Continue-reading behavior is spread across `HistoryTab`, `BookmarkHistoryListItem`, reader slices, and reader components.

## Target Interface for Future UI Replacement
The intended future boundary is represented by:

- `src/renderer/core/readerCoreContract.ts`

Key operations:

- `listLibraryItems()`
- `importOrOpenLocalPath(link, options?)`
- `openBook(link, options?)`
- `continueReading(request)`
- `removeFromLibrary(itemLink)`
- `persistCurrentReadingProgress()`

UI replacements should call only these operations (or adapters that satisfy the same contract), rather than reaching into mixed UI/store/window internals.

## Non-Goals in This Pass
- No DB schema changes
- No migration changes
- No close-save IPC sequence changes
- No progress semantic changes
- No removals of non-EPUB support
