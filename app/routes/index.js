/*
 * GET home page.
 */

module.exports = function(app, TopStatModel, UserModel, passport){
    
    app.get('/', function(req, res){
        var params = {type: 'hourly', count: 24}; 
        var topStatModel = new TopStatModel;
        topStatModel.findAll(params, function(error, docs){
            console.log(docs);
            res.render('index', { title: 'Lending Tools', data: docs });
        });
    });

    app.get('/login', function(req, res){
        res.render('login', { user: req.user, message: req.session.messages });
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err) }
            if (!user) {
                req.session.messages =  [info.message];
                return res.redirect('/login')
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/account');
            });
        })(req, res, next);
    });

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });
    
    app.get('/signup', function(req, res){
        res.render('signup');
    });
    
    app.post('/signup', function(req, res){
        var user = new UserModel(req.body);
        user.email = req.body.username;
        user.save(function (err) {
            if (err) {
                console.log(err);
                return res.render('signup', { errors: err.errors, user: user });
            }
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.redirect('/account');
            });
        });
    });
};
