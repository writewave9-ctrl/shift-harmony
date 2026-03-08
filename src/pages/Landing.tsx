import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { BenefitsStrip } from '@/components/landing/BenefitsStrip';
import { SocialProof } from '@/components/landing/SocialProof';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const Landing = () => (
  <div className="min-h-screen bg-background text-foreground">
    <LandingNav />
    <HeroSection />
    <BenefitsStrip />
    <SocialProof />
    <FeaturesGrid />
    <HowItWorks />
    <PricingSection />
    <FAQSection />
    <CTASection />
    <LandingFooter />
  </div>
);
