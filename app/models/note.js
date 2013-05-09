var mongoose = require('mongoose')
   ,Schema = mongoose.Schema;
 
var dailyNoteSchema = new Schema({
    time : Number,
    data : { 
        late16to30 : {               
            sum : Number, 
            count : Number
        },                             
        late31to120 : {              
            sum : Number, 
            count : Number
        },                             
        charged_off : {              
            sum : Number, 
            count : Number
        },                             
        charged_off_amount : {       
            sum : Number, 
            count : Number
        },                             
        default_l : {                
            sum : Number, 
            count : Number
        },                             
        default_l_amount : {         
            sum : Number, 
            count : Number
        },                             
        fully_paid : {               
            sum : Number, 
            count : Number
        },                             
        fully_paid_amount : {        
            sum : Number, 
            count : Number
        },                             
        in_funding : {               
            sum : Number, 
            count : Number
        },                             
        in_funding_amount : {        
            sum : Number, 
            count : Number
        },                             
        issued_and_current : {       
            sum : Number, 
            count : Number
        },                             
        issued_and_current_amount : {
            sum : Number, 
            count : Number
        },                             
        late16to30_amount : {        
            sum : Number, 
            count : Number
        },                             
        late31to120_amount : {       
            sum : Number, 
            count : Number
        }                  
    }
});

dailyNoteSchema.methods = {
    findAll: function(params, callback){
        this.model('hour_interval_note').find()
          .sort({time: -1})
          .limit(parseInt(params.count || 24))
          .exec(callback);
    }
};

module.exports = mongoose.model('hour_interval_note', dailyNoteSchema);

