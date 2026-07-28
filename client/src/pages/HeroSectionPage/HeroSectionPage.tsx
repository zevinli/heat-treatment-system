import { HeroSection } from '@/components/hero-section-2-bg';
export default function HeroSection2Demo() {
  return (
    <div className="w-full">
      <HeroSection
        logo={{
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m8 3 4 8 5-5 5 15H2L8 3z'/%3E%3Cpath d='M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19'/%3E%3C/svg%3E",
          alt: 'Company Logo',
          text: 'Mountain Co.',
        }}
        slogan="ELEVATE YOUR PERSPECTIVE"
        title={
          <>
            Each Peak <br />
            <span className="text-primary">Teaches Something</span>
          </>
        }
        subtitle="Discover breathtaking landscapes and challenge yourself with our guided mountain expeditions. Join a community of adventurers."
        callToAction={{
          text: 'JOIN US TO EXPLORE',
          href: '#explore',
        }}
        backgroundImage="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=60"
        contactInfo={{
          website: 'yourwebsite.com',
          phone: '+1 (555) 123-4567',
          address: '20 Fieldstone Dr, Roswell, GA',
        }}
      />
    </div>
  );
}
