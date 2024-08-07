require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Player = require('./models/Player');
const Match = require('./models/Match');
const Schedule = require('./models/Schedules');
const Standing = require('./models/Standing');

const DATABASE_URL = process.env.DATABASE_URL;

const seedDatabase = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB');

        // Clear existing data
        await Team.deleteMany({});
        await Player.deleteMany({});
        await Match.deleteMany({});
        await Schedule.deleteMany({});
        await Standing.deleteMany({});

        // Define team data (16 teams, 4 groups)
        const teamsData = [
            { grade: 1, class: 1 },
            { grade: 1, class: 2 },
            { grade: 1, class: 3 },
            { grade: 1, class: 4 },
            { grade: 2, class: 1 },
            { grade: 2, class: 2 },
            { grade: 2, class: 3 },
            { grade: 2, class: 4 },
            { grade: 3, class: 1 },
            { grade: 3, class: 2 },
            { grade: 3, class: 3 },
            { grade: 3, class: 4 },
            { grade: 4, class: 1 },
            { grade: 4, class: 2 },
            { grade: 4, class: 3 },
            { grade: 4, class: 4 }
        ];

        // Save teams and players
        const savedTeams = [];
        for (const teamData of teamsData) {
            const players = [];
            for (let i = 1; i <= 11; i++) {
                players.push({
                    name: `Player ${i} (Grade ${teamData.grade}, Class ${teamData.class})`,
                    position: i === 1 ? 'Goalkeeper' : i <= 4 ? 'Defender' : i <= 7 ? 'Midfielder' : 'Forward',
                    number: i
                });
            }

            const team = new Team({
                grade: teamData.grade,
                class: teamData.class,
                players: players
            });
            await team.save();
            savedTeams.push(team);

            for (const player of players) {
                const playerDoc = new Player({
                    name: player.name,
                    team: team._id,
                    position: player.position,
                    number: player.number
                });
                await playerDoc.save();
            }
        }

        // Define matches for each group (Group A, B, C, D)
        const matchesData = [];
        const groupSize = 4;
        for (let i = 0; i < savedTeams.length; i += groupSize) {
            const group = savedTeams.slice(i, i + groupSize);
            for (let j = 0; j < group.length; j++) {
                for (let k = j + 1; k < group.length; k++) {
                    const match = {
                        date: new Date(`2024-09-${i + j + k + 10}`), // Spread out match dates
                        team1: group[j]._id,
                        team2: group[k]._id,
                        score: { team1: Math.floor(Math.random() * 5), team2: Math.floor(Math.random() * 5) },
                        events: [
                            { minute: 15, team: group[j]._id, player: `Player ${Math.floor(Math.random() * 10) + 1}`, eventType: 'goal' },
                            { minute: 45, team: group[k]._id, player: `Player ${Math.floor(Math.random() * 10) + 1}`, eventType: 'goal' }
                        ]
                    };
                    matchesData.push(match);
                }
            }
        }

        // Save matches
        for (const matchData of matchesData) {
            const match = new Match(matchData);
            await match.save();
        }

        // Define and save schedules
        const schedulesData = matchesData.map(match => ({
            date: match.date,
            team1: match.team1,
            team2: match.team2
        }));

        for (const scheduleData of schedulesData) {
            const schedule = new Schedule(scheduleData);
            await schedule.save();
        }

        // Define standings (dummy data, can be updated after all matches)
        for (const team of savedTeams) {
            const standing = new Standing({
                team: team._id,
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

        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seeding function
seedDatabase().catch(error => console.error('Seeding error:', error));
