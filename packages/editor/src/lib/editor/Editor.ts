import EventEmitter from "eventemitter3";
import { TLEventMap } from "./types/emit-types";
import { RootState } from "./tools/RootState";
import { StateNode, TLStateNodeConstructor } from "./tools/StateNode";

export class Editor extends EventEmitter<TLEventMap> {
  constructor() {
    super();
    class NewRoot extends RootState {
      static override initial = initialState ?? "";
    }

    this.root = new NewRoot(this);
    this.root.children = {};
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
}
