import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const CITY_ID = 'cmmkdx1aa0014kb4a0nnvhbqa';

const WEEKDAY_HOURS = {
  mon: '9:00-17:30',
  tue: '9:00-17:30',
  wed: '9:00-17:30',
  thu: '9:00-17:30',
  fri: '9:00-17:30',
  sat: '9:00-17:30',
  sun: '9:00-17:30',
};

const RESTAURANT_HOURS = {
  mon: '7:00-22:00',
  tue: '7:00-22:00',
  wed: '7:00-22:00',
  thu: '7:00-22:00',
  fri: '7:00-22:00',
  sat: '7:00-22:00',
  sun: '7:00-22:00',
};

const MARKET_HOURS = {
  mon: '6:00-21:00',
  tue: '6:00-21:00',
  wed: '6:00-21:00',
  thu: '6:00-21:00',
  fri: '6:00-21:00',
  sat: '6:00-21:00',
  sun: '6:00-21:00',
};

async function main() {
  console.log('Seeding Mysore data...\n');

  // =========================================================================
  // 1. Publish Mysore
  // =========================================================================
  const mysore = await prisma.city.update({
    where: { id: CITY_ID },
    data: { status: 'PUBLISHED' },
  });
  console.log(`Published city: ${mysore.name} (${mysore.id})`);

  // =========================================================================
  // 2. Get category IDs by slug
  // =========================================================================
  const categories = await prisma.category.findMany({
    where: { isGlobal: true, cityId: null },
  });

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  const requiredSlugs = [
    'temples-shrines',
    'forts-palaces',
    'parks-gardens',
    'museums',
    'markets-bazaars',
    'restaurants',
    'cafes',
    'street-food',
    'viewpoints',
  ];

  for (const slug of requiredSlugs) {
    if (!catMap.has(slug)) {
      throw new Error(`Missing required category: ${slug}. Run the base seed first.`);
    }
  }

  console.log(`Found ${categories.length} categories`);

  // =========================================================================
  // 3. Get tag IDs
  // =========================================================================
  const tags = await prisma.tag.findMany();
  const tagMap = new Map(tags.map((t) => [t.slug, t.id]));
  console.log(`Found ${tags.length} tags`);

  // =========================================================================
  // 4. Create or find admin user
  // =========================================================================
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@localguide.app',
        name: 'Local Guide Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Created admin user: ${adminUser.id}`);
  } else {
    console.log(`Using existing admin user: ${adminUser.id}`);
  }

  // =========================================================================
  // 5. Define POIs
  // =========================================================================
  const poiData = [
    // --- Temples & Shrines ---
    {
      name: 'Chamundeshwari Temple',
      slug: 'chamundeshwari-temple',
      categorySlug: 'temples-shrines',
      latitude: 12.2724,
      longitude: 76.671,
      shortDescription:
        'Ancient hilltop temple dedicated to Goddess Chamundeshwari, the patron deity of Mysore.',
      longDescription:
        'Perched atop the 1,065-meter Chamundi Hill, this temple has been a center of worship for over a thousand years. The temple was patronized by the Mysore Maharajas and features a magnificent 40-meter gopuram (tower gateway). The climb of 1,008 steps to the summit passes the iconic Nandi Bull statue, one of the largest in India. The temple offers breathtaking panoramic views of Mysore city below.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '7:30-14:00, 15:30-18:00', tue: '7:30-14:00, 15:30-18:00', wed: '7:30-14:00, 15:30-18:00', thu: '7:30-14:00, 15:30-18:00', fri: '7:30-14:00, 15:30-18:00', sat: '7:30-14:00, 15:30-18:00', sun: '7:30-14:00, 15:30-18:00' },
      localTip:
        'Visit early morning to avoid crowds. The drive up is scenic, but climbing the 1,008 steps is a rewarding experience. Stop at the massive Nandi Bull statue at step 700.',
      address: 'Chamundi Hill, Mysuru, Karnataka 570010',
      priority: 'MUST_VISIT' as const,
      qualityScore: 92,
      dressCode: 'Conservative clothing recommended. Remove shoes before entering.',
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'photography'],
    },
    {
      name: "St. Philomena's Cathedral",
      slug: 'st-philomenas-cathedral',
      categorySlug: 'temples-shrines',
      latitude: 12.3185,
      longitude: 76.6556,
      shortDescription:
        'One of the tallest churches in Asia, built in Neo-Gothic style inspired by Cologne Cathedral.',
      longDescription:
        "St. Philomena's Cathedral, also known as St. Joseph's Cathedral, is a stunning Catholic church built between 1933 and 1941 under the patronage of Maharaja Krishnaraja Wadiyar IV. The cathedral features beautiful stained glass windows depicting scenes from the Bible, twin 175-foot spires, and a serene underground crypt believed to hold a relic of St. Philomena. The Neo-Gothic architecture is reminiscent of European cathedrals and makes it one of the most photographed landmarks in Mysore.",
      estimatedTimeToSpend: '30-45 minutes',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '5:00-18:00', tue: '5:00-18:00', wed: '5:00-18:00', thu: '5:00-18:00', fri: '5:00-18:00', sat: '5:00-18:00', sun: '5:00-18:00' },
      localTip:
        'The cathedral is beautifully lit in the evenings. Photography inside is allowed but be respectful of worshippers.',
      address: 'Lashkar Mohalla, Mysuru, Karnataka 570001',
      priority: 'RECOMMENDED' as const,
      qualityScore: 85,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'photography', 'free-entry'],
    },
    {
      name: 'Nanjundeshwara Temple',
      slug: 'nanjundeshwara-temple',
      categorySlug: 'temples-shrines',
      latitude: 12.2269,
      longitude: 76.6848,
      shortDescription:
        'Ancient Shiva temple in Nanjangud, known as the Dakshina Kashi (Varanasi of the South).',
      longDescription:
        'Located about 25 km from Mysore in the town of Nanjangud, this magnificent temple dedicated to Lord Shiva dates back to the Ganga dynasty period. The temple is set on the banks of the Kapila River and is renowned for its intricate Dravidian architecture. It houses a beautiful idol of Nanjundeshwara (Lord Shiva who drank poison). The annual Nanjangud car festival attracts thousands of devotees.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '6:00-13:00, 16:00-20:30', tue: '6:00-13:00, 16:00-20:30', wed: '6:00-13:00, 16:00-20:30', thu: '6:00-13:00, 16:00-20:30', fri: '6:00-13:00, 16:00-20:30', sat: '6:00-13:00, 16:00-20:30', sun: '6:00-13:00, 16:00-20:30' },
      localTip:
        'Combine this trip with a visit to nearby Srirangapatna. Try the local banana chips sold outside the temple.',
      address: 'Nanjangud, Mysuru District, Karnataka 571301',
      priority: 'RECOMMENDED' as const,
      qualityScore: 78,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'free-entry'],
    },

    // --- Forts & Palaces ---
    {
      name: 'Mysore Palace',
      slug: 'mysore-palace',
      categorySlug: 'forts-palaces',
      latitude: 12.3052,
      longitude: 76.6552,
      shortDescription:
        'The crown jewel of Mysore - a magnificent Indo-Saracenic palace and the second most visited monument in India.',
      longDescription:
        'The Mysore Palace, also known as Amba Vilas Palace, is a historical palace and the official residence of the Wadiyar dynasty who ruled the Kingdom of Mysore from 1399 to 1950. The current structure was built between 1897 and 1912 after the old wooden palace was destroyed by fire. Designed by British architect Henry Irwin in the Indo-Saracenic style, it blends Hindu, Muslim, Rajput, and Gothic architectural elements. The palace is spectacularly illuminated with 97,000 light bulbs on Sundays and public holidays.',
      estimatedTimeToSpend: '2-3 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: '\u20B970 (Indians), \u20B9200 (Foreigners)',
      openingHours: { mon: '10:00-17:30', tue: '10:00-17:30', wed: '10:00-17:30', thu: '10:00-17:30', fri: '10:00-17:30', sat: '10:00-17:30', sun: '10:00-17:30' },
      localTip:
        'Visit on a Sunday evening to see the spectacular palace illumination from 7-7:45 PM. Audio guides are available and highly recommended. Cameras are not allowed inside the palace, but you can photograph the exterior.',
      address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru, Karnataka 570001',
      priority: 'MUST_VISIT' as const,
      qualityScore: 95,
      wheelchairAccessible: true,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'instagram-worthy', 'photography'],
    },
    {
      name: 'Jaganmohan Palace',
      slug: 'jaganmohan-palace',
      categorySlug: 'forts-palaces',
      latitude: 12.3058,
      longitude: 76.6518,
      shortDescription:
        'A royal palace turned into one of the finest art galleries in South India.',
      longDescription:
        'Built in 1861 as an alternative palace for the royal family, Jaganmohan Palace now houses the Sri Jayachamarajendra Art Gallery. The gallery contains a remarkable collection of artifacts including paintings by Raja Ravi Varma, traditional Mysore paintings, antique musical instruments, sculptures, and rare artifacts from the Wadiyar dynasty. The palace itself is a beautiful example of traditional Hindu architecture with ornate pillars and decorated ceilings.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: '\u20B920 (Indians), \u20B9100 (Foreigners)',
      openingHours: { mon: '8:30-17:30', tue: '8:30-17:30', wed: '8:30-17:30', thu: '8:30-17:30', fri: '8:30-17:30', sat: '8:30-17:30', sun: '8:30-17:30' },
      localTip:
        'Don\'t miss the famous painting of Goddess Saraswati by Raja Ravi Varma. This palace is much less crowded than the main Mysore Palace and equally beautiful inside.',
      address: 'Jaganmohan Palace Rd, Chamrajpura, Mysuru, Karnataka 570005',
      priority: 'RECOMMENDED' as const,
      qualityScore: 82,
      familyFriendly: true,
      tags: ['family-friendly', 'photography'],
    },
    {
      name: 'Lalitha Mahal Palace',
      slug: 'lalitha-mahal-palace',
      categorySlug: 'forts-palaces',
      latitude: 12.2935,
      longitude: 76.6659,
      shortDescription:
        'An opulent white palace modeled after St. Paul\'s Cathedral in London, now a heritage hotel.',
      longDescription:
        'Built in 1921 by Maharaja Krishnaraja Wadiyar IV for his European guests, Lalitha Mahal Palace is the second-largest palace in Mysore. Designed by E.W. Fritchley in a Renaissance style, it was inspired by St. Paul\'s Cathedral in London. The stunning white edifice with its grand dome, Italian marble interiors, and sweeping staircases epitomizes regal luxury. Now operated as a heritage hotel by ITDC, visitors can enjoy high tea or a meal in the grand dining hall even without a room booking.',
      estimatedTimeToSpend: '1 hour',
      bestTimeToVisit: 'EVENING' as const,
      entryFee: 'Free (exterior only)',
      openingHours: WEEKDAY_HOURS,
      localTip:
        'Even if you are not staying here, you can visit for high tea or a meal in the grand dining hall. The sunset views from the lawns are magnificent.',
      address: 'T. Narasipura Main Rd, Siddartha Nagar, Mysuru, Karnataka 570011',
      priority: 'RECOMMENDED' as const,
      qualityScore: 80,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['instagram-worthy', 'photography'],
    },

    // --- Parks & Gardens ---
    {
      name: 'Brindavan Gardens',
      slug: 'brindavan-gardens',
      categorySlug: 'parks-gardens',
      latitude: 12.4214,
      longitude: 76.5729,
      shortDescription:
        'Iconic terraced gardens below KRS Dam with spectacular musical fountains in the evening.',
      longDescription:
        'Brindavan Gardens is one of the most celebrated botanical gardens in India, built in 1932 across 60 acres below the Krishnaraja Sagar Dam. The terraced gardens feature symmetrical landscaping, lush lawns, and ornamental plants arranged in stunning patterns. The highlight is the musical fountain show in the evening, where water dances to light and music against the backdrop of the illuminated dam. A boating facility on the backwaters of the dam adds to the experience.',
      estimatedTimeToSpend: '2-3 hours',
      bestTimeToVisit: 'EVENING' as const,
      entryFee: '\u20B930 (Indians), \u20B9100 (Foreigners)',
      openingHours: { mon: '6:30-20:30', tue: '6:30-20:30', wed: '6:30-20:30', thu: '6:30-20:30', fri: '6:30-20:30', sat: '6:30-20:30', sun: '6:30-20:30' },
      localTip:
        'Arrive by 5:30 PM to walk through the gardens before the musical fountain show starts at 6:30 PM (7 PM on weekends). The drive from Mysore takes about 45 minutes.',
      address: 'KRS Dam, Srirangapatna Taluk, Mandya District, Karnataka 571607',
      priority: 'MUST_VISIT' as const,
      qualityScore: 90,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'instagram-worthy', 'romantic', 'photography'],
    },
    {
      name: 'Mysore Zoo',
      slug: 'mysore-zoo',
      categorySlug: 'parks-gardens',
      latitude: 12.3022,
      longitude: 76.6632,
      shortDescription:
        'One of the oldest and most well-maintained zoos in India, home to a wide variety of species.',
      longDescription:
        'Established in 1892 under the patronage of Maharaja Chamaraja Wadiyar, the Sri Chamarajendra Zoological Gardens is one of the oldest zoos in the world. Spread across 157 acres, the zoo houses over 1,500 animals representing 168 species. Notable inhabitants include white tigers, African elephants, giraffes, and gorillas. The zoo is beautifully landscaped with mature trees, making it a pleasant walk even beyond the animal exhibits. It is consistently rated as one of the best-maintained zoos in India.',
      estimatedTimeToSpend: '2-3 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: '\u20B9100 (Adults), \u20B920 (Children)',
      openingHours: { mon: 'Closed', tue: '8:30-17:30', wed: '8:30-17:30', thu: '8:30-17:30', fri: '8:30-17:30', sat: '8:30-17:30', sun: '8:30-17:30' },
      localTip:
        'Closed on Tuesdays. Visit in the morning when animals are most active. Carry water and snacks as options inside are limited. The zoo is right next to Karanji Lake.',
      address: 'Indiranagar, Mysuru, Karnataka 570010',
      priority: 'RECOMMENDED' as const,
      qualityScore: 88,
      wheelchairAccessible: true,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['family-friendly', 'accessible'],
    },
    {
      name: 'Karanji Lake Nature Park',
      slug: 'karanji-lake-nature-park',
      categorySlug: 'parks-gardens',
      latitude: 12.2976,
      longitude: 76.6647,
      shortDescription:
        'A serene nature park with India\'s largest walk-through aviary and a beautiful butterfly park.',
      longDescription:
        'Karanji Lake Nature Park is spread across the shores of the scenic Karanji Lake, right next to the Mysore Zoo. The park is home to India\'s largest walk-through aviary, where you can observe various bird species in a semi-natural habitat. The butterfly park features a glass dome housing hundreds of colorful butterflies. The lake itself attracts migratory birds, making it a paradise for birdwatchers. A pleasant walking trail circles the lake with observation towers for panoramic views.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: '\u20B950 (Adults), \u20B910 (Children)',
      openingHours: { mon: '8:30-17:30', tue: '8:30-17:30', wed: '8:30-17:30', thu: '8:30-17:30', fri: '8:30-17:30', sat: '8:30-17:30', sun: '8:30-17:30' },
      localTip:
        'Visit early morning for the best birdwatching. Combine with a trip to the adjacent Mysore Zoo. The butterfly park is best visited between 10 AM and 2 PM when butterflies are most active.',
      address: 'Karanji Lake, Indiranagar, Mysuru, Karnataka 570010',
      priority: 'RECOMMENDED' as const,
      qualityScore: 79,
      familyFriendly: true,
      tags: ['family-friendly', 'photography', 'budget-friendly'],
    },

    // --- Museums ---
    {
      name: 'Rail Museum',
      slug: 'rail-museum-mysore',
      categorySlug: 'museums',
      latitude: 12.2993,
      longitude: 76.6324,
      shortDescription:
        'An open-air museum showcasing the rich railway heritage of Mysore with vintage locomotives and coaches.',
      longDescription:
        'The Mysore Rail Museum, established in 1979, is one of the few rail museums in India. Spread across a compact area near the Mysore railway station, it houses a fascinating collection of vintage steam locomotives, royal saloon coaches used by the Maharajas of Mysore, and other railway memorabilia. Highlights include the Maharaja\'s ornate saloon car and a gallery of photographs documenting the history of railways in the Mysore region. A toy train ride around the museum is a delight for children.',
      estimatedTimeToSpend: '1-1.5 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: '\u20B920 (Adults), \u20B910 (Children)',
      openingHours: { mon: 'Closed', tue: '10:00-17:00', wed: '10:00-17:00', thu: '10:00-17:00', fri: '10:00-17:00', sat: '10:00-17:00', sun: '10:00-17:00' },
      localTip:
        'Closed on Mondays. The toy train ride is the highlight for kids. Photography is allowed. It\'s a quick visit and can be combined with the nearby KR Hospital area exploration.',
      address: 'KRS Rd, Yadavagiri, Mysuru, Karnataka 570020',
      priority: 'RECOMMENDED' as const,
      qualityScore: 72,
      familyFriendly: true,
      budgetFriendly: true,
      tags: ['family-friendly', 'budget-friendly'],
    },
    {
      name: 'Folklore Museum (Janapada Loka)',
      slug: 'folklore-museum-janapada-loka',
      categorySlug: 'museums',
      latitude: 12.3046,
      longitude: 76.6417,
      shortDescription:
        'A treasure trove of Karnataka folk culture with puppets, masks, costumes, and musical instruments.',
      longDescription:
        'Janapada Loka (World of Folklore) is a museum and cultural center dedicated to preserving and showcasing the rich folk traditions of Karnataka. The museum houses an extensive collection of folk artifacts including traditional puppets (togalu gombeyata), wooden masks, agricultural implements, ceremonial costumes, and over 5,000 folk musical instruments. The open-air amphitheater hosts occasional folk performances. It provides a deep insight into the rural and tribal life of Karnataka that most tourists never experience.',
      estimatedTimeToSpend: '1-1.5 hours',
      bestTimeToVisit: 'ANY_TIME' as const,
      entryFee: '\u20B930',
      openingHours: { mon: '9:00-17:30', tue: '9:00-17:30', wed: '9:00-17:30', thu: '9:00-17:30', fri: '9:00-17:30', sat: '9:00-17:30', sun: '9:00-17:30' },
      localTip:
        'Ask the staff for a guided tour - they are passionate about folk culture and share fascinating stories behind the exhibits. The puppet collection is world-class.',
      address: 'Jayalakshmi Vilas Rd, Mysuru, Karnataka 570006',
      priority: 'HIDDEN_GEM' as const,
      qualityScore: 76,
      familyFriendly: true,
      budgetFriendly: true,
      tags: ['family-friendly', 'hidden-gem', 'budget-friendly'],
    },
    {
      name: 'Sand Sculpture Museum',
      slug: 'sand-sculpture-museum',
      categorySlug: 'museums',
      latitude: 12.3125,
      longitude: 76.6598,
      shortDescription:
        'A unique museum featuring incredible sand sculptures depicting Indian mythology and culture.',
      longDescription:
        'This one-of-a-kind museum in Mysore showcases remarkable sand sculptures created by skilled artists. The sculptures depict scenes from Indian mythology, historical events, and cultural icons, all crafted entirely from sand. The museum provides an unusual and artistic experience that is quite different from typical museums. The intricate detailing of the sculptures is impressive, with some pieces standing several feet tall. It is a relatively recent addition to Mysore\'s cultural landscape and offers a refreshing alternative to the city\'s more traditional attractions.',
      estimatedTimeToSpend: '30-45 minutes',
      bestTimeToVisit: 'ANY_TIME' as const,
      entryFee: '\u20B950',
      openingHours: { mon: '9:00-18:00', tue: '9:00-18:00', wed: '9:00-18:00', thu: '9:00-18:00', fri: '9:00-18:00', sat: '9:00-18:00', sun: '9:00-18:00' },
      localTip:
        'Great for a quick visit between other attractions. The sculptures change periodically, so it\'s worth visiting even if you\'ve been before.',
      address: 'Devaraja Mohalla, Mysuru, Karnataka 570001',
      priority: 'HIDDEN_GEM' as const,
      qualityScore: 70,
      familyFriendly: true,
      tags: ['family-friendly', 'hidden-gem', 'instagram-worthy'],
    },

    // --- Markets & Bazaars ---
    {
      name: 'Devaraja Market',
      slug: 'devaraja-market',
      categorySlug: 'markets-bazaars',
      latitude: 12.3102,
      longitude: 76.6548,
      shortDescription:
        'Mysore\'s oldest and most vibrant market, over 130 years old, bursting with flowers, spices, and local produce.',
      longDescription:
        'Devaraja Market (also known as Dodda Market) has been the commercial heart of Mysore for over 130 years. This sprawling market stretches across several blocks and is divided into sections for vegetables, flowers, fruits, spices, and household goods. The flower section is particularly stunning, with mountains of jasmine, marigold, and roses creating a riot of colors and fragrances. The spice section offers the finest Mysore sandalwood products, silk, and the famous Mysore Pak sweet. Walking through the narrow lanes is a sensory overload in the best possible way.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: MARKET_HOURS,
      localTip:
        'Visit in the early morning when the flower vendors set up - the sight and smell is incredible. Bargain firmly but fairly. The back lanes have the best deals on spices and sandalwood products.',
      address: 'Dhanwanthri Rd, Devaraja Mohalla, Mysuru, Karnataka 570001',
      priority: 'MUST_VISIT' as const,
      qualityScore: 91,
      familyFriendly: true,
      budgetFriendly: true,
      tags: ['photography', 'budget-friendly', 'instagram-worthy'],
    },
    {
      name: 'Sayyaji Rao Road',
      slug: 'sayyaji-rao-road',
      categorySlug: 'markets-bazaars',
      latitude: 12.3073,
      longitude: 76.6535,
      shortDescription:
        'Mysore\'s premier shopping street lined with heritage buildings, silk shops, and traditional stores.',
      longDescription:
        'Sayyaji Rao Road is the main commercial artery of Mysore, stretching from the palace gates to the clock tower. This tree-lined boulevard is flanked by heritage buildings housing silk emporiums, sandalwood shops, bookstores, and traditional sweet shops. The road comes alive during Dasara celebrations when it is spectacularly illuminated. Notable stops include the Government Silk Factory showroom, Cauvery Arts & Crafts Emporium, and numerous stores selling Mysore\'s famous silk sarees and sandalwood products.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'AFTERNOON' as const,
      entryFee: 'Free',
      openingHours: { mon: '10:00-21:00', tue: '10:00-21:00', wed: '10:00-21:00', thu: '10:00-21:00', fri: '10:00-21:00', sat: '10:00-21:00', sun: '10:00-21:00' },
      localTip:
        'Visit the Government Silk Factory showroom for guaranteed genuine Mysore silk at fixed prices. The smaller shops offer room for bargaining. Try the Mysore Pak from any of the sweet shops along the road.',
      address: 'Sayyaji Rao Rd, Mysuru, Karnataka 570001',
      priority: 'RECOMMENDED' as const,
      qualityScore: 83,
      familyFriendly: true,
      tags: ['budget-friendly', 'family-friendly'],
    },

    // --- Restaurants & Cafes ---
    {
      name: 'Mylari Hotel',
      slug: 'mylari-hotel',
      categorySlug: 'restaurants',
      latitude: 12.3047,
      longitude: 76.6525,
      shortDescription:
        'Legendary hole-in-the-wall serving what many consider the best dosa in all of India since 1936.',
      longDescription:
        'Mylari Hotel has been serving its iconic butter dosa since 1936, and people from across the country make the pilgrimage to this tiny, no-frills eatery. The menu is famously limited - essentially just dosa with a side of spiced potato and coconut chutney. But what a dosa it is: paper-thin, crispy on the outside, soft on the inside, generously slathered with butter, and served with a coconut-based accompaniment that is addictively good. The restaurant is always packed, with queues snaking out the door during peak hours.',
      estimatedTimeToSpend: '30-45 minutes',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '6:00-12:30, 15:30-19:30', tue: '6:00-12:30, 15:30-19:30', wed: '6:00-12:30, 15:30-19:30', thu: '6:00-12:30, 15:30-19:30', fri: '6:00-12:30, 15:30-19:30', sat: '6:00-12:30, 15:30-19:30', sun: '6:00-12:30, 15:30-19:30' },
      localTip:
        'Go before 8 AM to avoid the queue. Order at least 3 dosas per person - they are small and you will want more. Cash only. The dosa is different from what you find anywhere else in India.',
      address: 'Nazarbad Main Rd, Nazarbad, Mysuru, Karnataka 570010',
      priority: 'HIDDEN_GEM' as const,
      qualityScore: 93,
      budgetFriendly: true,
      familyFriendly: true,
      tags: ['budget-friendly', 'hidden-gem', 'street-food'],
    },
    {
      name: 'Hotel RRR',
      slug: 'hotel-rrr',
      categorySlug: 'restaurants',
      latitude: 12.3068,
      longitude: 76.654,
      shortDescription:
        'A beloved local institution famous for its generous Andhra-style thali meals and non-veg curries.',
      longDescription:
        'Hotel RRR (Raghavendra Refreshments & Restaurant) is a Mysore institution, famous for its generous and delicious Andhra-style meals. The restaurant serves unlimited thali meals at incredibly reasonable prices. The non-vegetarian options are particularly celebrated, with the mutton and chicken curries being consistently excellent. The restaurant is always busy, which is a testament to the quality and value it offers. The ambiance is simple and functional - people come here purely for the food.',
      estimatedTimeToSpend: '45 minutes-1 hour',
      bestTimeToVisit: 'AFTERNOON' as const,
      entryFee: 'Free',
      openingHours: { mon: '12:00-15:30, 19:00-22:30', tue: '12:00-15:30, 19:00-22:30', wed: '12:00-15:30, 19:00-22:30', thu: '12:00-15:30, 19:00-22:30', fri: '12:00-15:30, 19:00-22:30', sat: '12:00-15:30, 19:00-22:30', sun: '12:00-15:30, 19:00-22:30' },
      localTip:
        'Arrive by 12:30 PM for lunch to get a table without waiting. The mutton biryani sells out fast. Ask for extra ghee on your rice - they\'re generous with it.',
      address: 'Gandhi Square, Mysuru, Karnataka 570001',
      priority: 'RECOMMENDED' as const,
      qualityScore: 85,
      budgetFriendly: true,
      familyFriendly: true,
      tags: ['budget-friendly', 'family-friendly'],
    },
    {
      name: 'Oyster Bay',
      slug: 'oyster-bay',
      categorySlug: 'restaurants',
      latitude: 12.2977,
      longitude: 76.6485,
      shortDescription:
        'An upscale multi-cuisine restaurant with a charming garden setting, perfect for a leisurely dinner.',
      longDescription:
        'Oyster Bay is one of Mysore\'s finest dining establishments, set in a beautifully restored heritage bungalow with a lush garden. The restaurant serves an eclectic menu spanning Indian, Continental, and Asian cuisines, with all dishes prepared with care and fresh ingredients. The ambiance is romantic and relaxed, with outdoor seating under fairy lights in the garden. The bar offers a well-curated selection of cocktails and wines. It is the perfect place for a special dinner in Mysore.',
      estimatedTimeToSpend: '1.5-2 hours',
      bestTimeToVisit: 'EVENING' as const,
      entryFee: 'Free',
      openingHours: { mon: '12:00-15:00, 18:30-22:30', tue: '12:00-15:00, 18:30-22:30', wed: '12:00-15:00, 18:30-22:30', thu: '12:00-15:00, 18:30-22:30', fri: '12:00-15:00, 18:30-22:30', sat: '12:00-15:00, 18:30-22:30', sun: '12:00-15:00, 18:30-22:30' },
      localTip:
        'Reserve a garden table for dinner - the ambiance under the stars is lovely. Try the grilled fish and the butter garlic prawns. Weekends get busy, book ahead.',
      address: 'Sri Harsha Rd, Lakshmipuram, Mysuru, Karnataka 570004',
      priority: 'RECOMMENDED' as const,
      qualityScore: 81,
      familyFriendly: true,
      tags: ['romantic', 'instagram-worthy'],
    },
    {
      name: 'Depth N Green',
      slug: 'depth-n-green',
      categorySlug: 'cafes',
      latitude: 12.3145,
      longitude: 76.6438,
      shortDescription:
        'A trendy, Instagram-worthy cafe with artisanal coffee, healthy bowls, and a cozy reading corner.',
      longDescription:
        'Depth N Green is Mysore\'s hippest cafe, beloved by locals and digital nomads alike. The space is beautifully designed with exposed brick walls, hanging plants, and warm wooden furniture. The menu features specialty single-origin coffees, artisanal teas, smoothie bowls, and a selection of light meals with a health-conscious twist. The cafe also sells books, organic products, and quirky stationery. Free Wi-Fi and comfortable seating make it perfect for working or spending a lazy afternoon.',
      estimatedTimeToSpend: '1-2 hours',
      bestTimeToVisit: 'AFTERNOON' as const,
      entryFee: 'Free',
      openingHours: { mon: '9:00-21:00', tue: '9:00-21:00', wed: '9:00-21:00', thu: '9:00-21:00', fri: '9:00-21:00', sat: '9:00-21:00', sun: '9:00-21:00' },
      localTip:
        'Try the filter coffee made with locally roasted beans. The avocado toast and acai bowl are Instagram favorites. Best time for photos is late afternoon when the light streams through the windows.',
      address: 'Gokulam Main Rd, Gokulam, Mysuru, Karnataka 570002',
      priority: 'RECOMMENDED' as const,
      qualityScore: 77,
      wifiAvailable: true,
      familyFriendly: true,
      tags: ['instagram-worthy', 'photography'],
    },

    // --- Viewpoints ---
    {
      name: 'Chamundi Hill Viewpoint',
      slug: 'chamundi-hill-viewpoint',
      categorySlug: 'viewpoints',
      latitude: 12.2735,
      longitude: 76.6705,
      shortDescription:
        'A panoramic viewpoint at the top of Chamundi Hill offering sweeping views of the entire Mysore city.',
      longDescription:
        'The viewpoint at the summit of Chamundi Hill provides one of the most spectacular panoramic vistas in Karnataka. From 1,065 meters above sea level, you can see the entire city of Mysore spread out below, with the Mysore Palace clearly visible, surrounded by the city\'s grid of streets and the lush green countryside beyond. On clear days, the view extends to the Nilgiri Hills in the distance. Sunrise and sunset are particularly magical, with the city bathed in golden light. The viewpoint is adjacent to the Chamundeshwari Temple, making it easy to combine both attractions.',
      estimatedTimeToSpend: '30-45 minutes',
      bestTimeToVisit: 'EARLY_MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '6:00-21:00', tue: '6:00-21:00', wed: '6:00-21:00', thu: '6:00-21:00', fri: '6:00-21:00', sat: '6:00-21:00', sun: '6:00-21:00' },
      localTip:
        'Come for sunrise - the view of the city waking up with the palace glowing golden is unforgettable. On Sunday evenings, you can see the palace illumination from here. Bring a telephoto lens for the best photos.',
      address: 'Chamundi Hill Summit, Mysuru, Karnataka 570010',
      priority: 'MUST_VISIT' as const,
      qualityScore: 90,
      parkingAvailable: true,
      familyFriendly: true,
      tags: ['photography', 'instagram-worthy', 'free-entry', 'romantic'],
    },

    // --- Street Food ---
    {
      name: 'Guru Sweet Mart (Original Mysore Pak)',
      slug: 'guru-sweet-mart-mysore-pak',
      categorySlug: 'street-food',
      latitude: 12.3088,
      longitude: 76.6552,
      shortDescription:
        'The legendary sweet shop claiming to serve the original Mysore Pak recipe from the royal kitchens.',
      longDescription:
        'Guru Sweet Mart is a pilgrimage site for sweet lovers. This humble shop claims to carry forward the original recipe of Mysore Pak, the iconic sweet invented in the royal kitchens of the Mysore Palace. The Mysore Pak here is made fresh daily using generous amounts of ghee, gram flour, and sugar - the result is a melt-in-your-mouth delicacy with a rich, buttery texture that is distinctly different from the Mysore Pak found elsewhere. The shop also sells other traditional South Indian sweets and savories.',
      estimatedTimeToSpend: '15-30 minutes',
      bestTimeToVisit: 'MORNING' as const,
      entryFee: 'Free',
      openingHours: { mon: '8:00-20:30', tue: '8:00-20:30', wed: '8:00-20:30', thu: '8:00-20:30', fri: '8:00-20:30', sat: '8:00-20:30', sun: '8:00-20:30' },
      localTip:
        'Buy the soft Mysore Pak (melt-in-mouth variety) rather than the hard one. Eat it fresh and warm for the best experience. Buy extra to take home - it stays good for 2-3 days. Cash only.',
      address: 'Sayyaji Rao Rd, Devaraja Mohalla, Mysuru, Karnataka 570001',
      priority: 'HIDDEN_GEM' as const,
      qualityScore: 88,
      budgetFriendly: true,
      familyFriendly: true,
      tags: ['street-food', 'hidden-gem', 'budget-friendly'],
    },
  ];

  // =========================================================================
  // 6. Create POIs
  // =========================================================================
  const createdPOIs = new Map<string, string>(); // slug -> id

  for (const poi of poiData) {
    const categoryId = catMap.get(poi.categorySlug);
    if (!categoryId) {
      console.error(`Category not found for slug: ${poi.categorySlug}`);
      continue;
    }

    const existingPOI = await prisma.pOI.findUnique({
      where: { cityId_slug: { cityId: CITY_ID, slug: poi.slug } },
    });

    if (existingPOI) {
      console.log(`  POI already exists: ${poi.name} - updating...`);
      await prisma.pOI.update({
        where: { id: existingPOI.id },
        data: {
          name: poi.name,
          shortDescription: poi.shortDescription,
          longDescription: poi.longDescription,
          latitude: poi.latitude,
          longitude: poi.longitude,
          categoryId,
          estimatedTimeToSpend: poi.estimatedTimeToSpend,
          bestTimeToVisit: poi.bestTimeToVisit,
          entryFee: poi.entryFee,
          openingHours: poi.openingHours,
          localTip: poi.localTip,
          address: poi.address,
          priority: poi.priority,
          qualityScore: poi.qualityScore,
          status: 'PUBLISHED',
          dressCode: poi.dressCode ?? null,
          parkingAvailable: poi.parkingAvailable ?? false,
          wheelchairAccessible: poi.wheelchairAccessible ?? false,
          wifiAvailable: poi.wifiAvailable ?? false,
          budgetFriendly: poi.budgetFriendly ?? false,
          familyFriendly: poi.familyFriendly ?? true,
        },
      });
      createdPOIs.set(poi.slug, existingPOI.id);
    } else {
      const newPOI = await prisma.pOI.create({
        data: {
          cityId: CITY_ID,
          slug: poi.slug,
          name: poi.name,
          shortDescription: poi.shortDescription,
          longDescription: poi.longDescription,
          latitude: poi.latitude,
          longitude: poi.longitude,
          categoryId,
          estimatedTimeToSpend: poi.estimatedTimeToSpend,
          bestTimeToVisit: poi.bestTimeToVisit,
          entryFee: poi.entryFee,
          openingHours: poi.openingHours,
          localTip: poi.localTip,
          address: poi.address,
          priority: poi.priority,
          qualityScore: poi.qualityScore,
          status: 'PUBLISHED',
          dressCode: poi.dressCode ?? null,
          parkingAvailable: poi.parkingAvailable ?? false,
          wheelchairAccessible: poi.wheelchairAccessible ?? false,
          wifiAvailable: poi.wifiAvailable ?? false,
          budgetFriendly: poi.budgetFriendly ?? false,
          familyFriendly: poi.familyFriendly ?? true,
        },
      });
      createdPOIs.set(poi.slug, newPOI.id);
      console.log(`  Created POI: ${poi.name}`);
    }

    // Add tags
    const poiId = createdPOIs.get(poi.slug)!;
    for (const tagSlug of poi.tags ?? []) {
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        await prisma.tagsOnPOIs.upsert({
          where: { poiId_tagId: { poiId, tagId } },
          update: {},
          create: { poiId, tagId },
        });
      }
    }
  }

  console.log(`\nCreated/updated ${createdPOIs.size} POIs`);

  // =========================================================================
  // 7. Add photos for each POI
  // =========================================================================
  const photoData: Record<string, { url: string; caption: string }[]> = {
    'chamundeshwari-temple': [
      { url: 'https://placehold.co/800x600/E74C3C/FFFFFF?text=Chamundeshwari+Temple', caption: 'Chamundeshwari Temple atop Chamundi Hill' },
      { url: 'https://placehold.co/800x600/C0392B/FFFFFF?text=Nandi+Bull+Statue', caption: 'Giant Nandi Bull statue on the steps to the temple' },
    ],
    'st-philomenas-cathedral': [
      { url: 'https://placehold.co/800x600/2980B9/FFFFFF?text=St+Philomenas+Cathedral', caption: 'The twin Gothic spires of St. Philomena\'s Cathedral' },
      { url: 'https://placehold.co/800x600/3498DB/FFFFFF?text=Cathedral+Interior', caption: 'Beautiful stained glass windows inside the cathedral' },
    ],
    'nanjundeshwara-temple': [
      { url: 'https://placehold.co/800x600/E74C3C/FFFFFF?text=Nanjundeshwara+Temple', caption: 'Ancient Nanjundeshwara Temple in Nanjangud' },
    ],
    'mysore-palace': [
      { url: 'https://placehold.co/800x600/4A0E4E/FFFFFF?text=Mysore+Palace', caption: 'The magnificent Mysore Palace in daylight' },
      { url: 'https://placehold.co/800x600/D4AF37/FFFFFF?text=Palace+Illumination', caption: 'Mysore Palace illuminated with 97,000 bulbs on Sunday evening' },
    ],
    'jaganmohan-palace': [
      { url: 'https://placehold.co/800x600/8E44AD/FFFFFF?text=Jaganmohan+Palace', caption: 'Jaganmohan Palace housing the Art Gallery' },
      { url: 'https://placehold.co/800x600/9B59B6/FFFFFF?text=Art+Gallery', caption: 'Inside the Sri Jayachamarajendra Art Gallery' },
    ],
    'lalitha-mahal-palace': [
      { url: 'https://placehold.co/800x600/ECF0F1/333333?text=Lalitha+Mahal+Palace', caption: 'The stunning white Lalitha Mahal Palace' },
      { url: 'https://placehold.co/800x600/BDC3C7/333333?text=Palace+Dome', caption: 'Renaissance-style dome of Lalitha Mahal' },
    ],
    'brindavan-gardens': [
      { url: 'https://placehold.co/800x600/27AE60/FFFFFF?text=Brindavan+Gardens', caption: 'Terraced gardens at Brindavan Gardens' },
      { url: 'https://placehold.co/800x600/2ECC71/FFFFFF?text=Musical+Fountain', caption: 'The spectacular musical fountain show in the evening' },
    ],
    'mysore-zoo': [
      { url: 'https://placehold.co/800x600/4CAF50/FFFFFF?text=Mysore+Zoo', caption: 'Entrance to the Sri Chamarajendra Zoological Gardens' },
      { url: 'https://placehold.co/800x600/388E3C/FFFFFF?text=Zoo+Gardens', caption: 'Beautifully landscaped paths inside the zoo' },
    ],
    'karanji-lake-nature-park': [
      { url: 'https://placehold.co/800x600/0288D1/FFFFFF?text=Karanji+Lake', caption: 'Scenic view of Karanji Lake' },
      { url: 'https://placehold.co/800x600/0097A7/FFFFFF?text=Butterfly+Park', caption: 'The walk-through butterfly park' },
    ],
    'rail-museum-mysore': [
      { url: 'https://placehold.co/800x600/607D8B/FFFFFF?text=Rail+Museum', caption: 'Vintage locomotive at the Mysore Rail Museum' },
    ],
    'folklore-museum-janapada-loka': [
      { url: 'https://placehold.co/800x600/FF9800/FFFFFF?text=Folklore+Museum', caption: 'Traditional puppets at Janapada Loka' },
    ],
    'sand-sculpture-museum': [
      { url: 'https://placehold.co/800x600/795548/FFFFFF?text=Sand+Sculptures', caption: 'Intricate sand sculptures depicting Indian mythology' },
    ],
    'devaraja-market': [
      { url: 'https://placehold.co/800x600/F39C12/FFFFFF?text=Devaraja+Market', caption: 'Colorful flower stalls at Devaraja Market' },
      { url: 'https://placehold.co/800x600/E67E22/FFFFFF?text=Spice+Market', caption: 'Aromatic spice section of the market' },
    ],
    'sayyaji-rao-road': [
      { url: 'https://placehold.co/800x600/F1C40F/333333?text=Sayyaji+Rao+Road', caption: 'Heritage buildings along Sayyaji Rao Road' },
    ],
    'mylari-hotel': [
      { url: 'https://placehold.co/800x600/FF5722/FFFFFF?text=Mylari+Dosa', caption: 'The legendary Mylari butter dosa' },
      { url: 'https://placehold.co/800x600/E64A19/FFFFFF?text=Mylari+Hotel', caption: 'The humble exterior of Mylari Hotel' },
    ],
    'hotel-rrr': [
      { url: 'https://placehold.co/800x600/E67E22/FFFFFF?text=Hotel+RRR+Thali', caption: 'Generous Andhra-style thali meal at Hotel RRR' },
    ],
    'oyster-bay': [
      { url: 'https://placehold.co/800x600/1ABC9C/FFFFFF?text=Oyster+Bay', caption: 'Garden dining at Oyster Bay' },
    ],
    'depth-n-green': [
      { url: 'https://placehold.co/800x600/8BC34A/FFFFFF?text=Depth+N+Green', caption: 'The cozy, Instagram-worthy interior of Depth N Green' },
      { url: 'https://placehold.co/800x600/689F38/FFFFFF?text=Artisanal+Coffee', caption: 'Specialty coffee and smoothie bowls' },
    ],
    'chamundi-hill-viewpoint': [
      { url: 'https://placehold.co/800x600/4CAF50/FFFFFF?text=Chamundi+Hill+View', caption: 'Panoramic view of Mysore city from Chamundi Hill' },
      { url: 'https://placehold.co/800x600/2E7D32/FFFFFF?text=Sunrise+View', caption: 'Sunrise over Mysore as seen from the hilltop' },
    ],
    'guru-sweet-mart-mysore-pak': [
      { url: 'https://placehold.co/800x600/FFC107/333333?text=Mysore+Pak', caption: 'Fresh, melt-in-mouth Mysore Pak at Guru Sweet Mart' },
      { url: 'https://placehold.co/800x600/FFB300/333333?text=Sweet+Shop', caption: 'Traditional sweets display at Guru Sweet Mart' },
    ],
  };

  for (const [poiSlug, photos] of Object.entries(photoData)) {
    const poiId = createdPOIs.get(poiSlug);
    if (!poiId) continue;

    // Delete existing photos for this POI to avoid duplicates
    await prisma.pOIPhoto.deleteMany({ where: { poiId } });

    for (const [index, photo] of photos.entries()) {
      await prisma.pOIPhoto.create({
        data: {
          poiId,
          url: photo.url,
          caption: photo.caption,
          isPrimary: index === 0,
          sortOrder: index,
          source: 'seed-data',
        },
      });
    }
  }

  console.log('Added photos for all POIs');

  // =========================================================================
  // 8. Create Itineraries
  // =========================================================================

  // --- Itinerary 1: One Perfect Day in Mysore ---
  const itinerary1Slug = 'one-perfect-day-in-mysore';
  const existingItinerary1 = await prisma.itinerary.findUnique({
    where: { cityId_slug: { cityId: CITY_ID, slug: itinerary1Slug } },
  });

  let itinerary1Id: string;
  if (existingItinerary1) {
    await prisma.itineraryStop.deleteMany({ where: { itineraryId: existingItinerary1.id } });
    await prisma.itinerary.update({
      where: { id: existingItinerary1.id },
      data: {
        title: 'One Perfect Day in Mysore',
        description:
          'Experience the best of Mysore in a single day - from hilltop temples to royal palaces, bustling markets, legendary dosas, and magical evening gardens. This itinerary covers all the essential highlights while leaving room for spontaneous exploration.',
        duration: '1 day',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/4A0E4E/D4AF37?text=One+Perfect+Day+in+Mysore',
        difficulty: 'Moderate',
        estimatedBudget: '\u20B91,500-2,500 per person',
      },
    });
    itinerary1Id = existingItinerary1.id;
    console.log('Updated itinerary: One Perfect Day in Mysore');
  } else {
    const newItinerary1 = await prisma.itinerary.create({
      data: {
        cityId: CITY_ID,
        slug: itinerary1Slug,
        title: 'One Perfect Day in Mysore',
        description:
          'Experience the best of Mysore in a single day - from hilltop temples to royal palaces, bustling markets, legendary dosas, and magical evening gardens. This itinerary covers all the essential highlights while leaving room for spontaneous exploration.',
        duration: '1 day',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/4A0E4E/D4AF37?text=One+Perfect+Day+in+Mysore',
        difficulty: 'Moderate',
        estimatedBudget: '\u20B91,500-2,500 per person',
        createdById: adminUser.id,
      },
    });
    itinerary1Id = newItinerary1.id;
    console.log('Created itinerary: One Perfect Day in Mysore');
  }

  const itinerary1Stops = [
    {
      poiSlug: 'chamundi-hill-viewpoint',
      order: 1,
      timeOfDay: 'EARLY_MORNING' as const,
      duration: '1 hour',
      note: 'Start the day with a sunrise visit to Chamundi Hill. Take in the panoramic views of the city waking up below, then visit the Chamundeshwari Temple adjacent.',
      transportToNext: 'AUTO_RICKSHAW' as const,
      transportNote: '20-minute drive downhill to the city center',
    },
    {
      poiSlug: 'mysore-palace',
      order: 2,
      timeOfDay: 'MORNING' as const,
      duration: '2 hours',
      note: 'Explore the magnificent Mysore Palace at leisure. Consider hiring an audio guide for the full experience. Remember, cameras are not allowed inside.',
      transportToNext: 'WALK' as const,
      transportNote: '5-minute walk',
    },
    {
      poiSlug: 'devaraja-market',
      order: 3,
      timeOfDay: 'AFTERNOON' as const,
      duration: '1 hour',
      note: 'Wander through the colorful lanes of this 130-year-old market. Don\'t miss the flower section and pick up some Mysore sandalwood products.',
      transportToNext: 'WALK' as const,
      transportNote: '3-minute walk',
    },
    {
      poiSlug: 'mylari-hotel',
      order: 4,
      timeOfDay: 'AFTERNOON' as const,
      duration: '30 minutes',
      note: 'Enjoy a late lunch of legendary Mylari dosas. Simple, buttery, and unforgettable. Order at least 3 per person.',
      transportToNext: 'AUTO_RICKSHAW' as const,
      transportNote: '5-minute ride',
    },
    {
      poiSlug: 'jaganmohan-palace',
      order: 5,
      timeOfDay: 'AFTERNOON' as const,
      duration: '1 hour',
      note: 'Visit the art gallery housed in this beautiful palace. Much less crowded than the main palace, with a world-class collection of paintings.',
      transportToNext: 'TAXI' as const,
      transportNote: '45-minute drive to Brindavan Gardens',
    },
    {
      poiSlug: 'brindavan-gardens',
      order: 6,
      timeOfDay: 'EVENING' as const,
      duration: '2 hours',
      note: 'End the day with the magical musical fountain show at Brindavan Gardens. Arrive by 5:30 PM to explore the terraced gardens before the show starts.',
      transportToNext: 'NONE' as const,
      transportNote: null,
    },
  ];

  for (const stop of itinerary1Stops) {
    const poiId = createdPOIs.get(stop.poiSlug);
    if (!poiId) {
      console.error(`POI not found for itinerary stop: ${stop.poiSlug}`);
      continue;
    }
    await prisma.itineraryStop.create({
      data: {
        itineraryId: itinerary1Id,
        poiId,
        order: stop.order,
        timeOfDay: stop.timeOfDay,
        duration: stop.duration,
        note: stop.note,
        transportToNext: stop.transportToNext,
        transportNote: stop.transportNote,
      },
    });
  }

  // --- Itinerary 2: Mysore Foodie Trail ---
  const itinerary2Slug = 'mysore-foodie-trail';
  const existingItinerary2 = await prisma.itinerary.findUnique({
    where: { cityId_slug: { cityId: CITY_ID, slug: itinerary2Slug } },
  });

  let itinerary2Id: string;
  if (existingItinerary2) {
    await prisma.itineraryStop.deleteMany({ where: { itineraryId: existingItinerary2.id } });
    await prisma.itinerary.update({
      where: { id: existingItinerary2.id },
      data: {
        title: 'Mysore Foodie Trail',
        description:
          'A culinary journey through Mysore\'s best eateries, from legendary dosa joints to traditional sweet shops. This half-day trail covers the must-eat spots that define Mysore\'s food identity.',
        duration: 'Half day',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/FF5722/FFFFFF?text=Mysore+Foodie+Trail',
        difficulty: 'Easy',
        estimatedBudget: '\u20B9500-800 per person',
      },
    });
    itinerary2Id = existingItinerary2.id;
    console.log('Updated itinerary: Mysore Foodie Trail');
  } else {
    const newItinerary2 = await prisma.itinerary.create({
      data: {
        cityId: CITY_ID,
        slug: itinerary2Slug,
        title: 'Mysore Foodie Trail',
        description:
          'A culinary journey through Mysore\'s best eateries, from legendary dosa joints to traditional sweet shops. This half-day trail covers the must-eat spots that define Mysore\'s food identity.',
        duration: 'Half day',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/FF5722/FFFFFF?text=Mysore+Foodie+Trail',
        difficulty: 'Easy',
        estimatedBudget: '\u20B9500-800 per person',
        createdById: adminUser.id,
      },
    });
    itinerary2Id = newItinerary2.id;
    console.log('Created itinerary: Mysore Foodie Trail');
  }

  const itinerary2Stops = [
    {
      poiSlug: 'mylari-hotel',
      order: 1,
      timeOfDay: 'MORNING' as const,
      duration: '45 minutes',
      note: 'Start the day early with the legendary Mylari dosa. Arrive before 8 AM to beat the crowds. Order the butter dosa - nothing else is needed.',
      transportToNext: 'WALK' as const,
      transportNote: '10-minute walk towards Sayyaji Rao Road',
    },
    {
      poiSlug: 'guru-sweet-mart-mysore-pak',
      order: 2,
      timeOfDay: 'MORNING' as const,
      duration: '20 minutes',
      note: 'Pick up freshly made Mysore Pak - the original recipe from the royal kitchens. Get the soft variety and eat it warm.',
      transportToNext: 'WALK' as const,
      transportNote: '5-minute walk',
    },
    {
      poiSlug: 'devaraja-market',
      order: 3,
      timeOfDay: 'MORNING' as const,
      duration: '1 hour',
      note: 'Explore the market\'s food section - sample fresh fruits, buy spices, and try the various street snacks available from the vendors.',
      transportToNext: 'WALK' as const,
      transportNote: '5-minute walk to Gandhi Square',
    },
    {
      poiSlug: 'hotel-rrr',
      order: 4,
      timeOfDay: 'AFTERNOON' as const,
      duration: '1 hour',
      note: 'Arrive by 12:30 PM for the unlimited thali lunch. The Andhra-style meals here are generous and delicious. Try the mutton curry if you eat non-veg.',
      transportToNext: 'AUTO_RICKSHAW' as const,
      transportNote: '10-minute ride to Gokulam area',
    },
    {
      poiSlug: 'depth-n-green',
      order: 5,
      timeOfDay: 'AFTERNOON' as const,
      duration: '1 hour',
      note: 'Wind down with artisanal coffee and a light dessert at this charming cafe. The perfect way to end a foodie trail.',
      transportToNext: 'NONE' as const,
      transportNote: null,
    },
  ];

  for (const stop of itinerary2Stops) {
    const poiId = createdPOIs.get(stop.poiSlug);
    if (!poiId) {
      console.error(`POI not found for itinerary stop: ${stop.poiSlug}`);
      continue;
    }
    await prisma.itineraryStop.create({
      data: {
        itineraryId: itinerary2Id,
        poiId,
        order: stop.order,
        timeOfDay: stop.timeOfDay,
        duration: stop.duration,
        note: stop.note,
        transportToNext: stop.transportToNext,
        transportNote: stop.transportNote,
      },
    });
  }

  console.log('Created itinerary stops');

  // =========================================================================
  // 9. Create Collections
  // =========================================================================

  // --- Collection 1: Must-Visit Mysore ---
  const collection1Slug = 'must-visit-mysore';
  const existingCollection1 = await prisma.collection.findUnique({
    where: { cityId_slug: { cityId: CITY_ID, slug: collection1Slug } },
  });

  let collection1Id: string;
  if (existingCollection1) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: existingCollection1.id } });
    await prisma.collection.update({
      where: { id: existingCollection1.id },
      data: {
        title: 'Must-Visit Mysore',
        description:
          'The essential Mysore experience - 8 iconic landmarks and experiences that define this royal city. Whether you have one day or a week, these are the spots you simply cannot miss.',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/4A0E4E/D4AF37?text=Must+Visit+Mysore',
      },
    });
    collection1Id = existingCollection1.id;
    console.log('Updated collection: Must-Visit Mysore');
  } else {
    const newCollection1 = await prisma.collection.create({
      data: {
        cityId: CITY_ID,
        slug: collection1Slug,
        title: 'Must-Visit Mysore',
        description:
          'The essential Mysore experience - 8 iconic landmarks and experiences that define this royal city. Whether you have one day or a week, these are the spots you simply cannot miss.',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/4A0E4E/D4AF37?text=Must+Visit+Mysore',
        createdById: adminUser.id,
      },
    });
    collection1Id = newCollection1.id;
    console.log('Created collection: Must-Visit Mysore');
  }

  const mustVisitSlugs = [
    'mysore-palace',
    'chamundeshwari-temple',
    'chamundi-hill-viewpoint',
    'brindavan-gardens',
    'devaraja-market',
    'mysore-zoo',
    'st-philomenas-cathedral',
    'jaganmohan-palace',
  ];

  for (const [index, slug] of mustVisitSlugs.entries()) {
    const poiId = createdPOIs.get(slug);
    if (!poiId) continue;
    await prisma.collectionItem.create({
      data: {
        collectionId: collection1Id,
        poiId,
        order: index + 1,
        note: null,
      },
    });
  }

  // --- Collection 2: Hidden Gems of Mysore ---
  const collection2Slug = 'hidden-gems-of-mysore';
  const existingCollection2 = await prisma.collection.findUnique({
    where: { cityId_slug: { cityId: CITY_ID, slug: collection2Slug } },
  });

  let collection2Id: string;
  if (existingCollection2) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: existingCollection2.id } });
    await prisma.collection.update({
      where: { id: existingCollection2.id },
      data: {
        title: 'Hidden Gems of Mysore',
        description:
          'Beyond the palace and the zoo - discover Mysore\'s best-kept secrets. These lesser-known spots reward the curious traveler with authentic experiences far from the tourist trail.',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/9C27B0/FFFFFF?text=Hidden+Gems+of+Mysore',
      },
    });
    collection2Id = existingCollection2.id;
    console.log('Updated collection: Hidden Gems of Mysore');
  } else {
    const newCollection2 = await prisma.collection.create({
      data: {
        cityId: CITY_ID,
        slug: collection2Slug,
        title: 'Hidden Gems of Mysore',
        description:
          'Beyond the palace and the zoo - discover Mysore\'s best-kept secrets. These lesser-known spots reward the curious traveler with authentic experiences far from the tourist trail.',
        status: 'PUBLISHED',
        coverImageUrl: 'https://placehold.co/1200x600/9C27B0/FFFFFF?text=Hidden+Gems+of+Mysore',
        createdById: adminUser.id,
      },
    });
    collection2Id = newCollection2.id;
    console.log('Created collection: Hidden Gems of Mysore');
  }

  const hiddenGemSlugs = [
    'mylari-hotel',
    'guru-sweet-mart-mysore-pak',
    'folklore-museum-janapada-loka',
    'sand-sculpture-museum',
    'lalitha-mahal-palace',
    'karanji-lake-nature-park',
    'depth-n-green',
    'nanjundeshwara-temple',
  ];

  for (const [index, slug] of hiddenGemSlugs.entries()) {
    const poiId = createdPOIs.get(slug);
    if (!poiId) continue;
    await prisma.collectionItem.create({
      data: {
        collectionId: collection2Id,
        poiId,
        order: index + 1,
        note: null,
      },
    });
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n========================================');
  console.log('Mysore Seed Data Summary');
  console.log('========================================');
  console.log(`City: ${mysore.name} (PUBLISHED)`);
  console.log(`POIs created/updated: ${createdPOIs.size}`);
  console.log(`Itineraries: 2 (PUBLISHED)`);
  console.log(`Collections: 2 (PUBLISHED)`);
  console.log(`Photos added: ${Object.values(photoData).flat().length}`);
  console.log('========================================');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
