import { Apple, Soup, Utensils, Wheat } from 'lucide-react';
import type { Food } from './domain';

export function FoodGlyph({food}:{food:Pick<Food,'name'>}) {
  const name=food.name.toLocaleLowerCase('de-DE');
  const kind=/skyr|joghurt|quark|suppe|müsli/.test(name)?'bowl':/hafer|reis|brot|pasta|nudel/.test(name)?'grain':/banane|apfel|beere|obst/.test(name)?'fruit':'meal';
  const Icon=kind==='bowl'?Soup:kind==='grain'?Wheat:kind==='fruit'?Apple:Utensils;
  return <span className={`food-glyph food-${kind}`} aria-hidden="true"><Icon size={23} strokeWidth={1.75}/></span>;
}
