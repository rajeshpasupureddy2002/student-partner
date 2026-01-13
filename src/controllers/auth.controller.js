exports.homePage = (req, res) => {
    res.render('home', {
      title: 'Student Partner'
    });
  };
  
  exports.loginPage = (req, res) => {
    res.render('login', {
      title: 'Login'
    });
  };

  exports.registerPage = (req, res) => {
    res.render('register', {
      title: 'Register'
    });
  };