## Network Utility Tool
### Tool for debugging client side failure of requests, leading to requests getting dropped or not reaching BrowserStack.

## Features
- Proxy Server to intercept requests fired by client bindings to keep track of their flow.
- Connectivity Checker : To check for the reachability of BrowserStack components, i.e. Rails & Hub.
- Multi-Platform Stats Compatibility : Ability to collect stats of CPU, Network & Memory as and when required.

## How to run
- Code
  - Install all the packages required: `npm install`
  - Start Network Utility Tool with the required arguments: `npm start -- <args>`. 
  - Supported `args`:
    - `--proxy-host <hostname>`: Hostname of the external proxy via which the requests should pass.
    - `--proxy-port <port>`: Port of the external proxy via which the requests should pass.
    - `--proxy-user <username>`: Username of the external proxy for authentication
    - `--proxy-pass <password>`: Password of the external proxy for authentication
    - `--del-logs`: Deletes any existing logs from the NWT_Logs/ directory and initializes new files for logging. Refer 'NWT_Logs/' directory in the same directory  where the Network Utility Tool exists. Default : `false`.
    - `--help`: Help for Network Utility Tool
- Executable
  - Run the Platform Specific executable via terminal/cmd:
    - Mac: `./NWTool-Mac <args>`
    - Linux: `./NWTool-Linux <args>`
    - Windows: `NWTool.exe <args>`
  
## Steps to build the executables
- Linux
  - `./node_modules/pkg/lib-es5/bin.js -t node4-linux src/node.js`
- Mac OS X
  - `./node_modules/pkg/lib-es5/bin.js -t node4-macos src/node.js`
- Windows
  - `./node_modules/pkg/lib-es5/bin.js -t node4-win src/node.js`


## Note
- The tool is written in a manner to make it compatible with Node 4.