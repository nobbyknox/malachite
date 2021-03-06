'use strict';

let moment = require('moment');


function currentDatestamp() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Gets the relevant environmental configuration. When no argument is specified,
 * the MALACHITE_ENV environment variable is used to determine which config to return.
 *
 * @param env
 */
function getConfig(env) {

    let theEnv = env || process.env.MALACHITE_ENV || 'development';
    let config = null;

    if (theEnv === 'development') {
        try {
            config = require('../config/private.json');
            if (config) {
                console.log('Found private.json config file');
            }
        } catch(exc) {
            console.log('No "private.json" config found');
        }
    }

    if (!config) {
        config = require('../config/' + theEnv + '.json');
        console.log('Found ' + theEnv + '.json config file');
    }

    return config;

}

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
    currentDatestamp: currentDatestamp,
    getConfig: getConfig
};
