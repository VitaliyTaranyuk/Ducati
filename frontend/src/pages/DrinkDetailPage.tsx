import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { drinksApi, modifiersApi } from '../lib/api';
import { useCartStore } from '../store';
import { drinkMenuPath, formatSizePrice, lineExtras, saveMenuReturn } from '../lib/menu';
import { readStoredReadyAt } from '../lib/readyAt';
import { ReadyTimePicker } from '../components/ReadyTimePicker';
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
  const modifiers = (modifiersData?.modifiers ?? []).filter(
    (m) => !(drink?.excludedModifierNames ?? []).includes(m.name),
  );
  const [size, setSize] = useState<DrinkSize | null>(null);
  const [flavor, setFlavor] = useState('');
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [imgFailed, setImgFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number>();
  const [readyAt, setReadyAt] = useState(readStoredReadyAt);

  useEffect(() => {
    if (drink?.sizes.length === 1) setSize(drink.sizes[0].size);
  }, [drink]);

  useEffect(() => {
    if (drink) saveMenuReturn(drink);
  }, [drink]);

  useEffect(() => {
    setImgFailed(false);
    setJustAdded(false);
    setFlavor('');
    setSelectedMods([]);
    window.clearTimeout(addedTimer.current);
  }, [drink?.id]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  const selectedSize = drink?.sizes.find((s) => s.size === size);
  const chosenModifiers = useMemo(
    () => modifiers.filter((m) => selectedMods.includes(m.id)),
    [modifiers, selectedMods],
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

  const extras = lineExtras(
    chosenModifiers.map((m) => ({ modifierId: m.id, name: m.name, price: m.price })),
  );
  const price = (selectedSize?.price ?? 0) + extras;
  const needsFlavor = (drink.flavorOptions ?? []).length > 0;
  const canAdd = !!size && selectedSize && (!needsFlavor || !!flavor);

  const toggleMod = (mod: Modifier) => {
    setSelectedMods((prev) =>
      prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id],
    );
  };

  const handleAdd = () => {
    if (!size || !selectedSize || !canAdd) return;
    addItem({
      drinkId: drink.id,
      drinkName: drink.name,
      size,
      volumeMl: selectedSize.volumeMl,
      quantity: 1,
      unitPrice: selectedSize.price,
      flavor: flavor || undefined,
      modifiers: chosenModifiers.map((m) => ({
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

  return (
    <div className="pb-8">
      <div className="w-full aspect-[16/9] bg-brand-accent flex items-center justify-center relative">
        {drink.imageUrl && !imgFailed ? (
          <img
            src={drink.imageUrl}
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
      <div className="px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-brand-dark">{drink.name}</h1>
        {drink.description && <p className="text-brand-dark/60 mt-2">{drink.description}</p>}

        <div className="mt-6">
          <label className="text-sm font-medium text-brand-dark">Объём</label>
          <div className={`grid gap-2 mt-2 ${drink.sizes.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {drink.sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => setSize(s.size)}
                className={`py-3 rounded-xl border-2 font-sans font-medium transition-colors ${
                  size === s.size
                    ? 'border-brand bg-brand text-brand-paper'
                    : 'border-brand-dark/15 text-brand-dark bg-brand-paper'
                }`}
              >
                {formatSizePrice(s.volumeMl, s.price)}
              </button>
            ))}
          </div>
        </div>

        {needsFlavor && (
          <div className="mt-6">
            <p id="flavor-label" className="text-sm font-medium text-brand-dark">
              {drink.category === 'ice' || drink.name === 'Чай' ? 'Вкус' : 'Вариант'}
            </p>
            <div
              role="group"
              aria-labelledby="flavor-label"
              className={`grid gap-2 mt-2 ${
                (drink.flavorOptions ?? []).length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {(drink.flavorOptions ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={flavor === opt}
                  onClick={() => setFlavor(opt)}
                  className={`py-3 px-2 rounded-xl border-2 font-sans font-medium text-center text-sm leading-snug break-words transition-colors ${
                    flavor === opt
                      ? 'border-brand bg-brand text-brand-paper'
                      : 'border-brand-dark/15 text-brand-dark bg-brand-paper'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {modifiers.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-brand-dark">Дополнительно</label>
            <div className="mt-2 space-y-2">
              {modifiers.map((mod) => (
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
          </div>
        )}

        <div className="mt-6">
          <ReadyTimePicker value={readyAt} onChange={setReadyAt} />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          aria-live="polite"
          className="mt-8 w-full py-4 bg-brand text-brand-paper rounded-2xl font-semibold text-lg disabled:opacity-40"
        >
          {justAdded ? 'Добавлено' : `В корзину · ${price} ₽`}
        </button>
      </div>
    </div>
  );
}
