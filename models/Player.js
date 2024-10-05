const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 }
});

const Player = mongoose.model('Player', playerSchema);


module.exports = Player;
