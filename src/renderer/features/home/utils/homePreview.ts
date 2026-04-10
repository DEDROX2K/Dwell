import type { LibraryItemWithProgress } from "@common/types/db";
import { formatUtils } from "@utils/file";

export type HomePreviewKind = "image" | "folder" | "epub" | "pdf" | "archive" | "text" | "html" | "file";

export type HomePreviewData = {
    src: string | null;
    kind: HomePreviewKind;
    label: string;
};

const getKindFromPath = (pathLike: string, isDirectory: boolean): HomePreviewKind => {
    if (isDirectory) return "folder";
    const ext = window.path.extname(pathLike).toLowerCase();
    if (formatUtils.image.test(pathLike)) return "image";
    if (ext === ".epub") return "epub";
    if (ext === ".pdf") return "pdf";
    if (formatUtils.packedManga.test(pathLike)) return "archive";
    if (ext === ".txt") return "text";
    if (ext === ".html" || ext === ".xhtml") return "html";
    return "file";
};

const labelByKind: Record<HomePreviewKind, string> = {
    image: "IMG",
    folder: "DIR",
    epub: "EPUB",
    pdf: "PDF",
    archive: "CB",
    text: "TXT",
    html: "HTML",
    file: "FILE",
};

export const getHomePreview = ({
    link,
    isDirectory,
    libraryItem,
}: {
    link: string;
    isDirectory: boolean;
    libraryItem?: LibraryItemWithProgress | null;
}): HomePreviewData => {
    const kind = getKindFromPath(link, isDirectory);
    const coverPath = libraryItem?.cover;

    if (coverPath && window.fs.existsSync(coverPath)) {
        return {
            src: coverPath,
            kind: "image",
            label: labelByKind.image,
        };
    }

    if (kind === "image" && window.fs.existsSync(link)) {
        return {
            src: link,
            kind,
            label: labelByKind[kind],
        };
    }

    return {
        src: null,
        kind,
        label: labelByKind[kind],
    };
};
