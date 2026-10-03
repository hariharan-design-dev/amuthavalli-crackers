/**
 * Home Page Presentation Data for Amuthavalli Crackers
 * Reference: Client-approved visual reference (media_1790914896639.jpg)
 *
 * Strictly isolated for Home Page visual presentation.
 * Real product data will later be imported through Admin Products.
 */

export interface HomeCategoryItem {
  id: string;
  name: string;
  iconImage: string;
}

export interface HomeProductItem {
  id: string;
  name: string;
  category: string;
  ourRate: number;
  marketRate?: number;
  image: string;
}

export interface TrustPointItem {
  id: string;
  title: string;
  iconType: "shield-star" | "sparkles" | "price-tag" | "shield-check";
}

export const HOME_CATEGORIES: HomeCategoryItem[] = [
  { id: "single-crackers", name: "Single Crackers", iconImage: "/images/home/categories/single_crackers.png" },
  { id: "deluxe-crackers", name: "Deluxe Crackers", iconImage: "/images/home/categories/deluxe_crackers.png" },
  { id: "garland-wala", name: "Garland Wala", iconImage: "/images/home/categories/garland_wala.png" },
  { id: "chorsa-giant", name: "Chorsa & Giant", iconImage: "/images/home/categories/chorsa_giant.png" },
  { id: "bijili", name: "Bijili", iconImage: "/images/home/categories/bijili.png" },
  { id: "bomb-items", name: "Bomb Items", iconImage: "/images/home/categories/bomb_items.png" },
  { id: "fancy-showers", name: "Fancy Showers", iconImage: "/images/home/categories/fancy_showers.png" },
  { id: "ground-chakkars", name: "Ground Chakkars", iconImage: "/images/home/categories/ground_chakkars.png" },
  { id: "rockets", name: "Rockets", iconImage: "/images/home/categories/rockets.png" },
  { id: "sparklers", name: "Sparklers", iconImage: "/images/home/categories/sparklers.png" },
  { id: "kids-special", name: "Kids Special", iconImage: "/images/home/categories/kids_special.png" },
  { id: "shot-items", name: "Shot Items", iconImage: "/images/home/categories/shot_items.png" },
  { id: "gift-boxes", name: "Gift Boxes", iconImage: "/images/home/categories/gift_boxes.png" },
];

export const HOME_POPULAR_PRODUCTS: HomeProductItem[] = [
  {
    id: "15ecf1af-a6a8-4379-8f09-8b1d91102ff6",
    name: "1000 Wala",
    category: "Single Crackers",
    ourRate: 750,
    image: "/images/home/products/1000_wala.png",
  },
  {
    id: "e06e7f77-532a-4534-987e-7d142cf953eb",
    name: "Colour Koti",
    category: "Deluxe Crackers",
    ourRate: 660,
    image: "/images/home/products/colour_koti.png",
  },
  {
    id: "2c740647-a5ae-4ada-b646-241bfdad8c46",
    name: "Flower Pots Big",
    category: "Flower Pots",
    ourRate: 420,
    image: "/images/home/products/flower_pots_big.png",
  },
  {
    id: "4e2f9d51-87a3-481b-bf2e-06788b0a0e5b",
    name: "Ground Chakkar Special",
    category: "Ground Chakkars",
    ourRate: 180,
    image: "/images/home/products/ground_chakkar.png",
  },
  {
    id: "5d8a7c29-3b4e-4f1a-9c76-2e8d0f1b3a4c",
    name: "Sky Rocket",
    category: "Rockets",
    ourRate: 320,
    image: "/images/home/products/sky_rocket.png",
  },
  {
    id: "6f9b8d3a-4c5e-402b-ad87-3f9e1a2c4b5d",
    name: "Electric Sparklers",
    category: "Sparklers",
    ourRate: 150,
    image: "/images/home/products/electric_sparklers.png",
  },
];

export const HOME_NEW_ARRIVALS: HomeProductItem[] = [
  {
    id: "7a0c9e4b-5d6f-413c-be98-4a0f2b3d5c6e",
    name: "Colour Smoke",
    category: "New Arrivals",
    ourRate: 280,
    image: "/images/home/products/colour_smoke.png",
  },
  {
    id: "8b1d0f5c-6e7a-424d-cf09-5b1a3c4e6d7f",
    name: "Multi Colour Shot",
    category: "New Arrivals",
    ourRate: 660,
    marketRate: 850,
    image: "/images/home/products/multi_colour_shot.png",
  },
  {
    id: "9c2e1a6d-7f8b-435e-d01a-6c2b4d5f7e8a",
    name: "Mega Flower Pot",
    category: "New Arrivals",
    ourRate: 380,
    marketRate: 480,
    image: "/images/home/products/mega_flower_pot.png",
  },
  {
    id: "ad3f2b7e-8a9c-446f-e12b-7d3c5e6a8f9b",
    name: "Twinkling Star",
    category: "New Arrivals",
    ourRate: 120,
    marketRate: 200,
    image: "/images/home/products/twinkling_star.png",
  },
  {
    id: "be4a3c8f-9b0d-4570-f23c-8e4d6f7b9a0c",
    name: "Kids Fun Pack",
    category: "New Arrivals",
    ourRate: 450,
    image: "/images/home/products/kids_fun_pack.png",
  },
  {
    id: "cf5b4d90-0c1e-4681-034d-9f5e7a8c0b1d",
    name: "Sky Mega Rocket",
    category: "New Arrivals",
    ourRate: 500,
    marketRate: 600,
    image: "/images/home/products/sky_mega_rocket.png",
  },
];

export const TRUST_POINTS = [
  { id: "quality", title: "Premium Quality", iconType: "shield-star" as const },
  { id: "variety", title: "Wide Variety", iconType: "sparkles" as const },
  { id: "prices", title: "Best Prices", iconType: "price-tag" as const },
  { id: "safety", title: "Safe Celebrations", iconType: "shield-check" as const },
];

export const ABOUT_VALUES = [
  {
    id: "quality",
    title: "Quality Products",
    description: "Carefully selected crackers for memorable celebrations.",
    icon: "award",
  },
  {
    id: "variety",
    title: "Wide Variety",
    description: "From traditional favourites to exciting new arrivals.",
    icon: "sparkles",
  },
  {
    id: "value",
    title: "Value for Money",
    description: "Market rates with our special Amuthavalli prices.",
    icon: "rupee",
  },
  {
    id: "safety",
    title: "Safe Celebrations",
    description: "Committed to safety and customer satisfaction.",
    icon: "shield",
  },
];
