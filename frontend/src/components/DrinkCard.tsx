import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Drink } from '../types';
import { drinkAnchorId, drinkMinPrice, saveMenuReturn } from '../lib/menu';

interface Props {
  drink: Drink;
}

export function DrinkCard({ drink }: Props) {
  const minPrice = drinkMinPrice(drink);
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(drink.imageUrl) && !imgFailed;

  return (
    <Link
      id={drinkAnchorId(drink.id)}
      to={`/drink/${drink.id}`}
      onClick={() => saveMenuReturn(drink)}
      className="block bg-brand-paper rounded-2xl shadow-sm overflow-hidden border border-brand-dark/10 active:scale-[0.98] transition-transform scroll-mt-24"
    >
      <div className="aspect-[5/3] bg-brand-accent relative flex items-center justify-center">
        {showPhoto ? (
          <img
            src={drink.imageUrl!}
            alt={drink.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center text-brand/70">
            <span className="text-5xl" aria-hidden>
              🐾
            </span>
          </div>
        )}
        {drink.badge && (
          <span className="absolute top-3 right-3 bg-brand text-brand-paper text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full">
            {drink.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-brand-dark">{drink.name}</h3>
        {drink.description && (
          <p className="text-sm text-brand-dark/60 line-clamp-2 mt-1">{drink.description}</p>
        )}
        <p className="mt-2 font-sans font-bold text-brand">от {minPrice} ₽</p>
      </div>
    </Link>
  );
}
