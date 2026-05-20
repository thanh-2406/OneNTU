const specialisationService = require('../services/specialisationService');
const { sendPaginatedResponse, sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

const getAllSpecialisations = async (req, res, next) => {
  try {
    const { data, meta } = await specialisationService.getAllSpecialisations(req.query);
    return sendPaginatedResponse(res, data, meta, 'Specialisations retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

const createSpecialisation = async (req, res, next) => {
  try {
    const spec = await specialisationService.createSpecialisation(req.body);
    return sendSuccess(res, spec, 'Specialisation created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const updateSpecialisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const spec = await specialisationService.updateSpecialisation(id, req.body);
    return sendSuccess(res, spec, 'Specialisation updated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

const deleteSpecialisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const spec = await specialisationService.softDeleteSpecialisation(id);
    return sendSuccess(res, spec, 'Specialisation deleted (soft) successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllSpecialisations, createSpecialisation, updateSpecialisation, deleteSpecialisation };
