var config = require('./config');
var cronJob = require('cron').CronJob;
var request = require('request');
var jsdom = require("jsdom");
var mongodb = require('mongodb');
var moment = require('moment');
var fs = require('fs');

// request functions
function getPage(){
    request.post('https://www.lendingclub.com/account/login.action', {form:{
        login_url: '',
        login_remember_me: 'on', 
        login_email: config.account.email, 
        login_password: config.account.password
    }}, function(err, resp, body){
        if (!err) {
            /*
            https://www.lendingclub.com/account/loanDetail.action?loan_id=4436017 
            request.post('https://www.lendingclub.com/account/loansAj.action', {form:{
                sortBy:'nextPayment',
                dir:'desc',
                startindex:0,
                pagesize:10000,
                namespace:'/account',
                r:0.4541655050124973,
                join_criteria:'all',
                status_criteria:'Late_All'
            }}, function(err, resp, body){
                if (!err) {
                    fs.writeFile("./scrapper.log", body, function(err) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log("The file was saved!");
                        }
                    });
                };
            });
            */ 
            
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
    var rawData = {};
    rawData.data = JSON.parse(json);
    rawData.data = objKeysToUnderscore(rawData.data);
    rawData.time = moment().unix();
    rawData.data = cleanData(rawData.data);
    insertData(rawData, 'raw_notes');
    toTimeseriesData(rawData, 'hour_interval_notes', 'hour', insertData);
    toTimeseriesData(rawData, 'day_interval_notes', 'day', insertData);
};

function parseDom(body){
    jsdom.env(body, ["http://code.jquery.com/jquery.js"], function(err, window){
        var rawData = {};
        rawData.data = extractData(window);
        rawData.data = cleanData(rawData.data);
        rawData.time = moment().unix();
        insertData(rawData, 'raw_top_stats');
        toTimeseriesData(rawData, 'hour_interval_top_stats', 'hour', insertData);
        toTimeseriesData(rawData, 'day_interval_top_stats', 'day', insertData);
    }); 
};

function extractData(window){
    var $ = window.$;
    var rawData = {};
    rawData.net_annualized_return = $.trim( $('.main-module .box-module:eq(0) label:eq(1) span').text() );
    rawData.interest_received = $.trim( $('.main-module .box-module:eq(1) label:eq(1) span').text() );
    rawData.account_total = $.trim( $('.main-module .box-module:eq(2) label:eq(1) span').text() );
    rawData.principal_received = $.trim( $('#paymentBox .account-detail-line:eq(1) span').text() );
    return rawData;
};

function toTimeseriesData(rawData, collectionName, type, callback){

    if(type == 'hour'){
        var current_unix = moment().startOf('hour').unix();
        var previous_unix = moment.unix(current_unix).subtract('hours', 1).unix();
    }else if(type == 'day'){
        var current_unix = moment().startOf('day').unix();
        var previous_unix = moment.unix(current_unix).subtract('days', 1).unix();
    }
    
    function convertData(last, curr){
        var d = {};
        for(var key in curr){
            if(key != '_id'){         
                var lastVal = curr[key];
                lastVal = lastVal || 0;
                if(last && last[key]){
                    lastVal = last[key].sum; 
                }
                d[key] = {
                    sum: curr[key],
                    count: parseFloat((curr[key]-lastVal).toFixed(2))
                }
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
        var cursor = collection.find().sort({time:-1}).limit(1);
        cursor.nextObject(function(err, resp){
            if (error) throw error;
            if(!resp || !resp.data){
                resp = {};
                resp.data = null;
            }
            var timeData = {};
            timeData.data = convertData(resp.data, rawData.data); 
            timeData.time = current_unix;
            callback(timeData, collectionName);
            server.close();

        });
    });
};

// generic insert function
function insertData(data, collectionName){
    var server = new mongodb.Server("127.0.0.1", 27017, {});
    new mongodb.Db('lending_club', server, {w: 1}).open(function (error, client) {
        if (error) throw error;
        var collection = new mongodb.Collection(client, collectionName);
        collection.update({ time: data.time }, data, { save: true, upsert: true }, function(err, objects){
            if(!err){
            }
            console.log('data saved')
            server.close(); 
        });
    });
};

// cron functions
function startJob(){
    //start job at 11:30pm
    new cronJob('00 00 * * * *', function(){
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
        var shouldDelete = false;
        var newKey = key.replace(/([A-Z])/g, function($1){
            shouldDelete = true;
            return "_"+$1.toLowerCase();
        });
        obj[newKey] = obj[key];
        if(shouldDelete){
            delete obj[key];
        }
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
