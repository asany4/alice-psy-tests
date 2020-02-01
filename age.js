const START_AGE = 72;
const intents = {
    agree: ['да', 'конечно', 'верно', 'разумеется', 'обязательно', 'естественно'],
    disagree: ['нет', 'неверно']
};

const getNumber = ctx => {
    const number = ctx.nlu && ctx.nlu && ctx.nlu.entities && ctx.nlu.entities.find(i => i.type === 'YANDEX.NUMBER');
    return number && number.value;
}

// проверяет соответствие запроса пользователя ожидаемому ответу
const checkAnswer = function(ctx, intent) {
    if (typeof intent === 'function') {
        return intent(ctx);
    } else {
        return [].concat(intent).includes(ctx.message.toLowerCase());
    }
}

// задает вопрос по индексу. Может добавить текст preText перед вопросом
const askQuestion = function(testData, questionIndex = 0, preText) {
    if (!questions[questionIndex] || !questions[questionIndex].text) return askQuestion(0);
    testData.lastQuestion = questionIndex;

    var preText

    return {
        text: preText ? 
            `${preText} ${questions[questionIndex].text}` : 
            questions[questionIndex].text,
        tts: preText ? 
            `${preText} sil <[500]> ${questions[questionIndex].text}` : 
            questions[questionIndex].text,
    }
};



// подсчитывает и интерпретирует результат
const sayResult = function(testData) {
    const lastNum = testData.result % 10;
    return {
        text: `Люди с похожим образом жизни доживают в среднем до ${testData.result} лет. Но вы будете жить вечно!`,
        endTest: true
    };
};

/**
 * @typedef Question
 * 
 * @property {String} text
 * @property {Answer[]} answers
 */

 /**
 * @typedef Answer
 * 
 * @property {String|String[]|function} intent
 * @property {Number} value
 * @property {String|String[]} postMessage
 * @property {Number} skipNext
 */

const questions = [
    {
        text: 'Вы мужчина или женщина?',
        answers: [
            {
                intent: ['мужской', 'мужчина', 'парень', 'мальчик', 'мужик'],
                value: -3,
            },
            {
                intent: ['женский', 'женщина', 'девушка', 'девочка', 'баба'],
                value: 0,
                postMessage: 'Я тоже!',
            }
        ]
    },
    {
        text: 'В вашем городе проживает больше миллиона человек?',
        answers: [
            {
                intent: intents.agree.concat('больше'),
                value: -2,
                skipNext: 1
            },
            {
                intent: intents.disagree.concat('меньше'),
                value: 0,
            }
        ]
    },
    {
        text: 'Может быть, меньше десяти тысяч?',
        answers: [
            {
                intent: intents.agree.concat('меньше'),
                value: 0,
            },
            {
                intent: intents.disagree.concat('больше'),
                value: 0,
            }
        ]
    },
    {
        text: 'Вы занимаетесь спортом хотябы три раза в неделю?',
        answers: [
            {
                intent: intents.agree,
                value: 3,
                postMessage: 'Давайте заниматься вместе.'
            },
            {
                intent: intents.disagree,
                value: 0,
                postMessage: 'А зря…'
            }
        ]
    },
    {
        text: 'Вы состоите в браке?',
        answers: [
            {
                intent: intents.agree,
                value: 5,
                postMessage: 'Зато не скучно!'
            },
            {
                intent: intents.disagree,
                value: 0,
                postMessage: 'Как я вас понимаю…'
            }
        ]
    },
    {
        text: 'Вы часто спите меньше семи часов в сутки?',
        answers: [
            {
                intent: intents.agree.concat('постоянно'),
                value: -3,
                postMessage: 'Зато не скучно!'
            },
            {
                intent: intents.disagree.concat('иногда', 'бывает'),
                value: 0,
                postMessage: 'Как я вас понимаю…'
            }
        ]
    },
    {
        text: 'Вы курите?',
        answers: [
            {
                intent: intents.agree,
                value: 0,
                skipNext: 0
            },
            {
                intent: intents.disagree,
                value: 0,
                postMessage: 'Похвально! А я все никак не брошу.',
                skipNext: 1
            }
        ]
    },
    {
        text: 'Сколько пачек в день вы в среднем выкуриваете?',
        answers: [
            {
                intent: function(ctx) {
                    const n = getNumber(ctx);
                    return n && n <= 2;
                },
                value: -3,
                skipNext: 0
            },
            {
                intent: function(ctx) {
                    const n = getNumber(ctx);
                    return n && 2 < n && n <= 5;
                },
                value: -5,
                skipNext: 0
            },
            {
                intent: function(ctx) {
                    const n = getNumber(ctx);
                    return n && 5 < n;
                },
                value: -8,
                postMessage: 'Удивительно, что вы еще живы…',
                skipNext: 0
            }
        ]
    },
    {
        text: 'Ваша работа связана больше с физическим или умственным трудом?',
        answers: [
            {
                intent: ['физическим', 'физический', 'физически', 'первое'],
                value: -3,
            },
            {
                intent: ['умственным', 'умственный', 'умственно', 'второе'],
                value: 3,
            }
        ]
    },
    // {
    //     text: 'Сколько раз вы пили алкоголь на прошлой неделе?',
    //     answers: [
    //         {
    //             intent: function(ctx) {
    //                 const n = getNumber(ctx);
    //                 return n && 1 < n;
    //             },
    //             value: -1,
    //             skipNext: 0
    //         },
    //         {
    //             intent: function(ctx) {
    //                 const n = getNumber(ctx);
    //                 return n && n <= 1;
    //             },
    //             value: 0,
    //             skipNext: 0
    //         }
    //     ]
    // }
];

module.exports.AgeTest = function(ctx, session) {
    session.testData = session.testData || {};
    const { testData } = session;
    const { lastQuestion } = testData;

    if (typeof lastQuestion === 'undefined') {
        testData.result = START_AGE;
        return askQuestion(testData, 0);
    } else if (questions[lastQuestion]) {
        const question = questions[lastQuestion];
        
        for (let i = 0; i < question.answers.length; i++) {
            const answer = question.answers[i];
            const isValidAnswer = checkAnswer(ctx, answer.intent);
            
            if (!isValidAnswer) continue;

            testData.result += answer.value;
            const nextQuestion = lastQuestion + 1 + (answer.skipNext || 0);

            return nextQuestion >= questions.length ?
                sayResult(testData) :
                askQuestion(testData, nextQuestion, answer.postMessage);
        }

        return askQuestion(testData, lastQuestion, 'Я не поняла.');
    } else {
        return askQuestion(testData, 0, 'Я ничего не понимаю. Придется начать сначала.');
    }

};