const db = require('../config/db');
const getPaginationFromRequest = require('../utils/paginate');
const { generateTempPassword } = require('../utils/tempPassword');
const { hashPassword } = require('../utils/password');
const { sendEmail } = require('../utils/mailer');
const { studentWelcomeTemplate, staffWelcomeTemplate } = require('../utils/emailTemplates');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

/**
 * createStudent
 * - Performs full student onboarding flow inside the service layer.
 * - Steps: uniqueness checks, programme validation, generate temp password,
 *   hash password, insert student, send welcome email.
 * - Returns sanitized student object (no password_hash).
 */
const resetStudentPassword = async (studentId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStudent = await client.query('SELECT student_id, email, full_name FROM students WHERE student_id = $1', [studentId]);
    if (existingStudent.rowCount === 0) {
      throw createHttpError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    const student = existingStudent.rows[0];
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await client.query(
      `UPDATE students SET password_hash = $1, must_change_password = true, password_reset_at = NOW(), updated_at = NOW() WHERE student_id = $2`,
      [passwordHash, studentId]
    );

    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE actor_type = 'student' AND actor_id = $1 AND revoked_at IS NULL`,
      [studentId]
    );

    await client.query('COMMIT');

    try {
      const { studentPasswordResetTemplate } = require('../utils/emailTemplates');
      const { subject, text, html } = studentPasswordResetTemplate({
        name: student.full_name,
        loginIdentifier: student.email,
        tempPassword,
      });

      const emailResult = await sendEmail({ to: student.email, subject, text, html });
      if (!emailResult.ok) {
        console.warn('Password reset email failed to send', { email: student.email, error: emailResult.error });
      }
    } catch (emailErr) {
      console.error('Unexpected error while sending password reset email', emailErr);
    }

    const updated = await getStudentById(studentId);
    return { student: updated, tempPassword };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in resetStudentPassword', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to reset student password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const resetStaffPassword = async (staffId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStaff = await client.query('SELECT staff_id, email, full_name FROM staff WHERE staff_id = $1', [staffId]);
    if (existingStaff.rowCount === 0) {
      throw createHttpError('Staff not found', HTTP_STATUS.NOT_FOUND);
    }

    const staff = existingStaff.rows[0];
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await client.query(
      `UPDATE staff SET password_hash = $1, must_change_password = true, password_reset_at = NOW(), updated_at = NOW() WHERE staff_id = $2`,
      [passwordHash, staffId]
    );

    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE actor_type = 'staff' AND actor_id = $1 AND revoked_at IS NULL`,
      [staffId]
    );

    await client.query('COMMIT');

    try {
      const { staffPasswordResetTemplate } = require('../utils/emailTemplates');
      const { subject, text, html } = staffPasswordResetTemplate({
        name: staff.full_name,
        loginIdentifier: staff.email,
        tempPassword,
      });

      const emailResult = await sendEmail({ to: staff.email, subject, text, html });
      if (!emailResult.ok) {
        console.warn('Password reset email failed to send', { email: staff.email, error: emailResult.error });
      }
    } catch (emailErr) {
      console.error('Unexpected error while sending password reset email', emailErr);
    }

    const updated = await getStaffById(staffId);
    return { staff: updated, tempPassword };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in resetStaffPassword', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to reset staff password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const createStudent = async ({ full_name, matric_number, email, programme_id, year_of_study }, adminId) => {
  if (!adminId) throw createHttpError('Admin ID is required for auditing', HTTP_STATUS.BAD_REQUEST);

  const normalizedEmail = normalizeEmail(email);
  const normalizedMatric = typeof matric_number === 'string' ? matric_number.trim() : matric_number;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1) Check matric uniqueness
    const matricCheck = await client.query('SELECT student_id FROM students WHERE matric_number = $1', [normalizedMatric]);
    if (matricCheck.rowCount > 0) {
      throw createHttpError('Matric number already exists', HTTP_STATUS.CONFLICT);
    }

    // 2) Check email uniqueness
    const emailCheck = await client.query('SELECT student_id FROM students WHERE email = $1', [normalizedEmail]);
    if (emailCheck.rowCount > 0) {
      throw createHttpError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    // 3) Validate programme relationship
    const progCheck = await client.query('SELECT programme_id, is_active FROM programmes WHERE programme_id = $1', [programme_id]);
    if (progCheck.rowCount === 0) {
      throw createHttpError('Programme not found', HTTP_STATUS.BAD_REQUEST);
    }
    if (!progCheck.rows[0].is_active) {
      throw createHttpError('Programme is not active', HTTP_STATUS.BAD_REQUEST);
    }

    // 4) Generate temporary password (use util)
    const tempPassword = generateTempPassword();

    // 5) Hash temporary password (use central password util)
    const passwordHash = await hashPassword(tempPassword);

    // 6) Insert new student record
    const insertSql = `
      INSERT INTO students (matric_number, full_name, email, programme_id, year_of_study, password_hash, must_change_password, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING student_id, matric_number, full_name, email, programme_id, year_of_study, is_active, created_at, updated_at, must_change_password, created_by
    `;

    const insertValues = [
      normalizedMatric,
      full_name.trim(),
      normalizedEmail,
      programme_id,
      year_of_study,
      passwordHash,
      true,
      adminId,
    ];

    const insertResult = await client.query(insertSql, insertValues);
    const createdStudent = insertResult.rows[0];

    // Commit DB changes before sending email to avoid sending emails for failed inserts
    await client.query('COMMIT');

    // 7) Send welcome email (best-effort): include login identifier and temp password
    try {
      const { subject, text, html } = studentWelcomeTemplate({
        name: createdStudent.full_name,
        loginIdentifier: createdStudent.email,
        matricNumber: createdStudent.matric_number,
        tempPassword,
      });

      const emailResult = await sendEmail({ to: createdStudent.email, subject, text, html });
      if (!emailResult.ok) {
        // Log and return a warning, but do not delete the created student
        console.warn('Welcome email failed to send', { email: createdStudent.email, error: emailResult.error });
        createdStudent.email_sent = false;
      } else {
        createdStudent.email_sent = true;
      }
    } catch (emailErr) {
      console.error('Unexpected error while sending welcome email', emailErr);
      createdStudent.email_sent = false;
    }

    // 8) Sanitize response (never include password_hash)
    const sanitized = {
      id: createdStudent.student_id,
      matric_number: createdStudent.matric_number,
      full_name: createdStudent.full_name,
      email: createdStudent.email,
      programme_id: createdStudent.programme_id,
      year_of_study: createdStudent.year_of_study,
      is_active: createdStudent.is_active,
      must_change_password: createdStudent.must_change_password,
      created_at: createdStudent.created_at,
      updated_at: createdStudent.updated_at,
      created_by: createdStudent.created_by,
      email_sent: createdStudent.email_sent,
    };

    // Attach the temporary password to a special field only in the service return so callers (controller/tests)
    // can use it for immediate display or testing. Ensure controllers do NOT log or persist it.
    return { student: sanitized, tempPassword };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    // If it's an HttpError with statusCode, rethrow to be handled by controllers
    if (err && err.statusCode) throw err;

    // Map known DB errors (e.g., unique constraint) to friendly messages
    if (err && err.code === '23505') {
      // unique_violation
      throw createHttpError('Duplicate value', HTTP_STATUS.CONFLICT);
    }

    console.error('Unexpected error in createStudent', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to create student', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const deactivateStudent = async (studentId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStudent = await client.query('SELECT student_id FROM students WHERE student_id = $1', [studentId]);
    if (existingStudent.rowCount === 0) {
      throw createHttpError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    await client.query(
      `UPDATE students SET is_active = false, updated_at = NOW() WHERE student_id = $1`,
      [studentId]
    );

    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE actor_type = 'student' AND actor_id = $1 AND revoked_at IS NULL`,
      [studentId]
    );

    await client.query('COMMIT');

    return await getStudentById(studentId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in deactivateStudent', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to deactivate student', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const activateStudent = async (studentId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStudent = await client.query('SELECT student_id FROM students WHERE student_id = $1', [studentId]);
    if (existingStudent.rowCount === 0) {
      throw createHttpError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    await client.query(
      `UPDATE students SET is_active = true, updated_at = NOW() WHERE student_id = $1`,
      [studentId]
    );

    await client.query('COMMIT');

    return await getStudentById(studentId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in activateStudent', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to activate student', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const deactivateStaff = async (staffId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStaff = await client.query('SELECT staff_id FROM staff WHERE staff_id = $1', [staffId]);
    if (existingStaff.rowCount === 0) {
      throw createHttpError('Staff not found', HTTP_STATUS.NOT_FOUND);
    }

    await client.query(
      `UPDATE staff SET is_active = false, updated_at = NOW() WHERE staff_id = $1`,
      [staffId]
    );

    await client.query(
      `UPDATE sessions SET revoked_at = NOW() WHERE actor_type = 'staff' AND actor_id = $1 AND revoked_at IS NULL`,
      [staffId]
    );

    await client.query('COMMIT');

    return await getStaffById(staffId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in deactivateStaff', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to deactivate staff', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const activateStaff = async (staffId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStaff = await client.query('SELECT staff_id FROM staff WHERE staff_id = $1', [staffId]);
    if (existingStaff.rowCount === 0) {
      throw createHttpError('Staff not found', HTTP_STATUS.NOT_FOUND);
    }

    await client.query(
      `UPDATE staff SET is_active = true, updated_at = NOW() WHERE staff_id = $1`,
      [staffId]
    );

    await client.query('COMMIT');

    return await getStaffById(staffId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in activateStaff', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to activate staff', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const getStudents = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest({ query: queryParams }, {
    defaultSort: 'student_id',
    defaultOrder: 'asc',
    allowedSortFields: ['student_id', 'full_name', 'programme_id', 'year_of_study', 'created_at', 'updated_at'],
  });

  const filters = [];
  const values = [];
  let idx = 1;

  if (queryParams.programme_id !== undefined) {
    filters.push(`programme_id = $${idx++}`);
    values.push(queryParams.programme_id);
  }

  if (queryParams.year_of_study !== undefined) {
    filters.push(`year_of_study = $${idx++}`);
    values.push(queryParams.year_of_study);
  }

  if (queryParams.is_active !== undefined) {
    filters.push(`is_active = $${idx++}`);
    values.push(queryParams.is_active);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::int AS total FROM students ${whereClause}`;
  const countResult = await db.query(countSql, values);
  const total = countResult.rows[0].total;

  const dataSql = `
    SELECT student_id, matric_number, full_name, email, programme_id, year_of_study, is_active,
      must_change_password, created_by, created_at, updated_at
    FROM students
    ${whereClause}
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $${idx++}
    OFFSET $${idx++}
  `;

  const dataResult = await db.query(dataSql, [...values, pagination.limit, pagination.offset]);

  const students = dataResult.rows.map((row) => ({
    id: row.student_id,
    matric_number: row.matric_number,
    full_name: row.full_name,
    email: row.email,
    programme_id: row.programme_id,
    year_of_study: row.year_of_study,
    is_active: row.is_active,
    must_change_password: row.must_change_password,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    students,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      sort: pagination.sort,
      order: pagination.order,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getStudentById = async (studentId) => {
  const sql = `
    SELECT student_id, matric_number, full_name, email, programme_id, year_of_study, is_active,
      must_change_password, created_by, created_at, updated_at
    FROM students
    WHERE student_id = $1
  `;

  const { rows } = await db.query(sql, [studentId]);
  if (rows.length === 0) {
    throw createHttpError('Student not found', HTTP_STATUS.NOT_FOUND);
  }

  const row = rows[0];
  return {
    id: row.student_id,
    matric_number: row.matric_number,
    full_name: row.full_name,
    email: row.email,
    programme_id: row.programme_id,
    year_of_study: row.year_of_study,
    is_active: row.is_active,
    must_change_password: row.must_change_password,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const updateStudent = async (studentId, { matric_number, programme_id, year_of_study, email }) => {
  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : undefined;
  const normalizedMatric = typeof matric_number === 'string' ? matric_number.trim() : undefined;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStudent = await client.query('SELECT student_id FROM students WHERE student_id = $1', [studentId]);
    if (existingStudent.rowCount === 0) {
      throw createHttpError('Student not found', HTTP_STATUS.NOT_FOUND);
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (normalizedMatric !== undefined) {
      const matricCheck = await client.query(
        'SELECT student_id FROM students WHERE matric_number = $1 AND student_id <> $2',
        [normalizedMatric, studentId]
      );
      if (matricCheck.rowCount > 0) {
        throw createHttpError('Matric number already exists', HTTP_STATUS.CONFLICT);
      }
      fields.push(`matric_number = $${idx++}`);
      values.push(normalizedMatric);
    }

    if (normalizedEmail !== undefined) {
      const emailCheck = await client.query(
        'SELECT student_id FROM students WHERE email = $1 AND student_id <> $2',
        [normalizedEmail, studentId]
      );
      if (emailCheck.rowCount > 0) {
        throw createHttpError('Email already exists', HTTP_STATUS.CONFLICT);
      }
      fields.push(`email = $${idx++}`);
      values.push(normalizedEmail);
    }

    if (programme_id !== undefined) {
      const progCheck = await client.query('SELECT programme_id, is_active FROM programmes WHERE programme_id = $1', [programme_id]);
      if (progCheck.rowCount === 0) {
        throw createHttpError('Programme not found', HTTP_STATUS.BAD_REQUEST);
      }
      if (!progCheck.rows[0].is_active) {
        throw createHttpError('Programme is not active', HTTP_STATUS.BAD_REQUEST);
      }
      fields.push(`programme_id = $${idx++}`);
      values.push(programme_id);
    }

    if (year_of_study !== undefined) {
      fields.push(`year_of_study = $${idx++}`);
      values.push(year_of_study);
    }

    if (fields.length === 0) {
      throw createHttpError('No updatable fields provided', HTTP_STATUS.BAD_REQUEST);
    }

    const updateSql = `
      UPDATE students
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE student_id = $${idx}
    `;
    values.push(studentId);

    await client.query(updateSql, values);
    await client.query('COMMIT');

    return await getStudentById(studentId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in updateStudent', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to update student', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const updateStaff = async (staffId, { department_id, job_title, employment_type }) => {
  const normalizedJobTitle = typeof job_title === 'string' ? job_title.trim() : undefined;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingStaff = await client.query('SELECT staff_id FROM staff WHERE staff_id = $1', [staffId]);
    if (existingStaff.rowCount === 0) {
      throw createHttpError('Staff not found', HTTP_STATUS.NOT_FOUND);
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (department_id !== undefined) {
      const deptCheck = await client.query('SELECT department_id, is_active FROM departments WHERE department_id = $1', [department_id]);
      if (deptCheck.rowCount === 0) {
        throw createHttpError('Department not found', HTTP_STATUS.BAD_REQUEST);
      }
      if (!deptCheck.rows[0].is_active) {
        throw createHttpError('Department is not active', HTTP_STATUS.BAD_REQUEST);
      }
      fields.push(`department_id = $${idx++}`);
      values.push(department_id);
    }

    if (normalizedJobTitle !== undefined) {
      fields.push(`job_title = $${idx++}`);
      values.push(normalizedJobTitle);
    }

    if (employment_type !== undefined) {
      fields.push(`employment_type = $${idx++}`);
      values.push(employment_type);
    }

    if (fields.length === 0) {
      throw createHttpError('No updatable fields provided', HTTP_STATUS.BAD_REQUEST);
    }

    const updateSql = `
      UPDATE staff
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE staff_id = $${idx}
    `;
    values.push(staffId);

    await client.query(updateSql, values);
    await client.query('COMMIT');

    return await getStaffById(staffId);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    console.error('Unexpected error in updateStaff', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to update staff', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

const getStaffs = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest({ query: queryParams }, {
    defaultSort: 'staff_id',
    defaultOrder: 'asc',
    allowedSortFields: ['staff_id', 'full_name', 'email', 'job_title', 'employment_type', 'date_joined', 'created_at', 'updated_at'],
  });

  const filters = [];
  const values = [];
  let idx = 1;

  if (queryParams.department_id !== undefined) {
    filters.push(`department_id = $${idx++}`);
    values.push(queryParams.department_id);
  }

  if (queryParams.employment_type !== undefined) {
    filters.push(`employment_type = $${idx++}`);
    values.push(queryParams.employment_type);
  }

  if (queryParams.is_active !== undefined) {
    filters.push(`is_active = $${idx++}`);
    values.push(queryParams.is_active);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::int AS total FROM staff ${whereClause}`;
  const countResult = await db.query(countSql, values);
  const total = countResult.rows[0].total;

  const dataSql = `
    SELECT staff_id, department_id, full_name, preferred_name, email, personal_email, office_phone, mobile,
      job_title, office_location, biography, employment_type, session_duration_mins, buffer_time_mins,
      booking_window_weeks, max_active_requests, is_active, date_joined, created_by, created_at, updated_at
    FROM staff
    ${whereClause}
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $${idx++}
    OFFSET $${idx++}
  `;

  const dataResult = await db.query(dataSql, [...values, pagination.limit, pagination.offset]);

  const staff = dataResult.rows.map((row) => ({
    id: row.staff_id,
    department_id: row.department_id,
    full_name: row.full_name,
    preferred_name: row.preferred_name,
    email: row.email,
    personal_email: row.personal_email,
    office_phone: row.office_phone,
    mobile: row.mobile,
    job_title: row.job_title,
    office_location: row.office_location,
    biography: row.biography,
    employment_type: row.employment_type,
    session_duration_mins: row.session_duration_mins,
    buffer_time_mins: row.buffer_time_mins,
    booking_window_weeks: row.booking_window_weeks,
    max_active_requests: row.max_active_requests,
    is_active: row.is_active,
    date_joined: row.date_joined,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return {
    staff,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      sort: pagination.sort,
      order: pagination.order,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

const getStaffById = async (staffId) => {
  const sql = `
    SELECT s.staff_id, s.department_id, s.full_name, s.preferred_name, s.email, s.personal_email,
      s.office_phone, s.mobile, s.job_title, s.office_location, s.biography, s.employment_type,
      s.session_duration_mins, s.buffer_time_mins, s.booking_window_weeks, s.max_active_requests,
      s.is_active, s.date_joined, s.must_change_password, s.created_by, s.created_at, s.updated_at,
      json_agg(json_build_object('id', sp.specialisation_id, 'specialisation_name', sp.specialisation_name))
        FILTER (WHERE sp.specialisation_id IS NOT NULL) AS specialisations
    FROM staff s
    LEFT JOIN staff_specialisations ss ON ss.staff_id = s.staff_id
    LEFT JOIN specialisations sp ON sp.specialisation_id = ss.specialisation_id
    WHERE s.staff_id = $1
    GROUP BY s.staff_id
  `;

  const { rows } = await db.query(sql, [staffId]);
  if (rows.length === 0) {
    throw createHttpError('Staff not found', HTTP_STATUS.NOT_FOUND);
  }

  const row = rows[0];
  return {
    id: row.staff_id,
    department_id: row.department_id,
    full_name: row.full_name,
    preferred_name: row.preferred_name,
    email: row.email,
    personal_email: row.personal_email,
    office_phone: row.office_phone,
    mobile: row.mobile,
    job_title: row.job_title,
    office_location: row.office_location,
    biography: row.biography,
    employment_type: row.employment_type,
    session_duration_mins: row.session_duration_mins,
    buffer_time_mins: row.buffer_time_mins,
    booking_window_weeks: row.booking_window_weeks,
    max_active_requests: row.max_active_requests,
    is_active: row.is_active,
    date_joined: row.date_joined,
    must_change_password: row.must_change_password,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    specialisations: row.specialisations || [],
  };
};

const createStaff = async (
  { full_name, email, job_title, department_id, employment_type, specialisation_ids = [] },
  adminId
) => {
  if (!adminId) throw createHttpError('Admin ID is required for auditing', HTTP_STATUS.BAD_REQUEST);

  const normalizedEmail = normalizeEmail(email);
  const normalizedFullName = typeof full_name === 'string' ? full_name.trim() : full_name;
  const normalizedJobTitle = typeof job_title === 'string' ? job_title.trim() : job_title;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1) Email uniqueness for staff
    const emailCheck = await client.query('SELECT staff_id FROM staff WHERE email = $1', [normalizedEmail]);
    if (emailCheck.rowCount > 0) {
      throw createHttpError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    // 2) Validate department relationship and active status
    const deptCheck = await client.query(
      'SELECT department_id, is_active FROM departments WHERE department_id = $1',
      [department_id]
    );
    if (deptCheck.rowCount === 0) {
      throw createHttpError('Department not found', HTTP_STATUS.BAD_REQUEST);
    }
    if (!deptCheck.rows[0].is_active) {
      throw createHttpError('Department is not active', HTTP_STATUS.BAD_REQUEST);
    }

    // 3) Validate specialisation IDs if provided
    const uniqueSpecialisationIds = [];
    if (specialisation_ids !== undefined && specialisation_ids !== null) {
      if (!Array.isArray(specialisation_ids)) {
        throw createHttpError('specialisation_ids must be an array of IDs', HTTP_STATUS.BAD_REQUEST);
      }

      const parsedSpecialisationIds = specialisation_ids.map((id) => Number(id));
      if (parsedSpecialisationIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw createHttpError('specialisation_ids must contain only positive integers', HTTP_STATUS.BAD_REQUEST);
      }

      for (const id of parsedSpecialisationIds) {
        if (!uniqueSpecialisationIds.includes(id)) uniqueSpecialisationIds.push(id);
      }

      if (uniqueSpecialisationIds.length > 0) {
        const specCheck = await client.query(
          'SELECT specialisation_id FROM specialisations WHERE specialisation_id = ANY($1)',
          [uniqueSpecialisationIds]
        );
        if (specCheck.rowCount !== uniqueSpecialisationIds.length) {
          throw createHttpError('One or more specialisation IDs are invalid', HTTP_STATUS.BAD_REQUEST);
        }
      }
    }

    // 4) Generate temporary password
    const tempPassword = generateTempPassword();

    // 5) Hash temporary password
    const passwordHash = await hashPassword(tempPassword);

    // 6) Insert new staff record
    const insertSql = `
      INSERT INTO staff (department_id, full_name, email, job_title, employment_type, password_hash, must_change_password, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING staff_id, department_id, full_name, preferred_name, email, personal_email, office_phone, mobile,
        job_title, office_location, biography, employment_type, session_duration_mins, buffer_time_mins,
        booking_window_weeks, max_active_requests, is_active, date_joined, created_at, updated_at,
        must_change_password, created_by
    `;

    const insertValues = [
      department_id,
      normalizedFullName,
      normalizedEmail,
      normalizedJobTitle,
      employment_type,
      passwordHash,
      true,
      adminId,
    ];

    const insertResult = await client.query(insertSql, insertValues);
    const createdStaff = insertResult.rows[0];

    // 7) Insert staff specialisations if provided
    if (uniqueSpecialisationIds.length > 0) {
      const placeholders = uniqueSpecialisationIds
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(', ');
      const specInsertSql = `
        INSERT INTO staff_specialisations (staff_id, specialisation_id)
        VALUES ${placeholders}
      `;
      await client.query(specInsertSql, [createdStaff.staff_id, ...uniqueSpecialisationIds]);
    }

    await client.query('COMMIT');

    // 8) Send welcome email
    try {
      const { subject, text, html } = staffWelcomeTemplate({
        name: createdStaff.full_name,
        loginIdentifier: createdStaff.email,
        staffEmail: createdStaff.email,
        tempPassword,
      });

      const emailResult = await sendEmail({ to: createdStaff.email, subject, text, html });
      createdStaff.email_sent = Boolean(emailResult.ok);
      if (!emailResult.ok) {
        console.warn('Welcome email failed to send', { email: createdStaff.email, error: emailResult.error });
      }
    } catch (emailErr) {
      console.error('Unexpected error while sending staff welcome email', emailErr);
      createdStaff.email_sent = false;
    }

    const sanitized = {
      id: createdStaff.staff_id,
      department_id: createdStaff.department_id,
      full_name: createdStaff.full_name,
      preferred_name: createdStaff.preferred_name,
      email: createdStaff.email,
      personal_email: createdStaff.personal_email,
      office_phone: createdStaff.office_phone,
      mobile: createdStaff.mobile,
      job_title: createdStaff.job_title,
      office_location: createdStaff.office_location,
      biography: createdStaff.biography,
      employment_type: createdStaff.employment_type,
      session_duration_mins: createdStaff.session_duration_mins,
      buffer_time_mins: createdStaff.buffer_time_mins,
      booking_window_weeks: createdStaff.booking_window_weeks,
      max_active_requests: createdStaff.max_active_requests,
      is_active: createdStaff.is_active,
      date_joined: createdStaff.date_joined,
      created_at: createdStaff.created_at,
      updated_at: createdStaff.updated_at,
      must_change_password: createdStaff.must_change_password,
      created_by: createdStaff.created_by,
      email_sent: createdStaff.email_sent,
    };

    return { staff: sanitized, tempPassword };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Failed to rollback transaction', rbErr);
    }

    if (err && err.statusCode) throw err;
    if (err && err.code === '23505') {
      throw createHttpError('Duplicate value', HTTP_STATUS.CONFLICT);
    }

    console.error('Unexpected error in createStaff', err);
    throw createHttpError(MESSAGES.SERVER_RUNNING || 'Failed to create staff', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  } finally {
    client.release();
  }
};

module.exports = {
  createStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  resetStudentPassword,
  getStudents,
  getStudentById,
  getStaffs,
  getStaffById,
  updateStaff,
  deactivateStaff,
  activateStaff,
  resetStaffPassword,
  createStaff,
};
