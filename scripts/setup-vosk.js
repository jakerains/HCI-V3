"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupVoskModel = setupVoskModel;
var fs = require("fs");
var path = require("path");
var https = require("https");
var unzipper = require("unzipper");
var mkdirp_1 = require("mkdirp");
var MODEL_NAME = 'vosk-model-small-en-us-0.15';
var VOSK_MODEL_URL = "https://alphacephei.com/vosk/models/".concat(MODEL_NAME, ".zip");
var MODEL_DIR = path.join(process.cwd(), 'models');
var MODEL_PATH = path.join(MODEL_DIR, MODEL_NAME);
var MODEL_ZIP = path.join(MODEL_DIR, 'model.zip');
function listDirectoryContents(dir, indent) {
    if (indent === void 0) { indent = ''; }
    console.log("".concat(indent, "Directory contents of ").concat(dir, ":"));
    var items = fs.readdirSync(dir);
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        var fullPath = path.join(dir, item);
        var stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            console.log("".concat(indent, "- [DIR] ").concat(item));
            listDirectoryContents(fullPath, indent + '  ');
        }
        else {
            console.log("".concat(indent, "- [FILE] ").concat(item, " (").concat(stats.size, " bytes)"));
        }
    }
}
function downloadFile(url, dest) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    console.log('Downloading Vosk model...');
                    var file = fs.createWriteStream(dest);
                    var request = https.get(url, function (response) {
                        if (response.statusCode !== 200) {
                            reject(new Error("Failed to download: ".concat(response.statusCode, " ").concat(response.statusMessage)));
                            return;
                        }
                        var totalSize = parseInt(response.headers['content-length'] || '0', 10);
                        var downloadedSize = 0;
                        response.on('data', function (chunk) {
                            downloadedSize += chunk.length;
                            var progress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 'unknown';
                            process.stdout.write("Download progress: ".concat(progress, "%\r"));
                        });
                        response.pipe(file);
                        file.on('finish', function () {
                            file.close();
                            console.log('\nDownload complete');
                            resolve();
                        });
                    });
                    request.on('error', function (err) {
                        fs.unlink(dest, function () { });
                        reject(err);
                    });
                    file.on('error', function (err) {
                        fs.unlink(dest, function () { });
                        reject(err);
                    });
                })];
        });
    });
}
function extractZip(source, dest) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    console.log('Extracting model...');
                    // Verify the zip file exists and has content
                    var stats = fs.statSync(source);
                    console.log("Zip file size: ".concat(stats.size, " bytes"));
                    if (stats.size === 0) {
                        reject(new Error('Downloaded zip file is empty'));
                        return;
                    }
                    var extract = unzipper.Extract({ path: dest });
                    extract.on('error', function (err) {
                        console.error('Extraction error:', err);
                        reject(err);
                    });
                    extract.on('entry', function (entry) {
                        console.log("Extracting: ".concat(entry.path));
                    });
                    extract.on('close', function () {
                        console.log('Extraction complete');
                        listDirectoryContents(dest);
                        resolve();
                    });
                    fs.createReadStream(source).pipe(extract);
                })];
        });
    });
}
function verifyModelFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var requiredFiles;
        return __generator(this, function (_a) {
            requiredFiles = [
                'am/final.mdl',
                'conf/mfcc.conf',
                'conf/model.conf',
                'graph/phones/word_boundary.int',
                'ivector/final.dubm',
            ];
            return [2 /*return*/, requiredFiles.every(function (file) {
                    var exists = fs.existsSync(path.join(MODEL_PATH, file));
                    if (!exists) {
                        console.log("Missing required file: ".concat(file));
                    }
                    return exists;
                })];
        });
    });
}
function setupVoskModel() {
    return __awaiter(this, void 0, void 0, function () {
        var zipStats, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, verifyModelFiles()];
                case 1:
                    // Check if model already exists and is valid
                    if (_a.sent()) {
                        console.log('Vosk model already installed');
                        return [2 /*return*/];
                    }
                    console.log('Setting up Vosk model in:', MODEL_DIR);
                    // Create models directory if it doesn't exist
                    return [4 /*yield*/, (0, mkdirp_1.mkdirp)(MODEL_DIR)
                        // Download the model
                    ];
                case 2:
                    // Create models directory if it doesn't exist
                    _a.sent();
                    // Download the model
                    return [4 /*yield*/, downloadFile(VOSK_MODEL_URL, MODEL_ZIP)
                        // Verify the downloaded file
                    ];
                case 3:
                    // Download the model
                    _a.sent();
                    zipStats = fs.statSync(MODEL_ZIP);
                    console.log("Downloaded file size: ".concat(zipStats.size, " bytes"));
                    if (zipStats.size === 0) {
                        throw new Error('Downloaded file is empty');
                    }
                    // Extract the model
                    return [4 /*yield*/, extractZip(MODEL_ZIP, MODEL_DIR)
                        // Clean up zip file
                    ];
                case 4:
                    // Extract the model
                    _a.sent();
                    // Clean up zip file
                    fs.unlinkSync(MODEL_ZIP);
                    // Final verification
                    console.log('Vosk model setup complete. Verifying model files:');
                    return [4 /*yield*/, verifyModelFiles()];
                case 5:
                    if (!(_a.sent())) {
                        throw new Error('Model files verification failed after setup');
                    }
                    listDirectoryContents(MODEL_DIR);
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error('Error setting up Vosk model:', error_1);
                    throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
