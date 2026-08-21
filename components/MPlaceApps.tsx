const products = [
  { name: "Search", href: "https://mplace.cc", color: "#08b9f1", mark: "S" },
  { name: "Pages", href: "https://pages.mplace.cc", color: "#b438f0", mark: "P" },
  { name: "MVideo", href: "https://videos.mplace.cc", color: "#ff5f66", mark: "V" },
  { name: "MStudy", href: "https://study.mplace.cc", color: "#31d75d", mark: "S" },
  { name: "M.Ads", href: "https://ads.mplace.cc", color: "#ffb900", mark: "A" },
];

export function MPlaceApps({ compact = false }: { compact?: boolean }) {
  return (
    <details className={compact ? "mplace-apps mplace-apps-compact" : "mplace-apps"}>
      <summary aria-label="MPlace apps" title="MPlace apps">
        <span /><span /><span />
        <span /><span /><span />
        <span /><span /><span />
      </summary>
      <div className="mplace-apps-menu">
        <div className="mplace-apps-title">MPlace apps</div>
        <div className="mplace-apps-grid">
          {products.map((product) => (
            <a key={product.name} href={product.href}>
              <span className="mplace-app-icon" style={{ background: product.color }} aria-hidden="true">{product.mark}</span>
              <span>{product.name}</span>
            </a>
          ))}
        </div>
      </div>
    </details>
  );
}
