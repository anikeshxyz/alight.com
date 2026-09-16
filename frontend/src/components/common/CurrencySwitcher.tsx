"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface CurrencySwitcherProps {
  variant?: "dark" | "light";
}

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ variant = "dark" }) => {
  const { currencies, currentCurrency, setCurrencyCode } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buttonClasses =
    variant === "dark"
      ? "text-brand-slate-200 hover:text-white bg-brand-emerald-800/60 hover:bg-brand-emerald-800"
      : "text-brand-slate-700 hover:text-brand-slate-900 bg-brand-slate-100 hover:bg-brand-slate-200";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${buttonClasses}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-3.5 h-3.5 text-brand-gold-400" />
        <span className="font-semibold">{currentCurrency.code}</span>
        <span className="opacity-75">({currentCurrency.symbol})</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-white shadow-xl ring-1 ring-black/5 z-50 py-1 divide-y divide-brand-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-brand-slate-400 uppercase tracking-wider">
            Select Currency
          </div>
          <div className="py-1">
            {currencies.map((curr) => {
              const isSelected = curr.code === currentCurrency.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => {
                    setCurrencyCode(curr.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    isSelected
                      ? "bg-brand-emerald-50 text-brand-emerald-900 font-semibold"
                      : "text-brand-slate-700 hover:bg-brand-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 font-bold text-brand-emerald-700">{curr.symbol}</span>
                    <div>
                      <span className="font-medium text-brand-slate-900">{curr.code}</span>
                      <span className="text-brand-slate-500 text-[10px] ml-1.5 block">
                        {curr.name}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
