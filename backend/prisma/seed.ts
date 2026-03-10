import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Temples & Shrines", slug: "temples-shrines", emoji: "🛕", color: "#E67E22" },
  { name: "Restaurants", slug: "restaurants", emoji: "🍽️", color: "#E74C3C" },
  { name: "Cafes", slug: "cafes", emoji: "☕", color: "#8B4513" },
  { name: "Parks & Gardens", slug: "parks-gardens", emoji: "🌳", color: "#27AE60" },
  { name: "Museums", slug: "museums", emoji: "🏛️", color: "#8E44AD" },
  { name: "Shopping", slug: "shopping", emoji: "🛍️", color: "#F39C12" },
  { name: "Nightlife", slug: "nightlife", emoji: "🌙", color: "#2C3E50" },
  { name: "Street Food", slug: "street-food", emoji: "🥘", color: "#D35400" },
  { name: "Hotels & Stays", slug: "hotels-stays", emoji: "🏨", color: "#2980B9" },
  { name: "Adventure", slug: "adventure", emoji: "🧗", color: "#16A085" },
  { name: "Historical Sites", slug: "historical-sites", emoji: "🏰", color: "#7F8C8D" },
  { name: "Art & Culture", slug: "art-culture", emoji: "🎨", color: "#9B59B6" },
  { name: "Wellness & Spa", slug: "wellness-spa", emoji: "💆", color: "#1ABC9C" },
  { name: "Markets", slug: "markets", emoji: "🏪", color: "#E74C3C" },
  { name: "Viewpoints", slug: "viewpoints", emoji: "🌄", color: "#3498DB" },
];

const tags = [
  { name: "Family Friendly", slug: "family-friendly" },
  { name: "Budget", slug: "budget" },
  { name: "Luxury", slug: "luxury" },
  { name: "Wheelchair Accessible", slug: "wheelchair-accessible" },
  { name: "Pet Friendly", slug: "pet-friendly" },
  { name: "Open Late", slug: "open-late" },
  { name: "Vegetarian", slug: "vegetarian" },
  { name: "Hidden Gem", slug: "hidden-gem" },
  { name: "Instagram Worthy", slug: "instagram-worthy" },
  { name: "Local Favorite", slug: "local-favorite" },
];

async function main() {
  console.log("Seeding database...");

  // Upsert categories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, emoji: cat.emoji, color: cat.color },
      create: cat,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  // Upsert tags
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }
  console.log(`Seeded ${tags.length} tags`);

  // Upsert Mysore sample city
  const mysore = await prisma.city.upsert({
    where: { slug: "mysore" },
    update: {
      name: "Mysore",
      tagline: "The City of Palaces",
      status: "PUBLISHED",
      latitude: 12.2958,
      longitude: 76.6394,
      timezone: "Asia/Kolkata",
    },
    create: {
      name: "Mysore",
      slug: "mysore",
      tagline: "The City of Palaces",
      status: "PUBLISHED",
      latitude: 12.2958,
      longitude: 76.6394,
      timezone: "Asia/Kolkata",
    },
  });

  // Upsert Mysore theme
  await prisma.cityTheme.upsert({
    where: { cityId: mysore.id },
    update: {
      primaryColor: "#4A0E78",
      secondaryColor: "#D4A843",
    },
    create: {
      cityId: mysore.id,
      primaryColor: "#4A0E78",
      secondaryColor: "#D4A843",
    },
  });

  console.log("Seeded Mysore city with purple/gold theme");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
