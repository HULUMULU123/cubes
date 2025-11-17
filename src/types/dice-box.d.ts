declare module '@3d-dice/dice-box' {
  export interface DiceBoxLightConfig {
    intensity?: number;
    color?: string;
    x?: number;
    y?: number;
    z?: number;
  }

  export interface DiceBoxOptions {
    assetPath?: string;
    container?: string | HTMLElement;
    theme?: string | object;
    light?: DiceBoxLightConfig;
    scale?: number;
    shadowQuality?: number;
    origin?: { x?: number; y?: number };
  }

  export interface RollTheme {
    labels?: string;
    material?: string;
    background?: string;
    edges?: string;
    font?: string;
    size?: number;
    [key: string]: unknown;
  }

  export interface RollResult<T = number> {
    type: string;
    roll: T[];
  }

  export interface RollOptions {
    theme?: string | RollTheme;
    rerender?: boolean;
  }

  export class DiceBox {
    constructor(container: string | HTMLElement, options?: DiceBoxOptions);
    init(): Promise<void>;
    roll(notation: string | string[], options?: RollOptions): Promise<RollResult[]>;
    clear(): void;
  }
}
