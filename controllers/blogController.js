const Blog = require('../models/blog');
const {catchError} = require('../middlewares/CatchError');

exports.createBlog = catchError(async(req, res) =>{
    const {title, shortNote, content, cityId, tags} = req.body;
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const files = req.s3FileUrls;

    const newBlog = new Blog({
        title,
        shortNote,
        content,
        cityId,
        createdBy:userId,
        files,
        tags
    });

    const savedBlog = await newBlog.save();

    return res.status(201).json({data:savedBlog, message:"Record Created Successfully!"});

});


exports.getBlogByAdmin = catchError(async(req, res) =>{
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const blogs = await Blog.find()
      .populate('cityId', 'name')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

      return res.status(200).json({
        blogs,
        currentPage: page,
        totalPages: Math.ceil(await Blog.countDocuments() / pageSize),
        count: Math.ceil(await Blog.countDocuments()),
      });
});

exports.getBlogById = catchError(async(req, res) =>{
    const blog = await Blog.findById(req.params.id).populate('cityId', 'name').exec();

    return res.status(200).json({data:blog});
});

exports.updateBlog = catchError(async(req, res) =>{
    const {title, shortNote, content, cityId, tags} = req.body;

    const files = req.s3FileUrls;

    const blog = await Blog.findById(req.params.id).exec();

    blog.title = title;
    blog.cityId = cityId;
    blog.shortNote = shortNote;
    blog.content = content;
    blog.tags = tags;
    blog.files = files;

    const updatedBlog = await blog.save();

    return res.status(201).json({data:updatedBlog, message:"Record Updated Successfully!"})
});

exports.publishBlog = catchError(async(req, res) =>{
    const status ='published';

    const blog = await Blog.findById(req.params.id).exec();

    blog.status = status;
    const updatedStatus = await blog.save();

    return res.status(201).json({message:"Blog Published successfully!"})
});

exports.getAllBlogs = catchError(async(req, res) =>{
    const blogs = await Blog.find({status:"published"}).populate('cityId', 'name').exec();
    return res.status(200).json({blogs});

});


exports.getRecentBlogs = catchError(async(req, res) => {
    const recentBlogs = await Blog.find({status: "published"})
                                  .sort({createdAt: -1})
                                  .limit(4) 
                                  .populate('cityId', 'name')  
                                  .exec();

    const updatedBlogs = recentBlogs.map(blog => {
        const blogObj = blog.toObject();
        blogObj.id = blogObj._id;
        delete blogObj._id;
        
        return blogObj;
    });

    return res.status(200).json({updatedBlogs});
});

exports.deleteBlog = catchError(async(req, res) =>{
    const deleteBlog = await Blog.findByIdAndDelete(req.params.id);

    return res.status(200).json({message:"Record Deleted Successfully!"});

});