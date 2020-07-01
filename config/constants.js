module.exports.VERSION = '1.0.0';
module.exports.NO_REPORT_GENERATED = 'COULD NOT GENERATE REPORT FOR : ';
module.exports.HUB_STATUS_URL = 'http://hub-cloud.browserstack.com/wd/hub/status';
module.exports.RAILS_AUTOMATE = 'http://automate.browserstack.com';
module.exports.RD_HANDLER_PORT = process.env.NODE_ENV === 'test' ? 8787 : 9687;
module.exports.CONNECTIVITY_REQ_TIMEOUT = 20000;
module.exports.CLIENT_REQ_TIMEOUT = 50000;
module.exports.DEFAULT_PROXY_PORT = '3128';
module.exports.MAX_RETRIES = 1;
module.exports.REQ_TIMED_OUT = 'Request Timed Out. Did not get any response for ' + this.CLIENT_REQ_TIMEOUT + ' ms.';
module.exports.REQ_FAILED_MSG = 'Request Failed At Requests Debugger';
module.exports.PORTS = {
  MAX: 65535,
  MIN: 1
};
module.exports.LOGS = Object.freeze({
  NETWORK: 'NetworkStats.log',
  CPU: 'CPUStats.log',
  MEM: 'MemStats.log',
  REQUESTS: 'Requests.log',
  CONNECTIVITY: 'Connectivity.log',
  ERROR: 'RDT_Error.log'
});
module.exports.RdGlobalConfig = {};
module.exports.COMMON = Object.freeze({
  PING_HUB: 'ping -c 5 hub-cloud.browserstack.com',
  PING_AUTOMATE: 'ping -c 5 automate.browserstack.com'
});

module.exports.MAC = Object.freeze({
  TCP_LISTEN_ESTABLISHED: 'lsof -PiTCP',
  TOP_3_SAMPLES: 'top -n 10 -l 3 -stats pid,command,cpu,cpu_others,time,threads,ports,mem,vsize,pgrp,ppid,cycles',
  SWAP_USAGE: 'sysctl -n vm.swapusage'
});

module.exports.LINUX = Object.freeze({
  TCP_LISTEN_ESTABLISHED: 'lsof -PiTCP',
  TOP_3_SAMPLES: 'top -bn 3',
  PROC_MEMINFO: '/proc/meminfo'
});

module.exports.WIN = Object.freeze({
  NETSTAT_TCP: 'netstat -anosp tcp',
  NETSTAT_ROUTING_TABLE: 'netstat -r',
  IPCONFIG_ALL: 'ipconfig /all',
  SWAP_USAGE: 'pagefile get AllocatedBaseSize, CurrentUsage', // this is a WMIC command. Prefix with WMIC Path
  PING_HUB: 'ping -n 5 hub-cloud.browserstack.com',
  PING_AUTOMATE: 'ping -n 5 automate.browserstack.com',
  LOAD_PERCENTAGE: 'cpu get loadpercentage', // prefix wmic path
});
