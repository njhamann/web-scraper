var mongoose = require('mongoose')
   ,Schema = mongoose.Schema;
 
var dailyTopStatsSchema = new Schema({
    time : Number,
    data : { 
        net_annualized_return : { 
            sum : Number, 
            count : Number
        }, 
        interest_received : {
            sum : Number,
            count : Number 
        }, 
        account_total : { 
            sum : Number, 
            count : Number 
        }
    }
});

dailyTopStatsSchema.methods = {
    findAll: function(params, callback){
        this.model('day_interval_top_stat').find()
          .sort({time: -1})
          .limit(parseInt(params.count || 24))
          .exec(callback);
    }
};

module.exports = mongoose.model('day_interval_top_stat', dailyTopStatsSchema);

