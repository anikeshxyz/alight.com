"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SlideData {
  id: number;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  primaryCtaText: string;
  categoryTag: string;
  priceTag: string;
}

const HERO_SLIDES: SlideData[] = [
  {
    id: 1,
    badge: "Direct Factory Pricing • SS304 Certified",
    title: "Alight SS304 Tall Pantry",
    highlight: "Pull-Out Larder Unit",
    description:
      "Commercial-grade electro-polished SS304 kitchen pantry with 6 adjustable soft-close wire baskets supporting up to 100 kg total payload.",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1600&auto=format&fit=crop",
    productUrl: "/products/alight-ss304-tall-pantry-pullout-unit",
    primaryCtaText: "View Product Details",
    categoryTag: "Modular Kitchen",
    priceTag: "₹21,999"
  },
  {
    id: 2,
    badge: "Solid Brass & PVD Titanium Finish",
    title: "Artisan Knurled Solid Brass",
    highlight: "T-Bar Pull Handle 300mm",
    description:
      "Precision-milled diamond-cut knurled architectural pull handle with lifetime anti-tarnish PVD coating. Tested for 200,000+ cycles.",
    imageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop",
    productUrl: "/products/artisan-knurled-brass-tbar-pull-handle-300mm",
    primaryCtaText: "View Product Details",
    categoryTag: "Architectural Hardware",
    priceTag: "₹1,599"
  },
  {
    id: 3,
    badge: "German Engineering • 85° Door Clearance",
    title: "Kesseböhmer LeMans II",
    highlight: "Corner Swivel Tray (Anthracite)",
    description:
      "Patented corner carousel turns dead cabinet corners into ergonomic storage with 25 kg load capacity per shelf and anti-slip solid bases.",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1600&auto=format&fit=crop",
    productUrl: "/products/kessebohmer-lemans-ii-corner-swivel-tray",
    primaryCtaText: "View Product Details",
    categoryTag: "Corner Storage",
    priceTag: "₹26,500"
  },
  {
    id: 4,
    badge: "Dual Hydraulic Dampeners • 120 KG Load",
    title: "Heavy Duty Top-Hung Soft-Close",
    highlight: "Sliding Barn Door Kit 2.0M",
    description:
      "Architectural carbon steel sliding rail in matte black with bi-directional hydraulic dampening for ultra-quiet interior door glide.",
    imageUrl:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop",
    productUrl: "/products/heavy-duty-sliding-barn-door-hardware-kit",
    primaryCtaText: "View Product Details",
    categoryTag: "Sliding Systems",
    priceTag: "₹6,800"
  },
  {
    id: 5,
    badge: "Silent Flush Latch • Zero Impact Noise",
    title: "Concealed Magnetic Mortise",
    highlight: "Door Lock Mechanism",
    description:
      "European standard silent magnetic entry lock with solid brass faceplate. Retractable latch aligns flush without striking frame plates.",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    productUrl: "/products/concealed-magnetic-mortise-door-lock",
    primaryCtaText: "View Product Details",
    categoryTag: "Door Locks",
    priceTag: "₹1,999"
  }
];

export const HeroSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay effect (advances every 5.5 seconds unless hovered)
  useEffect(() => {
    if (isPaused) return;
    autoPlayRef.current = setInterval(nextSlide, 5500);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPaused, nextSlide]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStart(null);
  };

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-brand-slate-950 border border-brand-slate-800 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Images Container - Clickable direct product link */}
      <div className="relative h-[440px] sm:h-[480px] lg:h-[520px] w-full overflow-hidden">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Clickable Image & Backdrop */}
              <Link
                href={slide.productUrl}
                className="block w-full h-full cursor-pointer relative"
                title={`View ${slide.title} ${slide.highlight}`}
              >
                {/* Background Image */}
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-7000 ease-out"
                  style={{
                    transform: isActive ? "scale(1.03)" : "scale(1.08)",
                  }}
                />

                {/* Multi-gradient backdrop overlay for high text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-slate-950/95 via-brand-slate-950/75 to-brand-slate-950/30 sm:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-slate-950 via-transparent to-black/20" />

                {/* Hover indicator overlay */}
                <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-slate-950/70 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5 text-brand-gold-400" />
                  <span>Click image to view product</span>
                </div>
              </Link>

              {/* Slide Content Layer */}
              <div className="absolute inset-0 z-20 pointer-events-none h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex flex-col justify-center">
                <div className="max-w-2xl space-y-4 sm:space-y-5">
                  {/* Badge & Price Pill */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold-500/20 border border-brand-gold-500/40 text-brand-gold-300 text-xs font-semibold backdrop-blur-md pointer-events-auto">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold-400" />
                      <span>{slide.badge}</span>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-emerald-950/80 border border-brand-emerald-700 text-brand-emerald-300 text-xs font-mono font-bold backdrop-blur-md">
                      {slide.priceTag}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                    {slide.title}{" "}
                    <span className="text-brand-gold-400 block sm:inline">
                      {slide.highlight}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm lg:text-base text-brand-slate-300 leading-relaxed max-w-xl font-normal">
                    {slide.description}
                  </p>

                  {/* Action CTAs */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 pointer-events-auto">
                    <Link href={slide.productUrl}>
                      <Button
                        variant="secondary"
                        size="md"
                        className="bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-slate-950 font-bold px-6 py-2.5 text-xs sm:text-sm shadow-lg shadow-brand-gold-500/20"
                      >
                        <ShoppingBag className="w-4 h-4 mr-1.5" />
                        <span>{slide.primaryCtaText}</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>

                    <Link href="/products">
                      <Button
                        variant="outline"
                        size="md"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-6 py-2.5 text-xs sm:text-sm backdrop-blur-md"
                      >
                        <span>Explore All Catalog</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrow Controls */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-brand-slate-950/60 hover:bg-brand-slate-900/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-105 focus:outline-none"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-brand-slate-950/60 hover:bg-brand-slate-900/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-105 focus:outline-none"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Bar with Slide Indicators & Quick Selectors */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Slide Dots and Progress Bar */}
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 sm:w-10 h-2 sm:h-2.5 bg-brand-gold-400"
                  : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        {/* Slide Counter & Category Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-brand-slate-950/70 border border-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-brand-slate-300">
          <span className="font-bold text-brand-gold-400">{currentSlide.categoryTag}</span>
          <span className="text-brand-slate-600">•</span>
          <span className="font-mono font-medium">
            0{currentIndex + 1} / 0{HERO_SLIDES.length}
          </span>
        </div>
      </div>
    </div>
  );
};
