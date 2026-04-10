import type { LibraryItemWithProgress } from "@common/types/db";
import type { OpenInReaderOptions } from "@features/reader/hooks/useDirectoryValidator";
import { useAppSelector } from "@store/hooks";
import { formatUtils } from "@utils/file";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "src/renderer/App";
import HomeItemPreview from "./components/HomeItemPreview";
import { getHomePreview } from "./utils/homePreview";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOpenTarget = (item: LibraryItemWithProgress): { link: string; options: OpenInReaderOptions } => {
    const options: OpenInReaderOptions = {};

    if (item.type === "book") {
        options.epubChapterId = item.progress?.chapterId ?? "";
        options.epubElementQueryString = item.progress?.position ?? "";
        return { link: item.link, options };
    }

    if (item.progress) {
        options.mangaPageNumber = item.progress.currentPage || 1;
        return { link: item.progress.chapterLink || item.link, options };
    }
    return { link: item.link, options };
};

const open = async (
    openInReader: ReturnType<typeof useAppContext>["openInReader"],
    item: LibraryItemWithProgress,
) => {
    const target = getOpenTarget(item);
    await openInReader(target.link, target.options);
};

const normalizeImportPath = (filePath: string): string => {
    const normalized = window.path.normalize(filePath);
    if (formatUtils.image.test(normalized)) return window.path.dirname(normalized);
    return normalized;
};

const expectedLibraryKey = (pathLike: string): string => {
    if (formatUtils.book.test(pathLike)) return pathLike;
    return window.path.dirname(pathLike);
};

const getProgressPercent = (item: LibraryItemWithProgress): number | null => {
    if (!item.progress) return null;
    if (item.type === "manga") {
        const total = item.progress.totalPages || 0;
        const current = item.progress.currentPage || 0;
        if (total <= 0) return null;
        return Math.max(0, Math.min(100, (current / total) * 100));
    }
    return 12;
};

const LibraryHome: React.FC = () => {
    const { openInReader, closeReader, setContextMenuData } = useAppContext();
    const isReaderActive = useAppSelector((store) => store.reader.active);
    const libraryMap = useAppSelector((store) => store.library.items);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedLink, setSelectedLink] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const libraryRef = useRef(libraryMap);
    libraryRef.current = libraryMap;

    const libraryItems = useMemo(() => {
        return (Object.values(libraryMap).filter((item) => item !== null) as LibraryItemWithProgress[]).sort(
            (a, b) => {
                const byTitle = window.app.betterSortOrder(a.title || "", b.title || "");
                if (byTitle !== 0) return byTitle;
                const aTs = new Date(a.updatedAt).getTime();
                const bTs = new Date(b.updatedAt).getTime();
                return bTs - aTs;
            },
        );
    }, [libraryMap]);

    useEffect(() => {
        if (!selectedLink) return;
        if (!libraryMap[selectedLink]) setSelectedLink(null);
    }, [libraryMap, selectedLink]);

    const waitForLibraryEntry = async (key: string, timeoutMs = 12000): Promise<boolean> => {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
            if (libraryRef.current[key]) return true;
            await wait(200);
        }
        return false;
    };

    const openItem = async (item: LibraryItemWithProgress) => {
        await open(openInReader, item);
    };

    const handleCardContextMenu = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        item: LibraryItemWithProgress,
    ) => {
        e.preventDefault();
        setSelectedLink(item.link);
        setContextMenuData({
            clickX: e.clientX,
            clickY: e.clientY,
            focusBackElem: e.currentTarget,
            items: [
                {
                    label: "Open",
                    action() {
                        void openItem(item);
                    },
                },
                window.contextMenu.template.removeHistory(item.link),
            ],
        });
    };

    const handleRootMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!(e.target instanceof HTMLElement)) return;
        if (e.target.closest(".libraryCard")) return;
        setSelectedLink(null);
    };

    const addFromDialog = async () => {
        setIsAdding(true);
        try {
            const supportedExt = [...formatUtils.files.list, ...formatUtils.image.list].map((ext) => ext.slice(1));
            const result = await window.electron.invoke("dialog:showOpenDialog", {
                properties: ["openFile", "multiSelections"],
                filters: [{ name: "Supported files", extensions: supportedExt }],
            });
            if (result.canceled || result.filePaths.length === 0) return;

            const candidates = Array.from(new Set(result.filePaths.map((p) => normalizeImportPath(p))));
            for (const pathLike of candidates) {
                const canHandle = formatUtils.files.test(pathLike) || formatUtils.image.test(pathLike);
                if (!canHandle) continue;

                const opened = await openInReader(pathLike, {
                    errorOnInvalid: false,
                    maxSubdirectoryDepth: formatUtils.packedManga.test(pathLike) ? 1 : 0,
                });
                if (!opened) continue;

                await waitForLibraryEntry(expectedLibraryKey(pathLike));
                await closeReader();
            }
        } finally {
            await closeReader();
            setIsAdding(false);
        }
    };

    return (
        <div
            ref={rootRef}
            className="singleLibraryHome"
            style={{ display: isReaderActive ? "none" : "flex" }}
            onMouseDown={handleRootMouseDown}
        >
            <div className="libraryHeader">
                <h1>Your Library</h1>
                <p>Local books and files added to Dwell.</p>
            </div>

            <ul className="libraryGrid">
                {libraryItems.length === 0 ? (
                    <li className="libraryEmpty">
                        <p>No items in your library yet.</p>
                        <p>Use Add to import local files.</p>
                    </li>
                ) : (
                    libraryItems.map((item) => {
                        const preview = getHomePreview({
                            link: item.link,
                            isDirectory: item.type === "manga",
                            libraryItem: item,
                        });
                        const progress = getProgressPercent(item);
                        return (
                            <li key={item.link}>
                                <button
                                    className={`libraryCard ${selectedLink === item.link ? "selected" : ""}`}
                                    onClick={() => setSelectedLink(item.link)}
                                    onDoubleClick={() => void openItem(item)}
                                    onContextMenu={(e) => handleCardContextMenu(e, item)}
                                    title={item.link}
                                >
                                    <HomeItemPreview preview={preview} title={item.title} />
                                    <span className="meta">
                                        <span className="title">{item.title}</span>
                                        {item.author ? (
                                            <span className="author">{item.author}</span>
                                        ) : (
                                            <span className="author">Local file</span>
                                        )}
                                    </span>
                                    {progress !== null && (
                                        <span className="progressTrack" aria-hidden="true">
                                            <span className="progressFill" style={{ width: `${progress}%` }} />
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>

            <div className="libraryFooter">
                <button className="addLibraryBtn" onClick={addFromDialog} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add"}
                </button>
            </div>
        </div>
    );
};

export default LibraryHome;
