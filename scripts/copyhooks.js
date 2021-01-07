const fs = require('fs'); 

const srcDir = './hooks/';
const dstDir = './.git/hooks/'

fs.readdirSync(srcDir).forEach(file => {
  srcFile = srcDir + "/" + file;
  dstFile = dstDir + "/" + file;
  fs.createReadStream(srcFile).pipe(fs.createWriteStream(dstFile));
  fs.chmodSync(srcFile , '755');
});
