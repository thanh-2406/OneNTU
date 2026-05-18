const requestStatusService = require('../services/requestStatusService');
const { sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const listStatuses = async (req, res, next) => {
  try {
    const statuses = await requestStatusService.getAllStatuses({ activeOnly: true });
    return sendSuccess(res, statuses, 'Request statuses retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await requestStatusService.getStatusById(req.params.id);
    return sendSuccess(res, status, 'Request status retrieved', HTTP_STATUS.OK);
  } catch (err) {
    next(err);
  }
};

module.exports = { listStatuses, getStatus };
