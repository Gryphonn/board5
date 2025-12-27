import { Render } from "@tldraw/render";
import "./style.css";
import { Editor } from "@tldraw/editor";

const render = new Render();
const editor = new Editor();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
 Hey
`;
