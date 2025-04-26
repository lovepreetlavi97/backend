const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');

const { Blog } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new blog
const createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user._id;
    const image = req.file ? req.file.location : null;

    if (!title || !content) {
      return errorResponse(res, 400, "Title and content are required.");
    }

    const blogData = { title, content, image, authorId };
    const blog = await create(Blog, blogData);

    return successResponse(res, 201, messages.BLOG_CREATED, { blog });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await findMany(Blog);

    if (!blogs.length) {
      return successResponse(res, 200, messages.BLOGS_NOT_FOUND, { blogs });
    }

    return successResponse(res, 200, messages.BLOGS_RETRIEVED, { blogs });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get a blog by ID
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await findOne(Blog, { _id: id });

    if (!blog) {
      return errorResponse(res, 404, messages.BLOG_NOT_FOUND);
    }

    return successResponse(res, 200, messages.BLOG_RETRIEVED, { blog });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Update blog by ID
const updateBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const image = req.file ? req.file.location : null;

    const updateData = { title, content };
    if (image) updateData.image = image;

    const blog = await findAndUpdate(Blog, { _id: id }, updateData);

    if (!blog) {
      return errorResponse(res, 404, messages.BLOG_NOT_FOUND);
    }

    return successResponse(res, 200, messages.BLOG_UPDATED, { blog });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Delete a blog by ID
const deleteBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteOne(Blog, { _id: id });

    if (result.deletedCount === 0) {
      return errorResponse(res, 404, messages.BLOG_NOT_FOUND);
    }

    return successResponse(res, 200, messages.BLOG_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
};
