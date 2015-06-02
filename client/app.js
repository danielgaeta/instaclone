angular.module('Instagram', ['ngMessages', 'ui.router', 'satellizer'])
	.config(function($urlRouterProvider, $stateProvider, $authProvider) {
		$urlRouterProvider.otherwise('/home');
    
    	$stateProvider
        
        // HOME STATES AND NESTED VIEWS ========================================
        .state('home', {
            url: '/home',
            templateUrl: 'views/home.html',
            controller: 'HomeCtrl'
        })

        .state('login', {
        	url: '/login',
        	templateUrl: 'views/login.html',
        	controller: 'LoginCtrl'
        })

        .state('signup', {
        	url: '/signup',
        	templateUrl: 'views/signup.html',
        	controller: 'SignupCtrl'
        })

        .state('/photo/id', {
        	url: '/photo/:id', 
        	templateUrl: 'views/detail.html',
        	controller: 'DetailCtrl'
        });

        $authProvider.loginUrl = 'http://localhost:3000/auth/login';
		$authProvider.signupUrl = 'http://localhost:3000/auth/signup';
		$authProvider.oauth2({
		  name: 'instagram',
		  url: 'http://localhost:3000/auth/instagram',
		  redirectUri: 'http://localhost:8000',
		  clientId: 'cae1e199b535407da68342f8e2ef2e6e',
		  requiredUrlParams: ['scope'],
		  scope: ['likes'],
		  scopeDelimiter: '+',
		  authorizationEndpoint: 'https://api.instagram.com/oauth/authorize'
		});
	}).run(function($rootScope, $window, $auth) {
    if ($auth.isAuthenticated() && $window.localStorage.currentUser) {
      $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);
    }
  });