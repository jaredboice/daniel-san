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

module.exports = {
    isUndefinedOrNull
};
