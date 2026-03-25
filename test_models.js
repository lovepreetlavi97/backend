const models = require('./src/models/index');
console.log('Models keys:', Object.keys(models).sort());
console.log('Relation:', !!models.Relation);
console.log('Gift:', !!models.Gift);
