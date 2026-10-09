const logoLetters = ["G", "E", "M", "E"];

export function BrandedLoader() {
  return (
    <div aria-label="Loading GEME3T Academy" className="branded-loader" role="status">
      <div className="branded-loader-lockup">
        <div aria-hidden="true" className="branded-loader-wordmark">
          {logoLetters.map((letter, index) => (
            <span
              className="branded-loader-letter"
              key={`${letter}-${index}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {letter}
            </span>
          ))}
          <span aria-label="3T" className="branded-loader-suffix">
            <span aria-hidden="true" className="branded-loader-three">
              3
            </span>
            <span aria-hidden="true" className="branded-loader-t">
              T
            </span>
          </span>
        </div>
        <div aria-hidden="true" className="branded-loader-tagline">
          <span className="branded-loader-tagline-word branded-loader-tagline-word--transforming">
            Transforming
          </span>
          <span className="branded-loader-tagline-word branded-loader-tagline-word--tomorrow">
            Tomorrow
          </span>
          <span className="branded-loader-tagline-word branded-loader-tagline-word--today">
            Today
          </span>
        </div>
      </div>
    </div>
  );
}
