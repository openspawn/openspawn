import logoSvg from '../../assets/logo.svg';

const sizes = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

type LogoSize = keyof typeof sizes;

interface LogoProps {
  size?: LogoSize;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ size = 'md', className = '', style }: LogoProps) {
  const px = sizes[size];
  return (
    <img
      src={logoSvg}
      alt="BikiniBottom"
      width={px}
      height={px}
      className={`flex-shrink-0 ${className}`}
      style={style}
    />
  );
}
