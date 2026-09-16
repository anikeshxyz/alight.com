"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Package,
  Layers,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { searchProductsApi, getPublicCategoryTreeApi, getActiveBrandsApi } from "@/services/product-service";
import { ProductSummary, CategoryTree, Brand } from "@/types/product";
import { useCurrency } from "@/context/CurrencyContext";

function ProductsCatalogContent() {
  const { formatMoney } = useCurrency();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("q") || searchParams.get("search") || "";

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("createdAt,desc");
  const [totalResults, setTotalResults] = useState<number>(0);

  // Synchronize when URL searchParams update (e.g. from header search)
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setSearchQuery(urlSearch);
  }, [urlCategory, urlSearch]);

  const loadFilterMetadata = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        getPublicCategoryTreeApi(),
        getActiveBrandsApi(),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (brandRes.success) setBrands(brandRes.data || []);
    } catch (e) {
      console.error("Failed to load catalog metadata", e);
    }
  };

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchProductsApi({
        categoryId: selectedCategory || undefined,
        brandId: selectedBrand || undefined,
        search: searchQuery.trim() || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        inStock: inStockOnly ? true : undefined,
        sort: sortBy,
        page: 0,
        size: 24,
      });

      if (res.success && res.data) {
        setProducts(res.data.content || []);
        setTotalResults(res.data.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, searchQuery, minPrice, maxPrice, inStockOnly, sortBy]);

  useEffect(() => {
    loadFilterMetadata();
  }, []);

  // Debounced auto-fetch on filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePriceApply = () => {
    fetchProducts();
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSortBy("createdAt,desc");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Title */}
      <div className="space-y-2">
        <nav className="flex items-center gap-2 text-xs text-brand-slate-500">
          <Link href="/" className="hover:text-brand-slate-800 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-brand-slate-900">Product Catalog</span>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-brand-burgundy font-medium">Category Filter</span>
            </>
          )}
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-slate-900 tracking-tight">
              Hardware & Architectural Catalog
            </h1>
            <p className="text-xs text-brand-slate-500 mt-1">
              Explore premium modular fittings, luxury bathroom accessories, wardrobe organizers, and kitchen fixtures.
            </p>
          </div>
          <Badge variant="brand" size="md">
            {totalResults} Products Available
          </Badge>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <Card className="p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-brand-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900">
                <Filter className="w-4 h-4 text-brand-burgundy" /> Filters
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-brand-burgundy hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider block">
                Categories
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === ""
                      ? "bg-brand-burgundy text-white font-semibold"
                      : "text-brand-slate-600 hover:bg-brand-slate-100"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-brand-burgundy text-white font-semibold"
                        : "text-brand-slate-600 hover:bg-brand-slate-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="space-y-3 border-t border-brand-slate-100 pt-4">
                <label className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider block">
                  Brands
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedBrand("")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedBrand === ""
                        ? "bg-brand-burgundy text-white font-semibold"
                        : "text-brand-slate-600 hover:bg-brand-slate-100"
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBrand(b.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedBrand === b.id
                          ? "bg-brand-burgundy text-white font-semibold"
                          : "text-brand-slate-600 hover:bg-brand-slate-100"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="space-y-3 border-t border-brand-slate-100 pt-4">
              <label className="text-xs font-bold text-brand-slate-900 uppercase tracking-wider block">
                Price Range (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
                <span className="text-brand-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handlePriceApply}>
                Apply Price
              </Button>
            </div>

            {/* Availability */}
            <div className="border-t border-brand-slate-100 pt-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-brand-burgundy focus:ring-brand-burgundy"
                />
                <span className="text-xs font-medium text-brand-slate-700">In Stock Items Only</span>
              </label>
            </div>
          </Card>
        </aside>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Sort Controls Bar */}
          <Card className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-slate-400" />
                <input
                  type="text"
                  placeholder="Search catalog by title, SKU, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-slate-400 hover:text-brand-slate-600"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1.5 text-xs text-brand-slate-500 font-medium">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs bg-brand-slate-50 border border-brand-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-burgundy"
                >
                  <option value="createdAt,desc">Newest First</option>
                  <option value="basePrice,asc">Price: Low to High</option>
                  <option value="basePrice,desc">Price: High to Low</option>
                  <option value="title,asc">Title: A to Z</option>
                </select>
              </div>
            </div>

            {/* Active Search & Filter Indicator */}
            {(searchQuery || selectedCategory || selectedBrand || minPrice || maxPrice || inStockOnly) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-slate-100 text-xs text-brand-slate-500">
                <span>Active Filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-emerald-50 text-brand-emerald-800 text-[11px] font-medium border border-brand-emerald-200">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button
                      onClick={() => setSearchQuery("")}
                      className="hover:text-brand-emerald-950 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-slate-100 text-brand-slate-700 text-[11px] font-medium border border-brand-slate-200">
                    Category Filter
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="hover:text-brand-slate-900 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-brand-burgundy font-semibold hover:underline ml-auto"
                >
                  Reset All
                </button>
              </div>
            )}
          </Card>

          {/* Product Items Listing */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3 p-4 bg-white rounded-2xl border border-brand-slate-200">
                  <div className="w-full h-48 bg-brand-slate-100 rounded-xl" />
                  <div className="h-4 bg-brand-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-brand-slate-100 rounded w-1/2" />
                  <div className="h-5 bg-brand-slate-100 rounded w-1/3 pt-2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-brand-slate-100 rounded-full flex items-center justify-center mx-auto text-brand-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-slate-900">No Products Found</h3>
                <p className="text-xs text-brand-slate-500 mt-1 max-w-sm mx-auto">
                  We couldn&apos;t find any products matching your current filters. Try changing category, price range, or search terms.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group block"
                >
                  <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                    <div className="relative aspect-square w-full bg-brand-slate-50 overflow-hidden border-b border-brand-slate-100">
                      {p.primaryImageUrl ? (
                        <img
                          src={p.primaryImageUrl}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-slate-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      {p.discountPrice && (
                        <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm z-5">
                          Sale
                        </span>
                      )}
                      
                      {/* Heart Wishlist Button */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <WishlistButton product={p} size="sm" />
                      </div>

                      {p.brandName && (
                        <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-brand-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-brand-slate-200 shadow-xs">
                          {p.brandName}
                        </span>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-brand-burgundy uppercase tracking-wider">
                          {p.categoryName || "Hardware"}
                        </div>
                        <h3 className="text-sm font-bold text-brand-slate-900 group-hover:text-brand-burgundy transition-colors line-clamp-2 mt-0.5">
                          {p.title}
                        </h3>
                        {p.vendorStoreName && (
                          <p className="text-[11px] text-brand-slate-400 mt-1">
                            Sold by <span className="text-brand-slate-600 font-medium">{p.vendorStoreName}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-brand-slate-900">
                            {formatMoney(p.discountPrice || p.basePrice)}
                          </span>
                          {p.discountPrice && (
                            <span className="text-xs text-brand-slate-400 line-through">
                              {formatMoney(p.basePrice)}
                            </span>
                          )}
                        </div>
                        {p.inStock ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StorefrontCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-brand-slate-400">
          Loading catalog...
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  );
}
