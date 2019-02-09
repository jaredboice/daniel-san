const { isArray, isMap, isSet, isObject, isUndefinedOrNull } = require('./validation');

function objectCopy(object) {
    const newObject = {};
    Object.keys(object).forEach((key) => {
        newObject[key] = cloneStrategy(object[key]);
    });
    return newObject;
}

function mapCopy(map) {
    const tempArray = [];
    const keys = [...map.keys()];
    const values = [...map.values()];
    keys.forEach((key, index) => {
        const newValue = cloneStrategy(values[index]); // value might be a reference to an iterable structure
        tempArray.push([key, newValue]); // the key should always be a primitive
    });
    const newMap = new Map(tempArray);
    return newMap;
}

function setCopy(set) {
    const tempArray = [];
    const setArray = [...set];
    setArray.forEach((element) => {
        tempArray.push(cloneStrategy(element));
    });
    const newSet = new Set(tempArray);
    return newSet;
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
    if (isUndefinedOrNull(entity)) {
        newEntity = entity; // immediately return undefined or null
    } else if (isMap(entity)) {
        newEntity = mapCopy(entity);
    }
    if (isSet(entity)) {
        newEntity = setCopy(entity);
    }
    if (isArray(entity)) {
        newEntity = arrayCopy(entity);
    } else if (isObject(entity)) {
        newEntity = objectCopy(entity);
    } else {
        newEntity = entity; // whatever it was it is and nothing further can or need be done about it
    }
    return newEntity;
}

function deepCopy(entity) {
    const newEntity = cloneStrategy(entity);
    return newEntity;
}

module.exports = { deepCopy, objectCopy, mapCopy, setCopy, arrayCopy, cloneStrategy };
