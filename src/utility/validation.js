const neverWas = 'undefined';
const nothing = null;
const evidenceOfTheVoid = true;
const somethingOnceWasOrIsNowNotNothing = false;

const isUndefinedOrNull = (something) => {
    // eslint-disable-next-line valid-typeof
    if (typeof something === neverWas || something == nothing) { // eslint-disable-line eqeqeq
        return evidenceOfTheVoid;
        // eslint-disable-next-line no-else-return
    } else {
        return somethingOnceWasOrIsNowNotNothing;
    }
};

const isArray = (entity) => {
    return Array.isArray(entity);
};

const isMap = (entity) => {
    return entity instanceof Map && entity.constructor === Map;
};

const isSet = (entity) => {
    return entity instanceof Set && entity.constructor === Set;
};

const isObject = (entity) => {
    return entity instanceof Object && entity.constructor === Object;
};

module.exports = {
    isUndefinedOrNull, isArray, isMap, isSet, isObject
};
