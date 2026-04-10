import { setAppSettings } from "@store/appSettings";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import type { ReactElement } from "react";

const HomeViewToggle = (): ReactElement => {
    const dispatch = useAppDispatch();
    const homeViewMode = useAppSelector((store) => store.appSettings.homeViewMode);

    return (
        <fieldset className="viewToggle">
            <legend className="sr-only">Home view mode</legend>
            <button
                className={homeViewMode === "grid" ? "selected" : ""}
                data-tooltip="Grid View"
                onClick={() => dispatch(setAppSettings({ homeViewMode: "grid" }))}
            >
                Grid
            </button>
            <button
                className={homeViewMode === "list" ? "selected" : ""}
                data-tooltip="List View"
                onClick={() => dispatch(setAppSettings({ homeViewMode: "list" }))}
            >
                List
            </button>
        </fieldset>
    );
};

export default HomeViewToggle;
