/*
 * GET home page.
 */

module.exports = function(app, topStatsModel){
    app.get('/', function(req, res){
        var params = {type: 'hourly', count: 12};    
        topStatsModel.findAll(params, function(error,docs){
            res.render('index', { title: 'Lending Tools', data: docs });
        });
    });
};
