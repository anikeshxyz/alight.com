"use client";

import Link from "next/link";
import { Layers, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useCurrency } from "@/context/CurrencyContext";
import { getBundlesApi } from "@/services/discovery-service";
import { BundleSummary } from "@/types/discovery";

export default function BundlesPage() {
  const { formatMoney } = useCurrency();
  const [bundles, setBundles] = useState<BundleSummary[]>([]);
  useEffect(() => { getBundlesApi().then((res) => setBundles(res.data?.content || [])); }, []);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-brand-slate-900">Bundle Offers</h1><p className="text-sm text-brand-slate-500 mt-1">Curated product sets at a better combined price.</p></div>
    {!bundles.length ? <Card className="p-10 text-center"><Package className="w-9 h-9 mx-auto text-brand-slate-400 mb-3" /><p className="text-sm text-brand-slate-500">No bundle offers are available right now.</p></Card> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{bundles.map((bundle) => <Link key={bundle.id} href={`/bundles/${bundle.slug}`}><Card className="h-full overflow-hidden hover:shadow-md"><div className="aspect-video bg-brand-slate-50">{bundle.primaryImageUrl ? <img src={bundle.primaryImageUrl} alt="" className="w-full h-full object-cover" /> : <Layers className="w-10 h-10 m-auto relative top-1/2 -translate-y-1/2 text-brand-slate-300" />}</div><div className="p-4"><h2 className="font-bold text-brand-slate-900">{bundle.title}</h2><p className="text-xs text-brand-slate-500 mt-1 line-clamp-2">{bundle.description}</p><div className="mt-4 flex items-end justify-between"><div><span className="text-sm font-bold">{formatMoney(bundle.totalDiscountedPrice)}</span><span className="ml-2 text-xs line-through text-brand-slate-400">{formatMoney(bundle.totalOriginalPrice)}</span></div><span className="text-xs font-semibold text-emerald-700">Save {formatMoney(bundle.totalSavings)}</span></div></div></Card></Link>)}</div>}</div>;
}
