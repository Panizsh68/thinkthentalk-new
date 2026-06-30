'use client';
import { HeroSection } from "@/components/home/hero-section";
import { EventsSection } from "@/components/home/events-section";
import { SeasonOneSection } from "@/components/home/season-one-section";
import { WhySection } from "@/components/home/why-section";
import { GallerySection } from "@/components/home/gallery-section";
import { SuggestSection } from "@/components/home/suggest-section";
import { CollaborateSection } from "@/components/home/collaborate-section";
import { SponsorshipSection } from "@/components/home/sponsorship-section";
import { TeamSection } from "@/components/home/team-section";
import { FinalCTASection } from "@/components/home/final-cta-section";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-0 pb-16">
      <HeroSection />
      <EventsSection />
      <SeasonOneSection />
      <WhySection />
      <GallerySection />
      <SuggestSection />
      <CollaborateSection />
      <SponsorshipSection />
      <TeamSection />
      <FinalCTASection />
    </div>
  );
}
