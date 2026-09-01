import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, drinksApi, modifiersApi, statsApi } from '../lib/api';
import { PushOptIn } from '../components/PushOptIn';
import { CATEGORY_LABEL, CATEGORY_TABS, formatVolume } from '../lib/menu';
import type { DrinkCategory, DrinkSize, Modifier } from '../types';

type OwnerTab = 'menu' | 'modifiers' | 'stats';
type CategoryFilter = DrinkCategory | 'all';

type DrinkDraft = {
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: DrinkCategory;
  badge?: string;
  flavorOptionsText?: string;
  sizes?: { size: DrinkSize; price: number; volumeMl: number }[];
};

export function OwnerPage() {
  const [tab, setTab] = useState<OwnerTab>('menu');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const queryClient = useQueryClient();

  const { data: drinksData } = useQuery({
    queryKey: ['drinks-admin'],
    queryFn: drinksApi.adminAll,
  });

  const { data: modifiersData } = useQuery({
    queryKey: ['modifiers-admin'],
    queryFn: modifiersApi.adminAll,
    enabled: tab === 'modifiers',
  });

  const { data: stats } = useQuery({
    queryKey: ['stats', 'day'],
    queryFn: () => statsApi.get('day'),
    enabled: tab === 'stats',
  });

  const [editing, setEditing] = useState<DrinkDraft | null>(null);
  const [modDraft, setModDraft] = useState<Partial<Modifier> & { id?: string } | null>(null);
  const [formError, setFormError] = useState('');

  const filteredDrinks = useMemo(() => {
    const drinks = drinksData?.drinks ?? [];
    if (categoryFilter === 'all') return drinks;
    return drinks.filter((d) => d.category === categoryFilter);
  }, [drinksData?.drinks, categoryFilter]);

  const saveDrink = async () => {
    if (!editing?.name || !editing.sizes?.length) return;
    const payload = {
      name: editing.name,
      description: editing.description,
      imageUrl: editing.imageUrl,
      category: editing.category ?? 'classics',
      badge: editing.badge?.trim() || null,
      flavorOptions: (editing.flavorOptionsText ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: editing.sizes,
    };
    try {
      setFormError('');
      if (editing.id) {
        await drinksApi.update(editing.id, payload);
      } else {
        await drinksApi.create(payload);
      }
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['drinks-admin'] });
      queryClient.invalidateQueries({ queryKey: ['drinks'] });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось сохранить напиток');
    }
  };

  const deleteDrink = async (id: string) => {
    if (!confirm('Удалить напиток?')) return;
    await drinksApi.delete(id);
    queryClient.invalidateQueries({ queryKey: ['drinks-admin'] });
    queryClient.invalidateQueries({ queryKey: ['drinks'] });
  };

  const saveModifier = async () => {
    if (!modDraft?.name || modDraft.price == null) return;
    const payload = {
      name: modDraft.name,
      price: Number(modDraft.price),
      sortOrder: modDraft.sortOrder ?? 0,
      isActive: modDraft.isActive ?? true,
    };
    try {
      setFormError('');
      if (modDraft.id) {
        await modifiersApi.update(modDraft.id, payload);
      } else {
        await modifiersApi.create(payload);
      }
      setModDraft(null);
      queryClient.invalidateQueries({ queryKey: ['modifiers-admin'] });
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось сохранить доп');
    }
  };

  const deleteModifier = async (id: string) => {
    if (!confirm('Скрыть модификатор?')) return;
    await modifiersApi.delete(id);
    queryClient.invalidateQueries({ queryKey: ['modifiers-admin'] });
    queryClient.invalidateQueries({ queryKey: ['modifiers'] });
  };

  return (
    <div className="px-4 pb-8">
      <h1 className="font-display text-2xl font-bold text-brand-dark mb-4">Панель владельца</h1>
      <PushOptIn />

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {([
          ['menu', 'Меню'],
          ['modifiers', 'Допы'],
          ['stats', 'Статистика'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              tab === t ? 'bg-brand text-brand-paper' : 'bg-brand-accent text-brand-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'menu' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {([{ id: 'all', label: 'Все' }, ...CATEGORY_TABS] as const).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  categoryFilter === c.id ? 'bg-brand text-brand-paper' : 'bg-brand-accent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setEditing({
                name: '',
                description: '',
                category: 'classics',
                badge: '',
                flavorOptionsText: '',
                sizes: [{ size: 'S', price: 140, volumeMl: 250 }],
              });
            }}
            className="mb-4 px-4 py-2 bg-brand text-brand-paper rounded-xl text-sm"
          >
            + Добавить напиток
          </button>

          {editing && (
            <div className="bg-brand-paper rounded-xl p-4 shadow-sm mb-4 space-y-3 border border-brand-dark/10">
              <input
                value={editing.name ?? ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Название"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              <textarea
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Описание"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editing.category ?? 'classics'}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value as DrinkCategory })
                  }
                  className="p-2 border border-brand-dark/15 rounded-lg"
                >
                  {CATEGORY_TABS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  value={editing.badge ?? ''}
                  onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                  placeholder="Badge (NEW)"
                  className="p-2 border border-brand-dark/15 rounded-lg"
                />
              </div>
              <input
                value={editing.flavorOptionsText ?? ''}
                onChange={(e) => setEditing({ ...editing, flavorOptionsText: e.target.value })}
                placeholder="Вкусы через запятую"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              <input
                value={editing.imageUrl ?? ''}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                placeholder="URL фото или /drinks/latte.jpg"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              {editing.sizes?.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={s.size}
                    onChange={(e) => {
                      const sizes = [...(editing.sizes ?? [])];
                      sizes[i] = { ...s, size: e.target.value as DrinkSize };
                      setEditing({ ...editing, sizes });
                    }}
                    className="p-2 border border-brand-dark/15 rounded-lg"
                  >
                    <option value="S">S · 250</option>
                    <option value="M">M · 350</option>
                    <option value="L">L · 450</option>
                  </select>
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => {
                      const sizes = [...(editing.sizes ?? [])];
                      sizes[i] = { ...s, price: Number(e.target.value) };
                      setEditing({ ...editing, sizes });
                    }}
                    placeholder="Цена"
                    className="flex-1 p-2 border border-brand-dark/15 rounded-lg"
                  />
                  <input
                    type="number"
                    value={s.volumeMl}
                    onChange={(e) => {
                      const sizes = [...(editing.sizes ?? [])];
                      sizes[i] = { ...s, volumeMl: Number(e.target.value) };
                      setEditing({ ...editing, sizes });
                    }}
                    placeholder="мл"
                    className="w-20 p-2 border border-brand-dark/15 rounded-lg"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,
                    sizes: [...(editing.sizes ?? []), { size: 'M', price: 200, volumeMl: 350 }],
                  })
                }
                className="text-sm text-brand"
              >
                + размер
              </button>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={saveDrink} className="flex-1 py-2 bg-brand text-brand-paper rounded-lg">
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setEditing(null);
                  }}
                  className="py-2 px-4 bg-brand-accent rounded-lg"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredDrinks.map((drink) => (
              <div
                key={drink.id}
                className={`bg-brand-paper rounded-xl p-4 shadow-sm flex justify-between border border-brand-dark/10 ${!drink.isActive ? 'opacity-50' : ''}`}
              >
                <div>
                  <p className="font-medium">
                    {drink.name}
                    {drink.badge ? (
                      <span className="ml-2 text-[10px] bg-brand text-brand-paper px-1.5 py-0.5 rounded-full">
                        {drink.badge}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-brand-dark/50 mt-0.5">{CATEGORY_LABEL[drink.category]}</p>
                  <p className="text-sm text-brand-dark/55 font-sans">
                    {drink.sizes.map((s) => `${formatVolume(s.volumeMl)}: ${s.price}₽`).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: drink.id,
                        name: drink.name,
                        description: drink.description ?? undefined,
                        imageUrl: drink.imageUrl ?? undefined,
                        category: drink.category,
                        badge: drink.badge ?? '',
                        flavorOptionsText: (drink.flavorOptions ?? []).join(', '),
                        sizes: drink.sizes.map((s) => ({
                          size: s.size,
                          price: s.price,
                          volumeMl: s.volumeMl,
                        })),
                      })
                    }
                    className="text-brand text-sm"
                  >
                    ✏️
                  </button>
                  <button type="button" onClick={() => deleteDrink(drink.id)} className="text-red-400 text-sm">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'modifiers' && (
        <>
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setModDraft({ name: '', price: 40, sortOrder: 0, isActive: true });
            }}
            className="mb-4 px-4 py-2 bg-brand text-brand-paper rounded-xl text-sm"
          >
            + Добавить доп
          </button>

          {modDraft && (
            <div className="bg-brand-paper rounded-xl p-4 shadow-sm mb-4 space-y-3 border border-brand-dark/10">
              <input
                value={modDraft.name ?? ''}
                onChange={(e) => setModDraft({ ...modDraft, name: e.target.value })}
                placeholder="Название"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              <input
                type="number"
                value={modDraft.price ?? 0}
                onChange={(e) => setModDraft({ ...modDraft, price: Number(e.target.value) })}
                placeholder="Цена"
                className="w-full p-2 border border-brand-dark/15 rounded-lg"
              />
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={saveModifier} className="flex-1 py-2 bg-brand text-brand-paper rounded-lg">
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setModDraft(null);
                  }}
                  className="py-2 px-4 bg-brand-accent rounded-lg"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {modifiersData?.modifiers.map((mod) => (
              <div
                key={mod.id}
                className={`bg-brand-paper rounded-xl p-4 shadow-sm flex justify-between border border-brand-dark/10 ${!mod.isActive ? 'opacity-50' : ''}`}
              >
                <div>
                  <p className="font-medium">{mod.name}</p>
                  <p className="text-sm font-sans text-brand">+{mod.price} ₽</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModDraft(mod)} className="text-brand text-sm">
                    ✏️
                  </button>
                  <button type="button" onClick={() => deleteModifier(mod.id)} className="text-red-400 text-sm">
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-paper rounded-xl p-4 shadow-sm border border-brand-dark/10">
              <p className="text-sm text-brand-dark/55">Заказов сегодня</p>
              <p className="text-3xl font-sans font-bold text-brand">{String(stats.orderCount)}</p>
            </div>
            <div className="bg-brand-paper rounded-xl p-4 shadow-sm border border-brand-dark/10">
              <p className="text-sm text-brand-dark/55">Выручка</p>
              <p className="text-3xl font-sans font-bold text-brand">{String(stats.totalRevenue)} ₽</p>
            </div>
          </div>

          <div className="bg-brand-paper rounded-xl p-4 shadow-sm border border-brand-dark/10">
            <p className="font-medium mb-3">Популярные напитки</p>
            {(stats.popularDrinks as { name: string; count: number; revenue: number }[])?.map(
              (d, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-brand-dark/10 last:border-0">
                  <span>{d.name}</span>
                  <span className="text-brand-dark/55">{d.count} шт · {d.revenue} ₽</span>
                </div>
              ),
            )}
          </div>

          <a
            href={statsApi.exportUrl('week')}
            className="block text-center py-3 bg-brand text-brand-paper rounded-xl"
          >
            📥 Экспорт CSV (неделя)
          </a>
        </div>
      )}
    </div>
  );
}
