## Requests Debugger
### Tool for debugging client side failure of requests, leading to requests getting dropped or not reaching BrowserStack.

## Features
- Proxy Server to intercept requests fired by client bindings to keep track of their flow.
- Connectivity Checker : To check for the reachability of BrowserStack components, i.e. Rails & Hub.
- Multi-Platform Stats Compatibility : Ability to collect stats of CPU, Network & Memory as and when required.
- Retry Mechanism in case a request fails at the client side

## How to run
- Code
  - Install all the packages required: `npm install`
  - Start Requests Debugger with the required arguments: `npm run start -- <args>`. 
  - Supported `args`:
    - `--proxy-host <hostname>`: Hostname of the Upstream Proxy
    - `--proxy-port <port>`: Port of the Upstream Proxy
    - `--proxy-user <username>`: Username for auth of the Upstream Proxy
    - `--proxy-pass <password>`: Password for auth of the Upstream Proxy
    - `--logs-path <relative/absolute path>`: Directory where the 'RequestsDebuggerLogs' folder will be created for storing logs. Default: Current Working Directory
    - `--del-logs`: Deletes any existing logs from the RequestsDebuggerLogs/ directory and initializes new files for logging
    - `--help`: Help for Requests Debugger
- Executable
  - Run the Platform Specific executable via terminal/cmd:
    - Mac: `./RequestsDebugger-Mac <args>`
    - Linux: `./RequestsDebugger-Linux <args>`
    - Windows: `RequestsDebugger.exe <args>`

## How to use
- Since the tool acts like a proxy, you will have to set the proxy to be used by your client binding to `localhost:9687`. i.e.
  - For Java:
    - ```
      System.getProperties().put("http.proxyHost", "localhost");
      System.getProperties().put("http.proxyPort", "9687");
      ```
  - For Ruby:
    - Set your system's env variable `http_proxy=localhost:9687` and Ruby's Selenium Client Binding will pick the value. Or,
    - Run you test by givig the environment variable to your command itself, i.e. `http_proxy=localhost:9687 ruby <your_script.rb>`
  - Similarly, you can also set proxy for other client bindings.
  
## Steps to build the executables
- Linux
  - `npm run build:linux`
- Mac OS X
  - `npm run build:mac`
- Windows
  - `npm run build:win`


## Note
- The tool is written in a manner to make it compatible with Node 4.