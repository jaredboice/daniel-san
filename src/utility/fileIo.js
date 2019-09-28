const fs = require('fs');
const path = require('path');

const createStream = ({ filepath = null, filename = null, extension = 'txt', dirname }) => {
    if (!filename) {
        filename = 'daniel-san-report';
    }
    if (!filepath) {
        filepath = path.resolve(`${dirname}/../../reports`);
    }
    const fullFilename = extension ? `${filename}.${extension}` : `${filename}`;
    const absolutePath = path.resolve(filepath, fullFilename);
    const fileStream = fs.createWriteStream(absolutePath);
    // the finish event is emitted when all data has been flushed from the stream
    fileStream.on('finish', () => {
        console.log(`wrote all contents to file ${absolutePath}`); // eslint-disable-line no-console
    });
    // handle the errors on the write process
    fileStream.on('error', (err) => {
        console.error(`there was an error writing the file ${absolutePath} => ${err}`); // eslint-disable-line no-console
    });
    const writeStream = (content) => {
        fileStream.write(`${content}\n`);
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

module.exports = {
    createStream,
    closeStream
};
