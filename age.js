const intents = {
    agree: ['да', 'конечно'],
    disagree: ['нет']
};

const getNumber = ctx => ctx.nlu && ctx.nlu && ctx.nlu.entities && ctx.nlu.entities.find(i => i.type === 'YANDEX.NUMBER');

// проверяет соответствие запроса пользователя ожидаемому ответу
const checkAnswer = function(ctx, intent) {
    if (typeof intent === 'function') {
        return intent(ctx);
    } else {
        return [].concat(intent).includes(ctx.message)
    }
}

// задает вопрос по индексу. Может добавить текст preText перед вопросом
const askQuestion = function(testData, questionIndex = 0, preText) {
    if (!questions[questionIndex] || !questions[questionIndex].text) return askQuestion(0);
    testData.lastQuestion = questionIndex;
    return preText ? 
        `${preText}. ${questions[questionIndex].text}` : 
        questions[questionIndex].text;
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
                postMessage: ['Похвально!', 'А я все никак не брошу.'],
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
                value: -8,
                postMessage: ['Удивительно, что вы еще живы…'],
                skipNext: 0
            }
        ]
    },
    {
        text: 'Вы пьете?',
        answers: [
            {
                intent: intents.agree,
                value: -2,
                skipNext: 0
            },
            {
                intent: intents.disagree,
                value: 0,
                postMessage: ['Я тоже.'],
                skipNext: 0
            }
        ]
    }
];

module.exports.AgeTest = function(ctx, session) {
    session.testData = session.testData || {};
    const { testData } = session;
    const { message } = ctx;
    const { result, lastQuestion } = testData;

    if (typeof lastQuestion === 'undefined') {
        testData.result = 72;
        return askQuestion(testData, 0);
    } else if (questions[lastQuestion]) {
        const question = questions[lastQuestion];
        
        for (let i = 0; i < question.answers.length; i++) {
            const answer = question.answers[i];
            const isValidAnswer = checkAnswer(ctx, answer.intent);
            
            if (!isValidAnswer) continue;

            testData.result += answer.value;
            const nextQuestion = lastQuestion + 1 + (answer.skipNext || 0);

            return askQuestion(testData, nextQuestion, answer.postMessage);
        }

        return askQuestion(testData, lastQuestion, 'Я не понял.');
    } else {
        return askQuestion(testData, 0, 'Я ничего не понимаю. Придется начать сначала.');
    }

};