const User          = require('../models/User.model');
const downloadImage = require('./downloadImage');

const CHEFS = [
  {
    name:      'Marco Rossi',
    email:     'marco@gmail.com',
    password:  'chef@123',
    role:      'chef',
    specialty: 'Italian Cuisine',
    location:  'Rome, Italy',
    bio:       'Classically trained in Naples, Marco brings authentic Italian flavours to every dish. Passionate about handmade pasta and wood-fired cooking.',
    socialLinks: { instagram: 'https://instagram.com/marcorossi', twitter: 'https://twitter.com/marcorossi', youtube: '' },
    avatarUrl:  'https://picsum.photos/seed/chef-marco/200/200',
    avatarFile: 'chef-marco.jpg',
  },
  {
    name:      'Aisha Patel',
    email:     'aisha@gmail.com',
    password:  'chef@123',
    role:      'chef',
    specialty: 'Indian & Fusion',
    location:  'Mumbai, India',
    bio:       'Aisha blends traditional Indian spices with modern techniques. Her recipes celebrate bold flavours and vibrant colours from across the subcontinent.',
    socialLinks: { instagram: 'https://instagram.com/aishapatel', twitter: '', youtube: 'https://youtube.com/aishapatel' },
    avatarUrl:  'https://picsum.photos/seed/chef-aisha/200/200',
    avatarFile: 'chef-aisha.jpg',
  },
  {
    name:      'Jean-Luc Moreau',
    email:     'jeanluc@gmail.com',
    password:  'chef@123',
    role:      'chef',
    specialty: 'French Pastry',
    location:  'Paris, France',
    bio:       'A Michelin-trained pastry chef with 15 years of experience. Jean-Luc specialises in delicate French pastries, soufflés, and artisan breads.',
    socialLinks: { instagram: 'https://instagram.com/jeanlucmoreau', twitter: 'https://twitter.com/jeanlucmoreau', youtube: '' },
    avatarUrl:  'https://picsum.photos/seed/chef-jeanluc/200/200',
    avatarFile: 'chef-jeanluc.jpg',
  },
  {
    name:      'Sofia Hernandez',
    email:     'sofia@gmail.com',
    password:  'chef@123',
    role:      'chef',
    specialty: 'Mexican & Latin American',
    location:  'Mexico City, Mexico',
    bio:       'Sofia grew up cooking alongside her grandmother in Oaxaca. She champions authentic Mexican street food and modern Latin American cuisine.',
    socialLinks: { instagram: 'https://instagram.com/sofiahernandez', twitter: '', youtube: 'https://youtube.com/sofiahernandez' },
    avatarUrl:  'https://picsum.photos/seed/chef-sofia/200/200',
    avatarFile: 'chef-sofia.jpg',
  },
  {
    name:      'Kenji Tanaka',
    email:     'kenji@gmail.com',
    password:  'chef@123',
    role:      'chef',
    specialty: 'Japanese & Asian Fusion',
    location:  'Tokyo, Japan',
    bio:       'Kenji trained under a sushi master in Osaka before exploring Asian fusion. He brings precision and artistry to every plate.',
    socialLinks: { instagram: 'https://instagram.com/kenjitanaka', twitter: 'https://twitter.com/kenjitanaka', youtube: 'https://youtube.com/kenjitanaka' },
    avatarUrl:  'https://picsum.photos/seed/chef-kenji/200/200',
    avatarFile: 'chef-kenji.jpg',
  },
];

const seedChefs = async () => {
  try {
    for (const { avatarUrl, avatarFile, ...chefData } of CHEFS) {
      const exists = await User.findOne({ email: chefData.email });
      if (!exists) {
        const avatarPath = await downloadImage(avatarUrl, avatarFile);
        await User.create({ ...chefData, avatar: avatarPath || '' });
        console.log(`✅ Chef seeded: ${chefData.name}${avatarPath ? ' (with avatar)' : ''}`);
      } else if (!exists.avatar) {
        // Chef exists but has no avatar — download and patch
        const avatarPath = await downloadImage(avatarUrl, avatarFile);
        if (avatarPath) {
          await User.updateOne({ _id: exists._id }, { avatar: avatarPath });
          console.log(`🖼️  Avatar added for existing chef: ${chefData.name}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Chef seed error:', err.message);
  }
};

module.exports = seedChefs;
