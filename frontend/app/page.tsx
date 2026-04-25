'use client';

import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import DemoSection from '@/components/DemoSection';
import FeaturesSection from '@/components/FeaturesSection';
import DataVisualizationSection from '@/components/DataVisualizationSection';
import DeveloperSection from '@/components/DeveloperSection';
import SavingsSection from '@/components/SavingsSection';
import MobileShowcase from '@/components/MobileShowcase';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-900 overflow-x-hidden">
      <Header />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <DataVisualizationSection />
      <DeveloperSection />
      <SavingsSection />
      <MobileShowcase />
      <Footer />
    </main>
  );
}
