const { Alice, Reply, Markup } = require('yandex-dialogs-sdk')
const { AgeTest } = require('./age');

const alice = new Alice();

const sessions = {};

const M = Markup;
alice.command('', async ctx => Reply.text('Пройдите тест "Сколько я проживу". Я буду задавать вопросы, и в зависимости от ваших ответов я посчитаю, сколько в среднем живут люди с таким же образом жизни. Хотите запустить тест?'));
alice.command(['запустить', 'начать'], async ctx => Reply.text('Тут должен быть первый вопрос'));
// alice.command('Give a piece of advice', async ctx =>
//   Reply.text('Make const not var'),
// );
// alice.command(
//   ['What is trending now?', 'Watch films', 'Whats in the theatre?'],
//   ctx => {
//     return {
//       text: `What about 50 Angry Men?`,
//       buttons: [M.button('Buy ticket'), M.button('What else?')],
//     };
//   },
// );
// alice.command(/(https?:\/\/[^\s]+)/g, ctx => Reply.text('Matched a link!'));
// alice.any(async ctx => Reply.text(`Я не понимаю`));

alice.any(async ctx => {
  sessions[ctx.sessionId] = sessions[ctx.sessionId] || {};
  try {
      answer = AgeTest(ctx, sessions[ctx.sessionId]);
  } catch(e) {
      console.error(e);
      answer = 'Произошла ошибка в навыке. Попробуйте начать тест снова';
  };
  return Reply.text(answer);
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
