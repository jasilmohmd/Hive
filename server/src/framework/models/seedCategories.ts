import mongoose from 'mongoose';
import { CategoryModel } from './communityCategory.model';


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

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://jasilcheruppa:justdo1t23@cluster0.3gyy8.mongodb.net/Hive_DB?retryWrites=true&w=majority");
    console.log('Connected to MongoDB for categories.');

    // Optional: Clear existing categories
    await CategoryModel.deleteMany({});
    const createdCategories = await CategoryModel.insertMany(categories);
    console.log('Categories seeded:', createdCategories);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
})();
