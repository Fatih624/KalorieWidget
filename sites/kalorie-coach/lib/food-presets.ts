import { BASIC_FOODS } from './basic-foods';
import { LIDL_FOODS } from './lidl-foods';

// Read-only lookup data: never inserted into a diary or a favorites list automatically.
export const FOOD_PRESETS = [...BASIC_FOODS, ...LIDL_FOODS];
