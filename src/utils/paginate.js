const { PAGINATION } = require('../config/constants');

const ALLOWED_ORDER = ['asc', 'desc'];

const normalizePositiveInteger = (value, fallback, min, max) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
};

const normalizeOrder = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return ALLOWED_ORDER.includes(normalized) ? normalized : fallback;
};

const normalizeSort = (value, defaultSort, allowedSortFields = []) => {
  if (typeof value !== 'string' || !value.trim()) {
    return defaultSort;
  }

  const sortValue = value.trim();
  if (allowedSortFields.length === 0) {
    return defaultSort;
  }

  return allowedSortFields.includes(sortValue) ? sortValue : defaultSort;
};

const getPaginationFromRequest = (req, options = {}) => {
  const {
    defaultPage = PAGINATION.DEFAULT_PAGE,
    defaultLimit = PAGINATION.DEFAULT_LIMIT,
    maxLimit = PAGINATION.MAX_LIMIT,
    defaultSort = null,
    defaultOrder = 'asc',
    allowedSortFields = [],
  } = options;

  const page = normalizePositiveInteger(req.query.page, defaultPage, 1, Number.MAX_SAFE_INTEGER);
  const limit = normalizePositiveInteger(req.query.limit, defaultLimit, 1, maxLimit);
  const offset = (page - 1) * limit;
  const order = normalizeOrder(req.query.order, defaultOrder);
  const sort = normalizeSort(req.query.sort, defaultSort, allowedSortFields);

  return {
    page,
    limit,
    offset,
    sort,
    order,
  };
};

module.exports = getPaginationFromRequest;
