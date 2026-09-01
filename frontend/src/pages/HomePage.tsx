import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { drinksApi } from '../lib/api';
import { DrinkCard } from '../components/DrinkCard';
import {
  CATEGORY_TABS,
  clearMenuReturn,
  drinkAnchorId,
  drinkIdFromHash,
  parseDrinkCategory,
  readMenuReturn,
} from '../lib/menu';
import type { DrinkCategory } from '../types';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<DrinkCategory>(
    () => parseDrinkCategory(searchParams.get('category')) ?? 'classics',
  );
  const restored = useRef(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['drinks'],
    queryFn: () => drinksApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const visible = useMemo(
    () => (data?.drinks ?? []).filter((d) => (d.category ?? 'classics') === category),
    [data?.drinks, category],
  );

  useLayoutEffect(() => {
    if (restored.current || !data?.drinks.length) return;

    const hashId = drinkIdFromHash(window.location.hash);
    const stored = readMenuReturn();
    const drinkId = hashId ?? stored?.drinkId;
    const listed = drinkId ? data.drinks.find((d) => d.id === drinkId) : undefined;
    const nextCategory =
      listed?.category ??
      parseDrinkCategory(searchParams.get('category')) ??
      stored?.category ??
      category;

    if (nextCategory !== category) {
      setCategory(nextCategory);
      return;
    }

    restored.current = true;
    if (!drinkId) return;

    const node = document.getElementById(drinkAnchorId(drinkId));
    node?.scrollIntoView({ block: 'center', behavior: 'auto' });
    clearMenuReturn();
  }, [category, data, searchParams, visible.length]);

  const selectCategory = (id: DrinkCategory) => {
    restored.current = true;
    setCategory(id);
    setSearchParams(id === 'classics' ? {} : { category: id }, { replace: true });
  };

  return (
    <div className="pb-8">
      <div className="px-4 mb-4 text-center">
        <h1 className="font-display text-3xl font-bold text-brand-dark">Меню</h1>
        <p className="text-brand/80 text-xs mt-1 italic">Лучший кофе для лучших моментов!</p>
      </div>

      <div className="px-4 mb-5 flex gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectCategory(tab.id)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
              category === tab.id
                ? 'bg-brand text-brand-paper'
                : 'bg-brand-accent text-brand-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="px-4 grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-brand-accent rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 py-8 text-center text-brand-dark/60">
          <p>Не удалось загрузить меню онлайн.</p>
          <p className="text-sm mt-1">Проверьте кэш или подключение к сети.</p>
        </div>
      )}

      <div className="px-4 grid gap-4">
        {visible.map((drink) => (
          <DrinkCard key={drink.id} drink={drink} />
        ))}
      </div>

      {!isLoading && !error && visible.length === 0 && (
        <p className="px-4 text-center text-brand-dark/50 py-8">В этой категории пока пусто</p>
      )}

      <div className="px-4 mt-8 flex gap-4 text-sm text-brand-dark/40 justify-center">
        <Link to="/history" className="hover:text-brand">История заказов</Link>
        <span>·</span>
        <Link to="/login" className="hover:text-brand">Вход для персонала</Link>
      </div>
    </div>
  );
}
