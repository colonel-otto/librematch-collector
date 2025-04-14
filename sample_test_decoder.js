// sample_test_decoder.js
// Simple script to decode Age of Empires 2 match options 
// Based on librematch-collector code
// At the end of the script, update or hardcode your options string.
// Dependencies (install with: npm install pako)
const pako = require('pako');

// Base64 utility functions (from util.ts)
const Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    },
    _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        let c = 0;
        let c1 = 0;
        let c2 = 0;
        let c3 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
};

// Decompress zlib (from util.ts)
function decompressZlib(str) {
    // Convert base64 to binary
    let compressData = Buffer.from(str, 'base64');
    // Decompress using pako
    return pako.inflate(compressData, { to: 'string' });
}

// Option parsing functions (from options.ts)
function decompressOptions(str) {
    try {
        const optionsBase64 = decompressZlib(str);
        try {
            const optionsStr = Base64.decode(optionsBase64);
            // Split by control characters
            return optionsStr.split(/[\x00-\x1F]+/);
        } catch (e) {
            throw new Error(`Could not base64 decode settings: ${optionsBase64}`);
        }
    } catch (e) {
        throw new Error(`Could not decompress settings: ${str}`);
    }
}

function getSettingByKeyOrNull(settings, key) {
    const entry = settings.find(x => x.startsWith(`${key}:`));
    return entry ? entry.substr(entry.indexOf(':') + 1) : null;
}

function parseOption(value, type) {
    switch (type) {
        case 'int':
            return value ? parseInt(value) : null;
        case 'bool':
            return value ? value === 'y' : null;
        case '!bool':
            return value ? value !== 'y' : null;
    }
}

// Define the option mappings (simplified from options.ts)
const optionsMapBeforeReturnOfRomeRelease = {
    0: { name: 'starting_age', type: 'int' },
    1: { name: 'allow_cheats', type: 'bool' },
    5: { name: 'ending_age', type: 'int' },
    6: { name: 'game_mode', type: 'int' },
    9: { name: 'map_size', type: 'int' },
    11: { name: 'location', type: 'int' },
    29: { name: 'population', type: 'int' },
    38: { name: 'resources', type: 'int' },
    42: { name: 'speed', type: 'int' },
    57: { name: 'privacy', type: 'int' },
    58: { name: 'treaty_length', type: 'int' },
    62: { name: 'difficulty', type: 'int' },
    63: { name: 'full_tech_tree', type: 'bool' },
    66: { name: 'lock_speed', type: 'bool' },
    67: { name: 'lock_teams', type: '!bool' },
    76: { name: 'record_game', type: 'bool' },
    77: { name: 'shared_exploration', type: '!bool' },
    78: { name: 'team_positions', type: 'bool' },
    79: { name: 'team_together', type: 'bool' },
    80: { name: 'turbo_mode', type: '!bool' },
    82: { name: 'victory', type: 'int' },
    83: { name: 'reveal_map', type: 'int' },
    90: { name: 'empire_wars_mode', type: '!bool' },
    91: { name: 'sudden_death_mode', type: '!bool' },
    92: { name: 'regicide_mode', type: '!bool' },
};

const optionsMapAfterReturnOfRomeRelease = {
    0: { name: 'starting_age', type: 'int' },
    1: { name: 'allow_cheats', type: 'bool' },
    4: { name: 'ending_age', type: 'int' },
    5: { name: 'game_mode', type: 'int' },
    8: { name: 'map_size', type: 'int' },
    10: { name: 'location', type: 'int' },
    28: { name: 'population', type: 'int' },
    37: { name: 'resources', type: 'int' },
    41: { name: 'speed', type: 'int' },
    56: { name: 'privacy', type: 'int' },
    57: { name: 'treaty_length', type: 'int' },
    61: { name: 'difficulty', type: 'int' },
    62: { name: 'full_tech_tree', type: 'bool' },
    65: { name: 'lock_speed', type: 'bool' },
    66: { name: 'lock_teams', type: '!bool' },
    75: { name: 'record_game', type: 'bool' },
    76: { name: 'shared_exploration', type: '!bool' },
    77: { name: 'team_positions', type: 'bool' },
    78: { name: 'team_together', type: 'bool' },
    79: { name: 'turbo_mode', type: '!bool' },
    81: { name: 'victory', type: 'int' },
    82: { name: 'reveal_map', type: 'int' },
    89: { name: 'empire_wars_mode', type: '!bool' },
    90: { name: 'sudden_death_mode', type: '!bool' },
    91: { name: 'regicide_mode', type: '!bool' },
    97: { name: 'game_variant', type: 'int' },
};

function parseOptions(options) {
    const optionsDict = {};
    const gameVariant = getSettingByKeyOrNull(options, '97');
    const optionsMap = gameVariant == null ? optionsMapBeforeReturnOfRomeRelease : optionsMapAfterReturnOfRomeRelease;

    for (const optionNum of Object.keys(optionsMap)) {
        const value = getSettingByKeyOrNull(options, optionNum);
        const option = optionsMap[optionNum];
        optionsDict[option.name] = parseOption(value, option.type);
    }

    return optionsDict;
}

// Main function to analyze the encoded string
function analyzeEncodedOptions(encodedString) {
    try {
        console.log("Decoding options string...");
        const options = decompressOptions(encodedString);
        console.log("Raw options array:", options);
        
        console.log("\nParsing settings...");
        const parsedOptions = parseOptions(options);
        console.log("Parsed options:", JSON.stringify(parsedOptions, null, 2));
        
        return parsedOptions;
    } catch (error) {
        console.error("Error analyzing options:", error);
        return null;
    }
}

// Example usage
const encodedString="eNq91UlPg0AUB3A/y5zRMAvLNPFSWxqIrS1bF+NhCtOUsJQAmlTjd7cQDSGKZjxwegPzmEl++ecBkfT4BvLidIgSbmaH000UghHRCVQplkBZsSo6ZeYEjKAEKs7SeilL4MCCr43LU8EC3vTo9TqL7/kLTz53snjOquDonvOm5bo+J0r5khdGwVI+d5q+qLQ5C8/NNfWlz2XzOuUVm7CKgREwYwPbnjFeeQZe+U2drny7rmPftR72M6uys+Tovyb2Ng5nCz/fOnEe7X2r3HmGUfetNuFdU72dszeSzXxqNd+7m4AuHfMWvEvfMZCmQJ3SDgZqMWAfhjKshS1scRS3uKRCpbrascCtBeqzwNqwGI4wRvIzxvoXDKzKMiIdC9Ja4D4LRIe1cIUtcnELhHWNkC6G0mKQ3mAMa+GJWrhjcQsIsQ4VTe5gqC2G0puMgUeGL6xh/CMZKkEQ6R0MrcVQe/8laFiMtTCGJT4/KVGhTLvzU28xtN5kwGExtlAUY/EHxtPVB2pnpa8=";
analyzeEncodedOptions(encodedString);
