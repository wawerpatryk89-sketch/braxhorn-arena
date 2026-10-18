// v147: proximity alone is harmless; sustained forward pressure uses PUSH/RECEIVE.
require('./review/contact-contract.cjs')('deadline').catch(e=>{console.error(e);process.exitCode=1;});
