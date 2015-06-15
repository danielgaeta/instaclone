
angular.module('GitApp')
    .factory('twitterService', function($q, $window, $location, $rootScope) {

    var authorizationResult = false;

    return {
        initialize: function() {
            console.log("init");
            //initialize OAuth.io with public key of the application
            OAuth.initialize('G4SLOl6sgYaqR23q9KRU_ain43Q', {cache:true});
            //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
            authorizationResult = OAuth.create('twitter');
            console.log(authorizationResult);
        },
        isReady: function() {
            return (authorizationResult);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            OAuth.popup('twitter', {cache:true}, function(error, result) { //cache means to execute the callback if the tokens are already present
                if (!error) {

                    result.get('/me')
                    .done(function (response) {
                        //this will display "John Doe" in the console
                        $window.localStorage.currentUser = JSON.stringify(response.data.user);
                        $rootScope.currentUser = JSON.parse($window.localStorage.currentUser);
                        console.log(response.name);
                    })
                    .fail(function (err) {
                        //handle error with err
                    });

                    authorizationResult = result;
                    deferred.resolve();
                } else {
                    //do something if there's an error
                    console.log(error);
                }
            });
            return deferred.promise;
        },
        clearCache: function() {
            OAuth.clearCache('twitter');
            authorizationResult = false;
        },
        getLatestTweets: function () {
            //create a deferred object using Angular's $q service
            var deferred = $q.defer();
            var promise = authorizationResult.get('/1.1/statuses/home_timeline.json').done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
                //when the data is retrieved resolved the deferred object
                deferred.resolve(data)
            });
            //return the promise of the deferred object
            return deferred.promise;
        }
    }
    
});