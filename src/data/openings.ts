import type { Opening } from './types.ts';
import { caroKann } from './caroKann.ts';
import { vienna } from './vienna.ts';

/** Every repertoire the trainer offers, in the order the opening picker lists them. */
export const openings: Opening[] = [caroKann, vienna];
