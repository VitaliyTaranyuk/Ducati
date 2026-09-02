import { publicUrl } from '../lib/assets';

export const SYRUP_NONE_ID = '';

export interface SyrupOption {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
}

export const SYRUP_NONE: SyrupOption = {
  id: SYRUP_NONE_ID,
  name: 'Без сиропа',
  description: 'Классический вкус',
  imageUrl: null,
};

function photo(id: string): string {
  return publicUrl(`syrups/${id}.jpg`);
}

/** HERBARISTA map — one shared list for every drink card. */
export const SYRUPS: SyrupOption[] = [
  { id: 'caramel', name: 'Карамель', description: 'Мягкая классическая карамель', imageUrl: photo('caramel') },
  { id: 'salted-caramel', name: 'Солёная карамель', description: 'Карамель с морской солью', imageUrl: photo('salted-caramel') },
  { id: 'vanilla', name: 'Ваниль', description: 'Нежный ванильный вкус', imageUrl: photo('vanilla') },
  { id: 'chocolate', name: 'Шоколад', description: 'Насыщенный какао', imageUrl: photo('chocolate') },
  { id: 'maple', name: 'Кленовый', description: 'Тёплый кленовый сироп', imageUrl: photo('maple') },
  { id: 'hazelnut', name: 'Лесной орех', description: 'Классический фундук', imageUrl: photo('hazelnut') },
  { id: 'almond', name: 'Миндаль', description: 'Мягкий миндальный вкус', imageUrl: photo('almond') },
  { id: 'macadamia', name: 'Макадамия', description: 'Сливочный орех макадамия', imageUrl: photo('macadamia') },
  { id: 'pistachio', name: 'Фисташка', description: 'Фисташковый сироп', imageUrl: photo('pistachio') },
  { id: 'amaretto', name: 'Амаретто', description: 'Миндаль и лёгкая горчинка', imageUrl: photo('amaretto') },
  { id: 'popcorn', name: 'Попкорн', description: 'Сладкий попкорн', imageUrl: photo('popcorn') },
  { id: 'irish-cream', name: 'Ирландский крем', description: 'Сливочный десертный вкус', imageUrl: photo('irish-cream') },
  { id: 'gingerbread', name: 'Имбирный пряник', description: 'Пряный имбирный вкус', imageUrl: photo('gingerbread') },
  { id: 'oriental', name: 'Восточные пряности', description: 'Тёплые специи', imageUrl: photo('oriental') },
  { id: 'blackcurrant', name: 'Чёрная смородина', description: 'Яркая ягода', imageUrl: photo('blackcurrant') },
  { id: 'raspberry', name: 'Малина', description: 'Спелая малина', imageUrl: photo('raspberry') },
  { id: 'strawberry', name: 'Клубника', description: 'Ягодный клубничный вкус', imageUrl: photo('strawberry') },
  { id: 'cherry', name: 'Вишня', description: 'Спелая вишня', imageUrl: photo('cherry') },
  { id: 'banana', name: 'Банан', description: 'Сладкий банан', imageUrl: photo('banana') },
  { id: 'coconut', name: 'Кокос', description: 'Кокосовый вкус', imageUrl: photo('coconut') },
  { id: 'apple', name: 'Яблоко', description: 'Свежее яблоко', imageUrl: photo('apple') },
  { id: 'watermelon', name: 'Арбуз', description: 'Летний арбуз', imageUrl: photo('watermelon') },
  { id: 'lavender', name: 'Лаванда', description: 'Цветочная лаванда', imageUrl: photo('lavender') },
  { id: 'mint-eucalyptus', name: 'Мята и эвкалипт', description: 'Освежающие травы', imageUrl: photo('mint-eucalyptus') },
];

export const SYRUP_NAMES = SYRUPS.map((s) => s.name);

export function findSyrup(name: string | null | undefined): SyrupOption | undefined {
  if (!name) return undefined;
  return SYRUPS.find((s) => s.name === name);
}

export function isSyrupName(name: string): boolean {
  return SYRUP_NAMES.includes(name);
}
