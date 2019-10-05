const getRandomMiyagiQuote = () => {
    const quotes = [
        "'First learn balance. Balance good, karate good, everything good.\nBalance bad, might as well pack up, go home.'",
        "'To make honey, young bee need young flower, not old prune.'",
        "'Look eye! Always look eye!'",
        "'Daniel-san, you much humor!'",
        "'First learn stand, then learn fly. Nature rule, Daniel-san, not mine.'",
        "'You remember lesson about balance? Lesson not just karate only.\nLesson for whole life. Whole life have a balance. Everything be better.'",
        "'Banzai, Daniel-san!'",
        "'In Okinawa, all Miyagi know two things: fish and karate.'",
        "'Show me, sand the floor'",
        "'Show me, wax on, wax off'",
        "'Show me, paint the fence'",
        "'Called crane technique. If do right, no can defence.'",
        "'License never replace eye, ear and brain.'",
        "'Learn balance Daniel san... Wax-on... Wax-off.'",
        "'It’s ok to lose to opponent. It’s never okay to lose to fear'",
        "'Better learn balance. Balance is key. Balance good, karate good.\nEverything good. Balance bad, better pack up, go home. Understand?'",
        "'Never put passion in front of principle, even if you win, you’ll lose'",
        "'Either you karate do 'yes' or karate do 'no'\nYou karate do 'guess so,' (get squished) just like grape.'",
        "'Never trust spiritual leader who cannot dance.'",
        "'If come from inside you, always right one.'",
        "'Walk on road, hm? Walk left side, safe. Walk right side, safe.\nWalk middle, sooner or later...get squish just like grape'",
        "'Daniel-San, lie become truth only if person wanna believe it.'",
        "'Wax on, wax off. Wax on, wax off.'",
        "'Man who catch fly with chopstick, accomplish anything.'",
        "'If karate used defend honor, defend life, karate mean something.\nIf karate used defend plastic metal trophy, karate no mean nothing.'",
        "'Wax-on, wax-off.'",
        "'You trust the quality of what you know, not quantity.'",
        "'For person with no forgiveness in heart, living even worse punishment than death.'",
        "'In Okinawa, belt mean no need rope to hold up pants.'",
        "'Miyagi have hope for you.'",
        "'First, wash all car. Then wax. Wax on...'",
        "'Wax on, right hand. Wax off, left hand. Wax on, wax off. \nBreathe in through nose, out the mouth. Wax on, wax off.\nDon't forget to breathe, very important.'",
        "'Karate come from China, sixteenth century, called te, 'hand.'\nHundred year later, Miyagi ancestor bring to Okinawa,\ncall *kara*-te, 'empty hand.''",
        "'No such thing as bad student, only bad teacher. Teacher say, student do.'",
        "'Now use head for something other than target.'",
        "'Make block. Left, right. Up, down. Side, side.\nBreathe in, breathe out. And no scare fish.'",
        "'Ah, not everything is as seems...'",
        "'What'sa matter, you some kind of girl or something?'",
        "'Punch! Drive a punch! Not just arm, whole body! \nHip, leg, drive a punch! Make 'kiai.' Kiai! Kiai!\nGive you power. Now, try punch.'",
        "'I tell you what Miyagi think! I think you *dance around* too much!\nI think you *talk* too much! I think you not concentrate enough!\nLots of work to be done! Tournament just around the corner!\nCome. Stand up! Now, ready. Concentrate. Focus power.'",
        "'We make sacred pact. I promise teach karate to you, you promise learn.\nI say, you do, no questions.'",
        "'Choose.'"
    ];
    const elementIndex = Math.floor(Math.random() * quotes.length);
    return `${quotes[elementIndex]} -Miyagi-`;
};

module.exports = {
    getRandomMiyagiQuote
}