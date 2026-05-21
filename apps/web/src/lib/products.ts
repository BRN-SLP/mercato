/**
 * Canonical Mercato consumer basket.
 *
 * 33 everyday goods grouped by category, modelled on the OECD CPI
 * structure (food, transport, housing, utilities, lifestyle). Each
 * product has a stable, machine-friendly `slug` that uniquely
 * identifies it across countries and gets hashed to bytes12 by
 * `productSlugToBarcode` in lib/encode.ts.
 *
 * Why a fixed canonical list:
 *   1. Aggregation needs identity — a "milk_1l" price in Argentina is
 *      directly comparable to "milk_1l" in Kenya. Free-form text
 *      submissions ("milko", "1 litre milk", "молоко") break that.
 *   2. The submit form's dropdown turns a wide-open problem (any
 *      product) into a single tap, which is a 10× UX win on mobile.
 *   3. A bounded list keeps the country dashboard meaningful — 33
 *      data points per country fit one screen and feel comprehensive,
 *      whereas 5 000 SKUs feel like noise.
 *
 * Edits to this list ARE breaking — submissions sent against the old
 * slug ("bread_500g") will not aggregate with the new one
 * ("bread_loaf_500g") even if they mean the same product. Treat as
 * append-only post-launch; deprecate by adding a successor slug, not
 * renaming.
 */

export type ProductCategory =
  | "food"
  | "beverages"
  | "transport"
  | "utilities"
  | "lifestyle"
  | "clothing"
  | "housing";

export interface Product {
  /** Stable identifier — hashed to bytes12 for on-chain submission. */
  slug: string;
  /** Human-readable label shown in the dropdown. */
  label: string;
  /** Short hint shown under the label for ambiguous items. */
  hint?: string;
  category: ProductCategory;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  food: "Food",
  beverages: "Beverages",
  transport: "Transport",
  utilities: "Utilities",
  lifestyle: "Lifestyle",
  clothing: "Clothing",
  housing: "Housing",
};

/**
 * The canonical 33. Order inside each category is from "most
 * universal" (bread, milk) to "more specific" (cheese, olive oil)
 * so the dropdown surfaces the highest-signal items first.
 */
export const PRODUCTS: readonly Product[] = [
  // FOOD (13) — staples first, then proteins, then produce, then specialty
  { slug: "bread_500g", label: "Bread", hint: "500 g loaf, white", category: "food" },
  { slug: "milk_1l", label: "Milk", hint: "1 L, regular", category: "food" },
  { slug: "eggs_12", label: "Eggs", hint: "12 pcs, regular size", category: "food" },
  { slug: "rice_1kg", label: "Rice", hint: "1 kg, white", category: "food" },
  { slug: "chicken_breast_1kg", label: "Chicken breast", hint: "1 kg, boneless", category: "food" },
  { slug: "beef_ground_1kg", label: "Ground beef", hint: "1 kg, 80/20", category: "food" },
  { slug: "apples_1kg", label: "Apples", hint: "1 kg", category: "food" },
  { slug: "bananas_1kg", label: "Bananas", hint: "1 kg", category: "food" },
  { slug: "tomatoes_1kg", label: "Tomatoes", hint: "1 kg", category: "food" },
  { slug: "potatoes_1kg", label: "Potatoes", hint: "1 kg", category: "food" },
  { slug: "cheese_local_500g", label: "Cheese", hint: "500 g, local hard cheese", category: "food" },
  { slug: "olive_oil_1l", label: "Olive oil", hint: "1 L, extra virgin", category: "food" },
  { slug: "water_bottled_1500ml", label: "Bottled water", hint: "1.5 L", category: "food" },

  // BEVERAGES (2)
  { slug: "coffee_cappuccino_cafe", label: "Cappuccino", hint: "Regular size, at a café", category: "beverages" },
  { slug: "beer_imported_500ml", label: "Beer", hint: "500 mL, imported brand", category: "beverages" },

  // TRANSPORT (4)
  { slug: "gasoline_95_1l", label: "Gasoline", hint: "1 L, 95 octane", category: "transport" },
  { slug: "diesel_1l", label: "Diesel", hint: "1 L", category: "transport" },
  { slug: "public_transport_oneway", label: "Public transport", hint: "One-way ticket, local", category: "transport" },
  { slug: "taxi_5km", label: "Taxi ride", hint: "Approx. 5 km, daytime", category: "transport" },

  // UTILITIES (4)
  { slug: "internet_60mbps_monthly", label: "Internet", hint: "60+ Mbps, unlimited, monthly", category: "utilities" },
  { slug: "mobile_10gb_monthly", label: "Mobile data", hint: "10 GB plan, monthly", category: "utilities" },
  { slug: "electricity_apartment_monthly", label: "Electricity", hint: "Avg. monthly bill, 1-bedroom apt.", category: "utilities" },
  { slug: "gas_apartment_monthly", label: "Gas / heating", hint: "Avg. monthly bill, 1-bedroom apt.", category: "utilities" },

  // LIFESTYLE (5)
  { slug: "meal_inexpensive_restaurant", label: "Cheap meal out", hint: "Inexpensive restaurant, 1 person", category: "lifestyle" },
  { slug: "meal_midrange_restaurant", label: "Mid-range dinner", hint: "Mid-range restaurant, 2 people, 3 courses", category: "lifestyle" },
  { slug: "gym_monthly_pass", label: "Gym membership", hint: "Monthly, adult", category: "lifestyle" },
  { slug: "cinema_ticket", label: "Cinema ticket", hint: "1 adult, evening", category: "lifestyle" },
  { slug: "haircut_basic", label: "Haircut", hint: "Basic, men's barber or simple salon", category: "lifestyle" },

  // CLOTHING (2)
  { slug: "jeans_branded_pair", label: "Jeans", hint: "1 pair, branded (Levi's-tier)", category: "clothing" },
  { slug: "sneakers_branded_pair", label: "Sneakers", hint: "1 pair, branded (Nike-tier)", category: "clothing" },

  // HOUSING (3)
  { slug: "rent_1bd_center", label: "Rent — 1 bedroom, center", hint: "Monthly, city center", category: "housing" },
  { slug: "rent_1bd_outside", label: "Rent — 1 bedroom, outskirts", hint: "Monthly, outside city center", category: "housing" },
  { slug: "rent_3bd_center", label: "Rent — 3 bedroom, center", hint: "Monthly, city center", category: "housing" },
];

/**
 * Lookup by slug — used to resolve a submission's bytes12 productId
 * back to a human label on the dashboard.
 */
const PRODUCT_BY_SLUG: ReadonlyMap<string, Product> = new Map(
  PRODUCTS.map((p) => [p.slug, p]),
);

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCT_BY_SLUG.get(slug);
}

/**
 * Grouped view for the submit form's `<select>` with `<optgroup>`s.
 */
export function getProductsByCategory(): Array<{
  category: ProductCategory;
  label: string;
  products: Product[];
}> {
  const order: ProductCategory[] = [
    "food",
    "beverages",
    "transport",
    "utilities",
    "lifestyle",
    "clothing",
    "housing",
  ];
  return order.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    products: PRODUCTS.filter((p) => p.category === category),
  }));
}
