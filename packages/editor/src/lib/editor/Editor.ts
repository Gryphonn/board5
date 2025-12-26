import EventEmitter from "eventemitter3";
import { TLEventMap } from "./types/emit-types";

export class Editor extends EventEmitter<TLEventMap> {}
