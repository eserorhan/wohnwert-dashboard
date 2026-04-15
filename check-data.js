const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/properties_map.json', 'utf-8'));
const sample = data[0];

console.log('Total properties:', data.length);
console.log('\nSample property keys with "ww" or "score":');
Object.keys(sample)
  .filter(k => k.includes('ww') || k.includes('score') || k.includes('hw_'))
  .forEach(k => console.log(`  ${k}: ${sample[k]}`));

console.log('\nChecking ww_dim fields:');
console.log('  ww_dim_preis:', sample.ww_dim_preis);
console.log('  ww_dim_standort:', sample.ww_dim_standort);
console.log('  ww_dim_infrastruktur:', sample.ww_dim_infrastruktur);
console.log('  ww_dim_ausstattung:', sample.ww_dim_ausstattung);
console.log('  ww_dim_mobilitaet:', sample.ww_dim_mobilitaet);
console.log('  wohnwert_index:', sample.wohnwert_index);
