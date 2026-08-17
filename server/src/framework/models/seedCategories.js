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
const communityCategory_model_1 = require("./communityCategory.model");
const categories = [
    {
        name: 'Gaming',
        description: 'Latest news, reviews, and gamer chats.'
    },
    {
        name: 'Music',
        description: 'Fresh tracks, artist updates, and fan buzz.'
    },
    {
        name: 'Sports',
        description: 'Live scores, game highlights, and fan debates.'
    },
    {
        name: 'Technology',
        description: 'Innovations, gadgets, and coding insights.'
    },
    {
        name: 'Entertainment',
        description: 'Trending shows, movies, and creator chats.'
    },
    {
        name: 'Health',
        description: 'Wellness tips, fitness hacks, and nutrition talk.'
    },
    {
        name: 'Politics',
        description: 'Hot topics, debates, and policy updates.'
    },
    {
        name: 'Science',
        description: 'Breakthroughs, research, and curious discoveries.'
    },
    {
        name: 'Art',
        description: 'Creative showcases, design trends, and inspiration.'
    },
    {
        name: 'Business',
        description: 'Market trends, finance tips, and startup buzz.'
    },
    {
        name: 'Education',
        description: 'Study tips, academic insights, and learning hacks.'
    },
    {
        name: 'Lifestyle',
        description: 'Travel tips, fashion trends, and daily inspiration.'
    }
];
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || "mongodb+srv://jasilcheruppa:justdo1t23@cluster0.3gyy8.mongodb.net/Hive_DB?retryWrites=true&w=majority");
        console.log('Connected to MongoDB for categories.');
        // Optional: Clear existing categories
        yield communityCategory_model_1.CategoryModel.deleteMany({});
        const createdCategories = yield communityCategory_model_1.CategoryModel.insertMany(categories);
        console.log('Categories seeded:', createdCategories);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}))();
