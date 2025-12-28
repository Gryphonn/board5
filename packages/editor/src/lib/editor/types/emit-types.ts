/** @public */
export interface TLEventMap {
  tick: [number];
  frame: [number];
}

/** @public */
export type TLEventMapHandler<T extends keyof TLEventMap> = (
  ...args: TLEventMap[T]
) => void;
