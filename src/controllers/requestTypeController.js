const requestTypeService = require('../services/requestTypeService');
const { sendSuccess, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const getAll = async (req, res, next) => {
  try {
    const { data, meta } = await requestTypeService.getAllRequestTypes(req.query);
    return sendPaginatedResponse(res, data, meta, 'Request types retrieved', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await requestTypeService.getRequestTypeById(req.params.id);
    return sendSuccess(res, item, 'Request type retrieved', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await requestTypeService.createRequestType(req.body);
    return sendSuccess(res, item, 'Request type created', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await requestTypeService.updateRequestType(req.params.id, req.body);
    return sendSuccess(res, item, 'Request type updated', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await requestTypeService.softDeleteRequestType(req.params.id);
    return sendSuccess(res, item, 'Request type deleted (soft)', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };