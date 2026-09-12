import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import Pricing from "@/components/Pricing";
import FinalCta from "@/components/FinalCta";

export default function HomePage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <SiteHeader />
            <Hero />
            <HowItWorks />
            <Pricing />
            <FinalCta />
            <SiteFooter />
        </main>
    );
}
