module.exports = function(app, TopStatModel, NoteModel, ensureAuthenticated){
    
    app.get('/account', ensureAuthenticated, function(req, res){
        var params = {type: 'hourly', count: 24}; 
        var topStatModel = new TopStatModel;
        topStatModel.findAll(params, function(error, docs){
            res.render('account', { title: 'Lending Tools', data: docs });
        });
    });
    
    app.get('/account/notes', ensureAuthenticated, function(req, res){
        var params = {type: 'hourly', count: 24}; 
        var noteModel = new NoteModel;
        noteModel.findAll(params, function(error, docs){
            res.render('notes', { title: 'Lending Tools', data: docs });
        });
    });

};
