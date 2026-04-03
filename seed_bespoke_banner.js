const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Banner = require('./src/models/banner.model');
const Metal = require('./src/models/metal.model');

dotenv.config();

const seedBespokeBanner = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get a metal ID (any will do for the default)
        const metal = await Metal.findOne({ isDeleted: false });
        if (!metal) {
            console.log('No metal found. Please seed metals first.');
            process.exit(1);
        }

        // 2. Clear existing bespoke banners (optional, but keeps it clean)
        await Banner.deleteMany({ type: 'bespoke' });

        // 3. Create the banner
        const banner = new Banner({
            title: "Dream It. Design It. We Build It.",
            subtitle: "Bespoke Craftsmanship",
            description: "From a simple sketch to a finished masterpiece, we collaborate with you every step of the way to create jewelry that echoes your personality.",
            type: 'bespoke',
            imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=2000",
            link: "/custom-design",
            buttonText: "Start your design journey",
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)), // 10 years from now
            status: 'active',
            position: 1,
            metalIds: [metal._id]
        });

        await banner.save();
        console.log('Bespoke banner seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding bespoke banner:', error);
        process.exit(1);
    }
};

seedBespokeBanner();
