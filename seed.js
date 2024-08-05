require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/team');
const Player = require('./models/Player');
const Match = require('./models/match');
const Schedule = require('./models/Schedules');
const Standing = require('./models/standing');
const DATABASE_URL = process.env.DATABASE_URL

const seedDatabase = async () => {
    mongoose.connect(DATABASE_URL)
      .then(() => console.log('Connected to DB'))
      .catch(err => console.error('DB connection error:', err));

      await Team.deleteMany({});
      await Player.deleteMany({});
      await Match.deleteMany({});
      await Schedule.deleteMany({});
      await Standing.deleteMany({});
  
      // Define teams
      const team1 = new Team({
          grade: 2,
          class: 6,
          players: [
              { name: '윤성진', position: 'Forward', number: 13 },
              { name: '이호용', position: 'Midfielder', number: 16 },
              { name: '최민재', position: 'Defender', number: 23 },
              { name: '김은찬', position: 'Goalkeeper', number: 4 },
              { name: '주원석', position: 'Forward', number: 22 },
              { name: '홍영기', position: 'Defender', number: 26 },
              { name: '백승기', position: 'Midfielder', number: 9 },
              { name: '정성연', position: 'Forward', number: 19 },
              { name: '하준수', position: 'Midfielder', number: 24 },
              { name: '신재훈', position: 'Defender', number: 10 },
              { name: '장재원', position: 'Goalkeeper', number: 18 }
          ]
      });
  
      const team2 = new Team({
          grade: 2,
          class: 7,
          players: [
              { name: '김민재', position: 'Forward', number: 11 },
              { name: '이정후', position: 'Midfielder', number: 14 },
              { name: '박지훈', position: 'Defender', number: 25 },
              { name: '송진우', position: 'Goalkeeper', number: 1 },
              { name: '오지훈', position: 'Forward', number: 20 },
              { name: '윤병호', position: 'Defender', number: 30 },
              { name: '홍승민', position: 'Midfielder', number: 8 },
              { name: '최유진', position: 'Forward', number: 17 },
              { name: '하영철', position: 'Midfielder', number: 21 },
              { name: '서재원', position: 'Defender', number: 5 },
              { name: '강희준', position: 'Goalkeeper', number: 12 }
          ]
      });
  
      // Save teams
      await team1.save();
      await team2.save();
  
      // Define players based on the teams
      for (const playerData of team1.players) {
          const player = new Player({
              name: playerData.name,
              team: team1._id,
              position: playerData.position,
              number: playerData.number
          });
          await player.save();
      }
  
      for (const playerData of team2.players) {
          const player = new Player({
              name: playerData.name,
              team: team2._id,
              position: playerData.position,
              number: playerData.number
          });
          await player.save();
      }
  
      // Define matches
      const match1 = new Match({
          date: new Date('2024-08-10'),
          team1: team1._id,
          team2: team2._id,
          score: {
              team1: 2,
              team2: 1
          },
          events: [
              { minute: 15, team: team1._id, player: '윤성진', eventType: 'goal' },
              { minute: 45, team: team2._id, player: '김민재', eventType: 'goal' },
              { minute: 70, team: team1._id, player: '정성연', eventType: 'goal' }
          ]
      });
  
      // Save matches
      await match1.save();
  
      // Define schedules
      const schedule1 = new Schedule({
          date: new Date('2024-08-10'),
          team1: team1._id,
          team2: team2._id
      });
  
      // Save schedules
      await schedule1.save();
  
      // Define standings
      const standing1 = new Standing({
          team: team1._id,
          played: 1,
          wins: 1,
          draws: 0,
          losses: 0,
          goalsFor: 2,
          goalsAgainst: 1,
          points: 3
      });
  
      const standing2 = new Standing({
          team: team2._id,
          played: 1,
          wins: 0,
          draws: 0,
          losses: 1,
          goalsFor: 1,
          goalsAgainst: 2,
          points: 0
      });
  
      // Save standings
      await standing1.save();
      await standing2.save();
  
      console.log('Database seeded successfully');
    mongoose.connection.close();
};

// Run the seeding function
seedDatabase().catch(error => console.error('Seeding error:', error));
