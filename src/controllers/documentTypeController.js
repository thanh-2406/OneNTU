const documentTypeService = require('../services/documentTypeService');
const { sendSuccess, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const list = async (req, res, next) => {
  try {
    const { data, meta } = await documentTypeService.getAllDocumentTypes(req.query);
    return sendPaginatedResponse(res, data, meta, 'Document types retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await documentTypeService.getDocumentTypeById(req.params.id);
    return sendSuccess(res, item, 'Document type retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await documentTypeService.createDocumentType(req.body);
    return sendSuccess(res, item, 'Document type created', HTTP_STATUS.CREATED);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const item = await documentTypeService.updateDocumentType(req.params.id, req.body);
    return sendSuccess(res, item, 'Document type updated', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const item = await documentTypeService.softDeleteDocumentType(req.params.id);
    return sendSuccess(res, item, 'Document type deleted (soft)', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };