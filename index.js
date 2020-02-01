const { Alice, Reply, Markup } = require('yandex-dialogs-sdk')
const { AgeTest } = require('./age');

const alice = new Alice();

const sessions = {};

const M = Markup;

alice.command('', async ctx => {
  const sessionId = ctx.sessionId;

  sessions[sessionId] = {
    state: 'entry'
  };
  
  return Reply.text('Привет. Это тест Сколько лет осталось жить. Хотите начать?');
});

alice.command(
  ['что ты умеешь', 'помощь', 'расскажи что делать', 'как пользоваться'],
  ctx => {
    return {
      text: `Этот навык позволяет вам узнать примерную длину жизни. И т.д. и т.п.`
    };
  },
);

alice.any(async ctx => {
  const sessionId = ctx.sessionId;
  const currentSession = sessions[sessionId];
  const state = currentSession.state;

  let text = 'Я вас не поняла';
  const EXTRA_PARAMS = {};

  switch (state) {
    case 'entry':
      if (ctx.originalUtterance.indexOf('начни тест') !== -1) {
        sessions[sessionId] = {
          state: 'test'
        }

        let result = AgeTest(ctx, currentSession);

        text = `Начинаем! ${result.text}`;

        if (result.tts) {
          EXTRA_PARAMS.tts = `Начинаем! ${result.tts}`;
        }
      }
      
      if (ctx.originalUtterance.indexOf('расскажи информацию') !== -1) {
        sessions[sessionId] = {
          state: 'afterInfo'
        }

        text = 'Отвечая на вопросы вы узнаете сколько лет вам осталось жить. Ну что, начинаем?';
      };
      break;
    case 'afterInfo':
      if (ctx.originalUtterance.indexOf('да') !== -1) {
        sessions[sessionId] = {
          state: 'test'
        }

        text = 'Тогда начнем! Первый вопрос: сколько у вас котов?';
      };

      if (ctx.originalUtterance.indexOf('нет') !== -1) {
        sessions[sessionId] = {
          state: 'decideEndOrNot'
        }

        text = 'Вы хотите завершить навык?';
      };
      break;
    // дурацкое название, надо подумать
    case 'decideEndOrNot':
      if (ctx.originalUtterance.indexOf('да') !== -1) {
        sessions[sessionId] = undefined;

        EXTRA_PARAMS.end_session = true;
        text = 'Заходите еще!';
      };

      if (ctx.originalUtterance.indexOf('нет') !== -1) {
        sessions[sessionId] = {
          state: 'afterInfo'
        }

        text = 'Тогда все-таки начинаем?';
      };
      break;
    case 'afterTest':
      if (ctx.originalUtterance.indexOf('завершить') !== -1) {
        sessions[sessionId] = undefined;

        EXTRA_PARAMS.end_session = true;
        text = 'Заходите еще!';
      };

      if (ctx.originalUtterance.indexOf('еще раз') !== -1) {
        sessions[sessionId] = {
          state: 'test'
        }

        let result = AgeTest(ctx, currentSession);

        text = `Начинаем! ${result.text}`;

        if (result.tts) {
          EXTRA_PARAMS.tts = `Начинаем! ${result.tts}`;
        }
      };
      break;
    case 'test':
      try {
        let result = AgeTest(ctx, currentSession);

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
