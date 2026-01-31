"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create admin user
    const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@boko.app' },
        update: {},
        create: {
            email: 'admin@boko.app',
            password: hashedPassword,
            name: 'Admin',
            role: 'ADMIN',
        },
    });
    console.log('Created admin user:', admin.email);
    // Create default tags
    const defaultTags = [
        { name: 'Hot Lead', color: '#ef4444' },
        { name: 'Follow Up', color: '#f97316' },
        { name: 'Needs Website', color: '#8b5cf6' },
        { name: 'Redesign', color: '#06b6d4' },
        { name: 'E-commerce', color: '#22c55e' },
        { name: 'Startup', color: '#3b82f6' },
        { name: 'Local Business', color: '#f59e0b' },
    ];
    for (const tag of defaultTags) {
        await prisma.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: tag,
        });
    }
    console.log('Created default tags');
    // Create default scraping regions
    const defaultRegions = [
        {
            name: 'Bangalore Tech Hub',
            cities: ['Bangalore', 'Bengaluru', 'Electronic City', 'Whitefield'],
            state: 'Karnataka',
        },
        {
            name: 'Hyderabad IT Corridor',
            cities: ['Hyderabad', 'Secunderabad', 'HITEC City', 'Gachibowli'],
            state: 'Telangana',
        },
        {
            name: 'Mumbai Metro',
            cities: ['Mumbai', 'Navi Mumbai', 'Thane', 'Andheri'],
            state: 'Maharashtra',
        },
        {
            name: 'Delhi NCR',
            cities: ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad'],
            state: 'Delhi NCR',
        },
        {
            name: 'Chennai Tech',
            cities: ['Chennai', 'OMR', 'Velachery', 'Tambaram'],
            state: 'Tamil Nadu',
        },
        {
            name: 'Pune IT Park',
            cities: ['Pune', 'Hinjewadi', 'Kharadi', 'Magarpatta'],
            state: 'Maharashtra',
        },
    ];
    for (const region of defaultRegions) {
        await prisma.scrapingRegion.upsert({
            where: { name: region.name },
            update: {},
            create: region,
        });
    }
    console.log('Created default scraping regions');
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
//# sourceMappingURL=seed.js.map