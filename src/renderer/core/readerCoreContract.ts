import type { LibraryItemWithProgress } from "@common/types/db";
import type { OpenInReaderIfValid, OpenInReaderOptions } from "@features/reader/hooks/useDirectoryValidator";

/**
 * Reader-core contract for Dwell.
 *
 * This is a type-level boundary used by renderer modules to separate
 * reading/persistence operations from presentation concerns.
 *
 * Notes:
 * - This does not change runtime behavior.
 * - Current implementations still live in existing store slices/hooks/IPC handlers.
 */
export type ReaderCoreBookSummary = {
    link: string;
    title: string;
    type: "book" | "manga";
    lastReadAt?: Date;
};

export type ContinueReadingRequest = {
    itemLink: string;
    chapterId?: string;
    chapterName?: string;
    position?: string;
    page?: number;
};

export interface ReaderCoreContract {
    listLibraryItems(): Promise<LibraryItemWithProgress[]>;
    importOrOpenLocalPath: OpenInReaderIfValid;
    openBook(link: string, options?: OpenInReaderOptions): Promise<boolean>;
    continueReading(request: ContinueReadingRequest): Promise<boolean>;
    removeFromLibrary(itemLink: string): Promise<boolean>;
    persistCurrentReadingProgress(): Promise<void>;
}
