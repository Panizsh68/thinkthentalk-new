'use client';
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

export function GallerySection() {
  const { t } = useLanguage();
  
  const items = [
    { url: '/static-images/group-photo-1.jpg', span: 'col-span-2 row-span-2' },
    { url: '/static-images/-2147483648_-218139.jpg', span: 'col-span-1 row-span-1' },
    { url: '/static-images/IMG_6971.JPG', span: 'col-span-1 row-span-2' },
    { url: '/static-images/IMG_8724.JPG', span: 'col-span-1 row-span-1' },
    { url: '/static-images/-2147483648_-218260.jpg', span: 'col-span-2 md:col-span-2 row-span-1 md:row-span-1' },
  ];

  return (
    <section className="py-20 md:py-32 bg-secondary/10 px-4">
      <div className="container max-w-screen-2xl">
        <div className="mb-12 text-center space-y-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('home.moments.title')}</h2>
          <p className="text-lg text-muted-foreground font-medium">{t('home.moments.subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[150px] md:auto-rows-[200px] lg:auto-rows-[250px]">
          {items.map((item, i) => (
            <div key={i} className={cn("relative rounded-[2rem] overflow-hidden shadow-md group border-4 border-background", item.span)}>
              <Image 
                src={item.url} 
                alt="Think Then Talk Community Moments" 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
