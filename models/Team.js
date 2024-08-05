const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    number: { type: Number, required: true }
});

const teamSchema = new mongoose.Schema({
    grade: { type: Number, required: true },
    class: { type: Number, required: true },
    players: [playerSchema]
});

const Team = mongoose.model('Team', teamSchema);


module.exports = Team;
