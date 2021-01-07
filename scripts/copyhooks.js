const fs = require('fs');
const path = require('path');

const srcDir = './hooks/';
const dstDir = './.git/hooks/'

fs.readdirSync(srcDir).forEach(file => {
  srcFile = path.join(srcDir, file);
  dstFile = path.join(dstDir, file);
  fs.createReadStream(srcFile).pipe(fs.createWriteStream(dstFile));
  fs.chmodSync(srcFile , '755');
});
