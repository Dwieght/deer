export type StoreProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  gallery: string[];
  featured: boolean;
  isActive: boolean;
};
