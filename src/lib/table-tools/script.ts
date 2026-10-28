import SCRIPT_HTML from "./script.html";
import RUNTIME from "./runtime.generated.txt";

export const SCRIPT = SCRIPT_HTML.replace("/* TABLE_TOOLS_RUNTIME */", RUNTIME);
