const User = require('../models/User');

const getAllBarbers = async (req, res) => {
    try {
        const barbers = await User.find({ role: 'barber' })
            .select('name _id');
        res.json(barbers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = getAllBarbers;