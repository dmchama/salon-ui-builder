export interface Salon {
  id: string;
  name: string;
  image: string;
  logo: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  description: string;
  services: Service[];
  priceRange: string;
  isOpen: boolean;
  openingHours: { day: string; hours: string }[];
  gallery: string[];
  socialMedia: { platform: string; url: string }[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  duration?: string;
  category: string;
  image?: string;
}

export interface Technician {
  id: string;
  name: string;
  image: string;
  specializations: string[]; // service IDs
  experience: string;
  rating: number;
}

export interface HeroSlide {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
}

export const initialHeroSlides: HeroSlide[] = [
  {
    id: "slide-1",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80",
    title: "Experience the Elegance of Liyo Salon",
    subtitle: "Where Expert Care Meets Luxurious Services for a Transformative Beauty Experience.",
    buttonText: "Book Now"
  },
  {
    id: "slide-2",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80",
    title: "Unleash Your True Beauty",
    subtitle: "Discover our premium coloring and styling services tailored just for you.",
    buttonText: "Our Services"
  },
  {
    id: "slide-3",
    mediaType: "video",
    mediaUrl: "https://assets.mixkit.co/videos/preview/mixkit-working-with-the-hair-of-a-woman-in-a-hair-43486-large.mp4",
    title: "Masterful Precision",
    subtitle: "Experience the art of modern hairstyling by international experts.",
    buttonText: "Meet the Team"
  }
];

export const technicians: Record<string, Technician[]> = {
  "1": [
    { id: "t1", name: "Nimal Perera", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", specializations: ["s1", "s2", "s3"], experience: "8 years", rating: 4.9 },
    { id: "t2", name: "Sanduni Silva", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", specializations: ["s2", "s3", "s4"], experience: "5 years", rating: 4.7 },
    { id: "t3", name: "Kamal Fernando", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", specializations: ["s1", "s4"], experience: "10 years", rating: 4.8 },
  ],
  "2": [
    { id: "t4", name: "Dilani Jayawardena", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", specializations: ["s5", "s7"], experience: "6 years", rating: 4.8 },
    { id: "t5", name: "Rashmi Kumari", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", specializations: ["s5", "s6"], experience: "4 years", rating: 4.6 },
    { id: "t6", name: "Tharushi Mendis", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop", specializations: ["s6", "s7"], experience: "3 years", rating: 4.5 },
  ],
  "3": [
    { id: "t7", name: "Ruwan de Silva", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", specializations: ["s8", "s9", "s10"], experience: "12 years", rating: 4.9 },
    { id: "t8", name: "Ashan Bandara", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", specializations: ["s8", "s10"], experience: "7 years", rating: 4.7 },
  ],
  "4": [
    { id: "t9", name: "Nimali Weerasinghe", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", specializations: ["s11", "s14"], experience: "9 years", rating: 4.8 },
    { id: "t10", name: "Sachini Perera", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop", specializations: ["s12", "s13"], experience: "5 years", rating: 4.6 },
    { id: "t11", name: "Hasini Gunawardena", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop", specializations: ["s11", "s12", "s13", "s14"], experience: "7 years", rating: 4.9 },
  ],
};

export const salons: Salon[] = [
  {
    id: "1",
    name: "Luxe Hair Studio",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
    logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
    location: "Colombo 03",
    address: "45 Galle Road, Colombo 03",
    phone: "+94 77 234 5678",
    email: "info@luxehairstudio.lk",
    rating: 4.8,
    reviewCount: 124,
    description: "Premium hair salon offering cutting-edge styles and treatments in a luxurious setting. Our expert stylists bring years of international experience.",
    priceRange: "$$$ ",
    isOpen: true,
    services: [
      { id: "s1", name: "Haircut & Styling", description: "Professional cut and blow-dry", price: 2500, duration: "45 min", category: "Hair", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=200&h=200&fit=crop" },
      { id: "s2", name: "Hair Coloring", description: "Full color with premium products", price: 5500, duration: "90 min", category: "Hair" },
      { id: "s3", name: "Keratin Treatment", description: "Smoothing keratin treatment", price: 8000, duration: "120 min", category: "Hair" },
      { id: "s4", name: "Bridal Package", description: "Complete bridal hair and makeup", price: 15000, duration: "180 min", category: "Special" },
    ],
    openingHours: [
      { day: "Monday", hours: "9:00 AM - 7:00 PM" },
      { day: "Tuesday", hours: "9:00 AM - 7:00 PM" },
      { day: "Wednesday", hours: "9:00 AM - 7:00 PM" },
      { day: "Thursday", hours: "9:00 AM - 8:00 PM" },
      { day: "Friday", hours: "9:00 AM - 8:00 PM" },
      { day: "Saturday", hours: "8:00 AM - 6:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1521590832167-7228fcb28501?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
    ],
    socialMedia: [
      { platform: "Instagram", url: "#" },
      { platform: "Facebook", url: "#" },
    ],
  },
  {
    id: "2",
    name: "Glow Beauty Lounge",
    image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=400&fit=crop",
    logo: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=100&h=100&fit=crop",
    location: "Nugegoda",
    address: "12 High Level Road, Nugegoda",
    phone: "+94 71 345 6789",
    email: "hello@glowbeauty.lk",
    rating: 4.6,
    reviewCount: 89,
    description: "A modern beauty lounge specializing in skincare, makeup, and nail art. We use only cruelty-free and organic products.",
    priceRange: "$$",
    isOpen: true,
    services: [
      { id: "s5", name: "Facial Treatment", description: "Deep cleansing facial", price: 3500, duration: "60 min", category: "Skin" },
      { id: "s6", name: "Manicure & Pedicure", description: "Luxury mani-pedi combo", price: 2000, duration: "60 min", category: "Nails" },
      { id: "s7", name: "Makeup Application", description: "Professional makeup", price: 4000, duration: "45 min", category: "Makeup" },
    ],
    openingHours: [
      { day: "Monday", hours: "10:00 AM - 6:00 PM" },
      { day: "Tuesday", hours: "10:00 AM - 6:00 PM" },
      { day: "Wednesday", hours: "10:00 AM - 6:00 PM" },
      { day: "Thursday", hours: "10:00 AM - 7:00 PM" },
      { day: "Friday", hours: "10:00 AM - 7:00 PM" },
      { day: "Saturday", hours: "9:00 AM - 5:00 PM" },
      { day: "Sunday", hours: "Closed" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=300&fit=crop",
    ],
    socialMedia: [{ platform: "Instagram", url: "#" }],
  },
  {
    id: "3",
    name: "The Gentleman's Cut",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop",
    logo: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=100&h=100&fit=crop",
    location: "Kandy",
    address: "78 Peradeniya Road, Kandy",
    phone: "+94 76 456 7890",
    email: "book@gentlemanscut.lk",
    rating: 4.9,
    reviewCount: 210,
    description: "Classic barbershop with a modern twist. Specializing in men's grooming, beard styling, and hot towel shaves.",
    priceRange: "$$",
    isOpen: false,
    services: [
      { id: "s8", name: "Classic Haircut", description: "Traditional cut with hot towel", price: 1500, duration: "30 min", category: "Hair" },
      { id: "s9", name: "Beard Trim & Shape", description: "Precision beard styling", price: 800, duration: "20 min", category: "Grooming" },
      { id: "s10", name: "Hot Towel Shave", description: "Old-school straight razor shave", price: 1200, duration: "30 min", category: "Grooming" },
    ],
    openingHours: [
      { day: "Monday", hours: "8:00 AM - 6:00 PM" },
      { day: "Tuesday", hours: "8:00 AM - 6:00 PM" },
      { day: "Wednesday", hours: "8:00 AM - 6:00 PM" },
      { day: "Thursday", hours: "8:00 AM - 6:00 PM" },
      { day: "Friday", hours: "8:00 AM - 7:00 PM" },
      { day: "Saturday", hours: "8:00 AM - 5:00 PM" },
      { day: "Sunday", hours: "9:00 AM - 2:00 PM" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop",
    ],
    socialMedia: [{ platform: "Facebook", url: "#" }],
  },
  {
    id: "4",
    name: "Serenity Spa & Salon",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600&h=400&fit=crop",
    logo: "https://images.unsplash.com/photo-1519823551278-64ac92734314?w=100&h=100&fit=crop",
    location: "Mount Lavinia",
    address: "25 Hotel Road, Mount Lavinia",
    phone: "+94 77 567 8901",
    email: "relax@serenityspa.lk",
    rating: 4.7,
    reviewCount: 156,
    description: "Full-service spa and salon offering a complete range of beauty and wellness treatments in a peaceful oceanside setting.",
    priceRange: "$$$",
    isOpen: true,
    services: [
      { id: "s11", name: "Swedish Massage", description: "Full body relaxation massage", price: 6000, duration: "60 min", category: "Spa" },
      { id: "s12", name: "Hair Spa Treatment", description: "Deep conditioning hair spa", price: 3500, duration: "45 min", category: "Hair" },
      { id: "s13", name: "Gel Nails", description: "Long-lasting gel nail art", price: 2500, duration: "45 min", category: "Nails" },
      { id: "s14", name: "Body Scrub", description: "Exfoliating full body scrub", price: 4500, duration: "45 min", category: "Spa" },
    ],
    openingHours: [
      { day: "Monday", hours: "9:00 AM - 8:00 PM" },
      { day: "Tuesday", hours: "9:00 AM - 8:00 PM" },
      { day: "Wednesday", hours: "9:00 AM - 8:00 PM" },
      { day: "Thursday", hours: "9:00 AM - 8:00 PM" },
      { day: "Friday", hours: "9:00 AM - 9:00 PM" },
      { day: "Saturday", hours: "8:00 AM - 9:00 PM" },
      { day: "Sunday", hours: "10:00 AM - 6:00 PM" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1519823551278-64ac92734314?w=400&h=300&fit=crop",
    ],
    socialMedia: [
      { platform: "Instagram", url: "#" },
      { platform: "Facebook", url: "#" },
    ],
  },
];
