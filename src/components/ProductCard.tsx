import React from "react";
import { Plus } from "lucide-react";
import type { Product } from "../types";
import placeholder from "../asset/placeholder.jpg"; // ✅ import
import { formatMoney } from "../utils/format";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

function resolveImageSrc(image?: string | null) {
  if (!image) return placeholder;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // for old mock keywords (not URL)
  return placeholder;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const src = React.useMemo(() => resolveImageSrc(product.image), [product.image]);

  return (
    <div
      className="bg-white rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer group"
      onClick={() => onAdd(product)}
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            console.error("❌ image failed:", product.name, src);
            e.currentTarget.src = placeholder; // ✅ use imported placeholder
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />

        <button
          className="absolute bottom-2 right-2 bg-[var(--color-primary)] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="p-4">
        <h4 className="mb-1 line-clamp-1">{product.name}</h4>
<p className="text-[var(--color-primary)]">
  {formatMoney((product as any).basePrice ?? (product as any).base_price ?? 0)}
</p>
      </div>
    </div>
  );
};
