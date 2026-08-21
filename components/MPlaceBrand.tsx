type MPlaceBrandProps = {
  compact?: boolean;
  product?: string;
};

const MPLACE_LOGO = "https://unrealcake8.github.io/cdn-hls/mplace.png";

export function MPlaceBrand({ compact = false, product }: MPlaceBrandProps) {
  return (
    <span
      className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"}
      aria-label={product ? `MPlace ${product}` : "MPlace"}
    >
      <img
        className="brand-logo-image"
        src={MPLACE_LOGO}
        alt="MPlace"
      />
      {product ? <span className="brand-product">{product}</span> : null}
    </span>
  );
}
