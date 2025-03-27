const Logger = {
    levels: {
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error'
    },

    styles: {
        debug: 'color: #7f7f7f',
        info: 'color: #0066ff',
        warn: 'color: #ff9900; font-weight: bold',
        error: 'color: #ff0000; font-weight: bold'
    },

    debug(message, data = null) {
        this._log(this.levels.DEBUG, message, data);
    },

    info(message, data = null) {
        this._log(this.levels.INFO, message, data);
    },

    warn(message, data = null) {
        this._log(this.levels.WARN, message, data);
    },

    error(message, error = null) {
        this._log(this.levels.ERROR, message, error);
        if (error && error.stack) {
            console.error(error.stack);
        }
    },

    _log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        console.groupCollapsed(`${prefix} ${message}`);
        console.log(`%c${message}`, this.styles[level]);
        
        if (data) {
            console.log('Data:', data);
        }
        
        console.groupEnd();
    }
};

window.Logger = Logger;