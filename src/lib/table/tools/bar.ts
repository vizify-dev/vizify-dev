import BAR_HTML from "./bar.html";
import BAR_CSS from "./bar.css?raw";

export const BAR = BAR_HTML.replace("/* BAR_CSS */", () => BAR_CSS);
