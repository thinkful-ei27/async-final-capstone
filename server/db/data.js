'use strict';

const users = [
  {
    _id: '222222222222222222222200',
    firstName: 'Johnny',
    lastName: 'Salt',
    username: 'johnnysalt',
    password: '$2a$10$F3WxoCmNFelMJuUbFMTXWO.nrEhQg1GNfuwgItE3l6fb8Bfso0cLa'
  },
  {
    _id: '333333333333333333333300',
    firstName: 'Bob',
    lastName: 'User',
    username: 'bobuser',
    // hash digest for the string 'password'
    password: '$2a$10$0S5GdCkGJTDeaAH272/bmeZmmpC4rv6ItXIOZKwVQIfQOqSURhkhu'
  },
  {
    _id: '5c3f5ca9ec37422f44bdaa82',
    firstName: 'thejohnny',
    lastName: 'salt',
    username: 'thejohnnysalt',
    password: '$2a$10$hpBGDg4mlyzVM/7g4staJuA4fuaznzY64b6/s0SwkLWrblT7vEgDK'
  }
];

const games = [
  {
    name: 'Super Mario 64',
    'id': '5c9a959ba5d0dd09e07f45a7',
    igdb: {
      id: 1074,
      slug: 'super-mario-64'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/scutr4p9gytl4txb2soy.jpg'
  },
  {
    name: 'The Legend of Zelda',
    'id': '5c9a959ba5d0dd09e07f45a8',
    igdb: {
      id: 1022,
      slug: 'the-legend-of-zelda'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/bfeef9eun1ybhuwufqxm.jpg'
  },
  {
    name: 'Mortal Kombat',
    'id': '5c9a959ba5d0dd09e07f45a9',
    igdb: {
      id: 1618,
      slug: 'mortal-kombat--2'
    },
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_720p/co1hno.jpg'
  },
  {
    name: 'Street Fighter II',
    'id': '5c9a959ba5d0dd09e07f45a0',
    igdb: {
      id: 3186,
      slug: 'street-fighter-ii'
    },
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_720p/co1hq8.jpg'
  },
  {
    name: 'Halo: Combat Evolved',
    'id': '5c9a959ba5d0dd09e07f45a1',
    igdb: {
      id: 740,
      slug: 'halo-combat-evolved'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/bcotwv6rapvdglcahxi3.jpg'
  },
  {
    name: 'Superman',
    'id': '5c9a959ba5d0dd09e07f45a2',
    igdb: {
      id: 3005,
      slug: 'superman'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/wej8g7hq46wb0ueyblin.jpg'
  },
  {
    name: 'Final Fantasy VII',
    'id': '5c9a959ba5d0dd09e07f45a3',
    igdb: {
      id: 427,
      slug: 'final-fantasy-vii'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/idzdf1alxvetz3ow2ugy.jpg'
  },
  {
    name: 'WWF No Mercy',
    'id': '5c9a959ba5d0dd09e07f45a4',
    igdb: {
      id: 3644,
      slug: 'wwf-no-mercy'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/clajigg1q7mm9uxz14kx.jpg'
  },
  {
    name: 'Super Smash Bros.',
    'id': '5c9a959ba5d0dd09e07f45a5',
    igdb: {
      id: 1626,
      slug: 'super-smash-bros'
    },
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_720p/co1hzi.jpg'
  },
  {
    name: 'Candy Crush Saga',
    'id': '5c9a959ba5d0dd09e07f45a6',
    igdb: {
      id: 5636,
      slug: 'candy-crush-saga'
    },
    coverUrl:
      'https://images.igdb.com/igdb/image/upload/t_720p/u9s7ap9gi5kestfxhxdf.jpg'
  }
];

const histories = [
  {
    '_id': '222222222222222222222200',
    'userId': '333333333333333333333300',
    'gameOne': '5c9a959ba5d0dd09e07f45a6',
    'gameTwo': '5c9a959ba5d0dd09e07f45a5',
    'choice': '5c9a959ba5d0dd09e07f45a6'
  },
  {
    '_id': '222222222222222222222201',
    'userId': '5c3f5ca9ec37422f44bdaa82',
    'gameOne': '5c9a959ba5d0dd09e07f45a4',
    'gameTwo': '5c9a959ba5d0dd09e07f45a3',
    'choice': '5c9a959ba5d0dd09e07f45a4'
  },
  {
    '_id': '222222222222222222222202',
    'userId': '5c3f5ca9ec37422f44bdaa82',
    'gameOne': '5c9a959ba5d0dd09e07f45a2',
    'gameTwo': '5c9a959ba5d0dd09e07f45a1',
    'choice': '5c9a959ba5d0dd09e07f45a1'
  }
];

module.exports = {
  games,
  users,
  histories
};
