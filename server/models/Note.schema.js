const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Untitled'
    },
    content: {
        type: String,
        default: ''
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Note', NoteSchema);
