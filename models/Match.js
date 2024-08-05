const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    minute: { type: Number, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    player: { type: String, required: true },
    eventType: { type: String, enum: ['goal', 'yellow card', 'red card'], required: true }
});

const matchSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    score: {
        team1: { type: Number, required: true },
        team2: { type: Number, required: true }
    },
    events: [eventSchema]
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
