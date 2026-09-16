"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist, WishlistProduct } from "@/context/WishlistContext";

interface WishlistButtonProps {
  product: WishlistProduct;
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function WishlistButton({
  product,
  size = "md",
  className = "",
  showText = false,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [animating, setAnimating] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const sizeStyles = {
    sm: {
      btn: "w-8 h-8 rounded-full",
      icon: "w-4 h-4",
    },
    md: {
      btn: "w-9 h-9 rounded-full",
      icon: "w-4.5 h-4.5",
    },
    lg: {
      btn: "w-11 h-11 rounded-2xl",
      icon: "w-5 h-5",
    },
  }[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAnimating(true);
    await toggleWishlist(product);
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
      className={`relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 select-none ${
        isWishlisted
          ? "bg-white/95 text-rose-500 border border-rose-200/80 shadow-rose-500/15 hover:bg-white hover:scale-105"
          : "bg-white/80 backdrop-blur-md text-brand-slate-600 border border-white/60 hover:text-rose-500 hover:bg-white hover:scale-105 shadow-brand-slate-900/5"
      } ${animating ? "scale-125" : ""} ${sizeStyles.btn} ${className}`}
    >
      <Heart
        className={`transition-all duration-300 ${sizeStyles.icon} ${
          isWishlisted
            ? "fill-rose-500 text-rose-500 scale-100 drop-shadow-xs"
            : "text-brand-slate-600 hover:text-rose-500"
        } ${animating ? "scale-115" : ""}`}
      />
      {showText && (
        <span className="ml-2 text-xs font-semibold">
          {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
        </span>
      )}
    </button>
  );
}
