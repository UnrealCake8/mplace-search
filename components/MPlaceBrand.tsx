type MPlaceBrandProps = {
  compact?: boolean;
  product?: string;
};

export function MPlaceBrand({ compact = false, product }: MPlaceBrandProps) {
  return (
    <span className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"} aria-label={product ? `MPlace ${product}` : "MPlace"}>
      <span className="brand-word" aria-hidden="true">MPLACE</span>
      {product ? <span className="brand-product">{product}</span> : <span className="brand-tagline">YOUR PLACE ON THE INTERNET.</span>}
    </span>
  );
}
