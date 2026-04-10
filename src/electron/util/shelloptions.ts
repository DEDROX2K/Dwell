import fs from "node:fs/promises";
import path from "node:path";
import * as sudo from "@vscode/sudo-prompt";
import { app } from "electron";
import { IS_PORTABLE } from ".";
import { createMainLogger } from "./logger";

const logger = createMainLogger("shelloptions");

const op = {
    name: "Dwell",
    icns: app.getPath("exe"),
};

// registry, add option "open in reader" in  explorer context menu
export const addOptionToExplorerMenu = async (): Promise<boolean> => {
    try {
        const appPath = IS_PORTABLE
            ? app.getPath("exe").replace(/\\/g, "\\\\")
            : path.join(app.getPath("exe"), `../../${app.name}.exe`).replace(/\\/g, "\\\\");
        const regInit = `Windows Registry Editor Version 5.00
        
        ; setup context menu item for click on folders tree item
        [HKEY_CURRENT_USER\\Software\\Classes\\directory\\shell\\Dwell\\command]
        @="\\"${appPath}\\" \\"%V\\""
        
        ; specify an icon for the item
        [HKEY_CURRENT_USER\\Software\\Classes\\directory\\shell\\Dwell]
        @="Open in Dwell "
        "icon"="${appPath}"

        
        [HKEY_CLASSES_ROOT\\.cbz\\shell\\Dwell]
        @="Open in Dwell"
        "Icon"="${appPath}"

        [HKEY_CLASSES_ROOT\\.cbz\\shell\\Dwell\\command]
        @="\\"${appPath}\\" \\"%V\\""


        [HKEY_CLASSES_ROOT\\Dwell]
        @="Dwell"

        [HKEY_CLASSES_ROOT\\Dwell\\DefaultIcon]
        @="${appPath}"

        [HKEY_CLASSES_ROOT\\Dwell\\shell\\open]
        "Icon"="${appPath}"

        [HKEY_CLASSES_ROOT\\Dwell\\shell\\open\\command]
        @="\\"${appPath}\\" \\"%V\\""

        [HKEY_CLASSES_ROOT\\.zip\\OpenWithProgids]
        "Dwell"=""
        [HKEY_CLASSES_ROOT\\.cbz\\OpenWithProgids]
        "Dwell"=""
        [HKEY_CLASSES_ROOT\\.cbr\\OpenWithProgids]
        "Dwell"=""
        [HKEY_CLASSES_ROOT\\.cb7\\OpenWithProgids]
        "Dwell"=""

        [HKEY_CLASSES_ROOT\\.rar\\OpenWithProgids]
        "Dwell"=""

        [HKEY_CLASSES_ROOT\\.pdf\\OpenWithProgids]
        "Dwell"=""

        [HKEY_CLASSES_ROOT\\.7z\\OpenWithProgids]
        "Dwell"=""
        `;

        const tempPath = app.getPath("temp");
        const regFilePath = path.join(tempPath, "createOpenWithDwell.reg");

        await fs.writeFile(regFilePath, regInit);

        return await new Promise<boolean>((resolve, reject) => {
            sudo.exec(`regedit.exe /S ${regFilePath}`, op, (error) => {
                if (error) {
                    logger.error("Windows Explorer 'Open in Dwell' (folders): regedit returned error", error);
                    reject(new Error(`Failed to add explorer menu option: ${error.message}`));
                    return;
                }
                resolve(true);
            });
        });
    } catch (error) {
        logger.error("addOptionToExplorerMenu: failed before or after regedit", error);
        throw error;
    }
};

