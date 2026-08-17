"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const tag_model_1 = require("./tag.model"); // Adjust path as needed
const communityCategory_model_1 = require("./communityCategory.model"); // Adjust path as needed
const tags = [
    { name: 'Football', description: 'Latest football news and highlights', categories: [] },
    { name: 'Basketball', description: 'Basketball scores and highlights', categories: [] },
    { name: 'Cricket', description: 'Cricket scores and highlights', categories: [] },
    { name: 'Boxing', description: 'Latest boxing news and highlights', categories: [] },
    { name: 'MMA', description: 'Latest MMA news and highlights', categories: [] },
    { name: 'Esports', description: 'Competitive gaming and tournaments', categories: [] },
    { name: 'Console Gaming', description: 'Console games and hardware discussions', categories: [] },
    { name: 'PC Gaming', description: 'Gaming rigs, esports, and PC game reviews.', categories: [] },
    { name: 'Mobile Gaming', description: 'Casual and competitive mobile game buzz.', categories: [] },
    { name: 'Indie Games', description: 'Hidden gems and creative indie titles.', categories: [] },
    { name: 'RPG', description: 'Role-playing games and immersive storylines.', categories: [] },
    { name: 'Board Games', description: 'Strategy, fun, and family game nights.', categories: [] },
    { name: 'Card Games', description: 'TCG, deck building, and casual play.', categories: [] },
    { name: 'Strategy Games', description: 'Tactics, planning, and competitive play.', categories: [] },
    { name: 'Hip Hop', description: 'Rap news, beats, and urban culture.', categories: [] },
    { name: 'Rock', description: 'Classic and modern rock discussions.', categories: [] },
    { name: 'Jazz', description: 'Smooth tunes and jazz improvisations.', categories: [] },
    { name: 'Indie Music', description: 'Fresh sounds and underground artists', categories: [] },
    { name: 'Pop Music', description: 'Chart-toppers and pop culture', categories: [] },
    { name: 'Electronic', description: 'EDM festivals, DJs, and synth vibes.', categories: [] },
    { name: 'Classical Music', description: 'Timeless tunes and orchestral works.', categories: [] },
    { name: 'Opera', description: 'Dramatic performances and vocal art.', categories: [] },
    { name: 'Stand-up Comedy', description: 'Laugh out loud moments and comic relief.', categories: [] },
    { name: 'Live Concerts', description: 'Upcoming concerts and music events', categories: [] },
    { name: 'Action Movies', description: 'Blockbusters and adrenaline-packed films', categories: [] },
    { name: 'Documentaries', description: 'Educational and eye-opening documentaries', categories: [] },
    { name: 'Visual Arts', description: 'Painting, sculpture, and creative design', categories: [] },
    { name: 'Photography', description: 'Tips, techniques, and stunning imagery.', categories: [] },
    { name: 'Poetry', description: 'Spoken word, verses, and creative writing.', categories: [] },
    { name: 'Smartphones', description: 'Latest smartphones and reviews', categories: [] },
    { name: 'Wearables', description: 'Smartwatches and fitness trackers', categories: [] },
    { name: 'Fashion', description: 'Style trends and fashion updates', categories: [] },
    { name: 'Fitness', description: 'Workouts and exercise tips', categories: [] },
    { name: 'Nutrition', description: 'Healthy eating and diet tips', categories: [] },
    { name: 'Outdoor Activities', description: 'Hiking, camping, and adventure sports.', categories: [] },
    { name: 'Yoga', description: 'Mind-body balance and stretching routines.', categories: [] },
    { name: 'Meditation', description: 'Mindfulness techniques and calm discussions.', categories: [] },
    { name: 'Mindfulness', description: 'Meditation and mental wellness', categories: [] },
    { name: 'Travel', description: 'Guides and hacks for travelers', categories: [] },
    { name: 'Machine Learning', description: 'AI breakthroughs and data science trends.', categories: [] },
    { name: 'Cybersecurity', description: 'Hacking news and online safety tips.', categories: [] },
    { name: 'Virtual Reality', description: 'VR gaming and immersive experiences.', categories: [] },
    { name: 'Augmented Reality', description: 'AR apps, gadgets, and tech reviews.', categories: [] },
    { name: 'Robotics', description: 'Automation, drones, and futuristic tech.', categories: [] },
    { name: 'DIY Projects', description: 'Crafts and home projects', categories: [] },
    { name: 'Investment', description: 'Stock tips, crypto, and financial insights.', categories: [] },
    { name: 'Stock Market', description: 'Market analysis and investment tips', categories: [] },
    { name: 'Crypto', description: 'Cryptocurrency news and market trends', categories: [] },
    { name: 'Indian Politics', description: 'Indian political debates and news', categories: [] },
    { name: 'International Politics', description: 'International political debates and news', categories: [] },
    { name: 'Research', description: 'Scientific breakthroughs and studies', categories: [] },
    { name: 'Startups', description: 'Entrepreneurship and startup culture', categories: [] },
    { name: 'Debate', description: 'Open discussions on hot topics', categories: [] },
];
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || "mongodb+srv://jasilcheruppa:justdo1t23@cluster0.3gyy8.mongodb.net/Hive_DB?retryWrites=true&w=majority");
        console.log('Connected to MongoDB for tags.');
        // Optional: Clear existing tags
        yield tag_model_1.TagModel.deleteMany({});
        // Retrieve all categories to get their ObjectIds
        const categories = yield communityCategory_model_1.CategoryModel.find({});
        if (!categories || categories.length === 0) {
            throw new Error('No categories found. Seed categories first.');
        }
        // Helper function to get a category's ObjectId by its name
        const getCategoryId = (name) => {
            const category = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
            if (!category)
                throw new Error(`Category ${name} not found`);
            return category._id;
        };
        // Assign related category IDs to each tag
        tags.forEach(tag => {
            switch (tag.name) {
                case 'Football':
                    tag.categories.push(getCategoryId('Sports'));
                    break;
                case 'Basketball':
                    tag.categories.push(getCategoryId('Sports'));
                    break;
                case 'Cricket':
                    tag.categories.push(getCategoryId('Sports'));
                    break;
                case 'Boxing':
                    tag.categories.push(getCategoryId('Sports'), getCategoryId('Entertainment'));
                    break;
                case 'MMA':
                    tag.categories.push(getCategoryId('Sports'), getCategoryId('Entertainment'));
                    break;
                case 'Console Gaming':
                    tag.categories.push(getCategoryId('Gaming'), getCategoryId('Technology'));
                    break;
                case 'PC Gaming':
                    tag.categories.push(getCategoryId('Gaming'), getCategoryId('Technology'));
                    break;
                case 'Mobile Gaming':
                    tag.categories.push(getCategoryId('Gaming'), getCategoryId('Technology'));
                    break;
                case 'RPG':
                    tag.categories.push(getCategoryId('Gaming'), getCategoryId('Entertainment'));
                    break;
                case 'Indie Games':
                    tag.categories.push(getCategoryId('Gaming'));
                    break;
                case 'Board Games':
                    tag.categories.push(getCategoryId('Gaming'));
                    break;
                case 'Card Games':
                    tag.categories.push(getCategoryId('Gaming'));
                    break;
                case 'Strategy Games':
                    tag.categories.push(getCategoryId('Gaming'));
                    break;
                case 'Hip Hop':
                    tag.categories.push(getCategoryId('Music'));
                    break;
                case 'Rock':
                    tag.categories.push(getCategoryId('Music'));
                    break;
                case 'Jazz':
                    tag.categories.push(getCategoryId('Music'));
                    break;
                case 'Indie Music':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Art'));
                    break;
                case 'Pop Music':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Entertainment'));
                    break;
                case 'Electronic':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Technology'));
                    break;
                case 'Classical Music':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Art'));
                    break;
                case 'Opera':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Entertainment'));
                    break;
                case 'Photography':
                    tag.categories.push(getCategoryId('Art'), getCategoryId('Lifestyle'));
                    break;
                case 'Poetry':
                    tag.categories.push(getCategoryId('Art'), getCategoryId('Education'));
                    break;
                case 'Stand-up Comedy':
                    tag.categories.push(getCategoryId('Entertainment'));
                    break;
                case 'Investment':
                    tag.categories.push(getCategoryId('Business'));
                    break;
                case 'Machine Learning':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Science'));
                    break;
                case 'Cybersecurity':
                    tag.categories.push(getCategoryId('Technology'));
                    break;
                case 'Virtual Reality':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Gaming'), getCategoryId('Entertainment'));
                    break;
                case 'Augmented Reality':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Gaming'));
                    break;
                case 'Outdoor Activities':
                    tag.categories.push(getCategoryId('Sports'), getCategoryId('Lifestyle'));
                    break;
                case 'Yoga':
                    tag.categories.push(getCategoryId('Health'), getCategoryId('Lifestyle'));
                    break;
                case 'Meditation':
                    tag.categories.push(getCategoryId('Health'), getCategoryId('Education'));
                    break;
                case 'Robotics':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Science'));
                    break;
                case 'Smartphones':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Business'));
                    break;
                case 'Wearables':
                    tag.categories.push(getCategoryId('Technology'), getCategoryId('Health'));
                    break;
                case 'Action Movies':
                    tag.categories.push(getCategoryId('Entertainment'));
                    break;
                case 'Documentaries':
                    tag.categories.push(getCategoryId('Education'), getCategoryId('Entertainment'));
                    break;
                case 'Nutrition':
                    tag.categories.push(getCategoryId('Health'), getCategoryId('Education'));
                    break;
                case 'International Politics':
                    tag.categories.push(getCategoryId('Politics'));
                    break;
                case 'Indian Politics':
                    tag.categories.push(getCategoryId('Politics'));
                    break;
                case 'Research':
                    tag.categories.push(getCategoryId('Science'), getCategoryId('Education'));
                    break;
                case 'Visual Arts':
                    tag.categories.push(getCategoryId('Art'));
                    break;
                case 'Startups':
                    tag.categories.push(getCategoryId('Business'), getCategoryId('Technology'));
                    break;
                case 'Travel':
                    tag.categories.push(getCategoryId('Lifestyle'), getCategoryId('Education'));
                    break;
                case 'Fashion':
                    tag.categories.push(getCategoryId('Lifestyle'), getCategoryId('Art'));
                    break;
                case 'Fitness':
                    tag.categories.push(getCategoryId('Health'), getCategoryId('Lifestyle'));
                    break;
                case 'Esports':
                    tag.categories.push(getCategoryId('Gaming'), getCategoryId('Sports'), getCategoryId('Technology'));
                    break;
                case 'Live Concerts':
                    tag.categories.push(getCategoryId('Music'), getCategoryId('Entertainment'));
                    break;
                case 'Crypto':
                    tag.categories.push(getCategoryId('Business'), getCategoryId('Technology'), getCategoryId('Science'));
                    break;
                case 'DIY Projects':
                    tag.categories.push(getCategoryId('Education'), getCategoryId('Lifestyle'), getCategoryId('Art'));
                    break;
                case 'Mindfulness':
                    tag.categories.push(getCategoryId('Health'), getCategoryId('Education'));
                    break;
                case 'Debate':
                    tag.categories.push(getCategoryId('Politics'), getCategoryId('Education'));
                    break;
                case 'Stock Market':
                    tag.categories.push(getCategoryId('Business'));
                    break;
                default:
                    break;
            }
        });
        const createdTags = yield tag_model_1.TagModel.insertMany(tags);
        console.log('Tags seeded:', createdTags);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding tags:', error);
        process.exit(1);
    }
}))();
