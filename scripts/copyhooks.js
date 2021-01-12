const fs = require('fs');
const path = require('path');

const srcDir = './hooks/';
const dstDir = './.git/hooks/'

fs.readdirSync(srcDir).forEach(file => {
  const srcFile = path.join(srcDir, file);
  const dstFile = path.join(dstDir, file);
  fs.createReadStream(srcFile).pipe(fs.createWriteStream(dstFile));
  fs.chmodSync(dstFile , '755');
});
