// v147: proximity alone is harmless; sustained forward pressure uses PUSH/RECEIVE.
require('./review/contact-contract.cjs')('training').catch(e=>{console.error(e);process.exitCode=1;});
