// npm packages
const { Validator } = require('jsonschema');

// app imports
const { Company, Job } = require('../models');
const { jobNewSchema, jobUpdateSchema } = require('../schemas');
const {
  APIError,
  formatResponse,
  parseSkipLimit,
  ensureCorrectUser,
  validateSchema
} = require('../helpers');

// globals
const v = new Validator();

/**
 * List all the jobs. Query params ?skip=0&limit=1000 by default
 */
async function readJobs(request, response, next) {
  /* pagination validation */
  let skip = parseSkipLimit(request.query.skip, null, 'skip') || 0;
  let limit = parseSkipLimit(request.query.limit, 1000, 'limit') || 1000;
  if (typeof skip !== 'number') {
    return next(skip);
  } else if (typeof limit !== 'number') {
    return next(limit);
  }

  try {
    const { count, jobs } = await Job.readJobs({}, {}, skip, limit);
    return response.json({ count, ...formatResponse(jobs) });
  } catch (err) {
    next(err);
  }
}

/**
 * Validate the POST request body and create a new Job
 */
async function createJob(request, response, next) {
  const validSchema = validateSchema(
    v.validate(request.body, jobNewSchema),
    'job'
  );

  if (validSchema !== 'OK') {
    return next(validSchema);
  }

  try {
    const company = await Company.findById(request.body.data.company);
    if (!company) {
      return next(
        new APIError(
          404,
          'Company Not Found',
          'The company ID for the job you are trying to post does not exist.'
        )
      );
    }
    const correctCompany = ensureCorrectUser(
      request.headers.authorization,
      company.handle,
      true
    );
    if (correctCompany !== 'OK') {
      return next(correctCompany);
    }
    const newJob = await Job.createJob(new Job(request.body.data));
    return response.status(201).json(formatResponse(newJob));
  } catch (err) {
    return next(err);
  }
}

/**
 * Get a single job
 * @param {String} id - the id of the Job to retrieve
 */
async function readJob(request, response, next) {
  const { id } = request.params;
  try {
    const job = await Job.readJob(id);
    return response.json(formatResponse(job));
  } catch (err) {
    return next(err);
  }
}

/**
 * Update a single job
 * @param {String} id - the id of the Job to update
 */
async function updateJob(request, response, next) {
  const { id } = request.params;

  const validSchema = validateSchema(
    v.validate(request.body, jobUpdateSchema),
    'job'
  );
  if (validSchema !== 'OK') {
    return next(validSchema);
  }

  try {
    const { company } = await Job.findById(id);
    const jobCompany = await Company.findById(company);
    const correctCompany = ensureCorrectUser(
      request.headers.authorization,
      jobCompany.handle,
      true
    );
    if (correctCompany !== 'OK') {
      return next(correctCompany);
    }
    const job = await Job.updateJob(id, request.body.data);
    return response.json(formatResponse(job));
  } catch (err) {
    return next(err);
  }
}

/**
 * Remove a single job
 * @param {String} id - the id of the Job to remove
 */
async function deleteJob(request, response, next) {
  const { id } = request.params;
  try {
    const deleteMsg = await Job.deleteJob(id);
    return response.json(deleteMsg);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createJob,
  readJob,
  readJobs,
  updateJob,
  deleteJob
};