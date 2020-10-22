var exec = require('child_process').exec;
var os = require('os');
var cmd = "cp hooks/* .git/hooks/; chmod +x .git/hooks/*";
var cmdWin = "xcopy .\\hooks\\* .\\.git\\hooks\\ /Y";
var callback = function(error, stdout, stderr) {
   if (error) {
       console.log(`error: ${error.message}`);
       return;
   }
   if (stderr) {
       console.log(`stderr: ${stderr}`);
       return;
   }
};
if (os.type() === 'Linux') {
   exec(cmd, callback);
}
else if (os.type() === 'Darwin') {
   exec(cmd, callback);
}
else if (os.type() === 'Windows_NT') {
   exec(cmdWin, callback);
}
