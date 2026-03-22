const mongoose = require('mongoose');
const slugify = require('slugify');

// The provided MONGODB_URI
const MONGODB_URI = "mongodb+srv://guru_jewellers:WnSv3foIKcq44JPQ@gurujewellers.uqvdhl9.mongodb.net/gurujewellers?retryWrites=true&w=majority&appName=gurujewellers";

// Images for different categories (Unsplash)
const images = {
    necklace: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620656363914-f58444f6ab42?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1620656715100-33068e426870?q=80&w=800&auto=format&fit=crop"
    ],
    ring: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605100804107-77569d27537b?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1603912627214-1013a8896efb?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?q=80&w=800&auto=format&fit=crop"
    ],
    bangle: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1611085510592-af39ca7aa7d1?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?q=80&w=800&auto=format&fit=crop"
    ],
    earring: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1631023719280-5a3d463f27fd?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1629227306231-90327f277a88?q=80&w=800&auto=format&fit=crop"
    ]
};

// Models
const Category = require('./src/models/category.model');
const Subcategory = require('./src/models/subCategory.model');
const Product = require('./src/models/product.model');

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing test data if needed (Optional: be careful)
        // await Product.deleteMany({ tags: "New" });

        // 1. Create/Find Jewelry Category
        let jewelry = await Category.findOne({ name: "Jewelry" });
        if (!jewelry) {
            jewelry = await new Category({
                name: "Jewelry",
                description: "Premium and luxury jewelry collection.",
                image: images.necklace[0]
            }).save();
        }

        // 2. Define Subcategories & Nested Subcategories structure
        const structure = {
            "Necklace": ["Diamond Necklace", "Gold Chain Necklace", "Bridal Necklace"],
            "Rings": ["Engagement Rings", "Casual Rings"],
            "Bangles": ["Gold Bangles", "Kada Bangles"],
            "Earrings": ["Stud Earrings", "Jhumka Earrings"]
        };

        const subMap = {}; // To store the created subcategories

        for (const [mainName, children] of Object.entries(structure)) {
            let mainSub = await Subcategory.findOne({ name: mainName, categoryId: jewelry._id });
            if (!mainSub) {
                mainSub = await new Subcategory({
                    name: mainName,
                    categoryId: jewelry._id,
                    parentId: null,
                    image: images[mainName.toLowerCase().slice(0, -1)]?.[0] || images.necklace[0]
                }).save();
            }
            subMap[mainName] = { main: mainSub, children: [] };

            for (const childName of children) {
                let childSub = await Subcategory.findOne({ name: childName, parentId: mainSub._id });
                if (!childSub) {
                    childSub = await new Subcategory({
                        name: childName,
                        categoryId: jewelry._id,
                        parentId: mainSub._id,
                        image: images[mainName.toLowerCase().slice(0, -1)]?.[1] || images.necklace[1]
                    }).save();
                }
                subMap[mainName].children.push(childSub);
            }
        }

        console.log("Created/Verified Category and Subcategory structure.");

        // 3. Create 50 Products
        console.log("Creating 50 realistic products...");
        console.log("Cleaning up previous seeded data...");
        // Delete products with name matching Model X pattern to avoid duplicates
        await Product.deleteMany({ name: /Model \d+/ });

        const colors = ["Gold", "Silver", "Rose Gold"];
        const materials = ["Gold", "Diamond", "Silver"];
        const purities = ["18K", "22K", "925"];

        const productsToCreate = [];

        for (let i = 1; i <= 52; i++) {
            const index = i - 1;
            const mainSubKeys = Object.keys(structure);
            const mainKey = mainSubKeys[index % mainSubKeys.length];
            const children = subMap[mainKey].children;
            const childSub = children[Math.floor(Math.random() * children.length)];

            const imgKey = mainKey.toLowerCase().slice(0, -1); // "necklace", "ring", etc.
            const pImages = images[imgKey] || images.necklace;
            
            // Random attributes
            const color = colors[Math.floor(Math.random() * colors.length)];
            const material = materials[Math.floor(Math.random() * materials.length)];
            const purity = purities[Math.floor(Math.random() * purities.length)];

            const actualPrice = 5000 + (Math.floor(Math.random() * 95000));
            const discountedPrice = actualPrice * (0.7 + (Math.random() * 0.25)); // 5% to 30% discount

            productsToCreate.push({
                name: `${purity} ${color} ${childSub.name} - Model ${i}`,
                description: `Experience the elegance of this handcrafted ${purity} ${color} ${childSub.name}. Perfect for weddings, formal occasions, or as a timeless gift. Crafted with premium ${material} and finished to perfection.`,
                shortDescription: `Handcrafted ${purity} ${color} ${childSub.name}.`,
                actualPrice: Math.round(actualPrice),
                discountedPrice: Math.round(discountedPrice),
                weight: (10 + Math.random() * 50).toFixed(2),
                unit: "g",
                stock: 10 + Math.floor(Math.random() * 90),
                image: pImages[0],
                images: pImages,
                categoryId: jewelry._id,
                subcategoryId: childSub._id,
                attributes: {
                    color,
                    material,
                    purity
                },
                tags: i % 5 === 0 ? "Bestseller" : (i % 3 === 0 ? "Sale" : "New"),
                isFeatured: true,
                isPriceFixed: true
            });
        }

        // Use create() for triggering pre-save hooks (like slug generation)
        await Product.create(productsToCreate);

        console.log(`Successfully seeded 52 products.`);
        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
