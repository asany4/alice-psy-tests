const { Alice, Reply, Markup } = require('yandex-dialogs-sdk')
const alice = new Alice();

const M = Markup;
alice.command('', async ctx => Reply.text('Пройдите психологические тесты. Они помогут познать себя лучше. Пока что я не умею проводить тесты, но совсем скоро меня научат. Возвращайтесь немного позже!'));
alice.command('Give a piece of advice', async ctx =>
  Reply.text('Make const not var'),
);
alice.command(
  ['What is trending now?', 'Watch films', 'Whats in the theatre?'],
  ctx => {
    return {
      text: `What about 50 Angry Men?`,
      buttons: [M.button('Buy ticket'), M.button('What else?')],
    };
  },
);
alice.command(/(https?:\/\/[^\s]+)/g, ctx => Reply.text('Matched a link!'));
alice.any(async ctx => Reply.text(`Я не понимаю`));

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
