interface LogoProps {
  variant?: "on-dark" | "on-light";
  tagline?: string;
}

export function Logo({ variant = "on-dark", tagline = "Triagem industrial" }: LogoProps) {
  return (
    <div className={`logo ${variant}`}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#logo-gradient)" />
        <path
          d="M20 10 L20 15 M20 25 L20 30 M10 20 L15 20 M25 20 L30 20"
          stroke="#FF7A29"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="6.5" fill="none" stroke="#FF7A29" strokeWidth="2.4" />
        <circle cx="20" cy="20" r="2" fill="#FF7A29" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B4FD6" />
            <stop offset="1" stopColor="#082F86" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <div className="logo-word">
          FROT<b>MAN</b>
        </div>
        <div className="logo-tag">{tagline}</div>
      </div>
    </div>
  );
}
