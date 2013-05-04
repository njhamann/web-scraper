var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

TopStats = function(host, port) {
  this.db= new Db('lending_club', new Server(host, port, {auto_reconnect: true}, {}), {w: 1});
  this.db.open(function(){});
};


TopStats.prototype.getCollection= function(callback) {
  this.db.collection('day_interval_top_stats', function(error, article_collection) {
    if( error ) callback(error);
    else callback(null, article_collection);
  });
};

TopStats.prototype.findAll = function(params, callback) {
    this.getCollection(function(error, article_collection) {
        if( error ) callback(error)
        else {
            article_collection.find()
              .sort({time: -1})
              .limit(parseInt(params.count || 24))
              .toArray(function(error, results) {
              
                if( error ) callback(error)
                else callback(null, results)
            });
        }
    });
};


TopStats.prototype.findById = function(id, callback) {
    this.getCollection(function(error, article_collection) {
      if( error ) callback(error)
      else {
        article_collection.findOne({_id: article_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

TopStats.prototype.save = function(articles, callback) {
    this.getCollection(function(error, article_collection) {
      if( error ) callback(error)
      else {
        if( typeof(articles.length)=="undefined")
          articles = [articles];

        for( var i =0;i< articles.length;i++ ) {
          article = articles[i];
          article.created_at = new Date();
          if( article.comments === undefined ) article.comments = [];
          for(var j =0;j< article.comments.length; j++) {
            article.comments[j].created_at = new Date();
          }
        }

        article_collection.insert(articles, function() {
          callback(null, articles);
        });
      }
    });
};

exports.TopStats = TopStats;
