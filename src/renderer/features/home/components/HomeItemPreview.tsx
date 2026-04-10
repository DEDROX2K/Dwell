import type { ReactElement } from "react";
import type { HomePreviewData } from "../utils/homePreview";

const HomeItemPreview = ({ preview, title }: { preview: HomePreviewData; title: string }): ReactElement => {
    const { src, kind, label } = preview;

    return (
        <span className={`itemPreview kind-${kind}`} aria-hidden="true">
            {src ? (
                <img src={src} alt={`${title} preview`} loading="lazy" />
            ) : (
                <span className="placeholder">{label}</span>
            )}
        </span>
    );
};

export default HomeItemPreview;
