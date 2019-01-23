var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// configuration schema dans le mongodb
module.exports = mongoose.model('User', new Schema({ 
    name: String, 
    password: String, 
    admin: Boolean ,
    avatar:String,
    createdAt: Date
}));