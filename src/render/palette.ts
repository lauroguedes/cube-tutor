import type { Color } from '../engine/faces';

/** Popular cube looks the learner can pick from. */
export type CubeStyle = 'classic' | 'stickerless' | 'pastel';

export const CUBE_STYLES: readonly CubeStyle[] = ['classic', 'stickerless', 'pastel'];

export interface StyleSpec {
  /** Plastic between the stickers. */
  body: number;
  bodyRoughness: number;
  stickers: Record<Color, number>;
  /** Sticker (or colored tile) size relative to a 1-unit piece. */
  stickerSize: number;
  stickerRadius: number;
  /** Glossy stickers vs satin molded plastic. */
  clearcoat: number;
  roughness: number;
}

export const STYLES: Record<CubeStyle, StyleSpec> = {
  // Black plastic with glossy stickers: the original look.
  classic: {
    body: 0x0e0e10,
    bodyRoughness: 0.42,
    stickers: {
      white: 0xf2f2ee,
      yellow: 0xffd23a,
      green: 0x16a34a,
      blue: 0x1d4ed8,
      red: 0xc81e32,
      orange: 0xf26a1b,
    },
    stickerSize: 0.82,
    stickerRadius: 0.11,
    clearcoat: 0.45,
    roughness: 0.3,
  },
  // Modern speedcube: colored plastic tiles, no black border.
  stickerless: {
    body: 0x2a2b30,
    bodyRoughness: 0.55,
    stickers: {
      white: 0xf7f7f2,
      yellow: 0xfde047,
      green: 0x22c55e,
      blue: 0x2563eb,
      red: 0xe11d2e,
      orange: 0xff7a1a,
    },
    stickerSize: 0.935,
    stickerRadius: 0.16,
    clearcoat: 0.12,
    roughness: 0.42,
  },
  // Soft stickerless pastels on a light core.
  pastel: {
    body: 0xdedde4,
    bodyRoughness: 0.6,
    stickers: {
      white: 0xfbfaf6,
      yellow: 0xfde68a,
      green: 0x86efac,
      blue: 0x93c5fd,
      red: 0xf9a8c4,
      orange: 0xfdba74,
    },
    stickerSize: 0.935,
    stickerRadius: 0.16,
    clearcoat: 0.12,
    roughness: 0.45,
  },
};

export const DIM_HEX = 0x2a2a2e;
