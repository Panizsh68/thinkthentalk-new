import type { ComponentProps } from 'react';
import Image from 'next/image';

type LogoProps = Omit<ComponentProps<typeof Image>, 'src' | 'alt'> & {
  alt?: string;
};

export const Logo = ({
  alt = 'Think Then Talk',
  width = 200,
  height = 60,
  ...props
}: LogoProps) => (
  <Image
    src="/frontend/public/static-images/logo.png"
    alt={alt}
    priority
    width={width}
    height={height}
    {...props}
  />
);
