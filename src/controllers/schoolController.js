const schoolService = require('../services/schoolService');
const { sendSuccess, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const listSchools = async (req, res, next) => {
  try {
    const { data, meta } = await schoolService.getAllSchools(req.query);
    return sendPaginatedResponse(res, data, meta, 'Schools retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const getSchool = async (req, res, next) => {
  try {
    const school = await schoolService.getSchoolById(req.params.id);
    return sendSuccess(res, school, 'School retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const createSchool = async (req, res, next) => {
  try {
    const school = await schoolService.createSchool(req.body);
    return sendSuccess(res, school, 'School created', HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
};

const updateSchool = async (req, res, next) => {
  try {
    const school = await schoolService.updateSchool(req.params.id, req.body);
    return sendSuccess(res, school, 'School updated', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const deleteSchool = async (req, res, next) => {
  try {
    const school = await schoolService.softDeleteSchool(req.params.id);
    return sendSuccess(res, school, 'School deleted', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listSchools,
  getSchool,
  createSchool,
  updateSchool,
  deleteSchool,
};