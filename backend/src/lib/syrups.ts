export const SYRUP_MODIFIER_NAME = 'Сироп';

export const SYRUP_NAMES = [
  'Карамель',
  'Солёная карамель',
  'Ваниль',
  'Шоколад',
  'Кленовый',
  'Лесной орех',
  'Миндаль',
  'Макадамия',
  'Фисташка',
  'Амаретто',
  'Попкорн',
  'Ирландский крем',
  'Имбирный пряник',
  'Восточные пряности',
  'Чёрная смородина',
  'Малина',
  'Клубника',
  'Вишня',
  'Банан',
  'Кокос',
  'Яблоко',
  'Арбуз',
  'Лаванда',
  'Мята и эвкалипт',
] as const;

export type SyrupName = (typeof SYRUP_NAMES)[number];

export function isSyrupName(value: string): value is SyrupName {
  return (SYRUP_NAMES as readonly string[]).includes(value);
}
