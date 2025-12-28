import EventEmitter from "eventemitter3";
import { TLEventMap } from "./types/emit-types";
import { RootState } from "./tools/RootState";
import { StateNode, TLStateNodeConstructor } from "./tools/StateNode";
import { hasOwnProperty } from "@tldraw/utils";

/** @public */
export interface TLEditorOptions {
  initialState?: string;

  /**
   * An array of tools to use in the editor. These will be used to handle events and manage user interactions in the editor.
   */
  tools: readonly TLStateNodeConstructor[];
}

export class Editor extends EventEmitter<TLEventMap> {
  constructor({ initialState, tools }: TLEditorOptions) {
    super();

    class NewRoot extends RootState {
      static override initial = initialState ?? "";
    }

    this.root = new NewRoot(this);
    this.root.children = {};

    // Tools.
    // Accept tools from constructor parameters which should not conflict with the root note's default or
    // "baked in" tools, select and zoom.
    for (const Tool of [...tools]) {
      if (hasOwnProperty(this.root.children!, Tool.id)) {
        throw Error(`Can't override tool with id "${Tool.id}"`);
      }
      this.root.children![Tool.id] = new Tool(this, this.root);
    }
  }

  /**
   * The root state of the statechart.
   *
   * @public
   */
  readonly root: StateNode;

  /**
   * Set the selected tool.
   *
   * @example
   * ```ts
   * editor.setCurrentTool('hand')
   * editor.setCurrentTool('hand', { date: Date.now() })
   * ```
   *
   * @param id - The id of the tool to select.
   * @param info - Arbitrary data to pass along into the transition.
   *
   * @public
   */
  setCurrentTool(id: string, info = {}): this {
    this.root.transition(id, info);
    return this;
  }

  /**
   * The current selected tool.
   *
   * @public
   */
  getCurrentTool(): StateNode {
    return this.root.getCurrent()!;
  }
}
