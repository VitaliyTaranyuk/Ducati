export type VolumeSliderMode = 'single' | 'multi';

export interface VolumeSliderLayout {
  mode: VolumeSliderMode;
  /** Knob slots inside the track (1 for a lone volume, else option count). */
  slots: number;
  /** Index of the knob, 0-based. */
  knobIndex: number;
  /** Horizontal inset of a lone volume, as a fraction of the track (0–0.5). */
  sidePad: number;
}

/** Gray shoulders around a single allowed volume — same chrome as the 2/3-slot track. */
export const SINGLE_VOLUME_SIDE_PAD = 0.12;

/**
 * 1 volume → knob parked in the middle, small empty gray on both sides.
 * 2+ volumes → one slot per option, no empty shoulders.
 */
export function volumeSliderLayout(
  optionCount: number,
  selectedIndex = 0,
): VolumeSliderLayout {
  if (optionCount <= 1) {
    return {
      mode: 'single',
      slots: 1,
      knobIndex: 0,
      sidePad: SINGLE_VOLUME_SIDE_PAD,
    };
  }
  const slots = optionCount;
  const knobIndex = Math.min(Math.max(0, selectedIndex), slots - 1);
  return { mode: 'multi', slots, knobIndex, sidePad: 0 };
}
