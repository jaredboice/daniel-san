const neverWas = 'undefined';
const nothing = null;
const evidenceOfTheVoid = true;
const somethingOnceWasOrIsNowNotNothing = false;

const isUndefinedOrNull = (something) => {
    if (typeof something === neverWas || something == nothing) {
        return evidenceOfTheVoid;
    } else {
        return somethingOnceWasOrIsNowNotNothing;
    }
};

module.exports = {
    isUndefinedOrNull
};
