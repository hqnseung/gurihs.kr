const Log = require("../models/Log");

const createLog = async (logData) => {
  try {
    const log = new Log(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating log:', error);
    throw error;
  }
};

const getAllLogs = async () => {
  try {
    const logs = await Log.find({});
    return logs;
  } catch (error) {
    console.error('Error getting logs:', error);
    throw error;
  }
};

const getLogById = async (id) => {
  try {
    const log = await Log.findById(id);
    if (!log) {
      throw new Error('Log not found');
    }
    return log;
  } catch (error) {
    console.error('Error getting log by ID:', error);
    throw error;
  }
};

const updateLogById = async (id, updateData) => {
  try {
    const log = await Log.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!log) {
      throw new Error('Log not found');
    }
    return log;
  } catch (error) {
    console.error('Error updating log by ID:', error);
    throw error;
  }
};

const deleteLogById = async (id) => {
  try {
    const log = await Log.findByIdAndDelete(id);
    if (!log) {
      throw new Error('Log not found');
    }
    return log;
  } catch (error) {
    console.error('Error deleting log by ID:', error);
    throw error;
  }
};

module.exports = {
  createLog,
  getAllLogs,
  getLogById,
  updateLogById,
  deleteLogById,
};