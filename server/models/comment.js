var mongoose = require('mongoose'),
	Commentschema = require('../schemas/schema_comment.js');

var Comment = mongoose.model('Comment', Commentschema, 'comment')

module.exports = Comment;