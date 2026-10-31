import SCRIPT_HTML from "./script.html";
import RUNTIME from "./runtime.ts?raw";

export const SCRIPT = SCRIPT_HTML.replace("/* TABLE_RUNTIME */", () => RUNTIME);
