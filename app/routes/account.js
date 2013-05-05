module.exports = function(app, TopStatModel, ensureAuthenticated){
    
    app.get('/account', ensureAuthenticated, function(req, res){
        var params = {type: 'hourly', count: 24}; 
        var topStatModel = new TopStatModel;
        topStatModel.findAll(params, function(error, docs){
            res.render('index', { title: 'Lending Tools', data: docs });
        });
    });

};
