const { Alice, Reply, Markup } = require('yandex-dialogs-sdk')
const { AgeTest } = require('./age');

const alice = new Alice();
const intents = {
  positive: ['да', 'начни', 'давай', 'поехали', 'ага', 'иногда', 'хочу', 'я не против'],
  negative: ['нет', 'не хочу', 'не надо', 'не начинай', 'неа'],
  endDialog: ['завершить', 'заверши', 'выключись', 'закончить'],
  repeatDialog: ['еще раз', 'еще', 'заново', 'повтори']
};

const sessions = {};

const M = Markup;

function isIntentCorrect(request, intents) {
   return intents.some(intent => request.toLowerCase().indexOf(intent.toLowerCase()) !== -1);
}

alice.command('', async ctx => {
  const sessionId = ctx.sessionId;

  sessions[sessionId] = {
    state: 'entry'
  };
  
  return Reply.text('Привет. Это тест cколько лет осталось жить. Хотите начать?');
});

alice.command(
  ['что ты умеешь', 'помощь', 'расскажи что делать', 'как пользоваться'],
  ctx => {
    return {
      text: `Средняя продолжительность жизни постоянно растет. Но каждого, все равно, интересует, сколько же он проживет. Данный тест составлен американскими медиками. Советую Вам ответить наиболее искренне, не кривя душой. Особо следует обратить внимание на то, что результаты этого теста не являются окончательным "диагнозом". Может быть, вам необходимо в чем-то изменить свой образ жизни.
      Возраст не имеет значения. Все равно, 20 Вам или 50. Зато чем раньше Вы откажетесь от вредных привычек, тем лучше.`
    };
  },
);

alice.any(async ctx => {
  const sessionId = ctx.sessionId;
  const state = sessions[sessionId].state;
  const requestText = ctx.originalUtterance;

  let text = 'Я вас не поняла';
  const EXTRA_PARAMS = {};

  switch (state) {
    case 'entry':
      if (isIntentCorrect(requestText, intents.positive)) {
        sessions[sessionId] = {
          state: 'test'
        }

        let result = AgeTest(ctx, sessions[sessionId]);

        text = `Начинаем! ${result.text}`;

        if (result.tts) {
          EXTRA_PARAMS.tts = `Начинаем! ${result.tts}`;
        }
      }
      
      if (isIntentCorrect(requestText, intents.negative)) {
        text = `Я знаю точно наперед
        Сегодня кто-нибудь умрет`;
      };
      break;
    case 'afterInfo':
      if (isIntentCorrect(requestText, intents.positive)) {
        sessions[sessionId] = {
          state: 'test'
        }

        let result = AgeTest(ctx, sessions[sessionId]);

        text = `Начинаем! ${result.text}`;

        if (result.tts) {
          EXTRA_PARAMS.tts = `Начинаем! ${result.tts}`;
        }

        text = 'Тогда начнем! ${result.text}';
      };

      if (isIntentCorrect(requestText, intents.negative)) {
        sessions[sessionId] = {
          state: 'decideEndOrNot'
        }

        text = 'Вы хотите завершить навык?';
      };
      break;
    // дурацкое название, надо подумать
    case 'decideEndOrNot':
      if (isIntentCorrect(requestText, intents.positive)) {
        sessions[sessionId] = undefined;

        EXTRA_PARAMS.end_session = true;
        text = 'Заходите еще!';
      };

      if (isIntentCorrect(requestText, intents.negative)) {
        sessions[sessionId] = {
          state: 'afterInfo'
        }

        text = 'Тогда все-таки начинаем?';
      };
      break;
    case 'afterTest':
      if (isIntentCorrect(requestText, intents.endDialog)) {
        sessions[sessionId] = undefined;

        EXTRA_PARAMS.end_session = true;
        text = 'Заходите еще!';
      };

      if (isIntentCorrect(requestText, intents.repeatDialog)) {
        sessions[sessionId] = {
          state: 'test'
        }

        let result = AgeTest(ctx, sessions[sessionId]);

        text = `Начинаем! ${result.text}`;

        if (result.tts) {
          EXTRA_PARAMS.tts = `Начинаем! ${result.tts}`;
        }
      };
      break;
    case 'test':
      try {
        let result = AgeTest(ctx, sessions[sessionId]);

        text = result.text;

        if (result.tts) {
          EXTRA_PARAMS.tts = result.tts;
        }

        if (result.endTest) {
          sessions[sessionId] = {
            state: 'afterTest'
          }

          text += ' Хотите попробовать еще раз или завершить навык?';
          
          if (EXTRA_PARAMS.tts) {
            EXTRA_PARAMS.tts += ' Хотите попробовать еще раз или завершить навык?';
          }
        }

      } catch(e) {
          console.error(e);
          text = 'Произошла ошибка в навыке. Попробуйте начать тест снова';
      };
      break;
  }

  return Reply.text(text, EXTRA_PARAMS);
});

const server = alice.listen(process.env.PORT || 3001, '/');

// Учим сервер отвечать 200 OK на GET запрос в корень
const originalHandler = server._handleRequest;
server._handleRequest = function(request, response) {
  if (request.method === 'GET' && request.url === server._webhookUrl) {
    response.statusCode = 200;
    return response.end('OK');    
  }

  return originalHandler.apply(server, arguments);
}
