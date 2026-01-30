/**
 * Comprehensive Business Types for Google Places API
 * Organized by category with 100+ types for lead generation
 */

export interface BusinessType {
  value: string;      // Search query value (Google Places type)
  label: string;      // Display name
  category: string;   // Backend category for qualification
  icon?: string;      // Icon type for UI
}

export interface BusinessTypeCategory {
  id: string;
  label: string;
  types: BusinessType[];
}

export const BUSINESS_TYPE_CATEGORIES: BusinessTypeCategory[] = [
  {
    id: "popular",
    label: "Popular",
    types: [
      { value: "restaurant", label: "Restaurants", category: "RESTAURANT", icon: "utensils" },
      { value: "hotel", label: "Hotels", category: "HOTEL", icon: "hotel" },
      { value: "gym", label: "Gyms", category: "GYM", icon: "dumbbell" },
      { value: "salon", label: "Salons", category: "SALON", icon: "scissors" },
      { value: "clinic", label: "Clinics", category: "CLINIC", icon: "hospital" },
      { value: "dentist", label: "Dentists", category: "CLINIC", icon: "tooth" },
    ]
  },
  {
    id: "food_drink",
    label: "Food & Drink",
    types: [
      { value: "restaurant", label: "Restaurants", category: "RESTAURANT", icon: "utensils" },
      { value: "cafe", label: "Cafes", category: "RESTAURANT", icon: "coffee" },
      { value: "bar", label: "Bars", category: "RESTAURANT", icon: "beer" },
      { value: "bakery", label: "Bakeries", category: "RESTAURANT", icon: "cake" },
      { value: "fast_food_restaurant", label: "Fast Food", category: "RESTAURANT", icon: "burger" },
      { value: "pizza_restaurant", label: "Pizza", category: "RESTAURANT", icon: "pizza" },
      { value: "indian_restaurant", label: "Indian Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "chinese_restaurant", label: "Chinese Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "italian_restaurant", label: "Italian Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "japanese_restaurant", label: "Japanese Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "thai_restaurant", label: "Thai Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "mexican_restaurant", label: "Mexican Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "korean_restaurant", label: "Korean Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "vietnamese_restaurant", label: "Vietnamese Restaurant", category: "RESTAURANT", icon: "utensils" },
      { value: "mediterranean_restaurant", label: "Mediterranean", category: "RESTAURANT", icon: "utensils" },
      { value: "seafood_restaurant", label: "Seafood", category: "RESTAURANT", icon: "fish" },
      { value: "steak_house", label: "Steakhouse", category: "RESTAURANT", icon: "utensils" },
      { value: "vegetarian_restaurant", label: "Vegetarian", category: "RESTAURANT", icon: "leaf" },
      { value: "vegan_restaurant", label: "Vegan", category: "RESTAURANT", icon: "leaf" },
      { value: "ice_cream_shop", label: "Ice Cream", category: "RESTAURANT", icon: "icecream" },
      { value: "coffee_shop", label: "Coffee Shop", category: "RESTAURANT", icon: "coffee" },
      { value: "tea_house", label: "Tea House", category: "RESTAURANT", icon: "coffee" },
      { value: "juice_shop", label: "Juice Bar", category: "RESTAURANT", icon: "juice" },
      { value: "food_court", label: "Food Court", category: "RESTAURANT", icon: "utensils" },
      { value: "catering_service", label: "Catering", category: "RESTAURANT", icon: "utensils" },
      { value: "food_delivery", label: "Food Delivery", category: "RESTAURANT", icon: "delivery" },
      { value: "night_club", label: "Night Club", category: "RESTAURANT", icon: "music" },
      { value: "pub", label: "Pub", category: "RESTAURANT", icon: "beer" },
      { value: "wine_bar", label: "Wine Bar", category: "RESTAURANT", icon: "wine" },
      { value: "brunch_restaurant", label: "Brunch", category: "RESTAURANT", icon: "utensils" },
    ]
  },
  {
    id: "health",
    label: "Health & Medical",
    types: [
      { value: "hospital", label: "Hospitals", category: "CLINIC", icon: "hospital" },
      { value: "doctor", label: "Doctors", category: "CLINIC", icon: "stethoscope" },
      { value: "dentist", label: "Dentists", category: "CLINIC", icon: "tooth" },
      { value: "pharmacy", label: "Pharmacies", category: "CLINIC", icon: "pill" },
      { value: "physiotherapist", label: "Physiotherapy", category: "CLINIC", icon: "rehab" },
      { value: "chiropractor", label: "Chiropractors", category: "CLINIC", icon: "spine" },
      { value: "optician", label: "Opticians", category: "CLINIC", icon: "eye" },
      { value: "veterinary_care", label: "Veterinary", category: "CLINIC", icon: "paw" },
      { value: "medical_lab", label: "Medical Labs", category: "CLINIC", icon: "flask" },
      { value: "urgent_care", label: "Urgent Care", category: "CLINIC", icon: "ambulance" },
      { value: "mental_health", label: "Mental Health", category: "CLINIC", icon: "brain" },
      { value: "dermatologist", label: "Dermatologists", category: "CLINIC", icon: "skin" },
      { value: "pediatrician", label: "Pediatricians", category: "CLINIC", icon: "baby" },
      { value: "gynecologist", label: "Gynecologists", category: "CLINIC", icon: "heart" },
      { value: "orthopedic", label: "Orthopedics", category: "CLINIC", icon: "bone" },
      { value: "ayurveda", label: "Ayurveda", category: "CLINIC", icon: "leaf" },
      { value: "homeopathy", label: "Homeopathy", category: "CLINIC", icon: "drops" },
      { value: "acupuncture", label: "Acupuncture", category: "CLINIC", icon: "needle" },
    ]
  },
  {
    id: "fitness",
    label: "Fitness & Wellness",
    types: [
      { value: "gym", label: "Gyms", category: "GYM", icon: "dumbbell" },
      { value: "fitness_center", label: "Fitness Centers", category: "GYM", icon: "dumbbell" },
      { value: "yoga_studio", label: "Yoga Studios", category: "GYM", icon: "yoga" },
      { value: "pilates_studio", label: "Pilates Studios", category: "GYM", icon: "yoga" },
      { value: "spa", label: "Spas", category: "SALON", icon: "spa" },
      { value: "massage", label: "Massage", category: "SALON", icon: "massage" },
      { value: "swimming_pool", label: "Swimming Pools", category: "GYM", icon: "pool" },
      { value: "martial_arts_school", label: "Martial Arts", category: "GYM", icon: "karate" },
      { value: "dance_studio", label: "Dance Studios", category: "GYM", icon: "dance" },
      { value: "crossfit", label: "CrossFit", category: "GYM", icon: "dumbbell" },
      { value: "boxing_gym", label: "Boxing Gyms", category: "GYM", icon: "boxing" },
      { value: "sports_club", label: "Sports Clubs", category: "GYM", icon: "sports" },
      { value: "tennis_court", label: "Tennis Courts", category: "GYM", icon: "tennis" },
      { value: "golf_course", label: "Golf Courses", category: "GYM", icon: "golf" },
    ]
  },
  {
    id: "beauty",
    label: "Beauty & Personal Care",
    types: [
      { value: "hair_salon", label: "Hair Salons", category: "SALON", icon: "scissors" },
      { value: "beauty_salon", label: "Beauty Salons", category: "SALON", icon: "sparkles" },
      { value: "barber_shop", label: "Barber Shops", category: "SALON", icon: "scissors" },
      { value: "nail_salon", label: "Nail Salons", category: "SALON", icon: "nail" },
      { value: "skin_care", label: "Skin Care", category: "SALON", icon: "face" },
      { value: "tattoo_shop", label: "Tattoo Shops", category: "SALON", icon: "pen" },
      { value: "makeup_artist", label: "Makeup Artists", category: "SALON", icon: "brush" },
      { value: "tanning_salon", label: "Tanning Salons", category: "SALON", icon: "sun" },
      { value: "waxing", label: "Waxing", category: "SALON", icon: "wax" },
      { value: "threading", label: "Threading", category: "SALON", icon: "thread" },
      { value: "mehndi", label: "Mehndi/Henna", category: "SALON", icon: "hand" },
    ]
  },
  {
    id: "lodging",
    label: "Lodging & Travel",
    types: [
      { value: "hotel", label: "Hotels", category: "HOTEL", icon: "hotel" },
      { value: "motel", label: "Motels", category: "HOTEL", icon: "hotel" },
      { value: "resort", label: "Resorts", category: "HOTEL", icon: "resort" },
      { value: "bed_and_breakfast", label: "B&B", category: "HOTEL", icon: "home" },
      { value: "guest_house", label: "Guest Houses", category: "HOTEL", icon: "home" },
      { value: "hostel", label: "Hostels", category: "HOTEL", icon: "bed" },
      { value: "lodge", label: "Lodges", category: "HOTEL", icon: "cabin" },
      { value: "serviced_apartment", label: "Serviced Apartments", category: "HOTEL", icon: "building" },
      { value: "travel_agency", label: "Travel Agencies", category: "HOTEL", icon: "plane" },
      { value: "tour_operator", label: "Tour Operators", category: "HOTEL", icon: "map" },
    ]
  },
  {
    id: "shopping",
    label: "Shopping & Retail",
    types: [
      { value: "shopping_mall", label: "Shopping Malls", category: "RETAIL", icon: "shop" },
      { value: "supermarket", label: "Supermarkets", category: "RETAIL", icon: "cart" },
      { value: "grocery_store", label: "Grocery Stores", category: "RETAIL", icon: "basket" },
      { value: "clothing_store", label: "Clothing Stores", category: "RETAIL", icon: "shirt" },
      { value: "electronics_store", label: "Electronics", category: "RETAIL", icon: "device" },
      { value: "furniture_store", label: "Furniture", category: "RETAIL", icon: "sofa" },
      { value: "home_goods_store", label: "Home Goods", category: "RETAIL", icon: "home" },
      { value: "jewelry_store", label: "Jewelry", category: "RETAIL", icon: "gem" },
      { value: "book_store", label: "Book Stores", category: "RETAIL", icon: "book" },
      { value: "pet_store", label: "Pet Stores", category: "RETAIL", icon: "paw" },
      { value: "sporting_goods_store", label: "Sporting Goods", category: "RETAIL", icon: "sports" },
      { value: "toy_store", label: "Toy Stores", category: "RETAIL", icon: "toy" },
      { value: "shoe_store", label: "Shoe Stores", category: "RETAIL", icon: "shoe" },
      { value: "florist", label: "Florists", category: "RETAIL", icon: "flower" },
      { value: "gift_shop", label: "Gift Shops", category: "RETAIL", icon: "gift" },
      { value: "convenience_store", label: "Convenience Stores", category: "RETAIL", icon: "shop" },
      { value: "liquor_store", label: "Liquor Stores", category: "RETAIL", icon: "bottle" },
      { value: "hardware_store", label: "Hardware Stores", category: "RETAIL", icon: "tools" },
      { value: "bicycle_store", label: "Bicycle Stores", category: "RETAIL", icon: "bike" },
      { value: "mobile_phone_store", label: "Mobile Stores", category: "RETAIL", icon: "phone" },
      { value: "computer_store", label: "Computer Stores", category: "RETAIL", icon: "laptop" },
      { value: "optical_shop", label: "Optical Shops", category: "RETAIL", icon: "glasses" },
      { value: "watch_store", label: "Watch Stores", category: "RETAIL", icon: "watch" },
      { value: "cosmetics_store", label: "Cosmetics", category: "RETAIL", icon: "lipstick" },
      { value: "baby_store", label: "Baby Stores", category: "RETAIL", icon: "baby" },
      { value: "art_gallery", label: "Art Galleries", category: "RETAIL", icon: "art" },
      { value: "antique_store", label: "Antique Stores", category: "RETAIL", icon: "antique" },
    ]
  },
  {
    id: "services",
    label: "Home Services",
    types: [
      { value: "plumber", label: "Plumbers", category: "SERVICE", icon: "wrench" },
      { value: "electrician", label: "Electricians", category: "SERVICE", icon: "bolt" },
      { value: "locksmith", label: "Locksmiths", category: "SERVICE", icon: "key" },
      { value: "moving_company", label: "Moving Companies", category: "SERVICE", icon: "truck" },
      { value: "painter", label: "Painters", category: "SERVICE", icon: "brush" },
      { value: "roofing_contractor", label: "Roofing", category: "SERVICE", icon: "home" },
      { value: "hvac_contractor", label: "HVAC", category: "SERVICE", icon: "wind" },
      { value: "pest_control", label: "Pest Control", category: "SERVICE", icon: "bug" },
      { value: "cleaning_service", label: "Cleaning Services", category: "SERVICE", icon: "sparkles" },
      { value: "laundry", label: "Laundry", category: "SERVICE", icon: "washing" },
      { value: "dry_cleaner", label: "Dry Cleaners", category: "SERVICE", icon: "hanger" },
      { value: "tailor", label: "Tailors", category: "SERVICE", icon: "scissors" },
      { value: "carpet_cleaning", label: "Carpet Cleaning", category: "SERVICE", icon: "vacuum" },
      { value: "landscaper", label: "Landscapers", category: "SERVICE", icon: "tree" },
      { value: "gardener", label: "Gardeners", category: "SERVICE", icon: "plant" },
      { value: "pool_service", label: "Pool Services", category: "SERVICE", icon: "pool" },
      { value: "handyman", label: "Handyman", category: "SERVICE", icon: "tools" },
      { value: "appliance_repair", label: "Appliance Repair", category: "SERVICE", icon: "wrench" },
      { value: "furniture_repair", label: "Furniture Repair", category: "SERVICE", icon: "sofa" },
      { value: "interior_designer", label: "Interior Designers", category: "SERVICE", icon: "design" },
    ]
  },
  {
    id: "automotive",
    label: "Automotive",
    types: [
      { value: "car_dealer", label: "Car Dealers", category: "AUTOMOTIVE", icon: "car" },
      { value: "car_repair", label: "Car Repair", category: "AUTOMOTIVE", icon: "wrench" },
      { value: "car_wash", label: "Car Wash", category: "AUTOMOTIVE", icon: "water" },
      { value: "gas_station", label: "Gas Stations", category: "AUTOMOTIVE", icon: "fuel" },
      { value: "auto_parts_store", label: "Auto Parts", category: "AUTOMOTIVE", icon: "gear" },
      { value: "tire_shop", label: "Tire Shops", category: "AUTOMOTIVE", icon: "tire" },
      { value: "motorcycle_dealer", label: "Motorcycle Dealers", category: "AUTOMOTIVE", icon: "bike" },
      { value: "motorcycle_repair", label: "Motorcycle Repair", category: "AUTOMOTIVE", icon: "wrench" },
      { value: "car_rental", label: "Car Rental", category: "AUTOMOTIVE", icon: "car" },
      { value: "parking", label: "Parking", category: "AUTOMOTIVE", icon: "parking" },
      { value: "towing_service", label: "Towing", category: "AUTOMOTIVE", icon: "truck" },
      { value: "auto_detailing", label: "Auto Detailing", category: "AUTOMOTIVE", icon: "sparkles" },
      { value: "driving_school", label: "Driving Schools", category: "AUTOMOTIVE", icon: "wheel" },
    ]
  },
  {
    id: "professional",
    label: "Professional Services",
    types: [
      { value: "lawyer", label: "Lawyers", category: "PROFESSIONAL", icon: "scale" },
      { value: "accountant", label: "Accountants", category: "PROFESSIONAL", icon: "calculator" },
      { value: "real_estate_agency", label: "Real Estate", category: "REAL_ESTATE", icon: "home" },
      { value: "insurance_agency", label: "Insurance", category: "PROFESSIONAL", icon: "shield" },
      { value: "financial_advisor", label: "Financial Advisors", category: "PROFESSIONAL", icon: "chart" },
      { value: "tax_consultant", label: "Tax Consultants", category: "PROFESSIONAL", icon: "document" },
      { value: "notary", label: "Notaries", category: "PROFESSIONAL", icon: "stamp" },
      { value: "consulting", label: "Consultants", category: "PROFESSIONAL", icon: "briefcase" },
      { value: "marketing_agency", label: "Marketing Agencies", category: "STARTUP", icon: "megaphone" },
      { value: "advertising_agency", label: "Advertising", category: "STARTUP", icon: "ad" },
      { value: "web_design", label: "Web Design", category: "STARTUP", icon: "code" },
      { value: "it_services", label: "IT Services", category: "STARTUP", icon: "server" },
      { value: "recruitment_agency", label: "Recruitment", category: "PROFESSIONAL", icon: "users" },
      { value: "translation_service", label: "Translation", category: "PROFESSIONAL", icon: "globe" },
      { value: "printing_service", label: "Printing Services", category: "SERVICE", icon: "printer" },
      { value: "courier_service", label: "Courier Services", category: "SERVICE", icon: "package" },
      { value: "security_service", label: "Security Services", category: "SERVICE", icon: "shield" },
    ]
  },
  {
    id: "education",
    label: "Education",
    types: [
      { value: "school", label: "Schools", category: "EDUCATION", icon: "school" },
      { value: "university", label: "Universities", category: "EDUCATION", icon: "graduation" },
      { value: "preschool", label: "Preschools", category: "EDUCATION", icon: "baby" },
      { value: "tutoring", label: "Tutoring Centers", category: "EDUCATION", icon: "book" },
      { value: "language_school", label: "Language Schools", category: "EDUCATION", icon: "globe" },
      { value: "driving_school", label: "Driving Schools", category: "EDUCATION", icon: "car" },
      { value: "music_school", label: "Music Schools", category: "EDUCATION", icon: "music" },
      { value: "art_school", label: "Art Schools", category: "EDUCATION", icon: "art" },
      { value: "dance_school", label: "Dance Schools", category: "EDUCATION", icon: "dance" },
      { value: "cooking_school", label: "Cooking Schools", category: "EDUCATION", icon: "chef" },
      { value: "computer_training", label: "Computer Training", category: "EDUCATION", icon: "laptop" },
      { value: "coaching_center", label: "Coaching Centers", category: "EDUCATION", icon: "book" },
      { value: "daycare", label: "Daycare", category: "EDUCATION", icon: "baby" },
      { value: "library", label: "Libraries", category: "EDUCATION", icon: "book" },
    ]
  },
  {
    id: "entertainment",
    label: "Entertainment",
    types: [
      { value: "movie_theater", label: "Movie Theaters", category: "ENTERTAINMENT", icon: "film" },
      { value: "bowling_alley", label: "Bowling Alleys", category: "ENTERTAINMENT", icon: "bowling" },
      { value: "amusement_park", label: "Amusement Parks", category: "ENTERTAINMENT", icon: "ferris" },
      { value: "zoo", label: "Zoos", category: "ENTERTAINMENT", icon: "paw" },
      { value: "aquarium", label: "Aquariums", category: "ENTERTAINMENT", icon: "fish" },
      { value: "museum", label: "Museums", category: "ENTERTAINMENT", icon: "museum" },
      { value: "theme_park", label: "Theme Parks", category: "ENTERTAINMENT", icon: "coaster" },
      { value: "casino", label: "Casinos", category: "ENTERTAINMENT", icon: "dice" },
      { value: "arcade", label: "Arcades", category: "ENTERTAINMENT", icon: "game" },
      { value: "escape_room", label: "Escape Rooms", category: "ENTERTAINMENT", icon: "key" },
      { value: "karaoke", label: "Karaoke", category: "ENTERTAINMENT", icon: "mic" },
      { value: "comedy_club", label: "Comedy Clubs", category: "ENTERTAINMENT", icon: "laugh" },
      { value: "concert_hall", label: "Concert Halls", category: "ENTERTAINMENT", icon: "music" },
      { value: "theater", label: "Theaters", category: "ENTERTAINMENT", icon: "mask" },
      { value: "event_venue", label: "Event Venues", category: "ENTERTAINMENT", icon: "calendar" },
      { value: "banquet_hall", label: "Banquet Halls", category: "ENTERTAINMENT", icon: "party" },
      { value: "wedding_venue", label: "Wedding Venues", category: "ENTERTAINMENT", icon: "heart" },
    ]
  },
  {
    id: "finance",
    label: "Finance & Banking",
    types: [
      { value: "bank", label: "Banks", category: "FINANCE", icon: "bank" },
      { value: "atm", label: "ATMs", category: "FINANCE", icon: "atm" },
      { value: "credit_union", label: "Credit Unions", category: "FINANCE", icon: "bank" },
      { value: "money_transfer", label: "Money Transfer", category: "FINANCE", icon: "money" },
      { value: "currency_exchange", label: "Currency Exchange", category: "FINANCE", icon: "exchange" },
      { value: "investment_firm", label: "Investment Firms", category: "FINANCE", icon: "chart" },
      { value: "mortgage_broker", label: "Mortgage Brokers", category: "FINANCE", icon: "home" },
    ]
  },
  {
    id: "industrial",
    label: "Industrial & Manufacturing",
    types: [
      { value: "factory", label: "Factories", category: "STARTUP", icon: "factory" },
      { value: "warehouse", label: "Warehouses", category: "STARTUP", icon: "warehouse" },
      { value: "manufacturer", label: "Manufacturers", category: "STARTUP", icon: "factory" },
      { value: "distributor", label: "Distributors", category: "STARTUP", icon: "truck" },
      { value: "wholesaler", label: "Wholesalers", category: "STARTUP", icon: "boxes" },
      { value: "construction_company", label: "Construction", category: "STARTUP", icon: "crane" },
      { value: "general_contractor", label: "Contractors", category: "STARTUP", icon: "hardhat" },
      { value: "architect", label: "Architects", category: "PROFESSIONAL", icon: "ruler" },
      { value: "engineer", label: "Engineers", category: "PROFESSIONAL", icon: "gear" },
    ]
  },
  {
    id: "religious",
    label: "Religious & Community",
    types: [
      { value: "church", label: "Churches", category: "COMMUNITY", icon: "church" },
      { value: "mosque", label: "Mosques", category: "COMMUNITY", icon: "mosque" },
      { value: "temple", label: "Temples", category: "COMMUNITY", icon: "temple" },
      { value: "synagogue", label: "Synagogues", category: "COMMUNITY", icon: "synagogue" },
      { value: "cemetery", label: "Cemeteries", category: "COMMUNITY", icon: "grave" },
      { value: "funeral_home", label: "Funeral Homes", category: "COMMUNITY", icon: "flower" },
      { value: "community_center", label: "Community Centers", category: "COMMUNITY", icon: "building" },
      { value: "senior_center", label: "Senior Centers", category: "COMMUNITY", icon: "heart" },
    ]
  },
  {
    id: "government",
    label: "Government & Public",
    types: [
      { value: "post_office", label: "Post Offices", category: "GOVERNMENT", icon: "mail" },
      { value: "police", label: "Police Stations", category: "GOVERNMENT", icon: "shield" },
      { value: "fire_station", label: "Fire Stations", category: "GOVERNMENT", icon: "flame" },
      { value: "city_hall", label: "City Halls", category: "GOVERNMENT", icon: "building" },
      { value: "courthouse", label: "Courthouses", category: "GOVERNMENT", icon: "scale" },
      { value: "embassy", label: "Embassies", category: "GOVERNMENT", icon: "flag" },
    ]
  },
];

// Flat list for search functionality
export const ALL_BUSINESS_TYPES: BusinessType[] = BUSINESS_TYPE_CATEGORIES.flatMap(c => c.types);

// Deduplicated list (some types appear in multiple categories)
export const UNIQUE_BUSINESS_TYPES: BusinessType[] = ALL_BUSINESS_TYPES.filter(
  (type, index, self) => self.findIndex(t => t.value === type.value) === index
);

// Helper to find a business type by value
export function findBusinessType(value: string): BusinessType | undefined {
  return UNIQUE_BUSINESS_TYPES.find(t => t.value === value);
}

// Helper to get types count per category
export function getCategoryTypeCounts(): Record<string, number> {
  return BUSINESS_TYPE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.types.length;
    return acc;
  }, {} as Record<string, number>);
}

// Other option for custom queries
export const OTHER_BUSINESS_TYPE: BusinessType = {
  value: "__other__",
  label: "Other",
  category: "OTHER",
  icon: "sparkles"
};
