const { db, initDb } = require('./schema');

initDb();

const canteens = ['ground', '6th_floor', '8th_floor'];
const baseCategories = ['Snacks', 'Main Course', 'Beverages', 'Juices', 'Desserts', 'Ice Cream', 'Sushi', 'Chinese', 'South Indian', 'Gujarati Special', 'Street Food', 'Protein Bars', 'Chips & Chocolates'];
const cuisines = ['Indian', 'Chinese', 'Japanese', 'Italian', 'Mexican', 'Continental'];

// A helper to pick random items from an array
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPrice = (min, max) => Math.floor(Math.random() * (max - min) / 10) * 10 + min;

// Hardcoded explicit items to make sure specific user requests are fulfilled
const explicitItems = [
  { name: 'Pav Bhaji', desc: 'Spicy mashed vegetables with buttery pav', price: 120, cat: 'Main Course', jain: 0, canteen: 'ground', tag: 'Street Food', cust: '{"extra_pav": 15, "extra_cheese": 30}' },
  { name: 'Jain Pav Bhaji', desc: 'No onion no garlic, made with raw bananas', price: 130, cat: 'Main Course', jain: 1, canteen: '6th_floor', tag: 'Street Food', cust: '{"extra_pav": 15}' },
  { name: 'Veggie California Roll', desc: 'Avocado, cucumber, asparagus sushi', price: 250, cat: 'Sushi', jain: 0, canteen: '8th_floor', tag: 'Japanese', cust: '{"extra_soya": 10}' },
  { name: 'Edamame Sushi', desc: 'Steamed edamame inside out roll', price: 220, cat: 'Sushi', jain: 1, canteen: '8th_floor', tag: 'Japanese', cust: '{}' },
  { name: 'Quest Protein Bar', desc: '20g protein, chocolate chunk', price: 150, cat: 'Protein Bars', jain: 1, canteen: 'ground', tag: 'Snacks', cust: '{}' },
  { name: 'Slurrp Farm Granola', desc: 'Millet granola bar', price: 60, cat: 'Protein Bars', jain: 1, canteen: '6th_floor', tag: 'Snacks', cust: '{}' },
  { name: 'Brownie Fudge Ice Cream', desc: 'Rich chocolate brownie fudge', price: 180, cat: 'Ice Cream', jain: 1, canteen: '8th_floor', tag: 'Desserts', cust: '{}' },
  { name: 'Dhokla', desc: 'Steamed gram flour snack', price: 50, cat: 'Gujarati Special', jain: 1, canteen: '6th_floor', tag: 'Indian', cust: '{"extra_chutney": 10}' },
  { name: 'Handvo', desc: 'Savory vegetable cake', price: 90, cat: 'Gujarati Special', jain: 0, canteen: 'ground', tag: 'Indian', cust: '{}' },
  { name: 'Masala Dosa', desc: 'Crispy crepe with potato filling', price: 100, cat: 'South Indian', jain: 0, canteen: 'ground', tag: 'Indian', cust: '{"extra_sambhar": 20}' },
  { name: 'Jain Masala Dosa', desc: 'Crispy crepe with raw banana filling', price: 110, cat: 'South Indian', jain: 1, canteen: '6th_floor', tag: 'Indian', cust: '{"extra_sambhar": 20}' },
];

const generatedItems = [];
const adjectives = ['Spicy', 'Crispy', 'Cheesy', 'Grilled', 'Fried', 'Roasted', 'Steamed', 'Baked', 'Tangy', 'Sweet'];
const baseFoods = ['Burger', 'Pizza', 'Sandwich', 'Wrap', 'Roll', 'Pasta', 'Noodles', 'Rice', 'Salad', 'Fries'];

// Generate remaining items to hit 200+
for (let i = 0; i < 190; i++) {
  const isJain = Math.random() > 0.7; // 30% chance to be jain
  const cat = sample(baseCategories);
  let name = `${sample(adjectives)} ${sample(baseFoods)}`;
  if(isJain) name = `Jain ${name}`;

  generatedItems.push({
    name,
    desc: `Delicious and freshly prepared ${name.toLowerCase()}`,
    price: randomPrice(40, 300),
    cat: cat,
    jain: isJain ? 1 : 0,
    canteen: sample(canteens),
    tag: sample(cuisines),
    cust: '{}'
  });
}

const allItems = [...explicitItems, ...generatedItems];

const insertItem = db.prepare(`
  INSERT INTO food_items (name, description, price, category, canteen_id, is_jain, cuisine_tag, customizations, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  db.prepare('BEGIN').run();
  for (const item of allItems) {
    const defaultImage = \`https://placehold.co/400x300/e2e8f0/1e293b?text=\${encodeURIComponent(item.name)}\`;
    insertItem.run(item.name, item.desc, item.price, item.cat, item.canteen, item.jain, item.tag, item.cust, defaultImage);
  }
  db.prepare('COMMIT').run();
  console.log(\`Successfully seeded \${allItems.length} food items!\`);
} catch (err) {
  db.prepare('ROLLBACK').run();
  console.error('Seeding failed:', err);
}
