const { Alice, Reply, Markup } = require('yandex-dialogs-sdk')
const alice = new Alice();

const M = Markup;
alice.command('', async ctx => Reply.text('Look, what i can!'));
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
alice.any(async ctx => Reply.text(`I don't understand`));
const server = alice.listen(process.env.PORT || 3001, '/');
