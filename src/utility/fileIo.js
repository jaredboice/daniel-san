const fs = require('fs');
const path = require('path');
const { DEFAULT_JSON_SPACING } = require('../constants');

const defaultDirLevels = '/../../../../';

const createStream = ({
    filepath = null,
    filename = 'danielSanReport.txt',
    dirname = __dirname,
    defineEventHandlers = true
}) => {
    const defaultPath = path.resolve(`${dirname}${defaultDirLevels}`);
    if (!filepath) {
        filepath = path.resolve(`${defaultPath}/reports`);
    }
    const fullFilename = `${filename}`;
    const absolutePath = path.resolve(filepath, fullFilename);
    const fileStream = fs.createWriteStream(absolutePath);

    if (defineEventHandlers) {
        // the finish event is emitted when all data has been flushed from the stream
        fileStream.on('finish', () => {
            console.log(`wrote all contents to file ${absolutePath}`); // eslint-disable-line no-console
        });
        // handle the errors on the write process
        fileStream.on('error', (err) => {
            console.error(`there was an error writing the file ${absolutePath} => ${err}`); // eslint-disable-line no-console
        });
    }
    const writeStream = (content) => {
        fileStream.write(`${content}`);
    };
    return {
        fileStream,
        writeStream
    };
};

const closeStream = (fileStream) => {
    // close the stream
    fileStream.end();
};

const writeJsonToFile = ({ 
    filepath = null,
    filename = 'danielSanData.json',
    dirname = __dirname,
    json = {},
    jsonSpacing = DEFAULT_JSON_SPACING,
    onFinish = null,
    onError = null
}) => {
    const defaultPath = path.resolve(`${dirname}${defaultDirLevels}`);
    if (!filepath) {
        filepath = path.resolve(`${defaultPath}/data`);
    }
    const { fileStream } = createStream({ filepath, filename, defineEventHandlers: false });
    if (onFinish) {
        fileStream.on('finish', onFinish);
    }
    if (onError) {
        fileStream.on('error', onError);
    }
    fileStream.write(JSON.stringify(json, null, jsonSpacing));
    fileStream.end();
};

module.exports = {
    createStream,
    closeStream,
    writeJsonToFile
};
