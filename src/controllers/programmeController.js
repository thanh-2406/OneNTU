const programmeService = require('../services/programmeService');
const { sendSuccess, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const listProgrammes = async (req, res, next) => {
  try {
    const { data, meta } = await programmeService.getAllProgrammes(req.query);
    return sendPaginatedResponse(res, data, meta, 'Programmes retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const getProgramme = async (req, res, next) => {
  try {
    const programme = await programmeService.getProgrammeById(req.params.id);
    return sendSuccess(res, programme, 'Programme retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const createProgramme = async (req, res, next) => {
  try {
    const programme = await programmeService.createProgramme(req.body);
    return sendSuccess(res, programme, 'Programme created', HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
};

const updateProgramme = async (req, res, next) => {
  try {
    const programme = await programmeService.updateProgramme(req.params.id, req.body);
    return sendSuccess(res, programme, 'Programme updated', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const deleteProgramme = async (req, res, next) => {
  try {
    const programme = await programmeService.softDeleteProgramme(req.params.id);
    return sendSuccess(res, programme, 'Programme deleted', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProgrammes,
  getProgramme,
  createProgramme,
  updateProgramme,
  deleteProgramme,
};