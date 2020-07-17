## Requests Debugger
### Tool for debugging client side failure of requests, leading to requests getting dropped or not reaching BrowserStack.

## Features
- Proxy Server to intercept requests fired by client bindings to keep track of their flow.
- Connectivity Checker : To check for the reachability of BrowserStack components, i.e. Rails & Hub.
- Multi-Platform Stats Compatibility : Ability to collect stats of CPU, Network & Memory Stats.
- Retry Mechanism in case a request fails at the client side

## How to run
- Code
  - Install all the required packages: `npm install`
  - Start Requests Debugger with the required arguments: `npm run start -- <args>`. 
  - Supported `args`:
    - `--port <port>`: Port on which the Requests Debugger Tool's Proxy will run. Default: 9687
    - `--proxy-host <hostname>`: Hostname of the Upstream Proxy
    - `--proxy-port <port>`: Port of the Upstream Proxy. Default: 3128 (if hostname is provided)
    - `--proxy-user <username>`: Username for auth of the Upstream Proxy
    - `--proxy-pass <password>`: Password for auth of the Upstream Proxy. Default: empty (if username is provided)
    - `--retry-delay <milliseconds>`: Delay for the retry of a failed request. Default: 1000ms
    - `--request-timeout <milliseconds>`: Hard timeout for killing the requests being fired from the tool before receiving any response. Default: 260000ms.
    - `--logs-path <relative/absolute path>`: Directory where the 'RequestsDebuggerLogs' folder will be created for storing logs. Default: Current Working Directory
    - `--del-logs`: Deletes any existing logs from the RequestsDebuggerLogs/ directory and initializes new files for logging
    - `--help`: Help for Requests Debugger Tool
    - `--version`: Version of the Requests Debugger Tool
- Executable
  - Run the Platform Specific executable via terminal/cmd:
    - Mac: `./RequestsDebugger-Mac <args>`
    - Linux: `./RequestsDebugger-Linux-x86/x64 <args>`
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
    - Run you test by giving the environment variable to your command itself, i.e. `http_proxy=localhost:9687 ruby <your_script.rb>`
  - Similarly, you can also set proxy for other client bindings.
  
## Steps to build the executables
- Linux
  - `npm run build:linux`
- Mac OS X
  - `npm run build:mac`
- Windows
  - `npm run build:win`

## What each log file consists of?
- `Connectivitiy.log`
  - It consists the logs of all the connectivity checks which were performed in terms of reachability with BrowserStack componenets, i.e. Hub and Rails.
  - The report includes HTTP & HTTPS requests by passing the requests via any upstream proxy (if provided).
  - New checks are performed whenever a request fails.
- `CPUStats.log`
  - It consists of the load and usage stats of user's CPU while booting up the Requests Debugger Tool. It lists down the top 10 processes which were using the highest CPU at that moment. Note: For Windows, it only includes the `loadPercentage` at that moment.
- `MemStats.log`
  - It consists of the memory stats of the user's machine while booting up the tool. It includes:
    - Total Memory
    - Free Memory
    - Used Memory
    - Swap Total
    - Swap Free
    - Swap Used
- `NetworkStats.log`
  - It consists the list of connections/sockets being established/listening via the user's machine.
  - It also includes the report of ping checks with Hub & Rails.
  - New stats are appended whenever a request fails.
- `Requests.log`
  - It includes the logs of requests being passed via the Requests Debugger Tool.
  - Example Logs:
    - ```
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Request Start] [INFO] POST http://<URL>/wd/hub/status, {"headers":{"......."}}
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Request End] [INFO] POST http://<URL>/wd/hub/status, {"data":"{\"key\": \"value\"}"}
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Tool Request - Retries Left: 1] [INFO] POST http://<URL>/wd/hub/status, {"method":"POST","headers":{".......","Proxy-Authorization":"Basic AaBbCcDdEeFfGg==","X-Requests-Debugger":"2::UNIQUE_IDENTIFIER"},"host":"<EXTERNAL_PROXY_URL>","port":"3130","path":"http://<URL>/wd/hub/status","data":"{\"key\": \"value\"}"}
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Tool Request - Retries Left: 1] [ERROR] POST http://<URL>/wd/hub/status, {"errorMessage":"Error: getaddrinfo ENOTFOUND <EXTERNAL_PROXY_URL> <EXTERNAL_PROXY_URL>:3130"}
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Tool Request - Retries Left: 0] [ERROR] POST http://<URL>/wd/hub/status, {"errorMessage":"Error: getaddrinfo ENOTFOUND <EXTERNAL_PROXY_URL> <EXTERNAL_PROXY_URL>:3130"}
      TIMESTAMP_IN_UTC [#2::UNIQUE_IDENTIFIER] [Response End] [ERROR] POST http://<URL>/wd/hub/status, Status Code: 502, {"message":"Error: getaddrinfo ENOTFOUND <EXTERNAL_PROXY_URL> <EXTERNAL_PROXY_URL>:3130. Request Failed At Requests Debugger","error":"Request Failed At Requests Debugger"}
  - Tags & their meaning:
    - **TIMESTAMP_IN_UTC** : Timestamp of each event in UTC.
    - **#2** : This represents the `nth` request which the tool served from the time it was started.
    - **UNIQUE_IDENTIFIER** : `uuid` for the request. This is used in `X-Requests-Debugger` custom header for usage & debugging at BrowserStack's end.
    - **Request Start** : Client request entering the Requests Debugger Tool.
    - **Request End** : This is logged when the client request is finished, i.e. in case of `POST` request, when the client request has pushed all the data.
    - **Tool Request - Retries Left: X** : Request which was fired from the tool for the respective client request. It also mentions the retries left for the request. Max retries = 1. A request is retried in case it fails at the tool itself, i.e `ENOTFOUND` etc.
    - **Response End** : This specifies the response which was finally sent to the client.
- `RDT_Error.log`
  - This is to log any unexpected errors which might occur while using the tool.


## Note
- The tool is written in a manner to make it compatible with Node 4.4.0.
- `npm test` sets up a server which runs on port 8787.
- Building the executables require Node >=4.9.1. 
