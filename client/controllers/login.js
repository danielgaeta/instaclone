angular.module('GitApp')
  .controller('LoginCtrl', function($scope, $window, $location, $rootScope, $q, twitterService) {
 
    $scope.tweets; //array of tweets
    
    console.log("here");
    twitterService.initialize();

    //using the OAuth authorization result get the latest 20 tweets from twitter for the user
    $scope.refreshTimeline = function() {
        twitterService.getLatestTweets().then(function(data) {
            $scope.tweets = data;
        });
    }

    //when the user clicks the connect twitter button, the popup authorization window opens
    $scope.connectButton = function() {
        twitterService.clearCache();
        twitterService.connectTwitter().then(function() {
            if (twitterService.isReady()) {
                //if the authorization is successful, hide the connect button and display the tweets
                $('#connectButton').fadeOut(function(){
                    $('#getTimelineButton, #signOut').fadeIn();
                    $scope.refreshTimeline();
                });
            }
        });
    }

    //sign out clears the OAuth cache, the user will have to reauthenticate when returning
    $scope.signOut = function() {
        twitterService.clearCache();
        $scope.tweets.length = 0;
        $('#getTimelineButton, #signOut').fadeOut(function(){
            $('#connectButton').fadeIn();
        });
    }

    //if the user is a returning user, hide the sign in button and display the tweets
    if (twitterService.isReady()) {
        $('#connectButton').hide();
        $('#getTimelineButton, #signOut').show();
        $scope.refreshTimeline();
    }


    // $scope.githubLogin = function() {
    //   $auth.authenticate('github')
    //     .then(function(response) {
    //       console.log(response);
    //       $window.localStorage.currentUser = JSON.stringify(response.data.user);
    //       $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);
    //     })
    //     .catch(function(response) {
    //       console.log(response.data);
    //     });
    // };
 
    $scope.emailLogin = function() {
      $auth.login({ email: $scope.email, password: $scope.password })
        .then(function(response) {
          $window.localStorage.currentUser = JSON.stringify(response.data.user);
          $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);
        })
        .catch(function(response) {
          $scope.errorMessage = {};
          angular.forEach(response.data.message, function(message, field) {
            $scope.loginForm[field].$setValidity('server', false);
            $scope.errorMessage[field] = response.data.message[field];
          });
        });
    };
 
  });