export const addOptionToExplorerMenu_epub = async (): Promise<boolean> => {
    try {
        const appPath = IS_PORTABLE
            ? app.getPath("exe").replace(/\\/g, "\\\\")
            : path.join(app.getPath("exe"), `../../${app.name}.exe`).replace(/\\/g, "\\\\");
        const regInit = `Windows Registry Editor Version 5.00
        
        [HKEY_CLASSES_ROOT\\.epub\\shell\\Dwell]
        @="Open in Dwell"
        "Icon"="${appPath}"

        [HKEY_CLASSES_ROOT\\.epub\\shell\\Dwell\\command]
        @="\\"${appPath}\\" \\"%V\\""

        [HKEY_CLASSES_ROOT\\.epub\\OpenWithProgids]
        "Dwell"=""
        
        [HKEY_CLASSES_ROOT\\.txt\\OpenWithProgids]
        "Dwell"=""
        
        [HKEY_CLASSES_ROOT\\.xhtml\\OpenWithProgids]
        "Dwell"=""
        
        [HKEY_CLASSES_ROOT\\.html\\OpenWithProgids]
        "Dwell"=""
        `;

        const tempPath = app.getPath("temp");
        const regFilePath = path.join(tempPath, "createOpenWithDwell-epub.reg");

        await fs.writeFile(regFilePath, regInit);

        return await new Promise<boolean>((resolve, reject) => {
            sudo.exec(`regedit.exe /S ${regFilePath}`, op, (error) => {
                if (error) {
                    logger.error("Windows Explorer 'Open in Dwell' (.epub): regedit returned error", error);
                    reject(new Error(`Failed to add epub explorer menu option: ${error.message}`));
                    return;
                }
                resolve(true);
            });
        });
    } catch (error) {
        logger.error("addOptionToExplorerMenu_epub: failed before or after regedit", error);
        throw error;
    }
};

export const deleteOptionInExplorerMenu = async (): Promise<boolean> => {
    try {
        const regDelete = `Windows Registry Editor Version 5.00
        
        [-HKEY_CURRENT_USER\\Software\\Classes\\directory\\shell\\Dwell]
        
        [-HKEY_CLASSES_ROOT\\.cbz\\shell\\Dwell]

        [-HKEY_CLASSES_ROOT\\Dwell]

        [HKEY_CLASSES_ROOT\\.zip\\OpenWithProgids]
        "Dwell"=-

        [HKEY_CLASSES_ROOT\\.pdf\\OpenWithProgids]
        "Dwell"=-

        [HKEY_CLASSES_ROOT\\.7z\\OpenWithProgids]
        "Dwell"=-
        `;

        const tempPath = app.getPath("temp");
        const regFilePath = path.join(tempPath, "deleteOpenWithDwell.reg");

        await fs.writeFile(regFilePath, regDelete);

        return await new Promise<boolean>((resolve, reject) => {
            sudo.exec(`regedit.exe /S ${regFilePath}`, op, (error) => {
                if (error) {
                    logger.error("Windows Explorer: removing 'Open in Dwell' registry keys failed", error);
                    reject(new Error(`Failed to delete explorer menu option: ${error.message}`));
                    return;
                }
                resolve(true);
            });
        });
    } catch (error) {
        logger.error("deleteOptionInExplorerMenu: failed before or after regedit", error);
        throw error;
    }
};

export const deleteOptionInExplorerMenu_epub = async (): Promise<boolean> => {
    try {
        const regDelete = `Windows Registry Editor Version 5.00
        
        [-HKEY_CLASSES_ROOT\\.epub\\shell\\Dwell]

        `;

        const tempPath = app.getPath("temp");
        const regFilePath = path.join(tempPath, "deleteOpenWithDwell-epub.reg");

        await fs.writeFile(regFilePath, regDelete);

        return await new Promise<boolean>((resolve, reject) => {
            sudo.exec(`regedit.exe /S ${regFilePath}`, op, (error) => {
                if (error) {
                    logger.error("Windows Explorer: removing .epub shell key failed", error);
                    reject(new Error(`Failed to delete epub explorer menu option: ${error.message}`));
                    return;
                }
                resolve(true);
            });
        });
    } catch (error) {
        logger.error("deleteOptionInExplorerMenu_epub: failed before or after regedit", error);
        throw error;
    }
};
