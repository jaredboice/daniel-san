const { isArray, isMap, isSet, isObject } = require('./validation');

function objectCopy(object) {
    const newObject = {};
    Object.keys(object).forEach((key) => {
        newObject[key] = cloneStrategy(object[key]);
    });
    return newObject;
}

function arrayCopy(array) {
    const newArray = [];
    array.forEach((element) => {
        newArray.push(cloneStrategy(element));
    });
    return newArray;
}

function cloneStrategy(entity) {
    let newEntity;
    if (isArray(entity) || isMap(entity) || isSet(entity)) {
        newEntity = arrayCopy(entity);
    } else if (isObject(entity)) {
        newEntity = objectCopy(entity);
    } else {
        newEntity = entity;
    }
    return newEntity;
}

function deepCopy(entity) {
    const newEntity = cloneStrategy(entity);
    return newEntity;
}

module.exports = { deepCopy };
