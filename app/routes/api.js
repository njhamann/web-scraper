/*
 * GET home page.
 */

module.exports = function(app, topStatsModel){
    //api/[type]/[period type]/[length]
    app.get('/api/top_stats/:type/:count', function(req, res){
        topStatsModel.findAll(req.params, function(error,docs){
            res.json(docs);
        });
    });
};
