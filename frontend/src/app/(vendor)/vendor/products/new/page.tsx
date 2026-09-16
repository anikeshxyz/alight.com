"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageUploadDropzone } from "@/components/ui/ImageUploadDropzone";
import {
  getPublicCategoryTreeApi,
  getActiveBrandsApi,
  createVendorProductApi,
} from "@/services/product-service";
import {
  CategoryTree,
  Brand,
  CreateProductPayload,
  ProductImage,
  ProductAttribute,
  ProductVariant,
} from "@/types/product";

export default function NewProductPage() {
  const router = useRouter();
  const [flatCategories, setFlatCategories] = useState<{ id: string; name: string; level: number }[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("SKU-" + Math.floor(100000 + Math.random() * 900000));
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("50");

  // Gallery Images
  const [images, setImages] = useState<ProductImage[]>([
    {
      imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      altText: "Primary Product Photo",
      primary: true,
      displayOrder: 0,
    },
  ]);

  // Specifications
  const [attributes, setAttributes] = useState<ProductAttribute[]>([
    { attributeName: "Material", attributeValue: "Solid Brass", displayOrder: 0 },
    { attributeName: "Finish", attributeValue: "Matte Black", displayOrder: 1 },
  ]);

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      variantName: "Standard",
      variantSku: "SKU-" + Math.floor(100000 + Math.random() * 900000),
      price: 0,
      stockQuantity: 50,
      active: true,
    },
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          getPublicCategoryTreeApi(),
          getActiveBrandsApi(),
        ]);
        if (catRes.success && catRes.data) {
          const flattened: { id: string; name: string; level: number }[] = [];
          const flatten = (nodes: CategoryTree[], lvl = 0) => {
            nodes.forEach((n) => {
              flattened.push({ id: n.id, name: n.name, level: lvl });
              if (n.children && n.children.length > 0) {
                flatten(n.children, lvl + 1);
              }
            });
          };
          flatten(catRes.data);
          setFlatCategories(flattened);
          if (flattened.length > 0) {
            setCategoryId(flattened[0].id);
          }
        }
        if (brandRes.success && brandRes.data) {
          setBrands(brandRes.data);
          if (brandRes.data.length > 0) {
            setBrandId(brandRes.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories/brands", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadInitialData();
  }, []);

  // Image helpers
  const addImage = () => {
    setImages([
      ...images,
      {
        imageUrl: "",
        altText: "",
        primary: images.length === 0,
        displayOrder: images.length,
      },
    ]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        primary: i === index,
      }))
    );
  };

  // Attribute helpers
  const addAttribute = () => {
    setAttributes([
      ...attributes,
      { attributeName: "", attributeValue: "", displayOrder: attributes.length },
    ]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Variant helpers
  const addVariant = () => {
    const baseP = parseFloat(basePrice) || 0;
    setVariants([
      ...variants,
      {
        variantName: "Option " + (variants.length + 1),
        variantSku: "SKU-" + Math.floor(100000 + Math.random() * 900000),
        price: baseP,
        stockQuantity: 20,
        active: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage("Please provide a product title.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }
    const numBasePrice = parseFloat(basePrice);
    if (isNaN(numBasePrice) || numBasePrice <= 0) {
      setErrorMessage("Please enter a valid base price.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload: CreateProductPayload = {
      title: title.trim(),
      sku: sku.trim() || ("SKU-" + Math.floor(100000 + Math.random() * 900000)),
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      categoryId,
      brandId: brandId || undefined,
      basePrice: numBasePrice,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      stockQuantity: parseInt(stockQuantity) || 50,
      images: images.filter((img) => img.imageUrl.trim().length > 0),
      attributes: attributes.filter((a) => a.attributeName.trim().length > 0 && a.attributeValue.trim().length > 0),
      variants: variants.map((v) => ({
        ...v,
        price: v.price > 0 ? v.price : numBasePrice,
      })),
    };

    try {
      const token =
        localStorage.getItem("alight_token") ||
        localStorage.getItem("alight_access_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await createVendorProductApi(payload, token);
      if (res.success) {
        router.push("/vendor/products");
      } else {
        setErrorMessage(res.message || "Failed to create product");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/vendor/products">
            <button className="p-2 rounded-lg bg-white border border-brand-slate-200 text-brand-slate-600 hover:bg-brand-slate-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-slate-900">Add New Product</h1>
            <p className="text-xs text-brand-slate-500">
              Configure product details, imagery, technical specifications, and inventory variants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            loading={submitting}
            onClick={handleSubmit}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit for Approval
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Core Information */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900 border-b pb-2">
          <Package className="w-4 h-4 text-brand-burgundy" /> Basic Information
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Alight Architect Brass Pendant Lamp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                Master SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
              >
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"— ".repeat(c.level) + c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
                Brand
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
              >
                <option value="">None / Generic Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Short Summary / Highlight
            </label>
            <input
              type="text"
              placeholder="e.g. Handcrafted minimalist brass pendant with warm 2700K ambient LED"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe craftsmanship, mounting instructions, materials, care guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>
        </div>
      </Card>

      {/* Section 2: Pricing & Inventory */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900 border-b pb-2">
          <DollarSign className="w-4 h-4 text-brand-burgundy" /> Pricing & Inventory
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Base Price (MRP in ₹) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 4999.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Sale / Discount Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 3999.00 (Optional)"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-slate-700 mb-1">
              Initial Stock Quantity *
            </label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
            />
          </div>
        </div>
      </Card>

      {/* Section 3: Gallery Imagery */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900">
            <ImageIcon className="w-4 h-4 text-brand-burgundy" /> Media & Product Imagery
          </div>
          <Button variant="outline" size="sm" onClick={addImage}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Image Slot
          </Button>
        </div>

        {/* Master Drag & Drop Multi-Image Uploader */}
        <div className="p-3 bg-brand-slate-50/70 border border-brand-slate-200 rounded-xl space-y-2">
          <ImageUploadDropzone
            label="Direct Photo Uploader"
            helperText="Drag and drop or click to browse photos (automatically populates the gallery below)"
            multiple={true}
            maxFiles={10}
            value={images.map((img) => img.imageUrl).filter(Boolean)}
            onChange={(newUrls) => {
              const urlArray = Array.isArray(newUrls) ? newUrls : [newUrls];
              const updatedImages: ProductImage[] = urlArray.map((url, idx) => ({
                imageUrl: url,
                altText: images[idx]?.altText || `Product Photo ${idx + 1}`,
                primary: idx === 0,
                displayOrder: idx,
              }));
              if (updatedImages.length > 0) {
                setImages(updatedImages);
              }
            }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold text-brand-slate-500 uppercase tracking-wider">
            Image Gallery List ({images.length} photos)
          </p>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-brand-slate-50 border border-brand-slate-200 rounded-xl"
            >
              <div className="w-14 h-14 bg-white rounded-lg border border-brand-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {img.imageUrl ? (
                  <img src={img.imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-brand-slate-300" />
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <input
                  type="text"
                  placeholder="Image URL or uploaded file..."
                  value={img.imageUrl}
                  onChange={(e) => {
                    const newImgs = [...images];
                    newImgs[idx].imageUrl = e.target.value;
                    setImages(newImgs);
                  }}
                  className="px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
                />
                <input
                  type="text"
                  placeholder="Alt text / caption..."
                  value={img.altText || ""}
                  onChange={(e) => {
                    const newImgs = [...images];
                    newImgs[idx].altText = e.target.value;
                    setImages(newImgs);
                  }}
                  className="px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrimaryImage(idx)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                    img.primary
                      ? "bg-brand-burgundy text-white border-brand-burgundy"
                      : "bg-white text-brand-slate-600 border-brand-slate-200 hover:bg-brand-slate-100"
                  }`}
                >
                  {img.primary ? "Primary" : "Set Primary"}
                </button>
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 4: Technical Specifications */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900">
            <Sliders className="w-4 h-4 text-brand-burgundy" /> Technical Specifications & Attributes
          </div>
          <Button variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Spec
          </Button>
        </div>

        <div className="space-y-2">
          {attributes.map((attr, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Spec Key (e.g. Material)"
                value={attr.attributeName}
                onChange={(e) => {
                  const updated = [...attributes];
                  updated[idx].attributeName = e.target.value;
                  setAttributes(updated);
                }}
                className="w-1/3 px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
              <input
                type="text"
                placeholder="Spec Value (e.g. Solid Brass 18-gauge)"
                value={attr.attributeValue}
                onChange={(e) => {
                  const updated = [...attributes];
                  updated[idx].attributeValue = e.target.value;
                  setAttributes(updated);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
              />
              <button
                type="button"
                onClick={() => removeAttribute(idx)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5: SKU Variants */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-sm text-brand-slate-900">
            <Layers className="w-4 h-4 text-brand-burgundy" /> SKU Variants & Initial Stock
          </div>
          <Button variant="outline" size="sm" onClick={addVariant}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
          </Button>
        </div>

        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-brand-slate-50 border border-brand-slate-200 rounded-xl items-center"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-slate-400 mb-1">
                  Variant Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard / Large"
                  value={v.variantName}
                  onChange={(e) => {
                    const up = [...variants];
                    up[idx].variantName = e.target.value;
                    setVariants(up);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-slate-400 mb-1">
                  SKU Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. ALT-BRS-01"
                  value={v.variantSku}
                  onChange={(e) => {
                    const up = [...variants];
                    up[idx].variantSku = e.target.value;
                    setVariants(up);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-brand-slate-400 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => {
                    const up = [...variants];
                    up[idx].price = parseFloat(e.target.value) || 0;
                    setVariants(up);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-brand-slate-400 mb-1">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={v.stockQuantity}
                    onChange={(e) => {
                      const up = [...variants];
                      up[idx].stockQuantity = parseInt(e.target.value) || 0;
                      setVariants(up);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-brand-slate-200 rounded-lg focus:outline-none focus:border-brand-burgundy"
                  />
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
