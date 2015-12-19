'use strict';

// TODO: This class needs a better name.
module.exports = class ValidationError extends Error {

    constructor(message) {
        this.addError(message);
    };

    /**
     * Adds an unnamed error.
     * @param message
     */
    addError(message) {
        if (!this.messages) {
            this.messages = {};
        }

        if (this.messages.unnamed) {
            this.messages.unnamed.push(message);
        } else{
            this.messages.unnamed = [message];
        }
    };

    /**
     * Adds a named error.
     * @param property
     * @param message
     */
    addPropError(property, message) {
        if (!this.messages) {
            this.messages = {};
        }

        if (this.messages[property]) {
            this.messages[property].push(message);
        } else {
            this.messages[property] = [message];
        }
    };

    /**
     * Gets the messages object containing all named and unnamed errors.
     * @returns {{}|*}
     */
    getMessages() {
        return this.messages;
    };

    /**
     * Gets an array of unnamed errors.
     * @returns {Array}
     */
    getErrors() {
        return this.messages.unnamed;
    };

    /**
     * Gets an array of errors for the specified property.
     * @param property
     * @returns {Array}
     */
    getErrorsOf(property) {
        return this.messages[property];
    };

    /**
     * Gets an array of all named and unnamed errors.
     * @returns {Array}
     */
    getAllErrors() {
        let list = [];

        for (let p in this.messages) {
            list = list.concat(this.messages[p]);
        }

        return list;
    };

    /**
     * Indicates whether an error is present or not.
     * @returns {boolean}
     */
    hasErrors() {
        return this.getAllErrors().length > 0;
    };
};
