import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drinksApi, modifiersApi } from '../lib/api';
import { useCartStore } from '../store';
import {
  ALT_MILK_MODIFIER_NAME,
  defaultDrinkSize,
  drinkMenuPath,
  drinkSizePrice,
  formatPrice,
  formatVolume,
  hasPricedFlavors,
  lineExtras,
  saveMenuReturn,
  SYRUP_MODIFIER_NAME,
} from '../lib/menu';
import { drinkChips } from '../lib/ingredients';
import { flavorImageUrl } from '../data/flavors';
import { readStoredReadyAt } from '../lib/readyAt';
import { ReadyTimePicker } from '../components/ReadyTimePicker';
import { FlavorPhotoTiles } from '../components/FlavorPhotoTiles';
import { SegmentSlider } from '../components/SegmentSlider';
import { SyrupStrip } from '../components/SyrupStrip';
import type { DrinkSize, Modifier } from '../types';

export function DrinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['drink', id],
    queryFn: () => drinksApi.get(id!),
    enabled: !!id,
  });

  const { data: modifiersData } = useQuery({
    queryKey: ['modifiers'],
    queryFn: modifiersApi.list,
    staleTime: 5 * 60 * 1000,
  });

  const drink = data?.drink;
  const allModifiers = (modifiersData?.modifiers ?? []).filter(
    (m) => !(drink?.excludedModifierNames ?? []).includes(m.name),
  );
  const syrupMod = allModifiers.find((m) => m.name === SYRUP_MODIFIER_NAME);
  const milkMod = allModifiers.find((m) => m.name === ALT_MILK_MODIFIER_NAME);
  const extraModifiers = allModifiers.filter(
    (m) => m.name !== SYRUP_MODIFIER_NAME && m.name !== ALT_MILK_MODIFIER_NAME,
  );
  const syrupIncluded = drink?.category === 'ice';
  const showSyrup = Boolean(syrupMod);
  const showMilk = Boolean(milkMod);

  const [size, setSize] = useState<DrinkSize | null>(null);
  const [flavor, setFlavor] = useState('');
  const [syrup, setSyrup] = useState<string | null>(null);
  const [plantMilk, setPlantMilk] = useState(false);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [imgFailed, setImgFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number>();
  const [readyAt, setReadyAt] = useState(readStoredReadyAt);

  const variantOptions = drink?.category === 'ice' ? [] : (drink?.flavorOptions ?? []);

  useEffect(() => {
    if (drink) saveMenuReturn(drink);
  }, [drink]);

  useEffect(() => {
    setSize(null);
    setImgFailed(false);
    setJustAdded(false);
    const options = drink?.category === 'ice' ? [] : (drink?.flavorOptions ?? []);
    setFlavor(options[0] ?? '');
    setSyrup(null);
    setPlantMilk(false);
    setSelectedMods([]);
    window.clearTimeout(addedTimer.current);
  }, [drink?.id]);

  useEffect(() => {
    setImgFailed(false);
  }, [flavor]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  const activeSize = size ?? (drink?.sizes.length ? defaultDrinkSize(drink.sizes) : null);
  const selectedSize = drink?.sizes.find((s) => s.size === activeSize);
  const chosenModifiers = useMemo(
    () => extraModifiers.filter((m) => selectedMods.includes(m.id)),
    [extraModifiers, selectedMods],
  );

  if (isLoading || !drink) {
    return (
      <div className="p-4">
        <Link
          to={id ? drinkMenuPath({ id, category: null }) : '/'}
          aria-label="Назад"
          className="inline-flex mb-4 w-8 h-8 items-center justify-center rounded-full bg-brand-cream text-brand-dark/60 text-sm"
        >
          ←
        </Link>
        <div className="animate-pulse h-64 bg-brand-accent rounded-2xl" />
      </div>
    );
  }

  const milkCharge = plantMilk && milkMod ? milkMod.price : 0;
  const syrupCharge = syrup && syrupMod && !syrupIncluded ? syrupMod.price : 0;
  const extras =
    lineExtras(
      chosenModifiers.map((m) => ({ modifierId: m.id, name: m.name, price: m.price })),
    ) +
    syrupCharge +
    milkCharge;
  const sizePrice = activeSize ? drinkSizePrice(drink, activeSize, flavor) : 0;
  const price = sizePrice + extras;
  const needsFlavor = variantOptions.length > 0;
  const canAdd = !!activeSize && selectedSize && (!needsFlavor || !!flavor);
  const heroUrl = (flavor && flavorImageUrl(flavor, drink.id)) || drink.imageUrl;
  const chips = drinkChips(drink, flavor, plantMilk);

  const toggleMod = (mod: Modifier) => {
    setSelectedMods((prev) =>
      prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id],
    );
  };

  const handleAdd = () => {
    if (!activeSize || !selectedSize || !canAdd) return;
    const modsForCart = [...chosenModifiers];
    if (syrup && syrupMod && !syrupIncluded) {
      modsForCart.push(syrupMod);
    }
    if (plantMilk && milkMod) {
      modsForCart.push(milkMod);
    }
    addItem({
      drinkId: drink.id,
      drinkName: drink.name,
      size: activeSize,
      volumeMl: selectedSize.volumeMl,
      quantity: 1,
      unitPrice: sizePrice,
      flavor: flavor || undefined,
      syrup: syrup || undefined,
      modifiers: modsForCart.map((m) => ({
        modifierId: m.id,
        name: m.name,
        price: m.price,
      })),
    });
    sessionStorage.setItem('readyAt', readyAt.toISOString());
    setJustAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 1800);
  };

  const volumeOptions = drink.sizes.map((s) => ({
    value: s.size,
    label: formatVolume(s.volumeMl),
    sublabel: formatPrice(drinkSizePrice(drink, s.size, flavor)),
  }));

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col">
      <div className="w-full aspect-[16/9] bg-brand-accent flex items-center justify-center relative">
        {heroUrl && !imgFailed ? (
          <img
            key={heroUrl}
            src={heroUrl}
            alt={drink.name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="text-6xl" aria-hidden>
            🐾
          </span>
        )}
        <Link
          to={drinkMenuPath(drink)}
          aria-label="Назад"
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-brand-cream/80 text-brand-dark/65 text-sm flex items-center justify-center"
        >
          ←
        </Link>
        {drink.badge && (
          <span className="absolute top-4 right-4 bg-brand text-brand-paper text-xs font-semibold px-2.5 py-1 rounded-full">
            {drink.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pt-6">
        <h1 className="font-display text-2xl font-bold text-brand-dark">{drink.name}</h1>
        {drink.description && <p className="text-brand-dark/60 mt-2">{drink.description}</p>}

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" data-testid="ingredient-chips">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-brand-accent px-2.5 py-1 text-xs text-brand-dark"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {needsFlavor && (
          <div className="mt-6">
            <p id="flavor-label" className="text-sm font-medium text-brand-dark">
              Вкусы
            </p>
            <FlavorPhotoTiles
              drinkId={drink.id}
              options={variantOptions}
              value={flavor}
              onSelect={setFlavor}
              priceFor={
                hasPricedFlavors(drink) && activeSize
                  ? (name) => drinkSizePrice(drink, activeSize, name)
                  : undefined
              }
            />
          </div>
        )}

        <div className="mt-6">
          <p id="volume-label" className="text-sm font-medium text-brand-dark">
            Объём
          </p>
          <div className="mt-2">
            <SegmentSlider
              labelledBy="volume-label"
              testId="volume-slider"
              options={volumeOptions}
              value={activeSize ?? volumeOptions[0]?.value}
              onChange={setSize}
            />
          </div>
        </div>

        {showMilk && milkMod && (
          <div className="mt-6">
            <p id="milk-label" className="text-sm font-medium text-brand-dark">
              Молоко
            </p>
            <div className="mt-2">
              <SegmentSlider
                labelledBy="milk-label"
                testId="milk-slider"
                options={[
                  { value: 'dairy', label: 'Обычное', sublabel: 'в цене' },
                  {
                    value: 'plant',
                    label: 'Растительное',
                    sublabel: `+${milkMod.price} ₽`,
                  },
                ]}
                value={plantMilk ? 'plant' : 'dairy'}
                onChange={(next) => setPlantMilk(next === 'plant')}
              />
            </div>
          </div>
        )}

        {(showSyrup || extraModifiers.length > 0) && (
          <div className="mt-6">
            <p className="text-sm font-medium text-brand-dark">
              {showSyrup ? 'Сироп' : 'Дополнительно'}
            </p>
            {showSyrup && (
              <div className="mt-2">
                <SyrupStrip
                  selectedName={syrup}
                  includedInPrice={syrupIncluded}
                  price={syrupMod?.price ?? 40}
                  onSelect={setSyrup}
                />
              </div>
            )}
            {extraModifiers.length > 0 && (
              <div className="mt-2 space-y-2">
                {extraModifiers.map((mod) => (
                  <label
                    key={mod.id}
                    className="flex items-center gap-3 p-3 bg-brand-paper rounded-xl border border-brand-dark/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMods.includes(mod.id)}
                      onChange={() => toggleMod(mod)}
                      className="w-5 h-5 accent-brand"
                    />
                    <span className="flex-1">{mod.name}</span>
                    <span className="font-sans font-semibold text-brand">+{mod.price} ₽</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <ReadyTimePicker value={readyAt} onChange={setReadyAt} />
        </div>

        <div
          className={
            canAdd
              ? 'sticky bottom-0 z-20 mt-auto -mx-4 bg-transparent px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'
              : 'mt-8 -mx-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]'
          }
        >
          <button
            type="button"
            data-testid="add-to-cart"
            disabled={!canAdd}
            onClick={handleAdd}
            aria-live="polite"
            aria-disabled={!canAdd}
            className={
              canAdd
                ? 'w-full rounded-2xl border border-[rgba(60,48,40,0.12)] bg-white/[0.18] py-4 text-lg font-semibold text-brand backdrop-blur [text-shadow:0_0_10px_#FAF7F2,0_1px_0_#FAF7F2]'
                : 'w-full cursor-not-allowed rounded-2xl border border-brand-dark/10 bg-brand-paper/70 py-4 text-lg font-semibold text-brand-dark/35'
            }
          >
            {justAdded
              ? 'Добавлено'
              : canAdd
                ? `В корзину · ${price} ₽`
                : needsFlavor
                  ? 'В корзину · выберите вкус'
                  : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
}
