export const technicianCategories = [
  "Plumbers",
  "Electricians",
  "Tilers",
  "Furniture Designers",
  "Carpenters",
  "Painters",
  "Fashion Designers",
  "Cobblers",
  "Gas Vendors/Stations",
  "Dispatch Riders",
  "Meat Sellers",
  "Food Vendors/Restaurants",
  "Supermarkets",
  "Laundry Owners",
  "Hair Braiders",
  "Barbers",
  "POS Agents",
  "Others"
];

export function resolveTechnicianCategoryOption(category = "") {
  if (!category) {
    return "";
  }

  return technicianCategories.includes(category) ? category : "Others";
}
