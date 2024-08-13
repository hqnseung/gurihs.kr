require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Match = require('./models/Match');
const Schedule = require('./models/Schedules');
const Standing = require('./models/standing');

const DATABASE_URL = process.env.DATABASE_URL;

const seedDatabase = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB');
        await Promise.all([
            Match.deleteMany({}),
            Player.deleteMany({}),
            Schedule.deleteMany({}),
            Standing.deleteMany({}),
            Team.deleteMany({})
        ]);

        const teamsData = [
            {
                grade: 1,
                class: 1,
                group: 'A',
                players: [
                    { name: 'Player1-1', position: 'Forward', number: 9 },
                    { name: 'Player1-2', position: 'Midfielder', number: 10 },
                    { name: 'Player1-3', position: 'Defender', number: 4 },
                    { name: 'Player1-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 1,
                class: 2,
                group: 'A',
                players: [
                    { name: 'Player2-1', position: 'Forward', number: 7 },
                    { name: 'Player2-2', position: 'Midfielder', number: 8 },
                    { name: 'Player2-3', position: 'Defender', number: 5 },
                    { name: 'Player2-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 2,
                class: 1,
                group: 'B',
                players: [
                    { name: 'Player3-1', position: 'Forward', number: 11 },
                    { name: 'Player3-2', position: 'Midfielder', number: 6 },
                    { name: 'Player3-3', position: 'Defender', number: 3 },
                    { name: 'Player3-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 2,
                class: 2,
                group: 'B',
                players: [
                    { name: 'Player4-1', position: 'Forward', number: 10 },
                    { name: 'Player4-2', position: 'Midfielder', number: 8 },
                    { name: 'Player4-3', position: 'Defender', number: 4 },
                    { name: 'Player4-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 3,
                class: 1,
                group: 'C',
                players: [
                    { name: 'Player5-1', position: 'Forward', number: 9 },
                    { name: 'Player5-2', position: 'Midfielder', number: 7 },
                    { name: 'Player5-3', position: 'Defender', number: 5 },
                    { name: 'Player5-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 3,
                class: 2,
                group: 'C',
                players: [
                    { name: 'Player6-1', position: 'Forward', number: 11 },
                    { name: 'Player6-2', position: 'Midfielder', number: 6 },
                    { name: 'Player6-3', position: 'Defender', number: 4 },
                    { name: 'Player6-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 4,
                class: 1,
                group: 'D',
                players: [
                    { name: 'Player7-1', position: 'Forward', number: 10 },
                    { name: 'Player7-2', position: 'Midfielder', number: 8 },
                    { name: 'Player7-3', position: 'Defender', number: 5 },
                    { name: 'Player7-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 4,
                class: 2,
                group: 'D',
                players: [
                    { name: 'Player8-1', position: 'Forward', number: 7 },
                    { name: 'Player8-2', position: 'Midfielder', number: 6 },
                    { name: 'Player8-3', position: 'Defender', number: 3 },
                    { name: 'Player8-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 5,
                class: 1,
                group: 'A',
                players: [
                    { name: 'Player1-1', position: 'Forward', number: 9 },
                    { name: 'Player1-2', position: 'Midfielder', number: 10 },
                    { name: 'Player1-3', position: 'Defender', number: 4 },
                    { name: 'Player1-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 5,
                class: 2,
                group: 'A',
                players: [
                    { name: 'Player2-1', position: 'Forward', number: 7 },
                    { name: 'Player2-2', position: 'Midfielder', number: 8 },
                    { name: 'Player2-3', position: 'Defender', number: 5 },
                    { name: 'Player2-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 6,
                class: 1,
                group: 'B',
                players: [
                    { name: 'Player3-1', position: 'Forward', number: 11 },
                    { name: 'Player3-2', position: 'Midfielder', number: 6 },
                    { name: 'Player3-3', position: 'Defender', number: 3 },
                    { name: 'Player3-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 6,
                class: 2,
                group: 'B',
                players: [
                    { name: 'Player4-1', position: 'Forward', number: 10 },
                    { name: 'Player4-2', position: 'Midfielder', number: 8 },
                    { name: 'Player4-3', position: 'Defender', number: 4 },
                    { name: 'Player4-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 7,
                class: 1,
                group: 'C',
                players: [
                    { name: 'Player5-1', position: 'Forward', number: 9 },
                    { name: 'Player5-2', position: 'Midfielder', number: 7 },
                    { name: 'Player5-3', position: 'Defender', number: 5 },
                    { name: 'Player5-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 7,
                class: 2,
                group: 'C',
                players: [
                    { name: 'Player6-1', position: 'Forward', number: 11 },
                    { name: 'Player6-2', position: 'Midfielder', number: 6 },
                    { name: 'Player6-3', position: 'Defender', number: 4 },
                    { name: 'Player6-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 8,
                class: 1,
                group: 'D',
                players: [
                    { name: 'Player7-1', position: 'Forward', number: 10 },
                    { name: 'Player7-2', position: 'Midfielder', number: 8 },
                    { name: 'Player7-3', position: 'Defender', number: 5 },
                    { name: 'Player7-4', position: 'Goalkeeper', number: 1 }
                ]
            },
            {
                grade: 8,
                class: 2,
                group: 'D',
                players: [
                    { name: 'Player8-1', position: 'Forward', number: 7 },
                    { name: 'Player8-2', position: 'Midfielder', number: 6 },
                    { name: 'Player8-3', position: 'Defender', number: 3 },
                    { name: 'Player8-4', position: 'Goalkeeper', number: 1 }
                ]
            },
        ];
        
        async function seedDB() {
            try {
                await Team.deleteMany({});
                await Player.deleteMany({});
                await Standing.deleteMany({});  // 스탠딩 삭제
                
                for (let teamData of teamsData) {
                    // 팀 생성
                    let team = new Team({
                        grade: teamData.grade,
                        class: teamData.class,
                        group: teamData.group,
                        players: teamData.players.map(p => ({
                            name: p.name,
                            position: p.position,
                            number: p.number
                        }))
                    });
                    await team.save();

                    // 팀에 속한 플레이어 생성
                    for (let playerData of teamData.players) {
                        let player = new Player({
                            name: playerData.name,
                            position: playerData.position,
                            team: team._id, // 팀의 ObjectId를 참조
                        });
                        await player.save();
                    }

                    // 스탠딩 데이터 생성
                    let standing = new Standing({
                        team: team._id, // 팀의 ObjectId를 참조
                        played: 0,
                        wins: 0,
                        draws: 0,
                        losses: 0,
                        goalsFor: 0,
                        goalsAgainst: 0,
                        points: 0
                    });
                    await standing.save();
                }

                console.log("Database seeded with teams, players, and standings!");
            } catch (err) {
                console.error(err);
            }
        }

        await seedDB();


        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

// 실행
seedDatabase();