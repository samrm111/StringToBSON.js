var mongojs = require('mongojs');
var mongodb = require('mongodb');
var safeEval = require('safe-eval');

var StringToBSON = function() {

    /**
     * Parse a string to a javascript object with BSON types
     * @param  {String} string The string to parse
     * @return {Object}        The result of the parsing
     */
    this.parse = function(string) {
        return safeEval(string, context);
    };

    /**
     * Convert an object containing BSON values to a formatted string
     * @param  {Object} obj       The object to parse
     * @param  {Boolean} formatted If set to true, new line at each objects
     * @return {String}           The result of the parsing
     */
    this.toString = function(obj, formatted) {
        formatted = typeof formatted == 'undefined' ? false : formatted;
        var newline = formatted ? '\n' : '';
        //create an array that will later be joined into a string.
        var string = [];

        //is object
        if (obj == undefined) {
            return String(obj);
        } else if (typeof(obj) == "object" && (obj.join == undefined)) {
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (obj[prop] instanceof mongodb.ObjectID) {
                        string.push(newline + prop + ': ' + 'ObjectID("' + obj[prop].toString() + "\")");
                    } else if (obj[prop] instanceof Date) {
                        string.push(newline + prop + ': ' + 'ISOString("' + obj[prop].toString() + "\")");
                    } else if (obj[prop] instanceof mongojs.Long) {
                        string.push(newline + prop + ': ' + 'NumberLong("' + obj[prop].toString() + "\")");
                    } else {
                        string.push(newline + prop + ': ' + this.toString(obj[prop]));
                    }

                }
            };
            return "{" + string.join(",") + newline + "}";

            //is array
        } else if (typeof(obj) == "object" && !(obj.join == undefined)) {
            for (prop in obj) {
                string.push(this.toString(obj[prop]));
            }
            return "[" + string.join(",") + "]";

            //is function
        } else if (typeof(obj) == "function") {
            string.push(newline + obj.toString())

            //all other values can be done with JSON.stringify
        } else {
            string.push(JSON.stringify(obj))
        }

        return string.join(",");
    };

    /**
     * Context that is passed to the safeEval function containing BSON types
     * @type {Object}
     */
    var context = {
        ObjectID: function(id) {
            try {
                return new mongojs.ObjectID(id);
            } catch (err) {
                throw 'Invalid ObjectID: ' + id;
            }
        },
        ISODate: function(ISOString) {
            return new Date(ISOString);
        },
        NumberLong: function(number) {
            return mongojs.Long.fromString(number);
        },
        Date: function(dateString) {
            return new Date(dateString);
        }
    };
}
module.exports = new StringToBSON();
