(function (angualar) {
    'use.strict';

    angular.module('GitApp', ['ui.router', 'ngMessages'])
      .config(function($stateProvider, $urlRouterProvider) {
     	
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
            	templateUrl: '/views/login.html',
            	controller: 'LoginCtrl'
            })

            .state('signup', {
            	url: '/signup',
            	templateUrl: 'views/signup.html',
            	controller: 'SignupCtrl'
            })



      });
  }(angular));

