var config = require('./config');
var cronJob = require('cron').CronJob;
var request = require('request');
var jsdom = require("jsdom");
var mongodb = require('mongodb');
var moment = require('moment');

// request functions
function getPage(){
    request.post('https://www.lendingclub.com/account/login.action', {form:{
        login_url: '',
        login_remember_me: 'on', 
        login_email: config.account.email, 
        login_password: config.account.password
    }}, function(err, resp, body){
        if (!err) {
            
            request('https://www.lendingclub.com/account/summary.action', function(err, response, body){
                if (!err && response.statusCode == 200) {
                    parseDom(body);
                }
            });
            
            request('https://www.lendingclub.com/account/NotesSummaryAj.action', function(err, response, body){
                if (!err && response.statusCode == 200) {
                    parseJSON(body);
                }
            });

        }else{
            console.log('it did not work!');
        }
    });
};

// parse functions
function parseJSON(json){
    var rawData = JSON.parse(json);
    rawData = objKeysToUnderscore(rawData);
    rawData.time_saved = moment().unix();
    rawData = cleanData(rawData);
    console.log(rawData); 
    insertData(rawData, 'raw_notes_summary');
    toTimeseriesData(rawData, 'day_interval_top_stats', insertData);
};

function parseDom(body){
    jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(err, window){
        var rawData = extractData(window);
        rawData = cleanData(rawData);
        
        insertData(rawData, 'raw_top_stats');
        toTimeseriesData(rawData, 'day_interval_top_stats', insertData);
    }); 
};

function extractData(window){
    var $ = window.$;
    var rawData = {};
    rawData.net_annualized_return = $.trim( $('.main-module .box-module:eq(0) label:eq(1) span').text() );
    rawData.interest_received = $.trim( $('.main-module .box-module:eq(1) label:eq(1) span').text() );
    rawData.account_total = $.trim( $('.main-module .box-module:eq(2) label:eq(1) span').text() );
    rawData.time_saved = moment().unix();
    return rawData;
};

function toTimeseriesData(data, collectionName, callback){

    /*
        format:

        {
            time: [value]
            [metric key]: {
                sum: [value],
                count: [value]
            },
            [metric key]: {
                sum: [value],
                count: [value]
            }
        }

    */

    var today_unix = moment().startOf('day').unix();
    var yesterday_unix = moment.unix(today_unix).subtract('days', 1).unix();
    
    function convertData(last, curr){
        var d = {};
        d.time = today_unix;
        for(var key in curr){
            d[key] = {
                sum: curr[key],
                count: curr[key]-last[key]
            }
        }
        return d;
    };
    
    var oldData = { charged_off: 4,
      charged_off_amount: 40,
      default_l: 0,
      default_l_amount: 0,
      fully_paid: 11,
      fully_paid_amount: 300,
      in_funding: 119,
      in_funding_amount: 2975,
      issued_and_current: 690,
      issued_and_current_amount: 17558,
      late16to30_amount: 0,
      late31to120_amount: 123,
      time_saved: 1367526616 }; 
    
    var converted = convertData(oldData, data);
    console.log(converted);
    return;
    // get last timeseries
    var server = new mongodb.Server("127.0.0.1", 27017, {});
    new mongodb.Db('lending_club', server, {w: 1}).open(function (error, client) {
        if (error) throw error;
        //get last item saved
        var collection = new mongodb.Collection(client, collectionName);
        var cursor = collection.findOne({time_saved: yesterday_unix}, function(err, resp){
            if (error) throw error;
            if(resp){
                var timeData = convertData(resp, data); 
                callback(timeData, collectionName);
            }else{
            }
        });
    });
};

// generic insert function
function insertData(data, collectionName){
    return;
    var server = new mongodb.Server("127.0.0.1", 27017, {});
    new mongodb.Db('lending_club', server, {w: 1}).open(function (error, client) {
        if (error) throw error;
        var collection = new mongodb.Collection(client, collectionName);
        collection.insert(data, {safe: true}, function(err, objects){
            if(!err){
                console.log('insert successful');
            }
        });
    });
};

// cron functions
function startJob(){
    //start job at 11:30pm
    new cronJob('00 00 23 * * *', function(){
        getPage();
    }, null, true);
};

/**
 * Utility functions
 */

process.argv.forEach(function (val, index, array) {
    switch(val){
        case 'save':
            insertData();
            break;
        case 'get_page':
            getPage();
            break;
        case 'job':
            startJob();
            break;
    };
});

function objKeysToUnderscore(obj){
    for(var key in obj){
        var newKey = key.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
        obj[newKey] = obj[key];
        delete obj[key];
    }
    return obj;
}

function cleanData(data){
    for(var key in data){
        if(typeof data[key] == 'string'){
            data[key] = parseFloat( data[key].replace( /[^0-9\.]+/g, '' ) );
        }
    }; 
    return data;
}
