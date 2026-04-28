const bcrypt = require('bcrypt');

const password = 'password123';

async function run() {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);

  const match = await bcrypt.compare(password, hash);
  console.log(match); // true
}

run();