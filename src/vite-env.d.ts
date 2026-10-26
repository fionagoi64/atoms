/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'troika-three-text' {
  import { Object3D } from 'three';

  export class Text extends Object3D {
    text: string;
    font?: string;
    fontSize?: number;
    letterSpacing?: number;
    lineHeight?: number | string;
    maxWidth?: number;
    overflowWrap?: 'normal' | 'break-word';
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    textIndent?: number;
    whiteSpace?: 'normal' | 'nowrap';
    anchorX?: number | string;
    anchorY?: number | string;
    color?: string | number | any;
    fillOpacity?: number;
    outlineWidth?: number | string;
    outlineColor?: string | number | any;
    outlineOpacity?: number;
    outlineBlur?: number | string;
    outlineOffsetX?: number | string;
    outlineOffsetY?: number | string;
    strokeWidth?: number | string;
    strokeColor?: string | number | any;
    strokeOpacity?: number;
    curveRadius?: number;
    direction?: 'auto' | 'ltr' | 'rtl';
    glyphGeometryDetail?: number;
    sdfGlyphSize?: number;
    gpuAccelerateSDF?: boolean;
    sync(callback?: () => void): void;
    dispose(): void;
    [key: string]: any;
  }
}
