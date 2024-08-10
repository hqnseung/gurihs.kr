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
        // 기존 데이터 삭제
        await Promise.all([
            Match.deleteMany({}),
            Player.deleteMany({}),
            Schedule.deleteMany({}),
            Standing.deleteMany({}),
            Team.deleteMany({})
        ]);

        // 조 별 팀 생성
        const teams = [];
        for (let i = 1; i <= 16; i++) {
            const grade = i <= 8 ? 1 : 2; // 1학년: 1~8, 2학년: 9~16
            const classNum = (i - 1) % 8 + 1; // 1~8반

            const team = new Team({
                grade: grade,
                class: classNum,
                players: [], // 플레이어는 나중에 추가
                group: String.fromCharCode(65 + Math.floor((i - 1) / 4)) // A, B, C, D 그룹
            });
            teams.push(team);
        }
        await Promise.all(teams.map(team => team.save()));

        // 플레이어 데이터 생성
        const players = [];
        for (const team of teams) {
            for (let i = 1; i <= 11; i++) { // 각 팀에 11명의 플레이어 생성
                const player = new Player({
                    name: `Player ${team.grade}-${team.class}-${i}`,
                    team: team._id,
                    position: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'][Math.floor(Math.random() * 4)],
                    goals: Math.floor(Math.random() * 10),
                    assists: Math.floor(Math.random() * 10),
                    yellowCards: Math.floor(Math.random() * 3),
                    redCards: Math.floor(Math.random() * 1)
                });
                players.push(player);
            }
        }
        await Promise.all(players.map(player => player.save()));

        // Schedule 및 Match 데이터 생성
        const schedules = [];
        const matches = [];
        let matchDate = new Date('2024-08-10'); // 시작 날짜 설정

        // 팀 간 매치가 하루에 하나씩만 있도록 설정
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                if (matches.length >= 16) break; // 16경기까지만 생성
                const schedule = new Schedule({
                    date: matchDate, // 같은 날짜에 하나의 경기만 설정
                    team1: teams[i]._id,
                    team2: teams[j]._id
                });
                schedules.push(schedule);

                const match = new Match({
                    date: matchDate,
                    team1: teams[i]._id,
                    team2: teams[j]._id,
                    score: { team1: Math.floor(Math.random() * 5), team2: Math.floor(Math.random() * 5) },
                    events: [
                        { minute: 15, team: teams[i]._id, player: players[i * 11]._id, eventType: 'goal' },
                        { minute: 30, team: teams[j]._id, player: players[j * 11]._id, eventType: 'goal' }
                    ]
                });
                matches.push(match);

                // 다음 날짜로 이동
                matchDate.setDate(matchDate.getDate() + 1);
            }
            if (matches.length >= 16) break; // 16경기까지만 생성
        }
        await Promise.all(schedules.map(schedule => schedule.save()));
        await Promise.all(matches.map(match => match.save()));

        // Standing 데이터 생성
        const standings = [];
        for (const team of teams) {
            const standing = new Standing({
                team: team._id,
                played: 1,
                wins: Math.floor(Math.random() * 2),
                draws: Math.floor(Math.random() * 2),
                losses: 1 - Math.floor(Math.random() * 2),
                goalsFor: Math.floor(Math.random() * 5),
                goalsAgainst: Math.floor(Math.random() * 5),
                points: Math.floor(Math.random() * 3) * (1 + Math.floor(Math.random() * 2))
            });
            standings.push(standing);
        }
        await Promise.all(standings.map(standing => standing.save()));

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

// 실행
seedDatabase();