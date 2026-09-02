import { describe, expect, it } from 'vitest';
import { SINGLE_VOLUME_SIDE_PAD, volumeSliderLayout } from './volumeSlider';

describe('volumeSliderLayout', () => {
  it('parks a single volume in the middle with gray shoulders', () => {
    expect(volumeSliderLayout(1)).toEqual({
      mode: 'single',
      slots: 1,
      knobIndex: 0,
      sidePad: SINGLE_VOLUME_SIDE_PAD,
    });
    expect(SINGLE_VOLUME_SIDE_PAD).toBeGreaterThan(0);
    expect(SINGLE_VOLUME_SIDE_PAD).toBeLessThan(0.25);
  });

  it('uses two equal slots for two volumes', () => {
    expect(volumeSliderLayout(2, 0)).toMatchObject({
      mode: 'multi',
      slots: 2,
      knobIndex: 0,
      sidePad: 0,
    });
    expect(volumeSliderLayout(2, 1).knobIndex).toBe(1);
  });

  it('uses three equal slots for three volumes', () => {
    expect(volumeSliderLayout(3, 1)).toMatchObject({
      mode: 'multi',
      slots: 3,
      knobIndex: 1,
      sidePad: 0,
    });
  });

  it('clamps the knob index', () => {
    expect(volumeSliderLayout(3, -1).knobIndex).toBe(0);
    expect(volumeSliderLayout(3, 9).knobIndex).toBe(2);
  });
});
