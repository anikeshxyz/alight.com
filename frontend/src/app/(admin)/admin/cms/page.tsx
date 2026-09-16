"use client";

import React, { useState } from "react";
import {
  Layout,
  Plus,
  Eye,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Edit2,
  Image as ImageIcon,
  Layers,
  ArrowUp,
  ArrowDown,
  Monitor,
  Smartphone,
  Globe,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  active: boolean;
  order: number;
}

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  link: string;
  imageUrl: string;
  active: boolean;
}

interface CuratedCollection {
  id: string;
  name: string;
  handle: string;
  description: string;
  productCount: number;
  featured: boolean;
}

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<"hero" | "banners" | "collections" | "announcement">("hero");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [notification, setNotification] = useState("");

  // Hero Slides
  const [slides, setSlides] = useState<HeroSlide[]>([
    {
      id: "slide-1",
      title: "Direct-From-Factory Architectural Hardware",
      subtitle: "Engineered SS304 kitchen storage, precision soft-close hinges, and solid brass fittings.",
      badge: "Commercial Grade Warranty",
      ctaText: "Explore Atelier",
      ctaLink: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
      active: true,
      order: 1,
    },
    {
      id: "slide-2",
      title: "Concealed Soft-Close Carcass Systems",
      subtitle: "Tested to 100,000 duty cycles with 3-way eccentric cam adjustment for modular kitchens.",
      badge: "German Standard DIN 68857",
      ctaText: "View Hinges Matrix",
      ctaLink: "/shop?category=concealed-hinges",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      active: true,
      order: 2,
    },
  ]);

  // Promo Banners
  const [banners, setBanners] = useState<PromoBanner[]>([
    {
      id: "ban-1",
      title: "Modular Carcass Hardware",
      subtitle: "Bulk tier discounts for interior contractors",
      tag: "Contractor Wholesale",
      link: "/shop?category=kitchen-fittings",
      imageUrl: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=80",
      active: true,
    },
    {
      id: "ban-2",
      title: "Solid Forged Brass Handles",
      subtitle: "PVD Champagne Gold & Matte Graphite Finishes",
      tag: "Luxury Hardware",
      link: "/shop?category=handles",
      imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      active: true,
    },
  ]);

  // Collections
  const [collections, setCollections] = useState<CuratedCollection[]>([
    { id: "col-1", name: "SS304 Heavy Kitchen Pullouts", handle: "ss304-kitchen-pullouts", description: "Corrosion-proof wire baskets and magic corners", productCount: 24, featured: true },
    { id: "col-2", name: "Concealed Soft-Close Hinges", handle: "concealed-soft-close-hinges", description: "Zero-protrusion and clip-on hydraulic hinges", productCount: 18, featured: true },
    { id: "col-3", name: "PVD Architectural Pull Handles", handle: "pvd-pull-handles", description: "Solid forged luxury door and wardrobe pull profiles", productCount: 32, featured: true },
  ]);

  // Announcement Bar
  const [announcement, setAnnouncement] = useState({
    text: "Direct Manufacturer GST Invoicing & Nationwide Commercial Dispatch Available",
    linkText: "Request B2B Quotation →",
    linkUrl: "/become-a-seller",
    active: true,
    bgTone: "emerald",
  });

  const handleToggleSlide = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    setNotification("Slide visibility updated");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleToggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    setNotification("Banner status updated");
    setTimeout(() => setNotification(""), 3000);
  };

  const handlePublishAll = () => {
    setNotification("Storefront CMS configuration published to production edge cache.");
    setTimeout(() => setNotification(""), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-brand-emerald-400" />
            Storefront CMS & Visual Layout Manager
          </h1>
          <p className="text-xs text-brand-slate-400">
            Curate storefront hero sliders, promotional campaign grids, featured collections, and global announcements.
          </p>
        </div>

        <button
          onClick={handlePublishAll}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-emerald-800 hover:bg-brand-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Publish Storefront Layout
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-slate-700 text-xs">
        {(["hero", "banners", "collections", "announcement"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-semibold capitalize border-b-2 transition-all ${
              activeTab === tab
                ? "border-brand-emerald-500 text-brand-emerald-400 bg-brand-slate-800/40"
                : "border-transparent text-brand-slate-400 hover:text-white"
            }`}
          >
            {tab === "hero" ? "Hero Slides" : tab === "banners" ? "Promo Banners" : tab === "collections" ? "Curated Collections" : "Announcement Bar"}
          </button>
        ))}
      </div>

      {/* Tab: Hero Slides */}
      {activeTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Hero Carousel Items ({slides.length})
              </span>
              <button
                onClick={() => {
                  const newSlide: HeroSlide = {
                    id: `slide-${Date.now()}`,
                    title: "New Seasonal Campaign Title",
                    subtitle: "Enter description of the featured architectural collection...",
                    badge: "Factory Direct",
                    ctaText: "Shop Collection",
                    ctaLink: "/shop",
                    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                    active: true,
                    order: slides.length + 1,
                  };
                  setSlides([...slides, newSlide]);
                }}
                className="flex items-center gap-1 text-xs text-brand-emerald-400 hover:text-brand-emerald-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Slide
              </button>
            </div>

            <div className="space-y-3">
              {slides.map((slide, idx) => (
                <div key={slide.id} className="p-4 bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white text-xs">{slide.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSlide(slide.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          slide.active
                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {slide.active ? "Published" : "Draft"}
                      </button>
                      <button
                        onClick={() => setSlides(slides.filter((s) => s.id !== slide.id))}
                        className="text-brand-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-brand-slate-400 text-[10px] mb-0.5">Heading</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) =>
                          setSlides(slides.map((s) => (s.id === slide.id ? { ...s, title: e.target.value } : s)))
                        }
                        className="w-full px-2.5 py-1 bg-brand-slate-900 border border-brand-slate-750 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-brand-slate-400 text-[10px] mb-0.5">Badge Text</label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={(e) =>
                          setSlides(slides.map((s) => (s.id === slide.id ? { ...s, badge: e.target.value } : s)))
                        }
                        className="w-full px-2.5 py-1 bg-brand-slate-900 border border-brand-slate-750 rounded text-white text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-brand-slate-400 text-[10px] mb-0.5">Subtitle</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) =>
                          setSlides(slides.map((s) => (s.id === slide.id ? { ...s, subtitle: e.target.value } : s)))
                        }
                        className="w-full px-2.5 py-1 bg-brand-slate-900 border border-brand-slate-750 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-brand-slate-400 text-[10px] mb-0.5">CTA Button</label>
                      <input
                        type="text"
                        value={slide.ctaText}
                        onChange={(e) =>
                          setSlides(slides.map((s) => (s.id === slide.id ? { ...s, ctaText: e.target.value } : s)))
                        }
                        className="w-full px-2.5 py-1 bg-brand-slate-900 border border-brand-slate-750 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-brand-slate-400 text-[10px] mb-0.5">Destination Link</label>
                      <input
                        type="text"
                        value={slide.ctaLink}
                        onChange={(e) =>
                          setSlides(slides.map((s) => (s.id === slide.id ? { ...s, ctaLink: e.target.value } : s)))
                        }
                        className="w-full px-2.5 py-1 bg-brand-slate-900 border border-brand-slate-750 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Storefront Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-gold-400" />
                Live Storefront Preview
              </span>
              <div className="flex items-center bg-brand-slate-800 p-0.5 rounded border border-brand-slate-700">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1 rounded ${previewDevice === "desktop" ? "bg-brand-emerald-800 text-white" : "text-brand-slate-400"}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1 rounded ${previewDevice === "mobile" ? "bg-brand-emerald-800 text-white" : "text-brand-slate-400"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`border border-brand-slate-700 rounded-xl overflow-hidden bg-brand-slate-900 shadow-2xl transition-all ${previewDevice === "mobile" ? "max-w-[320px] mx-auto" : "w-full"}`}>
              {slides.filter((s) => s.active)[0] && (
                <div className="relative h-64 overflow-hidden group">
                  <img
                    src={slides.filter((s) => s.active)[0].imageUrl}
                    alt="Hero Preview"
                    className="w-full h-full object-cover brightness-[0.4]"
                  />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-brand-gold-300 uppercase tracking-wider bg-brand-gold-500/20 px-2 py-0.5 rounded-full self-start mb-2 border border-brand-gold-500/30">
                      {slides.filter((s) => s.active)[0].badge}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {slides.filter((s) => s.active)[0].title}
                    </h3>
                    <p className="text-[10px] text-brand-slate-300 mt-1 line-clamp-2">
                      {slides.filter((s) => s.active)[0].subtitle}
                    </p>
                    <button className="mt-3 px-3 py-1 bg-brand-gold-500 text-brand-slate-900 rounded font-bold text-[10px] self-start">
                      {slides.filter((s) => s.active)[0].ctaText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Promo Banners */}
      {activeTab === "banners" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((ban) => (
            <div key={ban.id} className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-4 space-y-3">
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img src={ban.imageUrl} alt={ban.title} className="w-full h-full object-cover brightness-[0.5]" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <span className="text-[10px] text-brand-gold-400 font-bold uppercase">{ban.tag}</span>
                  <div className="text-sm font-bold text-white">{ban.title}</div>
                  <p className="text-[11px] text-brand-slate-300">{ban.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-brand-slate-400 font-mono text-[11px]">{ban.link}</span>
                <button
                  onClick={() => handleToggleBanner(ban.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    ban.active
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {ban.active ? "Active" : "Disabled"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Curated Collections */}
      {activeTab === "collections" && (
        <div className="space-y-3">
          <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-slate-900/80 text-brand-slate-400 font-semibold border-b border-brand-slate-700">
                <tr>
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">URL Handle</th>
                  <th className="py-3 px-4">Catalog Products</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-slate-700/50">
                {collections.map((col) => (
                  <tr key={col.id} className="hover:bg-brand-slate-750/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{col.name}</div>
                      <p className="text-[11px] text-brand-slate-400">{col.description}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-brand-slate-300">
                      /collections/{col.handle}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {col.productCount} SKUs
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700">
                        Featured on Home
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 bg-brand-slate-700 hover:bg-brand-slate-600 text-brand-slate-200 rounded text-[11px] font-medium transition-colors">
                        Edit Grid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Announcement Bar */}
      {activeTab === "announcement" && (
        <div className="bg-brand-slate-800/80 border border-brand-slate-700 rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-brand-slate-700">
            <h3 className="text-sm font-bold text-white">Storefront Global Top Banner</h3>
            <button
              onClick={() => setAnnouncement({ ...announcement, active: !announcement.active })}
              className={`px-3 py-1 rounded text-xs font-semibold border ${
                announcement.active
                  ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {announcement.active ? "Banner Active" : "Banner Hidden"}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-brand-slate-300 font-medium mb-1">Headline Text</label>
              <input
                type="text"
                value={announcement.text}
                onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Link Label</label>
                <input
                  type="text"
                  value={announcement.linkText}
                  onChange={(e) => setAnnouncement({ ...announcement, linkText: e.target.value })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-brand-slate-300 font-medium mb-1">Link Target</label>
                <input
                  type="text"
                  value={announcement.linkUrl}
                  onChange={(e) => setAnnouncement({ ...announcement, linkUrl: e.target.value })}
                  className="w-full px-3 py-1.5 bg-brand-slate-900 border border-brand-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            {/* Live Bar Preview */}
            <div className="pt-2">
              <span className="text-[10px] text-brand-slate-400 uppercase tracking-wider block mb-1">Storefront Rendering</span>
              <div className="p-2.5 bg-brand-emerald-900/90 text-white rounded-lg flex items-center justify-between text-xs font-medium">
                <span>{announcement.text}</span>
                <span className="text-brand-gold-300 underline text-[11px]">{announcement.linkText}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
