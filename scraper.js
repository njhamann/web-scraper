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
    var obj = JSON.parse(json);
    data = objKeysToUnderscore(obj);
    data.time_saved = moment().unix();
    console.log(data);
    insertData(data, 'raw_notes_summary');
};

function parseDom(body){
    jsdom.env(body, ["http://code.jquery.com/jquery.js"], extractData); 
};

function extractData(err, window){
    var $ = window.$;
    var rawData = {};
    rawData.net_annualized_return = parseFloat($.trim($('.main-module .box-module:eq(0) label:eq(1) span').text()).replace(/[^0-9\.]+/g, ''));
    rawData.interest_received = parseFloat($.trim($('.main-module .box-module:eq(1) label:eq(1) span').text()).replace(/[^0-9\.]+/g, ''));
    rawData.account_total = parseFloat($.trim($('.main-module .box-module:eq(2) label:eq(1) span').text()).replace(/[^0-9\.]+/g, ''));
    rawData.time_saved = moment().unix();
    console.log(rawData);
    insertData(rawData, 'raw_top_stats');
    toTimeseriesData(rawData, 'day_interval_top_stats', insertData);
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
    
        mongodb notes:
        db.collection.find( { field: { $gt: value1, $lt: value2 } } );

    */

    var today_unix = moment().startOf('day').unix();
    var yesterday_unix = moment.unix(today).subtract('days', 1).unix();
    var data = {};
    
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
