import { HandTool, Render } from "@tldraw/render";
import "./style.css";
import {
  BaseRecord,
  Editor,
  RecordId,
  Store,
  StoreSchema,
  createRecordType,
} from "@tldraw/editor";

// Define record types
interface Book extends BaseRecord<"book", RecordId<Book>> {
  title: string;
  author: string;
}

const Book = createRecordType<Book>("book", {
  scope: "document",
});

interface Author extends BaseRecord<"author", RecordId<Author>> {
  name: string;
}

const Author = createRecordType<Author>("author", {
  scope: "document",
});

// Create a store with schema
const schema = StoreSchema.create({
  book: Book,
  author: Author,
});

const store = new Store({
  schema,
  props: {},
});

// Add records
const book = Book.create({ title: "The Lathe of Heaven", author: "Le Guin" });
store.put([book]);

// Listen to changes
store.listen((entry) => {
  console.log("Changes:", entry.changes);
});

// const render = new Render();

// console.log(HandTool.id);
// const editor = new Editor({ tools: [HandTool] });

// editor.setCurrentTool("hand");
// console.log(editor.getCurrentTool());
// console.log(editor.getCurrentTool().getPath());
// editor.getCurrentTool().transition("pointing");
// console.log(editor.getCurrentTool().getPath());

// console.log(typeof editor.getCurrentTool());

// document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
//  Hey
// `;
