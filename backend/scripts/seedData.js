const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Professional = require('../models/Professional');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Wallet = require('../models/Wallet');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const seedData = async () => {
  try {
    // Clear existing data (optional - comment out in production)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Professional.deleteMany({});
    await Category.deleteMany({});
    await Service.deleteMany({});
    await Wallet.deleteMany({});

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@skilllink.com',
      phone: '+919999999999',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      referralCode: 'ADMIN001'
    });
    await Wallet.create({ userId: admin._id, balance: 0, credits: 0 });
    console.log('✅ Admin created');

    // Create Categories
    console.log('📁 Creating categories...');
    const categories = [
      {
        name: 'Home Repair',
        nameLocalized: {
          en: 'Home Repair',
          te: 'గృహ మరమ్మత్తు',
          hi: 'घर की मरम्मत',
          ta: 'வீட்டு பழுது',
          kn: 'ಮನೆ ದುರಸ್ತಿ'
        },
        icon: '🔧',
        description: 'Home repair and maintenance services',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Beauty & Salon',
        nameLocalized: {
          en: 'Beauty & Salon',
          te: 'సౌందర్యం & సలూన్',
          hi: 'सौंदर्य और सैलून',
          ta: 'அழகு & சலூன்',
          kn: 'ಸೌಂದರ್ಯ & ಸಲೂನ್'
        },
        icon: '💇',
        description: 'Beauty and salon services',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Cleaning',
        nameLocalized: {
          en: 'Cleaning',
          te: 'శుభ్రపరచడం',
          hi: 'सफाई',
          ta: 'சுத்தம்',
          kn: 'ಸ್ವಚ್ಛತೆ'
        },
        icon: '🧹',
        description: 'Home and office cleaning services',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Painting',
        nameLocalized: {
          en: 'Painting',
          te: 'పెయింటింగ్',
          hi: 'पेंटिंग',
          ta: 'வண்ணம் தீட்டுதல்',
          kn: 'ಚಿತ್ರಕಲೆ'
        },
        icon: '🎨',
        description: 'Interior and exterior painting services',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Pest Control',
        nameLocalized: {
          en: 'Pest Control',
          te: 'కీటక నియంత్రణ',
          hi: 'कीट नियंत्रण',
          ta: 'பூச்சி கட்டுப்பாடு',
          kn: 'ಕೀಟ ನಿಯಂತ್ರಣ'
        },
        icon: '🐛',
        description: 'Pest control and extermination services',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Plumbing',
        nameLocalized: {
          en: 'Plumbing',
          te: 'ప్లంబింగ్',
          hi: 'प्लंबिंग',
          ta: 'குழாய் வேலை',
          kn: 'ಪ್ಲಂಬಿಂಗ್'
        },
        icon: '🚿',
        description: 'Plumbing and water supply services',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Electrical',
        nameLocalized: {
          en: 'Electrical',
          te: 'విద్యుత్',
          hi: 'विद्युत',
          ta: 'மின்சாரம்',
          kn: 'ವಿದ್ಯುತ್'
        },
        icon: '⚡',
        description: 'Electrical repair and installation services',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Carpentry',
        nameLocalized: {
          en: 'Carpentry',
          te: 'వడ్రంగి',
          hi: 'बढ़ईगीरी',
          ta: 'தச்சு வேலை',
          kn: 'ಸುತ್ತಿಗೆ'
        },
        icon: '🪚',
        description: 'Carpentry and woodwork services',
        isActive: true,
        sortOrder: 8
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create Services
    console.log('🛠️  Creating services...');
    const services = [
      // Home Repair
      {
        name: 'Furniture Repair',
        category: createdCategories[0]._id,
        nameLocalized: {
          en: 'Furniture Repair',
          te: 'ఫర్నిచర్ మరమ్మత్తు',
          hi: 'फर्नीचर मरम्मत',
          ta: 'தளபாடங்கள் பழுது',
          kn: 'ಪೀಠೋಪಕರಣ ದುರಸ್ತಿ'
        },
        isActive: true
      },
      {
        name: 'Appliance Repair',
        category: createdCategories[0]._id,
        nameLocalized: {
          en: 'Appliance Repair',
          te: 'ఉపకరణ మరమ్మత్తు',
          hi: 'उपकरण मरम्मत',
          ta: 'உபகரண பழுது',
          kn: 'ಉಪಕರಣ ದುರಸ್ತಿ'
        },
        isActive: true
      },
      // Beauty & Salon
      {
        name: 'Haircut',
        category: createdCategories[1]._id,
        nameLocalized: {
          en: 'Haircut',
          te: 'వెంట్రుకల కత్తిరింపు',
          hi: 'हेयरकट',
          ta: 'முடி வெட்டுதல்',
          kn: 'ಕೇಶ ಕತ್ತರಿಸುವಿಕೆ'
        },
        isActive: true
      },
      {
        name: 'Facial',
        category: createdCategories[1]._id,
        nameLocalized: {
          en: 'Facial',
          te: 'ముఖం',
          hi: 'फेशियल',
          ta: 'முகப்ப',
          kn: 'ಮುಖ'
        },
        isActive: true
      },
      // Cleaning
      {
        name: 'Deep Cleaning',
        category: createdCategories[2]._id,
        nameLocalized: {
          en: 'Deep Cleaning',
          te: 'లోతైన శుభ్రపరచడం',
          hi: 'गहरी सफाई',
          ta: 'ஆழமான சுத்தம்',
          kn: 'ಆಳವಾದ ಸ್ವಚ್ಛತೆ'
        },
        isActive: true
      },
      {
        name: 'Office Cleaning',
        category: createdCategories[2]._id,
        nameLocalized: {
          en: 'Office Cleaning',
          te: 'ఆఫీస్ శుభ్రపరచడం',
          hi: 'कार्यालय सफाई',
          ta: 'அலுவலக சுத்தம்',
          kn: 'ಕಚೇರಿ ಸ್ವಚ್ಛತೆ'
        },
        isActive: true
      },
      // Plumbing
      {
        name: 'Pipe Repair',
        category: createdCategories[5]._id,
        nameLocalized: {
          en: 'Pipe Repair',
          te: 'పైపు మరమ్మత్తు',
          hi: 'पाइप मरम्मत',
          ta: 'குழாய் பழுது',
          kn: 'ಪೈಪ್ ದುರಸ್ತಿ'
        },
        isActive: true
      },
      {
        name: 'Tap Installation',
        category: createdCategories[5]._id,
        nameLocalized: {
          en: 'Tap Installation',
          te: 'ట్యాప్ ఇన్స్టాలేషన్',
          hi: 'टैप स्थापना',
          ta: 'குழாய் நிறுவல்',
          kn: 'ಟ್ಯಾಪ್ ಸ್ಥಾಪನೆ'
        },
        isActive: true
      },
      // Electrical
      {
        name: 'Wiring',
        category: createdCategories[6]._id,
        nameLocalized: {
          en: 'Wiring',
          te: 'వైరింగ్',
          hi: 'तारों',
          ta: 'வயரிங்',
          kn: 'ವೈರಿಂಗ್'
        },
        isActive: true
      },
      {
        name: 'Fan Installation',
        category: createdCategories[6]._id,
        nameLocalized: {
          en: 'Fan Installation',
          te: 'ఫ్యాన్ ఇన్స్టాలేషన్',
          hi: 'पंखा स्थापना',
          ta: 'விசிறி நிறுவல்',
          kn: 'ಫ್ಯಾನ್ ಸ್ಥಾಪನೆ'
        },
        isActive: true
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`✅ Created ${createdServices.length} services`);

    // Create Sample Users
    console.log('👥 Creating sample users...');
    const baseTime = Date.now();
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        role: 'user',
        isVerified: true,
        language: 'en',
        referralCode: `REF543210${baseTime.toString().slice(-6)}`
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+919876543211',
        role: 'user',
        isVerified: true,
        language: 'en',
        referralCode: `REF543211${(baseTime + 1).toString().slice(-6)}`
      },
      {
        name: 'రాము',
        email: 'ramu@example.com',
        phone: '+919876543212',
        role: 'user',
        isVerified: true,
        language: 'te',
        referralCode: `REF543212${(baseTime + 2).toString().slice(-6)}`
      }
    ];

    const createdUsers = await User.insertMany(users);
    for (const user of createdUsers) {
      await Wallet.create({ userId: user._id, balance: 1000, credits: 10 });
    }
    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create Sample Professionals
    console.log('👨‍🔧 Creating sample professionals...');
    const professionals = [
      {
        userId: createdUsers[0]._id,
        profession: 'Electrician',
        category: createdCategories[6]._id,
        services: [createdServices[8]._id, createdServices[9]._id],
        experience: 5,
        bio: 'Experienced electrician with 5+ years of experience',
        skills: ['Wiring', 'Fan Installation', 'Switch Repair'],
        pricing: {
          basePrice: 500,
          pricePerHour: 200,
          minimumCharge: 300
        },
        workRadius: 15,
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
          coordinates: { lat: 17.3850, lng: 78.4867 }
        },
        kyc: {
          idType: 'aadhar',
          idNumber: '123456789012',
          status: 'approved',
          verifiedAt: new Date()
        },
        isActive: true,
        isVerified: true,
        rating: {
          average: 4.5,
          count: 12
        }
      },
      {
        userId: createdUsers[1]._id,
        profession: 'Plumber',
        category: createdCategories[5]._id,
        services: [createdServices[6]._id, createdServices[7]._id],
        experience: 3,
        bio: 'Professional plumber specializing in pipe repairs',
        skills: ['Pipe Repair', 'Tap Installation', 'Leak Fixing'],
        pricing: {
          basePrice: 400,
          pricePerHour: 150,
          minimumCharge: 250
        },
        workRadius: 10,
        location: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          coordinates: { lat: 12.9716, lng: 77.5946 }
        },
        kyc: {
          idType: 'aadhar',
          idNumber: '987654321098',
          status: 'approved',
          verifiedAt: new Date()
        },
        isActive: true,
        isVerified: true,
        rating: {
          average: 4.8,
          count: 25
        }
      }
    ];

    const createdProfessionals = await Professional.insertMany(professionals);
    
    // Update user roles
    await User.updateMany(
      { _id: { $in: [createdUsers[0]._id, createdUsers[1]._id] } },
      { role: 'professional' }
    );

    console.log(`✅ Created ${createdProfessionals.length} sample professionals`);

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin: 1`);
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Services: ${createdServices.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Professionals: ${createdProfessionals.length}`);
    console.log('\n🔑 Admin Credentials:');
    console.log(`   Phone: +919999999999`);
    console.log(`   Password: admin123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

